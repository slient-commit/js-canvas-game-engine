window.addEventListener("engineReady", function() {

    class SampleScene extends Scene {

        constructor(engine) {
            super('SampleScene', engine);
            this.x = 500;
            this.speed = 150;
            this.timer = 0;
            this.drawPoint = true;
            this.fadeOut = 1;
            this.animate = false;
            this.sprite = null;
            this.gameObject = null;
            this.animation = null;
            this.camera = null;
            this.movingAnimation = null;
        }

        OnCreate() {
            this.sprite = new SpriteSheet('moving', 125, 125, 5, 0, 15, '../../assets/spritesheet_numbered.png');
            this.gameObject = new GameObject(this.sprite, new Position(150, 150));
            this.animation = new Animation();
            this.animation.registerAnimation(this.sprite);
            this.gameObject.registerAnimation(this.animation);
            this.gameObject.setAnimation('moving');
            this.registerGameObject(this.gameObject);
            this.camera = new FixedCamera(this.engine.screenSize().width, this.engine.screenSize().height, 500, 500);
            this.setCamera(this.camera);
            this.movingAnimation = new GeometricAnimation('test', this.gameObject);
            this.movingAnimation.startFrom(null);
            return true;
        }

        OnUpdate(elapsedTime) {
            if (engine.keyClicked(Keys.ArrowRight)) {
                this.x += 200 * elapsedTime;
            }

            if (engine.keyClicked(Keys.ArrowLeft)) {
                this.x -= 200 * elapsedTime;
            }

            if (engine.keyClicked(Keys.Enter)) {
                this.drawPoint = !this.drawPoint;
            }

            if (engine.keyClicked(Keys.Space)) {
                this.animate = !this.animate;
            }

            if (this.animate) {
                this.movingAnimation.animate(elapsedTime);
            }

            if (engine.mouseClicked(MouseButton.LEFT)) {
                this.movingAnimation.to(engine.mousePosition(), 300);
            }
            if (engine.mouseClicked(MouseButton.RIGHT)) {
                this.movingAnimation.endAt(engine.mousePosition(), 300);
            }

            if (this.drawPoint)
                this.movingAnimation.drawPoints(engine.drawer);

            engine.drawer.text(`Object(${this.gameObject.position.X},${this.gameObject.position.Y})`, new Position(10, 20));
            if (this.movingAnimation.currentPoint) {
                engine.drawer.text(`Point(${this.movingAnimation.currentPoint.position.X},${this.movingAnimation.currentPoint.position.Y})`, new Position(10, 50));
                engine.drawer.text(`Distance(${parseInt(this.movingAnimation.currentPoint.position.X - this.gameObject.position.X)},${parseInt(this.movingAnimation.currentPoint.position.Y - this.gameObject.position.Y)})`, new Position(10, 80));
                engine.drawer.text(`Index(${this.movingAnimation.index})`, new Position(10, 100));
            }
        }
    }

    var canvas = document.getElementById("canvas");
    engine = new Engine(canvas);
    engine.OnCreate = function() {
        var scene = new SampleScene(engine);
        engine.registerScene(scene);
    };
    engine.start();
});
