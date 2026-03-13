class GameScene extends Scene {

    constructor(engine) {
        super('GameScene', engine);
        this.game = new Game(engine, this);
    }

    OnCreate() {
        this.game.OnCreate();
    }

    OnUpdate(elapsedTime) {
        this.game.OnUpdate(elapsedTime);
    }
}
