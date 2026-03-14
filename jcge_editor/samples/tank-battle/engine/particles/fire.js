class Fire {
    constructor(engine, startPosition, min = 40, max = 100) {
        this.startPosition = startPosition;
        this.engine = engine;
        this.elements = [];
        this.max = this.getRandomArbitrary(min, max);
    }

    generate() {
        for (var i = 0; i < this.max; i++) {
            var velocity = new Position(this.getRandomArbitrary(-5, 5), this.getRandomArbitrary(-15, -1));
            var size = this.getRandomArbitrary(1, 10);
            var particle = new Particle(this.startPosition, new Size(size, size), new RGB(242, 17, 17), velocity, this.getRandomArbitrary(5, 15));
            particle.id = i;
            this.elements.push(particle);
        }
    }

    draw(elapsedTime) {
        if (this.elements.length <= 0) return;
        for (var i = 0; i < this.elements.length; i++) {
            var particule = this.elements[i];
            if (!particule.isDead) {
                particule.color = new RGB(242, ((20 - particule.life) + 1) * 17, 17);
                particule.fade = particule.life * 0.01;
                this.engine.drawer.particle(particule, elapsedTime);
            }
            if (particule.isDead) {
                this.elements.splice(i, 1);
            }
        }
    }

    getRandomArbitrary(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}