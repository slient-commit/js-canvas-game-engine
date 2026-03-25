class ShadowCaster {
    /**
     * An object that casts a shadow
     * @param {Vec2} position - world position (pass a shared reference for auto-tracking)
     * @param {Size} size - footprint of the caster
     * @param {string} [type='rectangle'] - 'rectangle' or 'ellipse'
     * @param {number} [heightScale=1.0] - multiplier for shadow length (taller = longer)
     */
    constructor(position, size, type, heightScale) {
        this.position = position;
        this.size = size || new Size(32, 32);
        this.type = type || 'rectangle';
        this.heightScale = (heightScale !== undefined && heightScale !== null) ? heightScale : 1.0;
        this.rotation = 0; // radians, rotates the shadow shape
        this.active = true;
    }
}
