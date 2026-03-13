window.addEventListener("engineReady", function() {

    class SampleScene extends Scene {

        constructor(engine) {
            super('SampleScene', engine);
            this.delay = 0;
            this.fire = new Fire(this.engine, new Position(300, 300), 2, 7);
        }

        OnCreate() {
            this.fire.generate();
            return true;
        }

        OnUpdate(elapsedTime) {
            this.fire.draw(elapsedTime);
            this.fire.startPosition = this.engine.mousePosition();
            this.fire.generate();

            if (this.engine.mouseClicked(MouseButton.LEFT)) {
                this.fire.startPosition = this.engine.mousePosition();
                this.fire.generate();
            }
        }

        getRandomArbitrary(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    }

    var canvas = document.getElementById("canvas");
    engine = new Engine(canvas);
    engine.jumpEngineIntro = false;
    engine.OnCreate = function() {
        var scene = new SampleScene(engine);
        engine.registerScene(scene);
    };
    engine.start();
});
