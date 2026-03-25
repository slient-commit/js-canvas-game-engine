class Tilemap {
    /**
     * A tile-based map
     * @param {Tileset} tileset
     * @param {number[][]} data - 2D array of tile IDs (-1 = empty)
     * @param {number} cols - map width in tiles
     * @param {number} rows - map height in tiles
     */
    constructor(tileset, data, cols, rows) {
        this.tileset = tileset;
        this.data = data;
        this.cols = cols;
        this.rows = rows;
        this.layers = [data]; // support multiple layers
        this.collisionLayer = null;
        this._rotations = {}; // sparse map: "col,row" → angle in radians
        this._customSrc = {}; // sparse map: "col,row" → { sx, sy, sw, sh }
    }

    /**
     * Add an additional layer
     * @param {number[][]} layerData
     */
    addLayer(layerData) {
        this.layers.push(layerData);
    }

    /**
     * Set collision layer (2D array: 1=solid, 0=empty)
     * @param {number[][]} collisionData
     */
    setCollisionLayer(collisionData) {
        this.collisionLayer = collisionData;
    }

    /**
     * Check if a tile is solid
     * @param {number} col
     * @param {number} row
     * @returns {boolean}
     */
    isSolid(col, row) {
        if (!this.collisionLayer) return false;
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return true;
        return this.collisionLayer[row][col] === 1;
    }

    /**
     * Check if a world position is inside a solid tile
     * @param {number} worldX
     * @param {number} worldY
     * @returns {boolean}
     */
    isSolidAt(worldX, worldY) {
        var tw = this.tileset.displayWidth || this.tileset.tileWidth;
        var th = this.tileset.displayHeight || this.tileset.tileHeight;
        var col = Math.floor(worldX / tw);
        var row = Math.floor(worldY / th);
        return this.isSolid(col, row);
    }

    /**
     * Get tile at world position
     * @param {number} worldX
     * @param {number} worldY
     * @param {number} layerIndex
     * @returns {number} tile ID
     */
    getTileAt(worldX, worldY, layerIndex) {
        layerIndex = layerIndex || 0;
        var tw = this.tileset.displayWidth || this.tileset.tileWidth;
        var th = this.tileset.displayHeight || this.tileset.tileHeight;
        var col = Math.floor(worldX / tw);
        var row = Math.floor(worldY / th);
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return -1;
        return this.layers[layerIndex][row][col];
    }

    /**
     * Set tile at grid position
     * @param {number} col
     * @param {number} row
     * @param {number} tileId
     * @param {number} [layerIndex=0]
     */
    setTile(col, row, tileId, layerIndex) {
        layerIndex = layerIndex || 0;
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
        this.layers[layerIndex][row][col] = tileId;
    }

    /**
     * Set rotation for a tile (used with auto-tiling, road curves, etc.)
     * @param {number} col
     * @param {number} row
     * @param {number} angleDeg - rotation in degrees (0, 90, 180, 270)
     */
    setTileRotation(col, row, angleDeg) {
        var key = col + ',' + row;
        if (angleDeg === 0) {
            delete this._rotations[key];
        } else {
            this._rotations[key] = angleDeg * Math.PI / 180;
        }
    }

    /**
     * Clear rotation for a tile
     * @param {number} col
     * @param {number} row
     */
    clearTileRotation(col, row) {
        delete this._rotations[col + ',' + row];
    }

    /**
     * Override the source rectangle for a specific tile.
     * Use when a sprite region differs from the tileset grid
     * (e.g. a 2x2 crossroads scaled into one tile).
     * @param {number} col
     * @param {number} row
     * @param {number} sx - source X in the tileset image
     * @param {number} sy - source Y
     * @param {number} sw - source width
     * @param {number} sh - source height
     */
    setTileSource(col, row, sx, sy, sw, sh) {
        this._customSrc[col + ',' + row] = { x: sx, y: sy, w: sw, h: sh };
    }

    /**
     * Clear custom source for a tile (reverts to tileset grid)
     * @param {number} col
     * @param {number} row
     */
    clearTileSource(col, row) {
        delete this._customSrc[col + ',' + row];
    }

    /**
     * Get world dimensions
     * @returns {Size}
     */
    worldSize() {
        var tw = this.tileset.displayWidth || this.tileset.tileWidth;
        var th = this.tileset.displayHeight || this.tileset.tileHeight;
        return new Size(this.cols * tw, this.rows * th);
    }

    /**
     * Draw the tilemap with camera culling.
     * Supports both FixedCamera (offset only) and WorldCamera (zoom + offset).
     * @param {Drawer} drawer
     * @param {Camera} camera
     */
    draw(drawer, camera) {
        if (!this.tileset.imageLoaded) return;

        // Display size can differ from source size (e.g. 256px source → 48px on screen)
        var tw = this.tileset.displayWidth || this.tileset.tileWidth;
        var th = this.tileset.displayHeight || this.tileset.tileHeight;
        var ctx = drawer.ctx;

        var startCol = 0, startRow = 0;
        var endCol = this.cols, endRow = this.rows;

        // Camera culling (zoom-aware)
        if (camera) {
            var zoom = (typeof camera.getZoom === 'function') ? camera.getZoom() : 1;

            if (camera.location) {
                // WorldCamera: use location (center) + viewport/zoom for visible range
                var halfW = camera.cameraSize.width / (2 * zoom);
                var halfH = camera.cameraSize.height / (2 * zoom);
                startCol = Math.max(0, Math.floor((camera.location.X - halfW) / tw) - 1);
                startRow = Math.max(0, Math.floor((camera.location.Y - halfH) / th) - 1);
                endCol = Math.min(this.cols, Math.ceil((camera.location.X + halfW) / tw) + 1);
                endRow = Math.min(this.rows, Math.ceil((camera.location.Y + halfH) / th) + 1);
            } else {
                // FixedCamera: use position (top-left) + cameraSize
                startCol = Math.max(0, Math.floor(camera.position.X / tw) - 1);
                startRow = Math.max(0, Math.floor(camera.position.Y / th) - 1);
                endCol = Math.min(this.cols, Math.ceil((camera.position.X + camera.cameraSize.width) / tw) + 1);
                endRow = Math.min(this.rows, Math.ceil((camera.position.Y + camera.cameraSize.height) / th) + 1);
            }
        }

        // Apply camera transform (zoom + translation)
        var hasTransform = camera && typeof camera.applyTransform === 'function';
        if (hasTransform) {
            camera.applyTransform(ctx);
            var off = camera.getOffset();
            ctx.translate(off.X, off.Y);
        }

        for (var l = 0; l < this.layers.length; l++) {
            var layer = this.layers[l];
            for (var row = startRow; row < endRow; row++) {
                for (var col = startCol; col < endCol; col++) {
                    var tileId = layer[row][col];
                    if (tileId < 0) continue;

                    var key = col + ',' + row;
                    var src = this._customSrc[key] || this.tileset.getTileRect(tileId);
                    var dx = col * tw;
                    var dy = row * th;

                    // Legacy offset mode for cameras without applyTransform
                    if (!hasTransform && camera && camera.addOffset) {
                        dx += camera.offset.X;
                        dy += camera.offset.Y;
                    }

                    // Check for per-tile rotation
                    var rot = this._rotations[col + ',' + row];
                    if (rot) {
                        var cx = dx + tw / 2;
                        var cy = dy + th / 2;
                        ctx.save();
                        ctx.translate(cx, cy);
                        ctx.rotate(rot);
                        ctx.drawImage(
                            this.tileset.image,
                            src.x, src.y, src.w, src.h,
                            -tw / 2, -th / 2, tw, th
                        );
                        ctx.restore();
                    } else {
                        ctx.drawImage(
                            this.tileset.image,
                            src.x, src.y, src.w, src.h,
                            dx, dy, tw, th
                        );
                    }
                }
            }
        }

        if (hasTransform) {
            camera.resetTransform(ctx);
        }
    }
}
