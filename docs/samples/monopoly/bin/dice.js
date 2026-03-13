class Dice extends GameObject {

    constructor(position, name) {
        super(null, position);
        this.name = name;
        this.initAnimation();
        this.location = position;
        this.selectedNumber = -1;
        this.isStoped = true;
    }

    initAnimation(setanimation = true) {
        let point = this.getRandomArbitrary(0, 3);
        let one = new SpriteSheet('one', 128, 64, 3, point, point, './assets/sprites/dice.png');
        point = this.getRandomArbitrary(4, 7);
        let two = new SpriteSheet('two', 128, 64, 3, point, point, './assets/sprites/dice.png');
        point = this.getRandomArbitrary(8, 11);
        let three = new SpriteSheet('three', 128, 64, 3, point, point, './assets/sprites/dice.png');
        point = this.getRandomArbitrary(12, 15);
        let four = new SpriteSheet('four', 128, 64, 3, point, point, './assets/sprites/dice.png');
        point = this.getRandomArbitrary(16, 19);
        let five = new SpriteSheet('five', 128, 64, 3, point, point, './assets/sprites/dice.png');
        point = this.getRandomArbitrary(20, 23);
        let six = new SpriteSheet('six', 128, 64, 3, point, point, './assets/sprites/dice.png');

        let start = this.getRandomArbitrary(0, 12);
        let end = this.getRandomArbitrary(start, 23);
        if (end == start - 1 && end < 23)
            end++;
        let throwAnimation = new SpriteSheet('throw', 128, 64, 200, start, end, './assets/sprites/dice.png', true, function() {
            this.selectedNumber = this.getRandomArbitrary(1, 6);
            if (this.selectedNumber > 6)
                this.selectedNumber = 6;

            if (this.selectedNumber < 1)
                this.selectedNumber = 1;

            if (this.selectedNumber == -1)
                this.selectedNumber = 1;


            switch (this.selectedNumber) {
                case 1:
                    this.setAnimation('one');
                    break;
                case 2:
                    this.setAnimation('two');
                    break;
                case 3:
                    this.setAnimation('three');
                    break;
                case 4:
                    this.setAnimation('four');
                    break;
                case 5:
                    this.setAnimation('five');
                    break;
                case 6:
                    this.setAnimation('six');
                    break;
            }
            this.isStoped = true;
            this.initAnimation(false);
        }.bind(this), 2);

        let animation = new Animation();
        animation.registerAnimation(one);
        animation.registerAnimation(two);
        animation.registerAnimation(three);
        animation.registerAnimation(four);
        animation.registerAnimation(five);
        animation.registerAnimation(six);
        animation.registerAnimation(throwAnimation);
        this.registerAnimation(animation);
        if (setanimation)
            this.setAnimation('one');
    }

    throwDice() {
        this.isStoped = false;
        this.initAnimation();
        this.setAnimation('throw')
    }

    getRandomArbitrary(min, max) {
        return parseInt(Math.random() * (max - min) + min);
    }


}