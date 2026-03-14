class Sprite {

    constructor(width, height, path = null) {
        this.width = width;
        this.height = height;
        this.spritePath = path;
        this.image = new Image();
        this.imageLoaded = false;
        if (path) {
            this.image.onload = function() { this.imageLoaded = true; }.bind(this);
            this.image.src = path;
        }
    }

    /**
     * Load sprite image from a path
     * @param {string} path 
     * @returns 
     */
    loadImage(path = null) {
        if (path !== null && path !== undefined) {
            this.spritePath = path;
        }

        if (this.spritePath === null || this.spritePath === undefined) {
            console.error('No path was defined for the sprite');
            return false;
        }

        this.imageLoaded = false;
        this.image.onload = function() { this.imageLoaded = true; }.bind(this);
        this.image.src = this.spritePath;
        return true;
    }

    /**
     * Load sprite image from a path
     * @param {string} path 
     * @returns 
     */
    changeImage(path) {
        if (this.path === null || this.path === undefined) {
            console.error('No path was defined for the sprite');
            return false;
        }

        this.image.src = path;
        return true;
    }

    /**
     * Function to call back when the engine is loading all images
     */
    callbackWhenLoading() {

    }

    /**
     * Serialize sprite to a plain object
     * @returns {Object}
     */
    toJSON() {
        return {
            type: 'sprite',
            width: this.width,
            height: this.height,
            path: this.spritePath
        };
    }

    /**
     * Create a Sprite from serialized data
     * @param {Object} data
     * @returns {Sprite}
     */
    static fromJSON(data) {
        return new Sprite(data.width, data.height, data.path || null);
    }

    /**
     * Deserialize either a Sprite or SpriteSheet from JSON data
     * based on the 'type' field.
     * @param {Object} data
     * @returns {Sprite|SpriteSheet|null}
     */
    static spriteFromJSON(data) {
        if (!data) return null;
        if (data.type === 'spritesheet') {
            return SpriteSheet.fromJSON(data);
        }
        return Sprite.fromJSON(data);
    }
}