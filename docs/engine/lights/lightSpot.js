class LightSpot {
    /**
     * A light source — circle (point light) or cone (directional/triangle)
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
        this.shape = 'circle';    // 'circle' or 'cone'
        this.direction = 0;       // radians — direction the cone points (0 = right)
        this.spread = Math.PI / 3; // cone half-angle in radians (default 60° total)
    }
}
