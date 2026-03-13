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
}