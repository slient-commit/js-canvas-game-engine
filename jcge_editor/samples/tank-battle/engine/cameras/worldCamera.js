class WorldCamera extends Camera {

    constructor(screenWidth, screenHeight, levelWidth, levelHeight, speed = 10) {
        super(screenWidth, screenHeight, levelWidth, levelHeight, speed);
        this.smoothFollow = true;
        this.followLerp = 0.1;
        this._shakeIntensity = 0;
        this._shakeDuration = 0;
        this._shakeTimer = 0;
        this._zoom = 1;
    }

    /**
     * Smoothly follow a gameObject
     * @param {GameObject} gameObject
     * @param {number} elapsedTime
     */
    setPositionTo(gameObject, elapsedTime) {
        // target is the world point to center the camera on
        var targetX = gameObject.position.X + (gameObject.sprite ? gameObject.sprite.width / 2 : 0);
        var targetY = gameObject.position.Y + (gameObject.sprite ? gameObject.sprite.height / 2 : 0);

        if (this.smoothFollow && elapsedTime) {
            this.location = new Position(
                this.location.X + (targetX - this.location.X) * this.followLerp,
                this.location.Y + (targetY - this.location.Y) * this.followLerp
            );
        } else {
            this.location = new Position(targetX, targetY);
        }

        // position = top-left of camera view
        this.position = new Position(
            this.location.X - this.cameraSize.width / 2,
            this.location.Y - this.cameraSize.height / 2
        );

        this.clampPosition();

        // sync location back from clamped position
        this.location = new Position(
            this.position.X + this.cameraSize.width / 2,
            this.position.Y + this.cameraSize.height / 2
        );

        this.getOffset();
    }

    /**
     * Start camera shake effect
     * @param {number} intensity - shake strength in pixels
     * @param {number} duration - shake duration in seconds
     */
    shake(intensity, duration) {
        this._shakeIntensity = intensity;
        this._shakeDuration = duration;
        this._shakeTimer = 0;
    }

    /**
     * Set zoom level
     * @param {number} level - 1.0 = normal, 2.0 = 2x zoom in, 0.5 = zoom out
     */
    setZoom(level) {
        this._zoom = Math.max(0.1, level);
    }

    /** Get current zoom level */
    getZoom() { return this._zoom; }

    /**
     * Update camera shake (call each frame)
     * @param {number} elapsedTime
     */
    update(elapsedTime) {
        if (this._shakeDuration > 0) {
            this._shakeTimer += elapsedTime;
            if (this._shakeTimer < this._shakeDuration) {
                var progress = 1 - (this._shakeTimer / this._shakeDuration);
                var offsetX = (Math.random() * 2 - 1) * this._shakeIntensity * progress;
                var offsetY = (Math.random() * 2 - 1) * this._shakeIntensity * progress;
                this.offset = this.offset.add(new Point(offsetX, offsetY));
            } else {
                this._shakeDuration = 0;
                this._shakeIntensity = 0;
            }
        }
    }

    /**
     * Get the camera offset
     * @returns {Point}
     */
    getOffset() {
        this.offset = new Point(
            (this.cameraSize.width / 2) - this.location.X,
            (this.cameraSize.height / 2) - this.location.Y
        );
        return this.offset;
    }

    /**
     * Clamp camera position within world bounds
     */
    clampPosition() {
        if (this.position.X < 0) this.position = new Position(0, this.position.Y);
        if (this.position.Y < 0) this.position = new Position(this.position.X, 0);
        if (this.position.X > this.layoutSize.width - this.cameraSize.width) {
            this.position = new Position(this.layoutSize.width - this.cameraSize.width, this.position.Y);
        }
        if (this.position.Y > this.layoutSize.height - this.cameraSize.height) {
            this.position = new Position(this.position.X, this.layoutSize.height - this.cameraSize.height);
        }
    }
}
