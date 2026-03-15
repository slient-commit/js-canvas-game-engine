class Vec2 {
    constructor(x = 0, y = 0) {
        this.X = x;
        this.Y = y;
    }

    add(v) { return new Vec2(this.X + v.X, this.Y + v.Y); }
    sub(v) { return new Vec2(this.X - v.X, this.Y - v.Y); }
    scale(s) { return new Vec2(this.X * s, this.Y * s); }
    length() { return Math.sqrt(this.X * this.X + this.Y * this.Y); }
    distance(v) { return this.sub(v).length(); }
    dot(v) { return this.X * v.X + this.Y * v.Y; }

    normalize() {
        var len = this.length();
        if (len === 0) return new Vec2(0, 0);
        return new Vec2(this.X / len, this.Y / len);
    }

    lerp(v, t) {
        return new Vec2(
            this.X + (v.X - this.X) * t,
            this.Y + (v.Y - this.Y) * t
        );
    }

    clone() { return new Vec2(this.X, this.Y); }
    equals(v) { return this.X === v.X && this.Y === v.Y; }
    toString() { return `(${this.X}, ${this.Y})`; }

    static zero() { return new Vec2(0, 0); }
    static up() { return new Vec2(0, -1); }
    static down() { return new Vec2(0, 1); }
    static left() { return new Vec2(-1, 0); }
    static right() { return new Vec2(1, 0); }
}

// Backward compatibility aliases
const Point = Vec2;
const Position = Vec2;
