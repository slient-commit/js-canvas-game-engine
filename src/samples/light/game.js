window.addEventListener("engineReady", function() {

    class LightDemoScene extends Scene {

        constructor(engine) {
            super('LightDemoScene', engine);
            this.lighting = null;
            this.mouseLight = null;
            this.placedLights = [];

            // Room layout
            this.walls = [
                // Outer walls
                { x: 40,  y: 40,  w: 880, h: 10, color: '#4a4a5a' },  // top
                { x: 40,  y: 490, w: 880, h: 10, color: '#4a4a5a' },  // bottom
                { x: 40,  y: 40,  w: 10,  h: 460, color: '#4a4a5a' }, // left
                { x: 910, y: 40,  w: 10,  h: 460, color: '#4a4a5a' }, // right
                // Inner walls
                { x: 300, y: 40,  w: 10,  h: 200, color: '#3a3a4a' },
                { x: 600, y: 300, w: 10,  h: 200, color: '#3a3a4a' },
                { x: 400, y: 280, w: 200, h: 10,  color: '#3a3a4a' }
            ];

            // Furniture / objects
            this.objects = [
                { x: 100, y: 100, w: 60,  h: 40,  color: '#6b4423', label: 'Table' },
                { x: 700, y: 120, w: 80,  h: 50,  color: '#5c3d2e', label: 'Desk' },
                { x: 150, y: 350, w: 50,  h: 50,  color: '#8b5e3c', label: 'Crate' },
                { x: 450, y: 380, w: 70,  h: 35,  color: '#4a6741', label: 'Chest' },
                { x: 780, y: 400, w: 90,  h: 45,  color: '#5a3a3a', label: 'Barrel' },
                { x: 500, y: 100, w: 40,  h: 40,  color: '#7a6a5a', label: 'Box' }
            ];

            // Light color palette for random placement
            this.colorPalette = [
                new RGB(255, 200, 100),   // warm gold
                new RGB(100, 200, 255),   // cool blue
                new RGB(150, 255, 150),   // green
                new RGB(255, 150, 200),   // pink
                new RGB(200, 150, 255),   // purple
                new RGB(255, 255, 200),   // pale yellow
                new RGB(255, 120, 80)     // fiery orange
            ];
        }

        OnCreate() {
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            // Setup lighting
            this.lighting = new Lighting(this.engine);
            this.lighting.ambientAlpha = 0.92;

            // Mouse-following light (warm white)
            this.mouseLight = new LightSpot(
                new Position(sw / 2, sh / 2),
                new RGB(255, 240, 220),
                200, 1.0
            );
            this.lighting.addLightSpot(this.mouseLight);

            // Flickering torches on walls
            var torch1 = new LightSpot(new Position(100, 55), new RGB(255, 160, 50), 180, 0.9);
            torch1.flicker = 0.25;
            this.lighting.addLightSpot(torch1);

            var torch2 = new LightSpot(new Position(500, 55), new RGB(255, 140, 40), 160, 0.85);
            torch2.flicker = 0.2;
            this.lighting.addLightSpot(torch2);

            var torch3 = new LightSpot(new Position(850, 55), new RGB(255, 170, 60), 170, 0.9);
            torch3.flicker = 0.3;
            this.lighting.addLightSpot(torch3);

            // Cool blue ambient light in a corner
            var blueLight = new LightSpot(new Position(780, 450), new RGB(80, 150, 255), 200, 0.7);
            this.lighting.addLightSpot(blueLight);

            // Green glow near chest
            var greenGlow = new LightSpot(new Position(485, 395), new RGB(100, 255, 120), 120, 0.6);
            greenGlow.flicker = 0.1;
            this.lighting.addLightSpot(greenGlow);

            return true;
        }

        OnUpdate(elapsedTime) {
            var drawer = this.engine.drawer;
            var input = this.engine.input;
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            // --- Background ---
            drawer.clearWithColor('#1a1a24');

            // Floor tiles
            var tileSize = 40;
            for (var row = 0; row < sh / tileSize; row++) {
                for (var col = 0; col < sw / tileSize; col++) {
                    var shade = (row + col) % 2 === 0 ? '#22222e' : '#1e1e28';
                    drawer.rectangle(
                        new Vec2(col * tileSize, row * tileSize),
                        new Size(tileSize, tileSize),
                        true, 1, shade
                    );
                }
            }

            // --- Draw walls ---
            for (var i = 0; i < this.walls.length; i++) {
                var w = this.walls[i];
                drawer.rectangle(new Vec2(w.x, w.y), new Size(w.w, w.h), true, 1, w.color);
                // Highlight edge
                drawer.rectangle(new Vec2(w.x, w.y), new Size(w.w, w.h), false, 1, 'rgba(255,255,255,0.08)');
            }

            // --- Draw objects ---
            for (var i = 0; i < this.objects.length; i++) {
                var obj = this.objects[i];
                // Shadow
                drawer.rectangle(new Vec2(obj.x + 3, obj.y + 3), new Size(obj.w, obj.h), true, 1, 'rgba(0,0,0,0.4)');
                // Body
                drawer.rectangle(new Vec2(obj.x, obj.y), new Size(obj.w, obj.h), true, 1, obj.color);
                // Highlight
                drawer.rectangle(new Vec2(obj.x, obj.y), new Size(obj.w, Math.min(3, obj.h)), true, 1, 'rgba(255,255,255,0.12)');
                // Label
                drawer.text(obj.label, new Vec2(obj.x + 4, obj.y + obj.h / 2 + 4), 10, 'monospace', 'normal', 'rgba(255,255,255,0.6)');
            }

            // --- Draw torch flame indicators (small orange dots on wall) ---
            var torchPositions = [
                { x: 100, y: 50 },
                { x: 500, y: 50 },
                { x: 850, y: 50 }
            ];
            for (var i = 0; i < torchPositions.length; i++) {
                var tp = torchPositions[i];
                drawer.circle(new Vec2(tp.x, tp.y), 4, 0, -1, true, 1, '#ff8820');
                drawer.circle(new Vec2(tp.x, tp.y), 2, 0, -1, true, 1, '#ffcc44');
            }

            // --- Update mouse light position ---
            var mousePos = input.getMousePosition();
            this.mouseLight.position.X = mousePos.X;
            this.mouseLight.position.Y = mousePos.Y;

            // --- Click to place new light ---
            if (input.isMousePressed(0)) {
                var randColor = this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
                var newLight = new LightSpot(
                    new Position(mousePos.X, mousePos.Y),
                    randColor,
                    120 + Math.random() * 80,
                    0.7 + Math.random() * 0.3
                );
                newLight.flicker = Math.random() * 0.15;
                this.lighting.addLightSpot(newLight);
                this.placedLights.push(newLight);
            }

            // --- Right-click to remove last placed light ---
            if (input.isMousePressed(2) && this.placedLights.length > 0) {
                var removed = this.placedLights.pop();
                this.lighting.removeLightSpot(removed);
            }

            // --- Toggle darkness with D key ---
            if (input.isKeyPressed(Keys.D)) {
                if (this.lighting.ambientAlpha > 0.8) {
                    this.lighting.ambientAlpha = 0.5;
                } else if (this.lighting.ambientAlpha > 0.4) {
                    this.lighting.ambientAlpha = 0;
                } else {
                    this.lighting.ambientAlpha = 0.92;
                }
            }

            // --- Clear placed lights with C key ---
            if (input.isKeyPressed(Keys.C)) {
                for (var i = 0; i < this.placedLights.length; i++) {
                    this.lighting.removeLightSpot(this.placedLights[i]);
                }
                this.placedLights = [];
            }

            // --- Draw lighting overlay (AFTER scene, BEFORE UI text) ---
            this.lighting.draw(elapsedTime);

            // --- UI overlay text (drawn AFTER lighting so it's always visible) ---
            drawer.text('Lighting Demo', new Vec2(15, 22), 18, 'monospace', 'bold', 'rgba(255,255,255,0.9)');
            drawer.text('Move mouse to aim light  |  Click to place  |  Right-click to remove  |  D: toggle darkness  |  C: clear',
                new Vec2(15, sh - 15), 11, 'monospace', 'normal', 'rgba(255,255,255,0.5)');

            // Light count
            drawer.text('Lights: ' + this.lighting.lights.length, new Vec2(sw - 130, 22), 12, 'monospace', 'normal', 'rgba(255,255,255,0.5)');

            return true;
        }
    }

    var canvas = document.getElementById("canvas");
    var engine = new Engine(canvas);
    engine.jumpEngineIntro = true;
    engine.displayFPS = true;
    engine.setCanvasSize(960, 540);
    engine.OnCreate = function() {
        var scene = new LightDemoScene(engine);
        engine.registerScene(scene);
    };
    engine.start();
});
