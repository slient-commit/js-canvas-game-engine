class SpriteAtlas extends Sprite {

    /**
     * A sprite atlas holds named regions within a single image.
     * Each region can have its own position, size, and pivot point.
     *
     * @param {string} imagePath - Path to the atlas image
     * @param {Object} regions - Map of region names to {x, y, width, height, pivotX?, pivotY?}
     * @param {string} [defaultRegion] - Initial region to display
     *
     * @example
     *   var atlas = new SpriteAtlas('assets/sprites/car.png', {
     *     'north':     { x: 0,   y: 0,   width: 48, height: 64, pivotX: 24, pivotY: 32 },
     *     'east':      { x: 130, y: 5,   width: 64, height: 48 },
     *     'south':     { x: 270, y: 0,   width: 48, height: 64 }
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
     * @returns {{x: number, y: number, width: number, height: number, pivotX?: number, pivotY?: number}}
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
     * Get the pivot point for the current region.
     * Defaults to the center of the region if not explicitly set.
     * @returns {{x: number, y: number}}
     */
    getPivot() {
        var r = this.regions[this.currentRegion];
        if (!r) return { x: 0, y: 0 };
        return {
            x: r.pivotX !== undefined ? r.pivotX : Math.round(r.width / 2),
            y: r.pivotY !== undefined ? r.pivotY : Math.round(r.height / 2)
        };
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
