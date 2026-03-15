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
        var col = Math.floor(worldX / this.tileset.tileWidth);
        var row = Math.floor(worldY / this.tileset.tileHeight);
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
        var col = Math.floor(worldX / this.tileset.tileWidth);
        var row = Math.floor(worldY / this.tileset.tileHeight);
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return -1;
        return this.layers[layerIndex][row][col];
    }

    /**
     * Get world dimensions
     * @returns {Size}
     */
    worldSize() {
        return new Size(this.cols * this.tileset.tileWidth, this.rows * this.tileset.tileHeight);
    }

    /**
     * Draw the tilemap with camera culling
     * @param {Drawer} drawer
     * @param {Camera} camera
     */
    draw(drawer, camera) {
        if (!this.tileset.imageLoaded) return;

        var startCol = 0, startRow = 0;
        var endCol = this.cols, endRow = this.rows;

        // Camera culling
        if (camera) {
            startCol = Math.max(0, Math.floor(camera.position.X / this.tileset.tileWidth) - 1);
            startRow = Math.max(0, Math.floor(camera.position.Y / this.tileset.tileHeight) - 1);
            endCol = Math.min(this.cols, Math.ceil((camera.position.X + camera.cameraSize.width) / this.tileset.tileWidth) + 1);
            endRow = Math.min(this.rows, Math.ceil((camera.position.Y + camera.cameraSize.height) / this.tileset.tileHeight) + 1);
        }

        for (var l = 0; l < this.layers.length; l++) {
            var layer = this.layers[l];
            for (var row = startRow; row < endRow; row++) {
                for (var col = startCol; col < endCol; col++) {
                    var tileId = layer[row][col];
                    if (tileId < 0) continue;

                    var src = this.tileset.getTileRect(tileId);
                    var dx = col * this.tileset.tileWidth;
                    var dy = row * this.tileset.tileHeight;

                    if (camera && camera.addOffset) {
                        dx += camera.offset.X;
                        dy += camera.offset.Y;
                    }

                    drawer.ctx.drawImage(
                        this.tileset.image,
                        src.x, src.y, src.w, src.h,
                        dx, dy, this.tileset.tileWidth, this.tileset.tileHeight
                    );
                }
            }
        }
    }
}
