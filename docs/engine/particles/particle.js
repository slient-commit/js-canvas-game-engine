class Particle {

    constructor(startPosition, size = { width: 2, height: 2 }, color = new RGB(242, 17, 17), velocity = { X: 0, Y: -5 }, lifeSpeed = 2) {
        this.id = 0;
        this.position = new Position(startPosition.X, startPosition.Y);
        this.velocity = velocity;
        this.size = size;
        this.color = color;
        this.life = 20;
        this.fade = 1;
        this.lifeSpeed = lifeSpeed;
        this.isDead = false;
    }

    update(elapsedTime = 1) {
        if (!this.isDead) {
            this.position = new Position(this.position.X += this.velocity.X * elapsedTime,
                this.position.Y += this.velocity.Y * elapsedTime);
            this.life -= this.lifeSpeed * elapsedTime;

            if (this.life <= 0) {
                this.isDead = true;
            }
        }
    }

}