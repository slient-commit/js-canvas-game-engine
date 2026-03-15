class UILabel extends Element {

    /**
     * Text-rendering UI element
     * @param {string} text
     * @param {Position} position
     * @param {Object} options
     * @param {number} [options.fontSize=14]
     * @param {string} [options.fontFamily='monospace']
     * @param {string} [options.fontStyle='normal']
     * @param {string} [options.color='white']
     */
    constructor(text, position, options) {
        super(new Sprite(0, 0), position);
        options = options || {};
        this.text = text;
        this.fontSize = options.fontSize || 14;
        this.fontFamily = options.fontFamily || 'monospace';
        this.fontStyle = options.fontStyle || 'normal';
        this.color = options.color || 'white';
        this._isLabel = true;
    }

    /**
     * Draw the label
     * @param {Drawer} drawer
     */
    draw(drawer) {
        if (!this.showIt) return;
        drawer.text(this.text, this.position, this.fontSize, this.fontFamily, this.fontStyle, this.color, this.opacity);
    }

    /**
     * Update the displayed text
     * @param {string} newText
     */
    setText(newText) {
        this.text = newText;
    }
}
