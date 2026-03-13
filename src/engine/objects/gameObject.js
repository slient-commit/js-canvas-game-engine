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
}