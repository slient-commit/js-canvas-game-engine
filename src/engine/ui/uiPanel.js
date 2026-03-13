class UIPanel extends Element {

    /**
     * Rectangular background panel
     * @param {Position} position
     * @param {Size} size
     * @param {Object} options
     * @param {string} [options.fillColor='rgba(0,0,0,0.7)']
     * @param {string} [options.borderColor=null]
     * @param {number} [options.borderWidth=1]
     */
    constructor(position, size, options) {
        super(new Sprite(0, 0), position);
        options = options || {};
        this.size = size;
        this.fillColor = options.fillColor || 'rgba(0, 0, 0, 0.7)';
        this.borderColor = options.borderColor || null;
        this.borderWidth = options.borderWidth || 1;
        this._isPanel = true;
    }

    /**
     * Draw the panel
     * @param {Drawer} drawer
     */
    draw(drawer) {
        if (!this.showIt) return;
        drawer.rectangle(this.position, this.size, true, this.borderWidth, this.fillColor, this.opacity);
        if (this.borderColor) {
            drawer.rectangle(this.position, this.size, false, this.borderWidth, this.borderColor, this.opacity);
        }
    }
}
