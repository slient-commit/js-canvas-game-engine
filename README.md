# JS Canvas Game Engine

A lightweight 2D game engine built with vanilla JavaScript and HTML5 Canvas. No build tools, no dependencies — just include a script tag and start making games.

## Demo

![JCGE Demo](images/jcge_demo_gif.gif)

## Getting Started

### 1. Create your project

Create an HTML file that loads the engine and your game scripts:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Game</title>
    <script src="path/to/engine/engine-core.js"></script>
</head>
<body style="margin: 0; padding: 0; overflow: hidden;">
    <canvas id="canvas"></canvas>
    <script src="scenes/myScene.js"></script>
    <script src="game.js"></script>
</body>
</html>
```

### 2. Create a game entry point

```js
window.addEventListener("engineReady", function() {
    var canvas = document.getElementById("canvas");
    var engine = new Engine(canvas);

    engine.jumpEngineIntro = true;
    engine.displayFPS = true;

    engine.OnCreate = function() {
        var scene = new MyScene(engine);
        engine.registerScene(scene);
    };

    engine.start();
});
```

### 3. Create a scene

```js
class MyScene extends Scene {
    constructor(engine) {
        super('MyScene', engine);
    }

    OnCreate() {
        // Runs once when the scene starts
        return true;
    }

    OnUpdate(elapsedTime) {
        // Runs every frame
        this.engine.drawer.text('Hello World!', new Position(100, 100), 32, 'Arial', 'bold', 'white');
    }

    OnDestroy() {
        // Runs when leaving this scene
    }
}
```

## Architecture

```
Engine
├── Drawer          — renders sprites, shapes, text to canvas
├── InputManager    — keyboard, mouse, touch, gamepad input
├── SoundManager    — audio with master/music/sfx volume
├── TweenManager    — animate any property over time
├── AssetManager    — preload images and sounds
├── DebugOverlay    — collision boxes, object counts
└── Scenes[]
    ├── GameObjects[]  — positioned sprites with collision
    ├── Layers[]       — z-ordered rendering groups
    └── Camera         — viewport into the game world
```

## Core Concepts

### Engine

The `Engine` is the main class. It runs the game loop using `requestAnimationFrame` with delta-time.

```js
var engine = new Engine(canvas);
engine.displayFPS = true;           // show FPS counter
engine.jumpEngineIntro = true;      // skip splash screen
engine.setCanvasSize(800, 600);     // set canvas dimensions
engine.start();
```

### Scenes

Scenes organize your game into screens (menu, gameplay, credits). Override `OnCreate`, `OnUpdate`, and `OnDestroy`.

```js
// Switch scenes
engine.goToScene(gameScene);

// Switch with data passing and transition
engine.goToScene(gameScene, { level: 2 }, 'fade', 0.5);

// Access incoming data in the new scene
var data = this.getIncomingData(); // { level: 2 }
```

Transitions: `'none'`, `'fade'`, `'slide-left'`, `'slide-right'`

### Input

The `InputManager` provides per-frame edge detection:

```js
var input = engine.input;

// Keyboard
if (input.isKeyDown(Keys.ArrowRight))    { /* held down */ }
if (input.isKeyPressed(Keys.Space))      { /* just pressed this frame */ }
if (input.isKeyReleased(Keys.Escape))    { /* just released this frame */ }

// Mouse
if (input.isMouseDown(MouseButton.LEFT))    { /* held */ }
if (input.isMousePressed(MouseButton.LEFT)) { /* just clicked */ }
var pos = input.getMousePosition();         // canvas-relative {X, Y}

// Gamepad
if (input.isGamepadButtonDown(0))  { /* button 0 held */ }
var axes = input.getGamepadAxes(); // [leftX, leftY, rightX, rightY]
```

Full key list in `util/buttons.js`: all letters (A-Z), digits (0-9), F1-F12, arrows, modifiers, punctuation.

### Sprites & GameObjects

```js
// Simple sprite (just an image, no position)
var bg = new Sprite(800, 600);
bg.loadImage('background.png');
engine.drawer.sprite(bg, new Position(0, 0));

// GameObject (sprite + position, can move and collide)
var player = new GameObject(new Sprite(64, 64), new Position(100, 100));
player.sprite.loadImage('player.png');
scene.registerGameObject(player); // auto-drawn by the engine

// Movement
player.velocity = new Point(100, 0); // pixels per second
player.move(elapsedTime);

// Collision detection
if (player.collisionWith(enemy)) { /* AABB collision */ }
```

### Animated Sprites

```js
// SpriteSheet: name, width, height, columns, startFrame, endFrame, imagePath
var runSheet = new SpriteSheet('run', 64, 64, 8, 0, 7, 'run.png');

var anim = new Animation();
anim.registerAnimation(runSheet);
player.registerAnimation(anim);
player.setAnimation('run');
```

### Camera

```js
// Fixed camera (viewport stays in place)
var camera = new FixedCamera(800, 600, worldWidth, worldHeight);

// World camera (follows a target with smooth movement)
var camera = new WorldCamera(800, 600, worldWidth, worldHeight);
camera.setFollowTarget(player);
camera.followLerp = 0.1; // smoothing factor (0 = no follow, 1 = instant)

// Camera effects
camera.shake(10, 0.5);    // intensity, duration in seconds
camera.setZoom(1.5);       // zoom level

scene.setCamera(camera);
```

### Layers

Layers provide z-ordering for rendering:

```js
var uiLayer = new Layer('ui');
uiLayer.registerElement(button);
uiLayer.registerGameObject(cursor);
scene.registerLayer(uiLayer);
```

### Drawer

The `Drawer` handles all rendering:

```js
var d = engine.drawer;

// Shapes
d.rectangle(position, new Size(100, 50), true, 2, 'red');
d.circle(position, 25, true, 2, 'blue');
d.line(pointA, pointB, 3, 'white');

// Text
d.text('Score: 100', position, 24, 'Arial', 'bold', 'white');

// Sprite transforms
d.drawRotated(sprite, position, angle, opacity);
d.drawScaled(sprite, position, scaleX, scaleY, opacity);
d.drawFlipped(sprite, position, flipX, flipY, opacity);

// Utility
d.clearWithColor('black');
```

### Vec2

`Vec2` is the core vector class (replaces the old `Point` and `Position` which are now aliases):

```js
var v = new Vec2(10, 20);
var sum = v.add(new Vec2(5, 5));      // Vec2(15, 25)
var dist = v.distance(other);         // number
var norm = v.normalize();             // unit vector
var lerped = v.lerp(target, 0.5);     // halfway between v and target
var len = v.length();                 // magnitude
```

### Tweening

Animate any numeric property over time:

```js
// Move a game object to position (300, 200) over 1 second
engine.tweens.to(player.position, { X: 300, Y: 200 }, 1.0, Easing.easeInOut)
    .onComplete(function() { console.log('done!'); });

// Chain tweens
engine.tweens.to(obj, { X: 100 }, 0.5, Easing.easeIn)
    .then(obj, { Y: 200 }, 0.5, Easing.easeOut);
```

Easing functions: `linear`, `easeIn`, `easeOut`, `easeInOut`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `bounce`, `elastic`

### Tilemap

Render tile-based maps from 2D arrays:

```js
var tileset = new Tileset('tileset.png', 32, 32);
var mapData = [
    [0, 1, 2, 1],
    [3, 4, 5, 4],
    [6, 7, 8, 7]
];
var tilemap = new Tilemap(tileset, mapData, 4, 3);

// Add collision layer
tilemap.setCollisionLayer([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 1, 1, 1]  // 1 = solid
]);

// In OnUpdate:
tilemap.draw(engine.drawer, scene.currentCamera);

// Collision queries
if (tilemap.isSolidAt(player.position.X, player.position.Y + 64)) {
    // hit ground
}
```

### Particle System

```js
// Built-in presets
var fire = ParticleEmitter.fire(new Position(400, 300));
var smoke = ParticleEmitter.smoke(new Position(400, 300));
var explosion = ParticleEmitter.explosion(new Position(400, 300));
var sparkle = ParticleEmitter.sparkle(new Position(400, 300));

// In OnUpdate:
fire.update(elapsedTime);
fire.draw(engine.drawer);

// Custom emitter
var emitter = new ParticleEmitter({
    position: new Position(100, 100),
    rate: 20,
    lifespan: 1.5,
    speed: { min: 50, max: 150 },
    angle: { min: -Math.PI, max: 0 },
    size: { min: 2, max: 6 },
    colorStart: new RGB(255, 200, 0),
    colorEnd: new RGB(255, 0, 0),
    gravity: 100,
    fadeOut: true
});
```

### Sound

```js
// Simple sound playback
var jump = new Sound('jump.mp3');
jump.play();

// Sound manager with volume control
engine.sound.setMasterVolume(0.8);
engine.sound.setMusicVolume(0.5);
engine.sound.setSFXVolume(1.0);
engine.sound.playMusic(bgMusic);
engine.sound.playSFX(jumpSound);
engine.sound.muteAll();
```

### Asset Manager

Preload assets before the game starts:

```js
engine.assets
    .loadImage('player', 'sprites/player.png')
    .loadImage('enemy', 'sprites/enemy.png')
    .loadSound('jump', 'audio/jump.mp3')
    .onProgress(function(loaded, total) {
        console.log(loaded + '/' + total + ' loaded');
    })
    .onComplete(function() {
        engine.start();
    });

engine.assets.startLoading();

// Later, retrieve loaded assets
var img = engine.assets.getImage('player');
var snd = engine.assets.getSound('jump');
```

### Collision Helpers

Static utility functions for collision detection:

```js
Collision.rectRect(posA, sizeA, posB, sizeB);     // AABB overlap
Collision.circleCircle(posA, radiusA, posB, radiusB);
Collision.circleRect(circlePos, radius, rectPos, rectSize);
Collision.pointRect(point, rectPos, rectSize);
Collision.pointCircle(point, circlePos, radius);
```

### Event Emitter

Pub/sub events for decoupled communication:

```js
var emitter = new EventEmitter();
emitter.on('scoreChange', function(score) { /* ... */ });
emitter.once('gameOver', function() { /* fires only once */ });
emitter.emit('scoreChange', 100);
emitter.off('scoreChange', callback);
```

### Debug Overlay

Toggle debug visualizations:

```js
engine.debug.showCollisionBoxes = true;
engine.debug.showCameraBounds = true;
engine.debug.showObjectCount = true;
```

### Lighting

2D tile-based lighting system:

```js
var lighting = new Lighting(engine, 10, 10, 50); // cols, rows, tileSize
lighting.addLightSpot(new LightSpot(new Position(5, 5), new RGB(255, 255, 200), 3, 30));
// In OnUpdate:
lighting.draw();
```

## Project Structure

```
src/
├── engine/
│   ├── engine-core.js          — script loader (entry point)
│   ├── engine-parts/
│   │   ├── engine.js           — main Engine class
│   │   ├── scene.js            — Scene class
│   │   └── layer.js            — Layer class
│   ├── objects/
│   │   ├── gameObject.js       — GameObject class
│   │   ├── element.js          — UI Element class
│   │   └── camera.js           — Camera base class
│   ├── buffer/
│   │   ├── drawer.js           — rendering
│   │   ├── sprite.js           — Sprite class
│   │   └── spriteSheet.js      — SpriteSheet class
│   ├── cameras/
│   │   ├── fixedCamera.js      — FixedCamera
│   │   └── worldCamera.js      — WorldCamera (smooth follow, shake, zoom)
│   ├── input/
│   │   └── inputManager.js     — keyboard, mouse, touch, gamepad
│   ├── audio/
│   │   ├── sound.js            — Sound class
│   │   └── soundManager.js     — volume control
│   ├── animations/
│   │   ├── animation.js        — animation controller
│   │   ├── easing.js           — easing functions
│   │   ├── tween.js            — Tween and TweenManager
│   │   └── geometricAnimation.js
│   ├── particles/
│   │   ├── particle.js         — base Particle
│   │   ├── fire.js             — Fire effect
│   │   └── particleEmitter.js  — ParticleEmitter with presets
│   ├── physics/
│   │   └── collision.js        — static collision helpers
│   ├── tilemap/
│   │   ├── tileset.js          — Tileset class
│   │   └── tilemap.js          — Tilemap class
│   ├── lights/
│   │   ├── lighting.js         — tile-based lighting
│   │   ├── lightSpot.js        — light source
│   │   └── lightTile.js        — light tile
│   ├── assets/
│   │   └── assetManager.js     — asset preloading
│   ├── debug/
│   │   └── debugOverlay.js     — debug visualizations
│   ├── util/
│   │   ├── vec2.js             — Vec2 (also Point, Position)
│   │   ├── size.js             — Size class
│   │   ├── rgb.js              — RGB color
│   │   ├── buttons.js          — key/mouse button constants
│   │   └── eventEmitter.js     — pub/sub events
│   └── scenes/
│       └── introScene.js       — engine splash screen
├── samples/
│   ├── default/                — animation & input demo
│   ├── layers/                 — layer system demo
│   ├── particles/              — fire particles demo
│   ├── light/                  — lighting demo
│   ├── runner-demo/            — side-scrolling runner
│   └── monopoly/               — full board game
└── empty-game-project/         — starter template
```

## Using the Game Loader

For games with multiple script files (like the Monopoly sample), use `game-loader.js`:

```html
<script src="path/to/engine/engine-core.js"></script>
<script src="path/to/engine/game-loader.js"></script>
<script>
    var files = [
        { name: "Scene", path: "scenes/gameScene.js" },
        { name: "Player", path: "player.js" }
    ];
    loader(files, "", function() {
        console.log("All game scripts loaded");
    });
</script>
```

Then listen for `gameReady` instead of `engineReady`:

```js
window.addEventListener("gameReady", function() {
    var engine = new Engine(document.getElementById("canvas"));
    engine.start();
});
```
