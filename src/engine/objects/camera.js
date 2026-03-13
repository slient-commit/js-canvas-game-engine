class Camera {

    constructor(screenWidth, screenHeight, levelWidth, levelHeight, speed = 10) {
        this.id = "camera_" + Math.random().toString(16).slice(2);
        this.screenSize = new Size(screenWidth, screenHeight);
        this.layoutSize = new Size(levelWidth, levelHeight);
        this.cameraSize = new Size(screenWidth, screenHeight);
        this.speed = speed;
        this.maxPosition = new Point(0, 0);
        this.position = new Position(0, 0);
        this.offset = new Point(0, 0);
        this.location = new Point(0, 0);
        this.addOffset = false;
        this.updateMaxPosition();
        this.getOffset();
    }

    /**
     * Update the max points in the camera
     */
    updateMaxPosition() {
        this.maxPosition = new Point(this.position.X + this.cameraSize.width, this.position.Y + this.cameraSize.height);
    }

    /**
     * Get Camera offset
     * @returns {Point}
     */
    getOffset() {
        this.offset = new Point((this.cameraSize.width / 2) - this.position.X, (this.cameraSize.height / 2) - this.position.Y);
        return this.offset;
    }

    /**
     * Make the camera follow a gameObject
     * @param {GameObject} gameObject 
     */
    setPositionTo(gameObject) {
        let bordersX = new Point(this.position.X + gameObject.sprite.width, this.position.X + (this.cameraSize.width - (gameObject.sprite.width + 10)));
        let bordersY = new Point(this.position.Y + gameObject.sprite.height, this.position.Y + (this.cameraSize.height - (gameObject.sprite.height + 10)));

        if (gameObject.position.X < bordersX.X) {
            if (this.position.X > gameObject.position.X - (this.cameraSize.width / 2))
                this.position = new Position(this.position.X - this.speed, this.position.Y);
        }

        if (gameObject.position.X > bordersX.Y) {
            if (this.position.X < gameObject.position.X - (this.cameraSize.width / 2))
                this.position = new Position(this.position.X + this.speed, this.position.Y);
        }

        if (gameObject.position.Y < bordersY.X) {
            if (this.position.Y > gameObject.position.Y - (this.cameraSize.height / 2))
                this.position = new Position(this.position.X, this.position.Y - this.speed);
        }

        if (gameObject.position.Y > bordersY.Y) {
            if (this.position.Y < gameObject.position.Y - (this.cameraSize.height / 2))
                this.position = new Position(this.position.X, this.position.Y + this.speed);
        }

        this.getOffset();
    }
}