class Sprite {

    constructor(width, height, path = null) {
        this.width = width;
        this.height = height;
        this.spritePath = path;
        this.image = new Image();
        this.imageLoaded = false;
        this.chromaKey = null;
        this.chromaKeyTolerance = 30;
        /** @type {number|undefined} Pivot X — defaults to width/2 if undefined */
        this.pivotX = undefined;
        /** @type {number|undefined} Pivot Y — defaults to height/2 if undefined */
        this.pivotY = undefined;
        if (path) {
            var self = this;
            this.image.onload = function() {
                self.imageLoaded = true;
                if (self.chromaKey) self._applyChromaKey();
            };
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
        var self = this;
        this.image.onload = function() {
            self.imageLoaded = true;
            if (self.chromaKey) self._applyChromaKey();
        };
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
     * Set chroma key color to remove from sprite
     * @param {string} color - Hex color like '#FF00FF' or '#f0f'
     * @param {number} [tolerance=30] - Color matching tolerance (0-255)
     */
    setChromaKey(color, tolerance) {
        this.chromaKey = color || null;
        if (tolerance !== undefined) this.chromaKeyTolerance = tolerance;
        if (this.imageLoaded && this.chromaKey) {
            this._applyChromaKey();
        }
    }

    /**
     * Parse a hex color string to {r, g, b}
     * @param {string} hex
     * @returns {{r: number, g: number, b: number}}
     */
    _parseHexColor(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    /**
     * Apply chroma key removal — replaces this.image with a processed canvas
     */
    _applyChromaKey() {
        if (!this.chromaKey || !this.image) return;

        // Use the original image if we already replaced it before
        var src = this._originalImage || this.image;
        var w = src.width || this.width;
        var h = src.height || this.height;
        if (w === 0 || h === 0) return;

        // Keep a reference to the original image for re-processing
        if (!this._originalImage) {
            this._originalImage = this.image;
        }

        try {
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(src, 0, 0);

            var imageData = ctx.getImageData(0, 0, w, h);
            var pixels = imageData.data;
            var key = this._parseHexColor(this.chromaKey);
            var tol = this.chromaKeyTolerance;

            for (var i = 0; i < pixels.length; i += 4) {
                var dist = Math.abs(pixels[i] - key.r) + Math.abs(pixels[i + 1] - key.g) + Math.abs(pixels[i + 2] - key.b);
                if (dist <= tol) {
                    pixels[i + 3] = 0;
                }
            }

            ctx.putImageData(imageData, 0, 0);
            this.image = canvas;
        } catch (e) {
            console.warn('Chroma key failed (canvas may be tainted by cross-origin image):', e.message);
        }
    }

    /**
     * Get the pivot point for this sprite.
     * Defaults to the center of the sprite if not explicitly set.
     * @returns {{x: number, y: number}}
     */
    getPivot() {
        return {
            x: this.pivotX !== undefined ? this.pivotX : Math.round(this.width / 2),
            y: this.pivotY !== undefined ? this.pivotY : Math.round(this.height / 2)
        };
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
        var data = {
            type: 'sprite',
            width: this.width,
            height: this.height,
            path: this.spritePath
        };
        if (this.pivotX !== undefined) data.pivotX = this.pivotX;
        if (this.pivotY !== undefined) data.pivotY = this.pivotY;
        if (this.chromaKey) {
            data.chromaKey = this.chromaKey;
            data.chromaKeyTolerance = this.chromaKeyTolerance;
        }
        return data;
    }

    /**
     * Create a Sprite from serialized data
     * @param {Object} data
     * @returns {Sprite}
     */
    static fromJSON(data) {
        var spr = new Sprite(data.width, data.height, data.path || null);
        if (data.pivotX !== undefined) spr.pivotX = data.pivotX;
        if (data.pivotY !== undefined) spr.pivotY = data.pivotY;
        if (data.chromaKey) {
            spr.setChromaKey(data.chromaKey, data.chromaKeyTolerance !== undefined ? data.chromaKeyTolerance : 30);
        }
        return spr;
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
        if (data.type === 'spriteatlas') {
            return SpriteAtlas.fromJSON(data);
        }
        return Sprite.fromJSON(data);
    }
}