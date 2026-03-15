class IsometricMap {

    /**
     * Isometric tilemap with heightmap, collision, and rendering
     * @param {number} cols - grid width
     * @param {number} rows - grid height
     * @param {number} tileWidth - pixel width of diamond tile
     * @param {number} tileHeight - pixel height of diamond tile
     * @param {number} [heightStep=16] - pixels per height unit
     */
    constructor(cols, rows, tileWidth, tileHeight, heightStep) {
        this.cols = cols;
        this.rows = rows;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.heightStep = heightStep || 16;
        this.offset = new Vec2(0, 0);

        this.tiles = [];
        this.heightMap = [];
        this.collisionMap = [];

        for (var r = 0; r < rows; r++) {
            this.tiles[r] = [];
            this.heightMap[r] = [];
            this.collisionMap[r] = [];
            for (var c = 0; c < cols; c++) {
                this.tiles[r][c] = 0;
                this.heightMap[r][c] = 0;
                this.collisionMap[r][c] = 0;
            }
        }
    }

    /**
     * Convert grid to screen position (includes height from heightMap)
     * @param {number} col
     * @param {number} row
     * @returns {Vec2} screen position
     */
    toScreen(col, row) {
        var h = this.inBounds(col, row) ? this.heightMap[row][col] : 0;
        return IsometricUtils.toScreen(col, row, this.tileWidth, this.tileHeight, h, this.heightStep, this.offset);
    }

    /**
     * Convert screen position to grid (height-aware diamond hit test)
     * @param {number} screenX
     * @param {number} screenY
     * @returns {Vec2} grid position {X: col, Y: row} or (-1,-1) if none
     */
    toGrid(screenX, screenY) {
        var approx = IsometricUtils.toGrid(screenX, screenY, this.tileWidth, this.tileHeight, this.offset);
        var searchRange = 4;
        var startRow = Math.max(0, Math.floor(approx.Y) - searchRange);
        var endRow = Math.min(this.rows - 1, Math.floor(approx.Y) + searchRange);
        var startCol = Math.max(0, Math.floor(approx.X) - searchRange);
        var endCol = Math.min(this.cols - 1, Math.floor(approx.X) + searchRange);

        // Search front-to-back (higher row+col first) for correct occlusion
        for (var row = endRow; row >= startRow; row--) {
            for (var col = endCol; col >= startCol; col--) {
                var screenPos = this.toScreen(col, row);
                var verts = IsometricUtils.getDiamondVertices(screenPos.X, screenPos.Y, this.tileWidth, this.tileHeight);
                if (this._pointInDiamond(screenX, screenY, verts)) {
                    return new Vec2(col, row);
                }
            }
        }

        var fc = Math.floor(approx.X);
        var fr = Math.floor(approx.Y);
        if (this.inBounds(fc, fr)) return new Vec2(fc, fr);
        return new Vec2(-1, -1);
    }

    /**
     * Point-in-diamond test using triangle decomposition
     */
    _pointInDiamond(px, py, verts) {
        // Split diamond into two triangles and test each
        if (this._pointInTriangle(px, py, verts[0], verts[1], verts[2])) return true;
        if (this._pointInTriangle(px, py, verts[0], verts[2], verts[3])) return true;
        return false;
    }

    _pointInTriangle(px, py, v0, v1, v2) {
        var d1 = (px - v1.X) * (v0.Y - v1.Y) - (v0.X - v1.X) * (py - v1.Y);
        var d2 = (px - v2.X) * (v1.Y - v2.Y) - (v1.X - v2.X) * (py - v2.Y);
        var d3 = (px - v0.X) * (v2.Y - v0.Y) - (v2.X - v0.X) * (py - v0.Y);
        var hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        var hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        return !(hasNeg && hasPos);
    }

    /**
     * @param {number} col
     * @param {number} row
     * @returns {number} height value
     */
    getHeight(col, row) {
        if (!this.inBounds(col, row)) return 0;
        return this.heightMap[row][col];
    }

    /**
     * @param {number} col
     * @param {number} row
     * @returns {boolean}
     */
    isWalkable(col, row) {
        if (!this.inBounds(col, row)) return false;
        return this.collisionMap[row][col] === 0;
    }

    /**
     * Check if movement is valid: walkable AND height diff <= 1
     * @param {number} fromCol
     * @param {number} fromRow
     * @param {number} toCol
     * @param {number} toRow
     * @returns {boolean}
     */
    canMoveTo(fromCol, fromRow, toCol, toRow) {
        if (!this.isWalkable(toCol, toRow)) return false;
        var fromH = this.getHeight(fromCol, fromRow);
        var toH = this.getHeight(toCol, toRow);
        return Math.abs(fromH - toH) <= 1;
    }

    /**
     * @param {number} col
     * @param {number} row
     * @returns {boolean}
     */
    inBounds(col, row) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    /**
     * Render the isometric map with depth-sorted entity callback
     * @param {Drawer} drawer
     * @param {Camera} [camera]
     * @param {Function} [entityCallback] - fn(col, row, screenX, screenY)
     */
    draw(drawer, camera, entityCallback) {
        var ctx = drawer.ctx;
        var camOffX = camera && camera.addOffset ? camera.offset.X : 0;
        var camOffY = camera && camera.addOffset ? camera.offset.Y : 0;

        for (var row = 0; row < this.rows; row++) {
            for (var col = 0; col < this.cols; col++) {
                var tileType = this.tiles[row][col];
                var h = this.heightMap[row][col];
                var screenPos = this.toScreen(col, row);
                var sx = screenPos.X + camOffX;
                var sy = screenPos.Y + camOffY;

                var topColor = this._getTileColor(tileType, h);
                var leftColor = this._darkenColor(topColor, 0.7);
                var rightColor = this._darkenColor(topColor, 0.5);

                var verts = IsometricUtils.getDiamondVertices(sx, sy, this.tileWidth, this.tileHeight);

                // Height side faces
                if (h > 0) {
                    var sideH = h * this.heightStep;

                    // Left face
                    ctx.beginPath();
                    ctx.moveTo(verts[3].X, verts[3].Y);
                    ctx.lineTo(verts[2].X, verts[2].Y);
                    ctx.lineTo(verts[2].X, verts[2].Y + sideH);
                    ctx.lineTo(verts[3].X, verts[3].Y + sideH);
                    ctx.closePath();
                    ctx.fillStyle = leftColor;
                    ctx.fill();

                    // Right face
                    ctx.beginPath();
                    ctx.moveTo(verts[2].X, verts[2].Y);
                    ctx.lineTo(verts[1].X, verts[1].Y);
                    ctx.lineTo(verts[1].X, verts[1].Y + sideH);
                    ctx.lineTo(verts[2].X, verts[2].Y + sideH);
                    ctx.closePath();
                    ctx.fillStyle = rightColor;
                    ctx.fill();
                }

                // Top face (diamond)
                ctx.beginPath();
                ctx.moveTo(verts[0].X, verts[0].Y);
                ctx.lineTo(verts[1].X, verts[1].Y);
                ctx.lineTo(verts[2].X, verts[2].Y);
                ctx.lineTo(verts[3].X, verts[3].Y);
                ctx.closePath();
                ctx.fillStyle = topColor;
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.12)';
                ctx.lineWidth = 0.5;
                ctx.stroke();

                if (entityCallback) {
                    entityCallback(col, row, sx, sy);
                }
            }
        }
    }

    /**
     * Draw a highlighted diamond at a tile position
     * @param {Drawer} drawer
     * @param {number} col
     * @param {number} row
     * @param {string} color
     * @param {Camera} [camera]
     */
    drawTileHighlight(drawer, col, row, color, camera) {
        if (!this.inBounds(col, row)) return;
        var screenPos = this.toScreen(col, row);
        var camOffX = camera && camera.addOffset ? camera.offset.X : 0;
        var camOffY = camera && camera.addOffset ? camera.offset.Y : 0;
        var sx = screenPos.X + camOffX;
        var sy = screenPos.Y + camOffY;
        var verts = IsometricUtils.getDiamondVertices(sx, sy, this.tileWidth, this.tileHeight);
        var ctx = drawer.ctx;

        ctx.beginPath();
        ctx.moveTo(verts[0].X, verts[0].Y);
        ctx.lineTo(verts[1].X, verts[1].Y);
        ctx.lineTo(verts[2].X, verts[2].Y);
        ctx.lineTo(verts[3].X, verts[3].Y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    _getTileColor(tileType, height) {
        var bases = [
            [76, 153, 76],    // 0: grass
            [153, 112, 61],   // 1: dirt
            [140, 140, 155],  // 2: stone
            [51, 102, 178]    // 3: water
        ];
        var base = bases[tileType] || bases[0];
        var b = height * 12;
        return 'rgb(' + Math.min(255, base[0] + b) + ',' + Math.min(255, base[1] + b) + ',' + Math.min(255, base[2] + b) + ')';
    }

    _darkenColor(colorStr, factor) {
        var m = colorStr.match(/rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/);
        if (!m) return colorStr;
        return 'rgb(' + Math.floor(m[1] * factor) + ',' + Math.floor(m[2] * factor) + ',' + Math.floor(m[3] * factor) + ')';
    }
}
