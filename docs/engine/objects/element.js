/**
 * When you wanna add sprite or spritesheet to a layer, to be drawned by layer order and
 * automaticaly, you need to add it to an element and add it to the layer
 */
class Element {
    constructor(sprite, position, opacity = 1) {
        this.id = "element_" + Math.random().toString(16).slice(2);
        this.sprite = sprite;
        this.position = position;
        this.opacity = opacity;
        this.showIt = true;
        this._attachParent = null;
        this._attachOffset = null;
    }

    hide() {
        this.showIt = false;
    }

    show() {
        this.showIt = true;
    }

    /**
     * Attach this element to a parent object with an offset.
     * The engine will auto-update this element's position each frame.
     * @param {GameObject|Element} parent
     * @param {number} offsetX
     * @param {number} offsetY
     */
    attachTo(parent, offsetX, offsetY) {
        this._attachParent = parent;
        this._attachOffset = new Vec2(offsetX || 0, offsetY || 0);
    }

    /**
     * Detach this element from its parent
     */
    detach() {
        this._attachParent = null;
        this._attachOffset = null;
    }

    /**
     * Update position based on parent attachment.
     * Offset is measured from the parent's pivot to the child's pivot.
     */
    updateAttachment() {
        if (this._attachParent) {
            var parentPivot = this._attachParent.sprite && this._attachParent.sprite.getPivot
                ? this._attachParent.sprite.getPivot() : { x: 0, y: 0 };
            var childPivot = this.sprite && this.sprite.getPivot
                ? this.sprite.getPivot() : { x: 0, y: 0 };
            this.position = new Vec2(
                this._attachParent.position.X + parentPivot.x + this._attachOffset.X - childPivot.x,
                this._attachParent.position.Y + parentPivot.y + this._attachOffset.Y - childPivot.y
            );
        }
    }

    /**
     * Serialize element to a plain object
     * @returns {Object}
     */
    toJSON() {
        var data = {
            type: 'element',
            id: this.id,
            position: { X: this.position.X, Y: this.position.Y },
            opacity: this.opacity,
            showIt: this.showIt,
            sprite: this.sprite ? this.sprite.toJSON() : null
        };

        if (this._attachParent) {
            data.parentId = this._attachParent.id;
            data.attachOffset = { X: this._attachOffset.X, Y: this._attachOffset.Y };
        }

        return data;
    }

    /**
     * Create an Element from serialized data
     * @param {Object} data
     * @returns {Element}
     */
    static fromJSON(data) {
        var sprite = Sprite.spriteFromJSON(data.sprite);
        var element = new Element(
            sprite,
            new Vec2(data.position.X, data.position.Y),
            data.opacity !== undefined ? data.opacity : 1
        );
        element.id = data.id;
        element.showIt = data.showIt !== undefined ? data.showIt : true;

        if (data.parentId) {
            element._pendingParentId = data.parentId;
            element._pendingAttachOffset = data.attachOffset || { X: 0, Y: 0 };
        }

        return element;
    }
}