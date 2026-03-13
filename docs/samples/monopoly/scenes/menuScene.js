class MenuScene extends Scene {

    constructor(engine) {
        super('MenuScene', engine);
        this.spritePlay = new Sprite(200, 50);
        this.spritePlay.loadImage('./assets/sprites/buttons/play_off.png');
        this.music = new Sound('./assets/audio/main_menu.mp3', 50, true);

    }

    OnCreate() {
        if (this.engine.playMusic)
            this.music.play();
        this.clickSound = new Sound('./assets/audio/click.mp3', 80);
    }

    OnUpdate(elapsedTime) {
        this.engine.drawer.sprite(this.spritePlay, new Position((this.engine.screenSize().width / 2) - 100, 300));
        this.counter += elapsedTime;
        if (this.engine.mouseOnTopOfPosition(new Position((this.engine.screenSize().width / 2) - 100, 300), new Size(200, 50))) {
            this.spritePlay.loadImage('./assets/sprites/buttons/play_on.png');
            if (this.engine.mouseClicked(MouseButton.LEFT)) {
                if (this.engine.sfx)
                    this.clickSound.play();
                let gameScene = new GameScene(this.engine);
                this.engine.goToScene(gameScene);
                this.ended();
            }
        } else {
            this.spritePlay.loadImage('./assets/sprites/buttons/play_off.png');
        }

    }

    OnDestroy() {
        this.music.stop();
    }

}