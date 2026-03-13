// Wait for the engine to finish loading all scripts
window.addEventListener("engineReady", function() {

    class SampleScene extends Scene {

        constructor(engine) {
            super('SampleScene', engine);
            this.x = 100;
            this.y = 100;
            this.speed = 200;
        }

        OnCreate() {
            // Set up your scene here (runs once)
            return true;
        }

        OnUpdate(elapsedTime) {
            var input = this.engine.input;
            var drawer = this.engine.drawer;

            // Move with arrow keys or WASD
            if (input.isKeyDown(Keys.ArrowRight) || input.isKeyDown(Keys.D)) {
                this.x += this.speed * elapsedTime;
            }
            if (input.isKeyDown(Keys.ArrowLeft) || input.isKeyDown(Keys.A)) {
                this.x -= this.speed * elapsedTime;
            }
            if (input.isKeyDown(Keys.ArrowUp) || input.isKeyDown(Keys.W)) {
                this.y -= this.speed * elapsedTime;
            }
            if (input.isKeyDown(Keys.ArrowDown) || input.isKeyDown(Keys.S)) {
                this.y += this.speed * elapsedTime;
            }

            // Draw a rectangle at the current position
            drawer.rectangle(new Position(this.x, this.y), new Size(50, 50), true, 1, 'dodgerblue');

            // Draw instructions
            drawer.text('Use arrow keys or WASD to move', new Position(10, 30), 16, 'monospace', 'normal', 'white');
            drawer.text('Mouse: ' + Math.round(input.getMousePosition().X) + ', ' + Math.round(input.getMousePosition().Y),
                new Position(10, 50), 14, 'monospace', 'normal', 'gray');
        }

        OnDestroy() {
            // Clean up when leaving this scene
        }
    }

    var canvas = document.getElementById("canvas");
    var engine = new Engine(canvas);

    // Skip the engine intro splash screen (set to false to show it)
    engine.jumpEngineIntro = true;

    // Show FPS counter (useful for debugging)
    engine.displayFPS = true;

    // Set up the game
    engine.OnCreate = function() {
        var scene = new SampleScene(engine);
        engine.registerScene(scene);
    };

    engine.start();
});
