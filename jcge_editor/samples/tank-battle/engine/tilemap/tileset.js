class Tileset {
    /**
     * A tileset from a spritesheet image
     * @param {string} imagePath - path to tileset image
     * @param {number} tileWidth
     * @param {number} tileHeight
     */
    constructor(imagePath, tileWidth, tileHeight) {
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.image = new Image();
        this.imageLoaded = false;
        this.columns = 0;
        this.rows = 0;

        var self = this;
        this.image.onload = function() {
            self.imageLoaded = true;
            self.columns = Math.floor(self.image.width / self.tileWidth);
            self.rows = Math.floor(self.image.height / self.tileHeight);
        };
        this.image.src = imagePath;
    }

    /**
     * Get source rectangle for a tile ID
     * @param {number} tileId - 0-indexed tile ID
     * @returns {Object} {x, y, w, h}
     */
    getTileRect(tileId) {
        if (this.columns === 0) return { x: 0, y: 0, w: this.tileWidth, h: this.tileHeight };
        var col = tileId % this.columns;
        var row = Math.floor(tileId / this.columns);
        return {
            x: col * this.tileWidth,
            y: row * this.tileHeight,
            w: this.tileWidth,
            h: this.tileHeight
        };
    }
}
