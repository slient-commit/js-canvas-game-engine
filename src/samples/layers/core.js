window.addEventListener("engineReady", function() {

    class LayerDemoScene extends Scene {

        constructor(engine) {
            super('LayerDemoScene', engine);
            this.worldWidth = 2000;
            this.worldHeight = 1200;
            this.score = 0;
            this.health = 100;
            this.maxHealth = 100;
            this.scoreLabel = null;
            this.healthLabel = null;
            this.camTarget = new Vec2(this.worldWidth / 2, this.worldHeight / 2);

            // World objects scattered around the map
            this.worldObjects = [
                { x: 200,  y: 150,  w: 80,  h: 80,  color: '#e94560', label: 'Red Block' },
                { x: 600,  y: 300,  w: 120, h: 60,  color: '#16c79a', label: 'Green Plat' },
                { x: 1100, y: 200,  w: 100, h: 100, color: '#ffdd57', label: 'Gold Box' },
                { x: 1500, y: 600,  w: 60,  h: 120, color: '#9b59b6', label: 'Purple Pillar' },
                { x: 400,  y: 800,  w: 140, h: 70,  color: '#3498db', label: 'Blue Slab' },
                { x: 900,  y: 700,  w: 90,  h: 90,  color: '#e67e22', label: 'Orange Crate' },
                { x: 1600, y: 900,  w: 110, h: 50,  color: '#1abc9c', label: 'Teal Bar' },
                { x: 300,  y: 500,  w: 70,  h: 70,  color: '#e74c3c', label: 'Crimson Tile' },
                { x: 1200, y: 500,  w: 80,  h: 110, color: '#2ecc71', label: 'Emerald Wall' },
                { x: 800,  y: 1000, w: 150, h: 60,  color: '#f39c12', label: 'Amber Strip' }
            ];
        }

        OnCreate() {
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            // --- Camera ---
            this.cam = new WorldCamera(sw, sh, this.worldWidth, this.worldHeight);
            this.cam.addOffset = true;
            this.cam.smoothFollow = true;
            this.cam.followLerp = 0.08;
            this.setCamera(this.cam);

            // --- Foreground layer (world space) ---
            this.fgLayer = new Layer("foreground");
            this.registerLayer(this.fgLayer);

            // --- UI Layer (screen space, stays fixed) ---
            this.uiLayer = new UILayer("hud");
            this.registerLayer(this.uiLayer);

            // HUD panel
            var hudPanel = new UIPanel(new Position(10, 10), new Size(260, 130), {
                fillColor: 'rgba(10, 10, 30, 0.85)',
                borderColor: '#16c79a',
                borderWidth: 2
            });
            this.uiLayer.registerElement(hudPanel);

            // Title
            this.uiLayer.registerElement(new UILabel('HUD (UI Layer)', new Position(25, 35), {
                fontSize: 16, fontStyle: 'bold', color: '#16c79a'
            }));

            // Score label
            this.scoreLabel = new UILabel('Score: 0', new Position(25, 62), {
                fontSize: 16, fontStyle: 'bold', color: '#ffdd57'
            });
            this.uiLayer.registerElement(this.scoreLabel);

            // Health label
            this.healthLabel = new UILabel('Health: 100 / 100', new Position(25, 88), {
                fontSize: 14, color: '#e94560'
            });
            this.uiLayer.registerElement(this.healthLabel);

            // Instructions
            this.uiLayer.registerElement(new UILabel('WASD / Arrows: Move Camera', new Position(25, 118), {
                fontSize: 11, color: '#667788'
            }));

            // Camera position indicator (top right)
            this.camLabel = new UILabel('Camera: (0, 0)', new Position(sw - 220, 25), {
                fontSize: 12, color: '#556677'
            });
            this.uiLayer.registerElement(this.camLabel);

            // --- Buttons at bottom ---
            var self = this;

            var btnScore = new UIButton(new Position(10, sh - 55), new Size(140, 42), {
                normalColor: '#0f3460',
                hoverColor: '#1a4f8a',
                pressedColor: '#0a2040',
                label: '+100 Score',
                fontSize: 14,
                fontColor: 'white',
                onClick: function() {
                    self.score += 100;
                    self.scoreLabel.setText('Score: ' + self.score);
                }
            });
            this.uiLayer.registerElement(btnScore);

            var btnHeal = new UIButton(new Position(160, sh - 55), new Size(120, 42), {
                normalColor: '#1a5c2a',
                hoverColor: '#2a7a3e',
                pressedColor: '#0f3a1a',
                label: 'Heal +10',
                fontSize: 14,
                fontColor: 'white',
                onClick: function() {
                    self.health = Math.min(self.maxHealth, self.health + 10);
                    self.healthLabel.setText('Health: ' + self.health + ' / ' + self.maxHealth);
                }
            });
            this.uiLayer.registerElement(btnHeal);

            var btnDamage = new UIButton(new Position(290, sh - 55), new Size(130, 42), {
                normalColor: '#5c1a1a',
                hoverColor: '#7a2a2a',
                pressedColor: '#3a0f0f',
                label: 'Damage -15',
                fontSize: 14,
                fontColor: 'white',
                onClick: function() {
                    self.health = Math.max(0, self.health - 15);
                    self.healthLabel.setText('Health: ' + self.health + ' / ' + self.maxHealth);
                }
            });
            this.uiLayer.registerElement(btnDamage);

            var btnReset = new UIButton(new Position(430, sh - 55), new Size(160, 42), {
                normalColor: '#3a3a5c',
                hoverColor: '#4a4a7a',
                pressedColor: '#2a2a3a',
                label: 'Reset Camera',
                fontSize: 14,
                fontColor: 'white',
                onClick: function() {
                    self.camTarget = new Vec2(self.worldWidth / 2, self.worldHeight / 2);
                }
            });
            this.uiLayer.registerElement(btnReset);

            return true;
        }

        OnUpdate(elapsedTime) {
            var drawer = this.engine.drawer;
            var input = this.engine.input;

            drawer.clearWithColor('#12121e');

            // --- Camera movement ---
            var camSpeed = 350;
            if (input.isKeyDown(Keys.W) || input.isKeyDown(Keys.ArrowUp))
                this.camTarget = this.camTarget.add(new Vec2(0, -camSpeed * elapsedTime));
            if (input.isKeyDown(Keys.S) || input.isKeyDown(Keys.ArrowDown))
                this.camTarget = this.camTarget.add(new Vec2(0, camSpeed * elapsedTime));
            if (input.isKeyDown(Keys.A) || input.isKeyDown(Keys.ArrowLeft))
                this.camTarget = this.camTarget.add(new Vec2(-camSpeed * elapsedTime, 0));
            if (input.isKeyDown(Keys.D) || input.isKeyDown(Keys.ArrowRight))
                this.camTarget = this.camTarget.add(new Vec2(camSpeed * elapsedTime, 0));

            // Clamp within world
            this.camTarget = new Vec2(
                Math.max(0, Math.min(this.worldWidth, this.camTarget.X)),
                Math.max(0, Math.min(this.worldHeight, this.camTarget.Y))
            );

            // Follow target
            var camObj = { position: this.camTarget, sprite: { width: 0, height: 0 } };
            this.cam.setPositionTo(camObj, elapsedTime);
            this.cam.update(elapsedTime);

            var off = this.cam.offset;

            // --- Background: checkerboard grid ---
            var tileSize = 64;
            var startCol = Math.floor(this.cam.position.X / tileSize);
            var startRow = Math.floor(this.cam.position.Y / tileSize);
            var endCol = Math.ceil((this.cam.position.X + this.cam.cameraSize.width) / tileSize);
            var endRow = Math.ceil((this.cam.position.Y + this.cam.cameraSize.height) / tileSize);
            var maxCols = Math.ceil(this.worldWidth / tileSize);
            var maxRows = Math.ceil(this.worldHeight / tileSize);

            for (var row = startRow; row <= endRow; row++) {
                for (var col = startCol; col <= endCol; col++) {
                    if (row < 0 || col < 0 || row >= maxRows || col >= maxCols) continue;
                    var color = (row + col) % 2 === 0 ? '#1a1a2e' : '#16162a';
                    drawer.rectangle(
                        new Vec2(col * tileSize + off.X, row * tileSize + off.Y),
                        new Size(tileSize, tileSize),
                        true, 1, color
                    );
                }
            }

            // --- Subtle grid lines ---
            for (var col = startCol; col <= endCol; col++) {
                if (col < 0 || col > maxCols) continue;
                var x = col * tileSize + off.X;
                drawer.line(
                    new Vec2(x, Math.max(0, startRow * tileSize) + off.Y),
                    new Vec2(x, Math.min(this.worldHeight, (endRow + 1) * tileSize) + off.Y),
                    1, '#1e1e36', 0.3
                );
            }
            for (var row = startRow; row <= endRow; row++) {
                if (row < 0 || row > maxRows) continue;
                var y = row * tileSize + off.Y;
                drawer.line(
                    new Vec2(Math.max(0, startCol * tileSize) + off.X, y),
                    new Vec2(Math.min(this.worldWidth, (endCol + 1) * tileSize) + off.X, y),
                    1, '#1e1e36', 0.3
                );
            }

            // --- World border ---
            drawer.rectangle(
                new Vec2(off.X, off.Y),
                new Size(this.worldWidth, this.worldHeight),
                false, 2, '#e94560'
            );

            // --- World objects ---
            for (var i = 0; i < this.worldObjects.length; i++) {
                var obj = this.worldObjects[i];
                var ox = obj.x + off.X;
                var oy = obj.y + off.Y;

                // Shadow
                drawer.rectangle(new Vec2(ox + 4, oy + 4), new Size(obj.w, obj.h), true, 1, 'rgba(0,0,0,0.3)');
                // Object body
                drawer.rectangle(new Vec2(ox, oy), new Size(obj.w, obj.h), true, 1, obj.color);
                // Border highlight
                drawer.rectangle(new Vec2(ox, oy), new Size(obj.w, obj.h), false, 2, 'rgba(255,255,255,0.15)');
                // Label
                drawer.text(obj.label, new Vec2(ox + 5, oy + 16), 11, 'monospace', 'bold', 'white', 0.9);
                // World coordinates
                drawer.text('(' + obj.x + ', ' + obj.y + ')', new Vec2(ox + 5, oy + obj.h - 6), 9, 'monospace', 'normal', 'rgba(255,255,255,0.5)');
            }

            // --- Crosshair at world center ---
            var cx = this.worldWidth / 2 + off.X;
            var cy = this.worldHeight / 2 + off.Y;
            drawer.line(new Vec2(cx - 15, cy), new Vec2(cx + 15, cy), 1, '#555', 0.5);
            drawer.line(new Vec2(cx, cy - 15), new Vec2(cx, cy + 15), 1, '#555', 0.5);
            drawer.text('World Center', new Vec2(cx + 10, cy - 5), 10, 'monospace', 'normal', '#555', 0.5);

            // --- Update HUD labels ---
            this.camLabel.setText('Camera: (' + Math.round(this.cam.position.X) + ', ' + Math.round(this.cam.position.Y) + ')');

            // --- Health bar (top-right, drawn manually for dynamic width) ---
            var sw = this.engine.screenSize().width;
            var barX = sw - 220;
            var barY = 45;
            var barW = 200;
            var barH = 14;
            var healthPct = this.health / this.maxHealth;
            var barColor = healthPct > 0.5 ? '#16c79a' : healthPct > 0.25 ? '#f39c12' : '#e94560';

            drawer.rectangle(new Vec2(barX, barY), new Size(barW, barH), true, 1, 'rgba(255,255,255,0.1)');
            if (healthPct > 0) {
                drawer.rectangle(new Vec2(barX, barY), new Size(barW * healthPct, barH), true, 1, barColor);
            }
            drawer.rectangle(new Vec2(barX, barY), new Size(barW, barH), false, 1, 'rgba(255,255,255,0.2)');
            drawer.text(this.health + ' / ' + this.maxHealth,
                new Vec2(barX + barW / 2 - 25, barY + 11),
                10, 'monospace', 'bold', 'white', 0.8
            );

            return true;
        }
    }

    var canvas = document.getElementById("canvas");
    var engine = new Engine(canvas);
    engine.jumpEngineIntro = true;
    engine.displayFPS = true;
    engine.setCanvasSize(960, 540);
    engine.OnCreate = function() {
        var scene = new LayerDemoScene(engine);
        engine.registerScene(scene);
    };
    engine.start();
});
