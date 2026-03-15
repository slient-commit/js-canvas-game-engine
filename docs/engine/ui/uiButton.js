class UIButton extends Element {

    /**
     * Interactive button with normal/hover/pressed states
     * @param {Position} position
     * @param {Size} size
     * @param {Object} options
     * @param {Sprite} [options.normalSprite]
     * @param {Sprite} [options.hoverSprite]
     * @param {Sprite} [options.pressedSprite]
     * @param {string} [options.label]
     * @param {number} [options.fontSize=14]
     * @param {string} [options.fontFamily='monospace']
     * @param {string} [options.fontColor='white']
     * @param {string} [options.normalColor='#444']
     * @param {string} [options.hoverColor='#666']
     * @param {string} [options.pressedColor='#222']
     * @param {Function} [options.onClick]
     * @param {Function} [options.onHover]
     */
    constructor(position, size, options) {
        options = options || {};
        super(options.normalSprite || new Sprite(size.width, size.height), position);

        this.size = size;
        this.normalSprite = options.normalSprite || null;
        this.hoverSprite = options.hoverSprite || null;
        this.pressedSprite = options.pressedSprite || null;

        this.label = options.label || '';
        this.fontSize = options.fontSize || 14;
        this.fontFamily = options.fontFamily || 'monospace';
        this.fontColor = options.fontColor || 'white';

        this.normalColor = options.normalColor || '#444';
        this.hoverColor = options.hoverColor || '#666';
        this.pressedColor = options.pressedColor || '#222';

        this.onClick = options.onClick || null;
        this.onHover = options.onHover || null;

        this.isHovered = false;
        this.isPressed = false;
        this.isDisabled = false;
        this._wasHovered = false;
        this._wasPressed = false;
        this._useSprites = !!(this.normalSprite);
    }

    /**
     * Per-frame update called by the engine for UILayer elements
     * @param {Engine} engine
     */
    update(engine) {
        if (!this.showIt || this.isDisabled) {
            this.isHovered = false;
            this.isPressed = false;
            return;
        }

        var mouse = engine.input.getMousePosition();
        var hit = (mouse.X >= this.position.X &&
                   mouse.X <= this.position.X + this.size.width &&
                   mouse.Y >= this.position.Y &&
                   mouse.Y <= this.position.Y + this.size.height);

        this.isHovered = hit;
        this.isPressed = hit && engine.input.isMouseDown(0);

        // Fire onHover on transition into hover
        if (this.isHovered && !this._wasHovered && this.onHover) {
            this.onHover();
        }

        // Fire onClick on release while hovering
        if (this._wasPressed && !engine.input.isMouseDown(0) && hit && this.onClick) {
            this.onClick();
        }

        // Update sprite based on state
        if (this._useSprites) {
            if (this.isPressed && this.pressedSprite) {
                this.sprite = this.pressedSprite;
            } else if (this.isHovered && this.hoverSprite) {
                this.sprite = this.hoverSprite;
            } else {
                this.sprite = this.normalSprite;
            }
        }

        this._wasHovered = this.isHovered;
        this._wasPressed = this.isPressed;
    }

    /**
     * Draw fallback when no sprites are provided (colored rectangle + label)
     * @param {Drawer} drawer
     */
    drawFallback(drawer) {
        var color = this.normalColor;
        if (this.isPressed) color = this.pressedColor;
        else if (this.isHovered) color = this.hoverColor;

        drawer.rectangle(this.position, this.size, true, 1, color, this.opacity);

        if (this.label) {
            var textW = drawer.textWidth(this.label, this.fontSize, this.fontFamily, 'bold');
            var tx = this.position.X + (this.size.width - textW) / 2;
            var ty = this.position.Y + (this.size.height + this.fontSize) / 2 - 2;
            drawer.text(this.label, new Position(tx, ty), this.fontSize, this.fontFamily, 'bold', this.fontColor, this.opacity);
        }
    }
}
