class Animation {

    constructor() {
        this.animations = [];
    }

    /**
     * Add new animation
     * @param {SpriteSheet} spriteSheet 
     * @returns bool
     */
    registerAnimation(spriteSheet) {
        if (spriteSheet === null || spriteSheet === undefined) {
            console.error('No valide sprite sheet was found, can\'t build an animation');
            return false;
        }

        if (spriteSheet.image === null || spriteSheet.image === undefined) {
            console.error('No valide sprite sheet image was found, can\'t build an animation');
            return false;
        }

        this.animations.push(spriteSheet);
        return true;
    }

    /**
     * Get animation by name
     * @param {string} name
     * @returns Animation
     */
    getAnimation(name) {
        let animation = this.animations.filter(animation => {
            return animation.name === name;
        })[0];
        animation.currentFrame = 0;
        return animation;
    }
}