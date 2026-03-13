window.addEventListener("engineReady", function() {

    class SampleScene extends Scene {

        constructor(engine) {
            super('SampleScene', engine);
            this.firstLayer = new Layer("layer_1");
            this.buy_sprite = new Sprite(200, 50, "sprites/buy_off.png");
            this.end_sprite = new Sprite(200, 50, "sprites/end_turn_off.png");
            this.buy = new Element(this.buy_sprite, new Position(200, 200));
            this.end = new Element(this.end_sprite, new Position(200, 215));
        }

        OnCreate() {
            this.layers[0].layer.registerElement(this.buy);
            this.firstLayer.registerElement(this.end);

            this.registerLayer(this.firstLayer);
            this.buy.hide();
            this.end.show();
            return true;
        }

        OnUpdate(elapsedTime) {
            if (this.engine.mouseOnTopOf(this.end)) {
                this.end_sprite.loadImage("sprites/end_turn_on.png");
                if (this.engine.mouseClicked(MouseButton.LEFT)) {
                    this.buy.show();
                }
            } else {
                this.buy_sprite.loadImage("sprites/end_turn_off.png");
            }
            return true;
        }
    }

    var canvas = document.getElementById("canvas");
    engine = new Engine(canvas);
    engine.jumpEngineIntro = true;
    engine.OnCreate = function() {
        var scene = new SampleScene(engine);
        engine.registerScene(scene);
    };
    engine.start();
});
