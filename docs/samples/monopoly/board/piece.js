class Piece extends GameObject {

    constructor(spritePath, position) {
        super(null, position);
        this.spritePath = spritePath;
        this.cartesianPosition = new Position(9, 0);
        this.initAnimation();
        this.geoAnimation = null;
        this.moving = false;
        this.owner = null;
    }

    initAnimation() {
        let Sprite_bt = new SpriteSheet('bottomToTop', 128, 64, 5, 0, 0, this.spritePath);
        let Sprite_lr = new SpriteSheet('leftToRight', 128, 64, 5, 1, 1, this.spritePath);
        let Sprite_tb = new SpriteSheet('topToBottom', 128, 64, 5, 2, 2, this.spritePath);
        let Sprite_rt = new SpriteSheet('rightToLeft', 128, 64, 5, 3, 3, this.spritePath);

        let animation = new Animation();
        animation.registerAnimation(Sprite_bt);
        animation.registerAnimation(Sprite_lr);
        animation.registerAnimation(Sprite_tb);
        animation.registerAnimation(Sprite_rt);
        this.registerAnimation(animation);
        this.setAnimation('rightToLeft');
    }

    setDirection(direction) {
        if (this.sprite.name !== direction)
            this.setAnimation(direction);
    }

    goToJail() {
        this.cartesianPosition = new Position(10, 10);
    }
}