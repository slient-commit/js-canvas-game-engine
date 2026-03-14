class GeometricAnimation {

    constructor(name, gameObject) {
        this.name = name;
        this.gameObject = gameObject;
        this.ended = false;
        this.startPosition = new Position(0, 0);
        this.checkPoints = [];
        this.endPoint = new Position(0, 0);
        this.index = 0;
        this.currentPoint = null;
        this.started = false;
    }

    /**
     * Set the starting position
     * @param {Position} position 
     * @returns {GeometricAnimation}
     */
    startFrom(position = null) {
        if (position === null || position === undefined) {
            this.startPosition = this.gameObject.position;
            return this;
        }

        this.startPosition = position;
        return this;
    }

    /**
     * Add check point to the animation
     * @param {Position} position 
     * @param {Point} velocity 
     * @returns {GeometricAnimation}
     */
    to(position, speed = 50, callback = null) {
        if (position === null || position === undefined) {
            console.error('No position found to be added to the animation');
            return null;
        }

        this.checkPoints.push({ position: position, speed: speed, callback: callback });
        return this;
    }

    /**
     * Set the end point
     * @param {Position} position 
     * @param {Point} velocity 
     * @returns {GeometricAnimation}
     */
    endAt(position, speed = 50, callback = null) {
        if (position === null || position === undefined) {
            console.error('No position found to be added to the animation');
            return null;
        }

        this.endPoint = { position: position, speed: speed, callback: callback };
        return this;
    }

    /**
     * Run the animation
     * @param {Float} elapsedTime s
     */
    animate(elapsedTime) {
        if (!this.ended) {
            if (!this.started) {
                this.gameObject.position = this.startPosition;
                this.started = true;
            }
            if (this.checkPoints.length == 0)
                this.currentPoint = this.endPoint;
            if (this.index < this.checkPoints.length)
                this.currentPoint = this.checkPoints[this.index];
            if ((parseInt(this.currentPoint.position.X - this.gameObject.position.X) >= 0 && parseInt(this.currentPoint.position.X - this.gameObject.position.X) < 1) &&
                (parseInt(this.currentPoint.position.Y - this.gameObject.position.Y) >= 0 && parseInt(this.currentPoint.position.Y - this.gameObject.position.Y) < 1)) {
                if (this.index < this.checkPoints.length) {
                    if (this.checkPoints[this.index].callback)
                        this.checkPoints[this.index].callback();
                    this.index++;
                } else {
                    // end animation
                    if (this.endPoint !== null && (parseInt(this.endPoint.position.X - this.gameObject.position.X) >= 0 && parseInt(this.endPoint.position.X - this.gameObject.position.X) < 1)) {
                        if (this.endPoint.callback)
                            this.endPoint.callback();
                        this.ended = true;
                    } else {
                        this.currentPoint = this.endPoint;
                    }
                }

            } else {

                let fX = parseInt(this.currentPoint.position.X - this.gameObject.position.X);
                let fY = parseInt(this.currentPoint.position.Y - this.gameObject.position.Y);
                let dist = Math.sqrt(fX * fX + fY * fY);
                let step = (this.currentPoint.speed / parseInt(dist));
                if (dist > 0)
                    this.gameObject.position = new Position(this.gameObject.position.X + (fX * step * elapsedTime),
                        this.gameObject.position.Y + (fY * step * elapsedTime));
            }
        }
    }

    drawPoints(drawer) {
        if (this.startPosition)
            drawer.circle(new Position(this.startPosition.X, this.startPosition.Y), 4, 0, (2 * Math.PI), true, 2, 'red', null);
        if (this.checkPoints)
            for (var i = 0; i < this.checkPoints.length; i++) {
                const point = this.checkPoints[i].position;
                drawer.circle(new Position(point.X, point.Y), 4, 0, (2 * Math.PI), true, 2, 'red', null);
            }
        if (this.endPoint.position)
            drawer.circle(new Position(this.endPoint.position.X, this.endPoint.position.Y), 4, 0, (2 * Math.PI), true, 2, 'red', null);
    }
}