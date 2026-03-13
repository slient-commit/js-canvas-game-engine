class LightSpot {
    /**
     * A point light source
     * @param {Position} position - world position
     * @param {RGB} color - light color (default white)
     * @param {number} radius - light reach in pixels (default 150)
     * @param {number} intensity - brightness 0-1 (default 1)
     */
    constructor(position, color, radius, intensity) {
        this.position = new Vec2(position.X, position.Y);
        this.color = color || new RGB(255, 255, 255);
        this.radius = radius || 150;
        this.intensity = (intensity !== undefined && intensity !== null) ? intensity : 1.0;
        this.active = true;
        this.flicker = 0;
        this._flickerOffset = Math.random() * Math.PI * 2;
    }
}
