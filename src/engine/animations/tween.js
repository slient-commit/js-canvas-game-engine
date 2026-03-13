class Tween {
    /**
     * Create a tween animation
     * @param {Object} target - object to animate
     * @param {Object} properties - target property values {X: 100, Y: 200}
     * @param {number} duration - in seconds
     * @param {Function} easingFn - easing function
     */
    constructor(target, properties, duration, easingFn) {
        this.target = target;
        this.properties = properties;
        this.duration = duration;
        this.easing = easingFn || Easing.linear;
        this.elapsed = 0;
        this.started = false;
        this.completed = false;
        this._startValues = {};
        this._onComplete = null;
        this._onUpdate = null;
        this._next = null;
    }

    /**
     * Set completion callback
     * @param {Function} fn
     * @returns {Tween}
     */
    onComplete(fn) {
        this._onComplete = fn;
        return this;
    }

    /**
     * Set per-frame update callback
     * @param {Function} fn
     * @returns {Tween}
     */
    onUpdate(fn) {
        this._onUpdate = fn;
        return this;
    }

    /**
     * Chain another tween after this one
     * @param {Object} target
     * @param {Object} properties
     * @param {number} duration
     * @param {Function} easingFn
     * @returns {Tween} the chained tween
     */
    then(target, properties, duration, easingFn) {
        this._next = new Tween(target, properties, duration, easingFn);
        return this._next;
    }

    /**
     * Update the tween
     * @param {number} elapsedTime
     * @returns {boolean} true if still running
     */
    update(elapsedTime) {
        if (this.completed) {
            if (this._next) return this._next.update(elapsedTime);
            return false;
        }

        if (!this.started) {
            this.started = true;
            for (var key in this.properties) {
                this._startValues[key] = this.target[key];
            }
        }

        this.elapsed += elapsedTime;
        var t = Math.min(this.elapsed / this.duration, 1);
        var easedT = this.easing(t);

        for (var key in this.properties) {
            this.target[key] = this._startValues[key] + (this.properties[key] - this._startValues[key]) * easedT;
        }

        if (this._onUpdate) this._onUpdate(t);

        if (t >= 1) {
            this.completed = true;
            if (this._onComplete) this._onComplete();
            return !!this._next;
        }

        return true;
    }

    /**
     * Static factory: create and return a tween
     */
    static to(target, properties, duration, easingFn) {
        return new Tween(target, properties, duration, easingFn);
    }
}

class TweenManager {
    constructor() {
        this._tweens = [];
    }

    /**
     * Add a tween to be managed
     * @param {Tween} tween
     * @returns {Tween}
     */
    add(tween) {
        this._tweens.push(tween);
        return tween;
    }

    /**
     * Create and add a tween
     * @param {Object} target
     * @param {Object} properties
     * @param {number} duration
     * @param {Function} easingFn
     * @returns {Tween}
     */
    to(target, properties, duration, easingFn) {
        var tween = new Tween(target, properties, duration, easingFn);
        this._tweens.push(tween);
        return tween;
    }

    /**
     * Update all tweens (call each frame)
     * @param {number} elapsedTime
     */
    update(elapsedTime) {
        for (var i = this._tweens.length - 1; i >= 0; i--) {
            if (!this._tweens[i].update(elapsedTime)) {
                this._tweens.splice(i, 1);
            }
        }
    }

    /** Remove all tweens */
    clear() { this._tweens = []; }
}
