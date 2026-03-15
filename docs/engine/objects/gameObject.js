class GameObject {

    constructor(sprite, position, opacity = 1) {
        this.id = "gameobject_" + Math.random().toString(16).slice(2);
        this.sprite = sprite;
        this.opacity = opacity;
        this.position = position;
        this.velocity = new Point(0, 0);
        this.name = "Game Object";
        this.showIt = true;
        this.isStatic = false;
        this.animations = new Animation();
        this.hasSimpleSprite = true;
        this._attachParent = null;
        this._attachOffset = null;
    }

    /**
     * Make this static
     */
    staticObject() {
        this.isStatic = true;
    }

    /**
     * Make this object movable
     */
    notStaticObject() {
        this.isStatic = false;
    }

    /**
     * Show this object, by default
     */
    show() {
        this.showIt = true;
    }

    /**
     * Hide this object
     */
    hide() {
        this.showIt = false;
    }

    /**
     * Check if this object is in collision with another game Object
     * @param {GameObject} other 
     * @returns bool
     */
    collisionWith(other) {
        if (this.position.X < other.position.X + other.sprite.width &&
            this.position.X + this.sprite.width > other.position.X &&
            this.position.Y < other.position.Y + other.sprite.height &&
            this.sprite.height + this.position.Y > other.position.Y) {
            return true;
        }
        return false;
    }

    /**
     * This function to check for some user rules, like falling gravity
     * @param {double} x 
     * @param {double} y 
     * @param {double} elapsedTime 
     * @returns bool
     */
    moveCondition(x, y, elapsedTime) { return false; }

    /**
     * Using the object velocity, this will change the position
     * Also, it gonna verify the Moving Condition Function
     * @param {double} elapsedTime 
     */
    move(elapsedTime) {
        let newPositionX = this.position.X + (this.velocity.X * elapsedTime);
        let newPositionY = this.position.Y + (this.velocity.Y * elapsedTime);

        // Check if there is condition
        this.moveCondition(newPositionX, newPositionY, elapsedTime);

        newPositionX = this.position.X + (this.velocity.X * elapsedTime);
        newPositionY = this.position.Y + (this.velocity.Y * elapsedTime);

        this.position = new Position(newPositionX, newPositionY);
    }

    /**
     * Set the game object animation object
     * @param {Animation} animation 
     * @returns bool
     */
    registerAnimation(animation) {
        if (animation === null || animation === undefined) {
            console.error('No valid animation was found to be registred to the gameObject');
            return false;
        }
        this.animations = animation;
        return true;
    }

    /**
     * Set the current sprite to spriteSheet
     * @param {string} name 
     * @returns bool
     */
    setAnimation(name) {
        let spriteSheet = this.animations.getAnimation(name);
        if (spriteSheet === null || spriteSheet === undefined) {
            console.error('No sprite sheet was found in the animation to be displayed');
            return false;
        }

        this.sprite = spriteSheet;
        this.hasSimpleSprite = false;
        return false;
    }

    /**
     * Set a simple sprite
     * @param {string} name 
     * @returns bool
     */
    setSprite(sprite) {
        if (sprite === null || sprite === undefined) {
            console.error('No sprite was found to be displayed');
            return false;
        }

        this.sprite = sprite;
        this.hasSimpleSprite = true;
        return false;
    }

    /**
     * Attach this object to a parent object with an offset.
     * The engine will auto-update this object's position each frame.
     * @param {GameObject|Element} parent
     * @param {number} offsetX
     * @param {number} offsetY
     */
    attachTo(parent, offsetX, offsetY) {
        this._attachParent = parent;
        this._attachOffset = new Vec2(offsetX || 0, offsetY || 0);
    }

    /**
     * Detach this object from its parent
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
            this.position = new Position(
                this._attachParent.position.X + parentPivot.x + this._attachOffset.X - childPivot.x,
                this._attachParent.position.Y + parentPivot.y + this._attachOffset.Y - childPivot.y
            );
        }
    }

    /**
     * Serialize game object to a plain object
     * @returns {Object}
     */
    toJSON() {
        var data = {
            type: 'gameobject',
            id: this.id,
            name: this.name,
            position: { X: this.position.X, Y: this.position.Y },
            velocity: { X: this.velocity.X, Y: this.velocity.Y },
            opacity: this.opacity,
            showIt: this.showIt,
            isStatic: this.isStatic,
            hasSimpleSprite: this.hasSimpleSprite,
            sprite: this.sprite ? this.sprite.toJSON() : null,
            animations: []
        };

        if (this._attachParent) {
            data.parentId = this._attachParent.id;
            data.attachOffset = { X: this._attachOffset.X, Y: this._attachOffset.Y };
        }

        if (this.animations && this.animations.animations) {
            for (var i = 0; i < this.animations.animations.length; i++) {
                data.animations.push(this.animations.animations[i].toJSON());
            }
        }

        return data;
    }

    /**
     * Create a GameObject from serialized data
     * @param {Object} data
     * @returns {GameObject}
     */
    static fromJSON(data) {
        var sprite = Sprite.spriteFromJSON(data.sprite);
        var position = new Vec2(data.position.X, data.position.Y);
        var obj = new GameObject(sprite, position, data.opacity !== undefined ? data.opacity : 1);

        obj.id = data.id;
        obj.name = data.name || 'Game Object';
        obj.velocity = new Vec2(
            data.velocity ? data.velocity.X : 0,
            data.velocity ? data.velocity.Y : 0
        );
        obj.showIt = data.showIt !== undefined ? data.showIt : true;
        obj.isStatic = data.isStatic || false;
        obj.hasSimpleSprite = data.hasSimpleSprite !== undefined ? data.hasSimpleSprite : true;

        if (data.parentId) {
            obj._pendingParentId = data.parentId;
            obj._pendingAttachOffset = data.attachOffset || { X: 0, Y: 0 };
        }

        if (data.animations && data.animations.length > 0) {
            var animation = new Animation();
            for (var i = 0; i < data.animations.length; i++) {
                var spriteSheet = SpriteSheet.fromJSON(data.animations[i]);
                animation.registerAnimation(spriteSheet);
            }
            obj.registerAnimation(animation);
        }

        return obj;
    }
}