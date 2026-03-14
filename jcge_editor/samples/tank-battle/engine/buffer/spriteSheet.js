class SpriteSheet extends Sprite {

    constructor(name, width, height, frameSpeed, startFrame, endFrame, imagePath, once = false, callback = null, once_max_frame = -1) {
        super(width, height, imagePath);
        this.name = name;
        this.dWidth = width;
        this.counter = 0;
        this.currentFrame = 0;
        this.once_max_frame = once_max_frame;
        this.once = once;
        this.frameSpeed = frameSpeed;
        this.startFrame = startFrame;
        this.endFrame = endFrame;
        this.animationSequence = [];
        this.callback = callback;
        // create the sequence of frame numbers for the animation
        for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++) {
            this.animationSequence.push(frameNumber);
        }
        // framesPerRow will be calculated when the image loads
        this.framesPerRow = 0;
        this.countPlaying = 0;

        // Override onload to recalculate framesPerRow when image is ready
        var self = this;
        this.image.onload = function() {
            self.imageLoaded = true;
            self.framesPerRow = Math.floor(self.image.width / self.dWidth);
        };
        if (imagePath) this.image.src = imagePath;
    }

    /**
     * Update frame index to the next frame
     */
    update() {
        if (this.once && this.once_max_frame > 0 && this.countPlaying > this.once_max_frame) {
            this.currentFrame = this.framesPerRow - 1;
        }

        if (this.once && this.currentFrame == this.framesPerRow - 1) {
            if (this.callback)
                this.callback();

            return this.endFrame;
        }
        this.countPlaying++;
        let animCount = this.animationSequence.length;
        if (animCount == 0) animCount = 1;
        if (this.counter == (this.frameSpeed - 1)) this.currentFrame = parseInt((this.currentFrame + 1) % animCount);

        // Update the counter
        this.counter = parseInt((this.counter + 1) % this.frameSpeed);

    }

    /**
     * Get Current Frame
     * @returns Point
     */
    frame() {
        // get the row and col of the frame
        let row = parseInt(Math.floor(parseFloat(this.animationSequence[this.currentFrame] / this.framesPerRow)));
        let col = parseInt(Math.floor(parseFloat(this.animationSequence[this.currentFrame] % this.framesPerRow)));
        return new Point(parseInt(col * this.width), parseInt(row * this.height));
    }

    callbackWhenLoading() {
        // kept for compatibility — framesPerRow is now recalculated in onload
    }

    /**
     * Serialize sprite sheet to a plain object
     * @returns {Object}
     */
    toJSON() {
        return {
            type: 'spritesheet',
            name: this.name,
            width: this.dWidth,
            height: this.height,
            frameSpeed: this.frameSpeed,
            startFrame: this.startFrame,
            endFrame: this.endFrame,
            path: this.spritePath,
            once: this.once,
            once_max_frame: this.once_max_frame
        };
    }

    /**
     * Create a SpriteSheet from serialized data.
     * Note: callback is not serializable and will be null.
     * @param {Object} data
     * @returns {SpriteSheet}
     */
    static fromJSON(data) {
        return new SpriteSheet(
            data.name,
            data.width,
            data.height,
            data.frameSpeed,
            data.startFrame,
            data.endFrame,
            data.path || null,
            data.once || false,
            null,
            data.once_max_frame !== undefined ? data.once_max_frame : -1
        );
    }
}