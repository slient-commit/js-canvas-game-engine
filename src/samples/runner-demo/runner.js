window.addEventListener("engineReady", function() {
    class RunnerScene extends Scene {

        constructor(engine) {
            super('RunnerScene', engine);
            this.PLAYER_SPAWN_X = 0;
            this.PLAYER_SPAWN_Y = 0;
            this.player = null;
            this.spriteSheet = null;
            this.playerAnimations = null;
            this.background = null;
            this.buildingSprite = null;
            this.buildings = null;
            this.buildings0 = null;
            this.buildings1 = null;
            this.buildings2 = null;
            this.buildings3 = null;
            this.groundSprite = null;
            this.ground = null;
            this.camera = null;
        }

        OnCreate() {
            // Create a camera
            this.camera = new FixedCamera(engine.screenSize().width, engine.screenSize().height, engine.screenSize().width, engine.screenSize().height);
            // Player Positino
            this.PLAYER_SPAWN_X = (engine.screenSize().width / 2) - 65;
            this.PLAYER_SPAWN_Y = engine.screenSize().height - 75;
            // Create the runner
            this.player = new GameObject(new Sprite(65, 70), new Position(this.PLAYER_SPAWN_X, this.PLAYER_SPAWN_Y));
            // Create the running sprtieSheet
            this.spriteSheet = new SpriteSheet('running', 65, 70, 4, 0, 11, './assets/sprites/man_running.png');
            // Create the animation for the runner and include the spritesheet
            this.playerAnimations = new Animation();
            this.playerAnimations.registerAnimation(this.spriteSheet);
            this.player.registerAnimation(this.playerAnimations);
            // set the current animation to running, because the name of the spriteSheet is running
            this.player.setAnimation('running');

            // Create the background as simple sprite only
            this.background = new Sprite(engine.screenSize().width, engine.screenSize().height - 150);
            this.background.loadImage('./assets/sprites/background.jpg');

            // Create the building as Gameobject so they can move using the default functions
            this.buildingSprite = new Sprite(500, 250);
            this.buildingSprite.loadImage('./assets/sprites/buildings.png');
            this.buildings = new GameObject(this.buildingSprite, new Position(-500, 680));
            this.buildings0 = new GameObject(this.buildingSprite, new Position(0, 680));
            this.buildings1 = new GameObject(this.buildingSprite, new Position(500, 680));
            this.buildings2 = new GameObject(this.buildingSprite, new Position(1000, 680));
            this.buildings3 = new GameObject(this.buildingSprite, new Position(1500, 680));

            // Set the velocity to 100 in X
            this.buildings.velocity = new Point(100, 0);
            this.buildings0.velocity = new Point(100, 0);
            this.buildings1.velocity = new Point(100, 0);
            this.buildings2.velocity = new Point(100, 0);
            this.buildings3.velocity = new Point(100, 0);

            // Check if the building are out of the camera from the right, to put the them at the left, simple loop
            this.buildings.moveCondition = function(x, y, elapsedTime) {
                if (this.buildings.position.X >= this.camera.maxPosition.X - 10)
                    this.buildings.position.X = -500;
            }.bind(this);

            this.buildings0.moveCondition = function(x, y, elapsedTime) {
                if (this.buildings0.position.X >= this.camera.maxPosition.X - 10)
                    this.buildings0.position.X = -500;
            }.bind(this);

            this.buildings1.moveCondition = function(x, y, elapsedTime) {
                if (this.buildings1.position.X >= this.camera.maxPosition.X - 10)
                    this.buildings1.position.X = -500;
            }.bind(this);

            this.buildings2.moveCondition = function(x, y, elapsedTime) {
                if (this.buildings2.position.X >= this.camera.maxPosition.X - 10)
                    this.buildings2.position.X = -500;
            }.bind(this);

            this.buildings3.moveCondition = function(x, y, elapsedTime) {
                if (this.buildings3.position.X >= this.camera.maxPosition.X - 10)
                    this.buildings3.position.X = -500;
            }.bind(this);

            // Ground as GameObject for order drawing
            this.groundSprite = new Sprite(engine.screenSize().width, 300);
            this.groundSprite.loadImage('./assets/sprites/ground.png');
            this.ground = new GameObject(this.groundSprite, new Position(0, engine.screenSize().height - 180));


            // add objects to the engine to auto drawing
            this.registerGameObject(this.ground);
            this.registerGameObject(this.buildings);
            this.registerGameObject(this.buildings0);
            this.registerGameObject(this.buildings1);
            this.registerGameObject(this.buildings2);
            this.registerGameObject(this.buildings3);
            this.registerGameObject(this.player);
        }

        OnUpdate(elapsedTime) {
            // Draw the background sprite
            engine.drawer.sprite(this.background, new Position(0, 0));
            // run the move function for the building
            this.buildings.move(elapsedTime);
            this.buildings0.move(elapsedTime);
            this.buildings1.move(elapsedTime);
            this.buildings2.move(elapsedTime);
            this.buildings3.move(elapsedTime);
        }

        OnDestroy() {}

    }

    // Get the canas Element
    var canvas = document.getElementById("canvas");

    engine = new Engine(canvas);
    engine.jumpEngineIntro = true;
    engine.OnCreate = function() {
        runnerScene = new RunnerScene(this);
        engine.registerScene(runnerScene);
    };

    engine.OnUpdate = function(elapsedTime) {};

    engine.start();
});