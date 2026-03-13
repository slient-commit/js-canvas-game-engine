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
    }

    hide() {
        this.showIt = false;
    }

    show() {
        this.showIt = true;
    }

    /**
     * Serialize element to a plain object
     * @returns {Object}
     */
    toJSON() {
        return {
            type: 'element',
            id: this.id,
            position: { X: this.position.X, Y: this.position.Y },
            opacity: this.opacity,
            showIt: this.showIt,
            sprite: this.sprite ? this.sprite.toJSON() : null
        };
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
        return element;
    }
}