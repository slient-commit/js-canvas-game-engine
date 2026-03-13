window.addEventListener("engineReady", function() {

    class ShadowDemoScene extends Scene {

        constructor(engine) {
            super('ShadowDemoScene', engine);
            this.shadowSystem = null;

            // Scene objects: each has visual properties + a shadow caster
            this.objects = [
                // Crates
                { x: 150, y: 200, w: 60, h: 40, color: '#8b5e3c', highlight: '#a47450', label: 'Crate', type: 'rectangle', heightScale: 1.0 },
                { x: 420, y: 320, w: 50, h: 50, color: '#7a5030', highlight: '#906040', label: 'Crate', type: 'rectangle', heightScale: 1.2 },
                { x: 700, y: 250, w: 70, h: 35, color: '#6b4423', highlight: '#845838', label: 'Chest', type: 'rectangle', heightScale: 0.8 },

                // Pillars (tall — higher heightScale)
                { x: 300, y: 140, w: 24, h: 24, color: '#7a7a8a', highlight: '#9a9aaa', label: 'Pillar', type: 'rectangle', heightScale: 2.5 },
                { x: 600, y: 380, w: 24, h: 24, color: '#7a7a8a', highlight: '#9a9aaa', label: 'Pillar', type: 'rectangle', heightScale: 2.5 },

                // Trees (ellipse shadows)
                { x: 500, y: 120, w: 44, h: 44, color: '#3a7a3a', highlight: '#4a9a4a', label: 'Tree', type: 'ellipse', heightScale: 2.0 },
                { x: 180, y: 380, w: 50, h: 50, color: '#2e6e2e', highlight: '#3e8e3e', label: 'Tree', type: 'ellipse', heightScale: 2.2 },
                { x: 780, y: 140, w: 38, h: 38, color: '#357535', highlight: '#459545', label: 'Tree', type: 'ellipse', heightScale: 1.8 },

                // Character
                { x: 460, y: 220, w: 20, h: 20, color: '#cc6644', highlight: '#ee8866', label: 'Player', type: 'rectangle', heightScale: 1.5 }
            ];

            this.casters = [];
        }

        OnCreate() {
            this.shadowSystem = new ShadowSystem(this.engine);
            this.shadowSystem.lightAngle = 315;
            this.shadowSystem.shadowLength = 80;
            this.shadowSystem.shadowOpacity = 0.4;
            this.shadowSystem.blur = 4;

            // Create casters for each object
            for (var i = 0; i < this.objects.length; i++) {
                var obj = this.objects[i];
                var caster = new ShadowCaster(
                    new Vec2(obj.x, obj.y),
                    new Size(obj.w, obj.h),
                    obj.type,
                    obj.heightScale
                );
                this.shadowSystem.addCaster(caster);
                this.casters.push(caster);
            }

            return true;
        }

        OnUpdate(elapsedTime) {
            var drawer = this.engine.drawer;
            var input = this.engine.input;
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            // --- Background: dark green ground ---
            drawer.clearWithColor('#2a4a2a');

            // Subtle grid
            for (var gx = 0; gx < sw; gx += 40) {
                drawer.line(new Vec2(gx, 0), new Vec2(gx, sh), 1, 'rgba(0,0,0,0.12)');
            }
            for (var gy = 0; gy < sh; gy += 40) {
                drawer.line(new Vec2(0, gy), new Vec2(sw, gy), 1, 'rgba(0,0,0,0.12)');
            }

            // --- Mouse controls light direction ---
            var mousePos = input.getMousePosition();
            var cx = sw / 2;
            var cy = sh / 2;
            this.shadowSystem.lightAngle = Math.atan2(mousePos.Y - cy, mousePos.X - cx) * 180 / Math.PI;

            // --- Arrow keys adjust shadow length ---
            if (input.isKeyDown(Keys.ArrowUp)) {
                this.shadowSystem.shadowLength = Math.min(this.shadowSystem.shadowLength + 120 * elapsedTime, 300);
            }
            if (input.isKeyDown(Keys.ArrowDown)) {
                this.shadowSystem.shadowLength = Math.max(this.shadowSystem.shadowLength - 120 * elapsedTime, 10);
            }

            // --- Sync caster positions (in case objects move) ---
            for (var i = 0; i < this.objects.length; i++) {
                this.casters[i].position.X = this.objects[i].x;
                this.casters[i].position.Y = this.objects[i].y;
            }

            // --- Draw shadows BEFORE objects ---
            this.shadowSystem.draw(null);

            // --- Draw objects ---
            for (var i = 0; i < this.objects.length; i++) {
                var obj = this.objects[i];

                if (obj.type === 'ellipse') {
                    // Tree trunk
                    var trunkX = obj.x + obj.w / 2;
                    var trunkY = obj.y + obj.h * 0.6;
                    drawer.rectangle(new Vec2(trunkX - 4, trunkY), new Size(8, obj.h * 0.4), true, 1, '#5a3a1a');
                    // Tree canopy
                    drawer.circle(new Vec2(obj.x + obj.w / 2, obj.y + obj.h / 2), obj.w / 2, 0, -1, true, 1, obj.color);
                    drawer.circle(new Vec2(obj.x + obj.w / 2, obj.y + obj.h / 2), obj.w / 2, 0, -1, false, 1, obj.highlight);
                } else {
                    // Solid body
                    drawer.rectangle(new Vec2(obj.x, obj.y), new Size(obj.w, obj.h), true, 1, obj.color);
                    // Top highlight
                    drawer.rectangle(new Vec2(obj.x, obj.y), new Size(obj.w, Math.min(3, obj.h)), true, 1, obj.highlight);
                    // Border
                    drawer.rectangle(new Vec2(obj.x, obj.y), new Size(obj.w, obj.h), false, 1, 'rgba(255,255,255,0.1)');
                }

                // Label
                var tw = drawer.textWidth(obj.label, 9, 'monospace', 'normal');
                drawer.text(obj.label, new Vec2(obj.x + (obj.w - tw) / 2, obj.y - 6), 9, 'monospace', 'normal', 'rgba(255,255,255,0.5)');
            }

            // --- Sun direction indicator (top-right) ---
            var indX = sw - 60;
            var indY = 60;
            var indR = 25;

            // Background circle
            drawer.circle(new Vec2(indX, indY), indR + 4, 0, -1, true, 1, 'rgba(0,0,0,0.3)');
            drawer.circle(new Vec2(indX, indY), indR, 0, -1, false, 2, 'rgba(255,220,100,0.4)');

            // Direction line
            var dirRad = this.shadowSystem.lightAngle * Math.PI / 180;
            var lineEndX = indX + Math.cos(dirRad) * indR;
            var lineEndY = indY + Math.sin(dirRad) * indR;
            drawer.line(new Vec2(indX, indY), new Vec2(lineEndX, lineEndY), 2, '#ffdd66');

            // Sun dot
            drawer.circle(new Vec2(lineEndX, lineEndY), 5, 0, -1, true, 1, '#ffdd66');
            drawer.circle(new Vec2(lineEndX, lineEndY), 3, 0, -1, true, 1, '#ffffff');

            // Center dot
            drawer.circle(new Vec2(indX, indY), 2, 0, -1, true, 1, 'rgba(255,255,255,0.4)');

            // --- UI text ---
            drawer.text('Shadow Demo', new Vec2(15, 22), 18, 'monospace', 'bold', 'rgba(255,255,255,0.9)');

            drawer.text(
                'Move mouse to aim light  |  Up/Down: shadow length  |  Angle: ' +
                Math.round(this.shadowSystem.lightAngle) + '\u00B0  |  Length: ' +
                Math.round(this.shadowSystem.shadowLength) + 'px',
                new Vec2(15, sh - 15), 11, 'monospace', 'normal', 'rgba(255,255,255,0.5)'
            );

            drawer.text('Casters: ' + this.shadowSystem.casters.length,
                new Vec2(sw - 130, 22), 12, 'monospace', 'normal', 'rgba(255,255,255,0.5)');

            return true;
        }
    }

    var canvas = document.getElementById("canvas");
    var engine = new Engine(canvas);
    engine.jumpEngineIntro = true;
    engine.displayFPS = true;
    engine.setCanvasSize(960, 540);
    engine.OnCreate = function() {
        var scene = new ShadowDemoScene(engine);
        engine.registerScene(scene);
    };
    engine.start();
});
