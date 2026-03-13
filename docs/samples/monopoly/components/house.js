class House {

    constructor(level, direction, position) {
        this.level = level;
        this.direction = direction;
        this.position = position;
        this.sprite = null;
        this.getSprite();
    }

    getSprite() {
        let version = 1;
        if (this.level < 5) {
            version = this.getRandomArbitrary(1, 2);
        }
        let fileName = `${this.direction}_${this.level}_${version}.png`;

        this.sprite = new Sprite(128, 64);
        this.sprite.loadImage(`./assets/sprites/houses/${fileName}`);
    }

    getRandomArbitrary(min, max) {
        return parseInt(Math.random() * (max - min) + min);
    }
}