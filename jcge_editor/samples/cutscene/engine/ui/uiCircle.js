class UICircle extends Element {

    /**
     * Circle shape element
     * @param {Position} position - Center position of the circle
     * @param {Object} options
     * @param {number} [options.radius=20]
     * @param {string} [options.fillColor='white']
     * @param {string} [options.borderColor=null]
     * @param {number} [options.borderWidth=1]
     */
    constructor(position, options) {
        super(new Sprite(0, 0), position);
        options = options || {};
        this.radius = options.radius || 20;
        this.fillColor = options.fillColor || 'white';
        this.borderColor = options.borderColor || null;
        this.borderWidth = options.borderWidth || 1;
        this._isCircle = true;
    }

    /**
     * Draw the circle
     * @param {Drawer} drawer
     */
    draw(drawer) {
        if (!this.showIt) return;
        // drawer.circle(position, radius, startAngle, endAngle, filled, lineWidth, color, opacity)
        drawer.circle(this.position, this.radius, 0, -1, true, 1, this.fillColor, this.opacity);
        if (this.borderColor) {
            drawer.circle(this.position, this.radius, 0, -1, false, this.borderWidth, this.borderColor, this.opacity);
        }
    }
}
