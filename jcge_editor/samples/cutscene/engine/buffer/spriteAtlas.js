class SpriteAtlas extends Sprite {

    /**
     * A sprite atlas holds named regions within a single image.
     * Each region can have its own position and size, unlike a
     * SpriteSheet which uses a uniform grid.
     *
     * @param {string} imagePath - Path to the atlas image
     * @param {Object} regions - Map of region names to {x, y, width, height}
     * @param {string} [defaultRegion] - Initial region to display
     *
     * @example
     *   var atlas = new SpriteAtlas('assets/sprites/car.png', {
     *     'north':     { x: 0,   y: 0,   width: 48, height: 64 },
     *     'northeast': { x: 60,  y: 10,  width: 56, height: 60 },
     *     'east':      { x: 130, y: 5,   width: 64, height: 48 },
     *     'southeast': { x: 200, y: 12,  width: 56, height: 60 },
     *     'south':     { x: 270, y: 0,   width: 48, height: 64 },
     *     'southwest': { x: 340, y: 12,  width: 56, height: 60 },
     *     'west':      { x: 410, y: 5,   width: 64, height: 48 },
     *     'northwest': { x: 480, y: 10,  width: 56, height: 60 }
     *   }, 'north');
     */
    constructor(imagePath, regions, defaultRegion) {
        var firstKey = defaultRegion || Object.keys(regions)[0];
        var first = regions[firstKey];
        super(first.width, first.height, imagePath);
        this.regions = regions;
        this.currentRegion = firstKey;
        this._isAtlas = true;
    }

    /**
     * Switch to a named region
     * @param {string} name - Region name
     */
    setRegion(name) {
        var r = this.regions[name];
        if (!r) {
            console.error('SpriteAtlas: region "' + name + '" not found');
            return;
        }
        this.currentRegion = name;
        this.width = r.width;
        this.height = r.height;
    }

    /**
     * Get the current region's source rectangle
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getRegion() {
        return this.regions[this.currentRegion];
    }

    /**
     * Get all region names
     * @returns {string[]}
     */
    getRegionNames() {
        return Object.keys(this.regions);
    }

    /**
     * Serialize sprite atlas to a plain object
     * @returns {Object}
     */
    toJSON() {
        var data = {
            type: 'spriteatlas',
            path: this.spritePath,
            regions: this.regions,
            currentRegion: this.currentRegion
        };
        if (this.chromaKey) {
            data.chromaKey = this.chromaKey;
            data.chromaKeyTolerance = this.chromaKeyTolerance;
        }
        return data;
    }

    /**
     * Create a SpriteAtlas from serialized data
     * @param {Object} data
     * @returns {SpriteAtlas}
     */
    static fromJSON(data) {
        var atlas = new SpriteAtlas(data.path || null, data.regions, data.currentRegion);
        if (data.chromaKey) {
            atlas.setChromaKey(data.chromaKey, data.chromaKeyTolerance !== undefined ? data.chromaKeyTolerance : 30);
        }
        return atlas;
    }
}
