class ParticleEmitter {
    /**
     * General-purpose particle emitter
     * @param {Object} config
     */
    constructor(engine, config) {
        this.engine = engine;
        this.position = config.position || new Vec2(0, 0);
        this.minSpeed = config.minSpeed || 20;
        this.maxSpeed = config.maxSpeed || 100;
        this.minAngle = config.minAngle || 0;
        this.maxAngle = config.maxAngle || Math.PI * 2;
        this.minLife = config.minLife || 0.5;
        this.maxLife = config.maxLife || 2;
        this.minSize = config.minSize || 2;
        this.maxSize = config.maxSize || 6;
        this.startColor = config.startColor || new RGB(255, 200, 50);
        this.endColor = config.endColor || new RGB(255, 50, 0, 0);
        this.gravity = config.gravity || new Vec2(0, 0);
        this.rate = config.rate || 10; // particles per emission
        this.shape = config.shape || 'rectangle'; // 'rectangle' or 'circle'

        this.particles = [];
        this._pool = [];
        this.active = true;
    }

    _random(min, max) {
        return min + Math.random() * (max - min);
    }

    _lerpColor(a, b, t) {
        return new RGB(
            Math.round(a.red + (b.red - a.red) * t),
            Math.round(a.green + (b.green - a.green) * t),
            Math.round(a.blue + (b.blue - a.blue) * t),
            a.alpha + (b.alpha - a.alpha) * t
        );
    }

    _getParticle() {
        if (this._pool.length > 0) return this._pool.pop();
        return {};
    }

    /**
     * Emit particles
     * @param {number} count
     */
    emit(count) {
        count = count || this.rate;
        for (var i = 0; i < count; i++) {
            var angle = this._random(this.minAngle, this.maxAngle);
            var speed = this._random(this.minSpeed, this.maxSpeed);
            var p = this._getParticle();
            p.position = this.position.clone();
            p.velocity = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
            p.life = this._random(this.minLife, this.maxLife);
            p.maxLife = p.life;
            p.size = this._random(this.minSize, this.maxSize);
            p.dead = false;
            this.particles.push(p);
        }
    }

    /**
     * Update and draw all particles
     * @param {number} elapsedTime
     */
    draw(elapsedTime) {
        if (this.active) this.emit();

        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.life -= elapsedTime;

            if (p.life <= 0) {
                p.dead = true;
                this._pool.push(this.particles.splice(i, 1)[0]);
                continue;
            }

            // Apply gravity
            p.velocity = p.velocity.add(this.gravity.scale(elapsedTime));
            p.position = p.position.add(p.velocity.scale(elapsedTime));

            // Interpolate color based on remaining life
            var t = 1 - (p.life / p.maxLife);
            var color = this._lerpColor(this.startColor, this.endColor, t);
            var fade = p.life / p.maxLife;

            var size = new Size(p.size, p.size);
            if (this.shape === 'circle') {
                this.engine.drawer.circle(p.position, p.size / 2, 0, -1, true, 1, color.toString(), fade);
            } else {
                this.engine.drawer.rectangle(p.position, size, true, 1, color.toString(), fade);
            }
        }
    }

    /**
     * Stop emitting and clear particles
     */
    stop() {
        this.active = false;
    }

    /**
     * Clear all particles
     */
    clear() {
        this._pool = this._pool.concat(this.particles);
        this.particles = [];
    }
}

// --- Built-in Presets ---

ParticleEmitter.fire = function(engine, position) {
    return new ParticleEmitter(engine, {
        position: position,
        minSpeed: 30,
        maxSpeed: 80,
        minAngle: -Math.PI * 0.75,
        maxAngle: -Math.PI * 0.25,
        minLife: 0.3,
        maxLife: 1.0,
        minSize: 3,
        maxSize: 8,
        startColor: new RGB(255, 200, 50),
        endColor: new RGB(255, 30, 0, 0),
        gravity: new Vec2(0, -20),
        rate: 8
    });
};

ParticleEmitter.smoke = function(engine, position) {
    return new ParticleEmitter(engine, {
        position: position,
        minSpeed: 10,
        maxSpeed: 30,
        minAngle: -Math.PI * 0.75,
        maxAngle: -Math.PI * 0.25,
        minLife: 1,
        maxLife: 3,
        minSize: 4,
        maxSize: 12,
        startColor: new RGB(150, 150, 150, 0.6),
        endColor: new RGB(80, 80, 80, 0),
        gravity: new Vec2(0, -10),
        rate: 3,
        shape: 'circle'
    });
};

ParticleEmitter.explosion = function(engine, position) {
    var emitter = new ParticleEmitter(engine, {
        position: position,
        minSpeed: 100,
        maxSpeed: 300,
        minAngle: 0,
        maxAngle: Math.PI * 2,
        minLife: 0.2,
        maxLife: 0.8,
        minSize: 2,
        maxSize: 6,
        startColor: new RGB(255, 255, 100),
        endColor: new RGB(255, 50, 0, 0),
        gravity: new Vec2(0, 100),
        rate: 0
    });
    emitter.active = false;
    emitter.emit(50);
    return emitter;
};

ParticleEmitter.sparkle = function(engine, position) {
    return new ParticleEmitter(engine, {
        position: position,
        minSpeed: 5,
        maxSpeed: 30,
        minAngle: 0,
        maxAngle: Math.PI * 2,
        minLife: 0.5,
        maxLife: 1.5,
        minSize: 1,
        maxSize: 3,
        startColor: new RGB(255, 255, 255),
        endColor: new RGB(200, 200, 255, 0),
        gravity: new Vec2(0, 0),
        rate: 5,
        shape: 'circle'
    });
};
