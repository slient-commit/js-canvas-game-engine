window.addEventListener("engineReady", function() {

    // ============================================
    // MENU SCENE
    // ============================================
    class MenuScene extends Scene {

        constructor(engine) {
            super('MenuScene', engine);
            this.titleAlpha = { value: 0 };
            this.subtitleAlpha = { value: 0 };
            this.sparkleEmitter = null;
            this.pulseTime = 0;
        }

        OnCreate() {
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            this.engine.tweens.to(this.titleAlpha, { value: 1 }, 1.0, Easing.easeOut);
            this.engine.tweens.to(this.subtitleAlpha, { value: 1 }, 1.8, Easing.easeOut);

            this.sparkleEmitter = ParticleEmitter.sparkle(this.engine, new Vec2(sw / 2, sh / 2 - 50));
        }

        OnUpdate(elapsedTime) {
            var drawer = this.engine.drawer;
            var input = this.engine.input;
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            drawer.clearWithColor('#1a1a2e');

            // Gradient strip
            drawer.gradient(
                new Vec2(0, sh / 2 - 100), new Size(sw, 200),
                new Vec2(0, sh / 2 - 100), new Vec2(0, sh / 2 + 100),
                'rgba(16, 29, 66, 0.8)', 'rgba(26, 26, 46, 0)'
            );

            // Sparkle particles
            if (this.sparkleEmitter) {
                this.sparkleEmitter.position = new Vec2(sw / 2, sh / 2 - 50);
                this.sparkleEmitter.draw(elapsedTime);
            }

            // Title
            this.pulseTime += elapsedTime;
            var titleText = "ARENA SURVIVOR";
            var titleWidth = drawer.textWidth(titleText, 72, 'monospace', 'bold');
            drawer.text(titleText,
                new Vec2(sw / 2 - titleWidth / 2, sh / 2 - 40),
                72, 'monospace', 'bold', '#e94560', this.titleAlpha.value);

            // Subtitle
            var subText = "How long can you survive?";
            var subWidth = drawer.textWidth(subText, 18, 'monospace', 'normal');
            drawer.text(subText,
                new Vec2(sw / 2 - subWidth / 2, sh / 2 + 30),
                18, 'monospace', 'normal', '#0f3460', this.subtitleAlpha.value);

            // Flashing "Press ENTER"
            var flashAlpha = (Math.sin(this.pulseTime * 3) + 1) / 2;
            var instrText = "Press ENTER to start";
            var instrWidth = drawer.textWidth(instrText, 20, 'monospace', 'normal');
            drawer.text(instrText,
                new Vec2(sw / 2 - instrWidth / 2, sh / 2 + 100),
                20, 'monospace', 'normal', 'white', flashAlpha);

            // Controls
            var ctrlText = "WASD - Move  |  Mouse - Aim & Shoot  |  SPACE - Dash  |  F1 - Debug";
            var ctrlWidth = drawer.textWidth(ctrlText, 12, 'monospace', 'normal');
            drawer.text(ctrlText,
                new Vec2(sw / 2 - ctrlWidth / 2, sh - 40),
                12, 'monospace', 'normal', '#555');

            if (input.isKeyPressed(Keys.Enter)) {
                var arena = new ArenaScene(this.engine);
                this.engine.registerScene(arena);
                this.engine.goToScene(arena, null, 'fade', 0.5);
            }
        }

        OnDestroy() {
            this.engine.tweens.clear();
        }
    }

    // ============================================
    // ARENA SCENE
    // ============================================
    class ArenaScene extends Scene {

        constructor(engine) {
            super('ArenaScene', engine);

            // World config
            this.worldCols = 40;
            this.worldRows = 30;
            this.tileSize = 32;
            this.worldWidth = this.worldCols * this.tileSize;
            this.worldHeight = this.worldRows * this.tileSize;

            // Player
            this.player = {
                pos: new Vec2(this.worldWidth / 2, this.worldHeight / 2),
                size: 14,
                speed: 200,
                health: 100,
                maxHealth: 100,
                dashCooldown: 0,
                dashTimer: 0,
                isDashing: false,
                angle: 0,
                invulnTimer: 0
            };

            // Game state
            this.score = 0;
            this.wave = 1;
            this.waveTimer = 0;
            this.waveDelay = 3;
            this.enemiesPerWave = 5;
            this.waveActive = false;
            this.enemies = [];
            this.bullets = [];
            this.particles = [];
            this.shootCooldown = 0;
            this.gameOver = false;

            // Events
            this.events = new EventEmitter();

            // Systems
            this.tilemap = null;
            this.cam = null;
        }

        OnCreate() {
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            this._buildTilemap();

            // World camera with smooth follow
            this.cam = new WorldCamera(sw, sh, this.worldWidth, this.worldHeight);
            this.cam.addOffset = true;
            this.cam.smoothFollow = true;
            this.cam.followLerp = 0.08;
            this.setCamera(this.cam);

            // Event listeners
            var self = this;

            this.events.on('enemyKilled', function(pos) {
                self.score += 100;
                self._spawnExplosion(pos);
                self.cam.shake(4, 0.15);
            });

            this.events.on('waveComplete', function() {
                self.wave++;
                self.waveTimer = 0;
                self.waveActive = false;
                self.enemiesPerWave = Math.min(5 + self.wave * 2, 40);
            });

            this.events.on('playerHit', function() {
                if (self.player.invulnTimer > 0) return;
                self.player.health -= 10;
                self.player.invulnTimer = 0.5;
                self.cam.shake(6, 0.3);
                if (self.player.health <= 0) {
                    self.gameOver = true;
                }
            });

            this.engine.debug.showObjectCount = true;
            this._startWave();
        }

        _buildTilemap() {
            // Procedurally generate a 3-tile tileset using canvas
            var tc = document.createElement('canvas');
            tc.width = this.tileSize * 3;
            tc.height = this.tileSize;
            var g = tc.getContext('2d');

            // Tile 0: dark floor
            g.fillStyle = '#2a2a3e';
            g.fillRect(0, 0, this.tileSize, this.tileSize);
            g.fillStyle = '#252538';
            g.fillRect(1, 1, this.tileSize - 2, this.tileSize - 2);

            // Tile 1: wall
            g.fillStyle = '#4a4a5e';
            g.fillRect(this.tileSize, 0, this.tileSize, this.tileSize);
            g.fillStyle = '#3a3a4e';
            g.fillRect(this.tileSize + 2, 2, this.tileSize - 4, this.tileSize - 4);
            g.fillStyle = '#555570';
            g.fillRect(this.tileSize + 4, 4, this.tileSize - 8, 2);

            // Tile 2: accent floor
            g.fillStyle = '#2e2e42';
            g.fillRect(this.tileSize * 2, 0, this.tileSize, this.tileSize);
            g.fillStyle = '#282838';
            g.fillRect(this.tileSize * 2 + 1, 1, this.tileSize - 2, this.tileSize - 2);
            g.fillStyle = '#3a3a50';
            g.fillRect(this.tileSize * 2 + 14, 14, 4, 4);

            var tileset = new Tileset(tc.toDataURL(), this.tileSize, this.tileSize);

            // Generate map and collision data
            var data = [];
            var collision = [];
            for (var row = 0; row < this.worldRows; row++) {
                data[row] = [];
                collision[row] = [];
                for (var col = 0; col < this.worldCols; col++) {
                    if (row === 0 || row === this.worldRows - 1 || col === 0 || col === this.worldCols - 1) {
                        data[row][col] = 1;
                        collision[row][col] = 1;
                    } else {
                        data[row][col] = (row + col) % 7 === 0 ? 2 : 0;
                        collision[row][col] = 0;
                    }
                }
            }

            // Scatter pillar obstacles (2x2 blocks)
            var pillars = [
                [7, 7], [7, 20], [7, 33],
                [14, 12], [14, 28],
                [22, 7], [22, 20], [22, 33],
                [10, 16], [10, 24],
                [20, 16], [20, 24]
            ];
            for (var i = 0; i < pillars.length; i++) {
                var pr = pillars[i][0];
                var pc = pillars[i][1];
                for (var dr = 0; dr < 2; dr++) {
                    for (var dc = 0; dc < 2; dc++) {
                        var r = pr + dr;
                        var c = pc + dc;
                        if (r > 0 && r < this.worldRows - 1 && c > 0 && c < this.worldCols - 1) {
                            data[r][c] = 1;
                            collision[r][c] = 1;
                        }
                    }
                }
            }

            this.tilemap = new Tilemap(tileset, data, this.worldCols, this.worldRows);
            this.tilemap.setCollisionLayer(collision);
        }

        _startWave() {
            this.waveActive = true;
            for (var i = 0; i < this.enemiesPerWave; i++) {
                this._spawnEnemy();
            }
        }

        _spawnEnemy() {
            var side = Math.floor(Math.random() * 4);
            var x, y;
            var margin = this.tileSize * 2;
            if (side === 0) {
                x = margin + Math.random() * (this.worldWidth - margin * 2);
                y = margin;
            } else if (side === 1) {
                x = margin + Math.random() * (this.worldWidth - margin * 2);
                y = this.worldHeight - margin;
            } else if (side === 2) {
                x = margin;
                y = margin + Math.random() * (this.worldHeight - margin * 2);
            } else {
                x = this.worldWidth - margin;
                y = margin + Math.random() * (this.worldHeight - margin * 2);
            }

            var baseSpeed = 50 + this.wave * 5;
            this.enemies.push({
                pos: new Vec2(x, y),
                size: 10 + Math.random() * 6,
                speed: baseSpeed + Math.random() * 30,
                health: 1 + Math.floor(this.wave / 3),
                maxHealth: 1 + Math.floor(this.wave / 3),
                color: this.wave > 5 ? '#ff4444' : '#e94560',
                flashTimer: 0
            });
        }

        _spawnExplosion(worldPos) {
            var screenPos = worldPos.add(this.cam.offset);
            var emitter = ParticleEmitter.explosion(this.engine, screenPos);
            this.particles.push(emitter);
        }

        _shoot() {
            if (this.shootCooldown > 0) return;
            this.shootCooldown = 0.15;

            var mouseScreen = this.engine.input.getMousePosition();
            var mouseWorld = mouseScreen.sub(this.cam.offset);
            var dir = mouseWorld.sub(this.player.pos).normalize();

            this.bullets.push({
                pos: this.player.pos.add(dir.scale(20)),
                vel: dir.scale(500),
                life: 2.0,
                size: 4
            });

            this.cam.shake(1.5, 0.05);
        }

        _canMoveTo(pos, radius) {
            return !this.tilemap.isSolidAt(pos.X - radius, pos.Y - radius) &&
                   !this.tilemap.isSolidAt(pos.X + radius, pos.Y - radius) &&
                   !this.tilemap.isSolidAt(pos.X - radius, pos.Y + radius) &&
                   !this.tilemap.isSolidAt(pos.X + radius, pos.Y + radius);
        }

        OnUpdate(elapsedTime) {
            if (this.gameOver) {
                this._goToGameOver();
                return;
            }

            var drawer = this.engine.drawer;
            var input = this.engine.input;

            drawer.clearWithColor('#1a1a2e');

            // ---- INPUT ----
            var moveDir = Vec2.zero();
            if (input.isKeyDown(Keys.W) || input.isKeyDown(Keys.ArrowUp))    moveDir = moveDir.add(Vec2.up());
            if (input.isKeyDown(Keys.S) || input.isKeyDown(Keys.ArrowDown))  moveDir = moveDir.add(Vec2.down());
            if (input.isKeyDown(Keys.A) || input.isKeyDown(Keys.ArrowLeft))  moveDir = moveDir.add(Vec2.left());
            if (input.isKeyDown(Keys.D) || input.isKeyDown(Keys.ArrowRight)) moveDir = moveDir.add(Vec2.right());
            if (moveDir.length() > 0) moveDir = moveDir.normalize();

            // Dash
            if (input.isKeyPressed(Keys.Space) && this.player.dashCooldown <= 0 && moveDir.length() > 0) {
                this.player.isDashing = true;
                this.player.dashTimer = 0.15;
                this.player.dashCooldown = 1.0;
                this.player.invulnTimer = 0.15;
                var sparkle = ParticleEmitter.sparkle(this.engine, this.player.pos.add(this.cam.offset));
                sparkle.emit(15);
                sparkle.active = false;
                this.particles.push(sparkle);
            }

            // Movement with tilemap collision
            var speed = this.player.speed;
            if (this.player.isDashing) {
                speed *= 3;
                this.player.dashTimer -= elapsedTime;
                if (this.player.dashTimer <= 0) this.player.isDashing = false;
            }

            var newPos = this.player.pos.add(moveDir.scale(speed * elapsedTime));
            var m = this.player.size;

            if (this._canMoveTo(newPos, m)) {
                this.player.pos = newPos;
            } else {
                // Slide along each axis independently
                var slideX = new Vec2(newPos.X, this.player.pos.Y);
                if (this._canMoveTo(slideX, m)) {
                    this.player.pos = slideX;
                }
                var slideY = new Vec2(this.player.pos.X, newPos.Y);
                if (this._canMoveTo(slideY, m)) {
                    this.player.pos = slideY;
                }
            }

            // Aim toward mouse
            var mouseScreen = input.getMousePosition();
            var mouseWorld = mouseScreen.sub(this.cam.offset);
            this.player.angle = Math.atan2(mouseWorld.Y - this.player.pos.Y, mouseWorld.X - this.player.pos.X);

            // Shoot on click
            if (input.isMouseDown(0)) {
                this._shoot();
            }

            // Cooldowns
            this.shootCooldown -= elapsedTime;
            this.player.dashCooldown -= elapsedTime;
            this.player.invulnTimer -= elapsedTime;

            // ---- CAMERA ----
            var camTarget = { position: this.player.pos, sprite: { width: 0, height: 0 } };
            this.cam.setPositionTo(camTarget, elapsedTime);
            this.cam.update(elapsedTime);
            var offset = this.cam.offset;

            // ---- DRAW TILEMAP ----
            this.tilemap.draw(drawer, this.cam);

            // ---- BULLETS ----
            for (var i = this.bullets.length - 1; i >= 0; i--) {
                var b = this.bullets[i];
                b.pos = b.pos.add(b.vel.scale(elapsedTime));
                b.life -= elapsedTime;

                if (b.life <= 0 || this.tilemap.isSolidAt(b.pos.X, b.pos.Y)) {
                    this.bullets.splice(i, 1);
                    continue;
                }

                var bs = b.pos.add(offset);
                drawer.circle(bs, b.size, 0, -1, true, 1, '#ffdd57');
            }

            // ---- ENEMIES ----
            for (var i = this.enemies.length - 1; i >= 0; i--) {
                var e = this.enemies[i];
                e.flashTimer -= elapsedTime;

                // Chase player
                var toPlayer = this.player.pos.sub(e.pos);
                if (toPlayer.length() > 0) {
                    var eMove = toPlayer.normalize().scale(e.speed * elapsedTime);
                    var eNew = e.pos.add(eMove);
                    if (this._canMoveTo(eNew, e.size)) {
                        e.pos = eNew;
                    } else {
                        // Slide along each axis
                        var slideX = new Vec2(e.pos.X + eMove.X, e.pos.Y);
                        if (this._canMoveTo(slideX, e.size)) {
                            e.pos = slideX;
                        }
                        var slideY = new Vec2(e.pos.X, e.pos.Y + eMove.Y);
                        if (this._canMoveTo(slideY, e.size)) {
                            e.pos = slideY;
                        }
                    }
                }

                // Enemy-enemy repulsion (prevent stacking)
                for (var k = i - 1; k >= 0; k--) {
                    var other = this.enemies[k];
                    var sep = e.pos.sub(other.pos);
                    var dist = sep.length();
                    var minDist = e.size + other.size;
                    if (dist > 0 && dist < minDist) {
                        var push = sep.normalize().scale((minDist - dist) * 0.5);
                        e.pos = e.pos.add(push);
                        other.pos = other.pos.sub(push);
                    }
                }

                // Player-enemy collision with knockback
                var peDist = e.pos.distance(this.player.pos);
                var peMinDist = e.size + this.player.size;
                if (peDist < peMinDist) {
                    this.events.emit('playerHit');
                    // Push enemy away from player
                    var knockDir;
                    if (peDist > 0.1) {
                        knockDir = e.pos.sub(this.player.pos).normalize();
                    } else {
                        // If exactly overlapping, push in a random direction
                        var rAngle = Math.random() * Math.PI * 2;
                        knockDir = new Vec2(Math.cos(rAngle), Math.sin(rAngle));
                    }
                    var knockStrength = peMinDist - peDist + 2;
                    var knockPos = e.pos.add(knockDir.scale(knockStrength));
                    if (this._canMoveTo(knockPos, e.size)) {
                        e.pos = knockPos;
                    }
                }

                // Bullet-enemy collision
                var enemyDead = false;
                for (var j = this.bullets.length - 1; j >= 0; j--) {
                    var b = this.bullets[j];
                    if (b.pos.distance(e.pos) < e.size + b.size) {
                        e.health--;
                        e.flashTimer = 0.1;
                        this.bullets.splice(j, 1);
                        if (e.health <= 0) {
                            this.events.emit('enemyKilled', e.pos.clone());
                            this.enemies.splice(i, 1);
                            enemyDead = true;
                            break;
                        }
                    }
                }
                if (enemyDead) continue;

                // Draw enemy
                var es = e.pos.add(offset);
                var eColor = e.flashTimer > 0 ? 'white' : e.color;
                drawer.rectangle(
                    new Vec2(es.X - e.size, es.Y - e.size),
                    new Size(e.size * 2, e.size * 2),
                    true, 1, eColor
                );

                // Health bar for tough enemies
                if (e.maxHealth > 1) {
                    var hpW = e.size * 2;
                    var hpR = e.health / e.maxHealth;
                    drawer.rectangle(new Vec2(es.X - e.size, es.Y - e.size - 6), new Size(hpW, 3), true, 1, '#333');
                    drawer.rectangle(new Vec2(es.X - e.size, es.Y - e.size - 6), new Size(hpW * hpR, 3), true, 1, '#e94560');
                }
            }

            // Wave logic
            if (this.waveActive && this.enemies.length === 0) {
                this.events.emit('waveComplete');
            }
            if (!this.waveActive) {
                this.waveTimer += elapsedTime;
                if (this.waveTimer >= this.waveDelay) {
                    this._startWave();
                }
            }

            // ---- PLAYER ----
            var ps = this.player.pos.add(offset);

            // Dash glow
            if (this.player.isDashing) {
                drawer.circle(ps, this.player.size + 6, 0, -1, true, 1, 'rgba(100, 200, 255, 0.3)');
            }

            // Body
            var pAlpha = this.player.invulnTimer > 0 ? 0.5 + Math.sin(this.player.invulnTimer * 30) * 0.3 : 1;
            drawer.circle(ps, this.player.size, 0, -1, true, 1, '#16c79a', pAlpha);

            // Gun barrel
            var gunEnd = ps.add(new Vec2(
                Math.cos(this.player.angle) * (this.player.size + 12),
                Math.sin(this.player.angle) * (this.player.size + 12)
            ));
            drawer.line(ps, gunEnd, 3, '#0f9b6e');

            // Muzzle dot
            drawer.circle(gunEnd, 3, 0, -1, true, 1, '#ffdd57', 0.6);

            // ---- CROSSHAIR ----
            var cx = mouseScreen.X;
            var cy = mouseScreen.Y;
            drawer.circle(mouseScreen, 8, 0, -1, false, 1, 'rgba(255,255,255,0.4)');
            drawer.line(new Vec2(cx - 12, cy), new Vec2(cx - 4, cy), 1, 'rgba(255,255,255,0.3)');
            drawer.line(new Vec2(cx + 4, cy), new Vec2(cx + 12, cy), 1, 'rgba(255,255,255,0.3)');
            drawer.line(new Vec2(cx, cy - 12), new Vec2(cx, cy - 4), 1, 'rgba(255,255,255,0.3)');
            drawer.line(new Vec2(cx, cy + 4), new Vec2(cx, cy + 12), 1, 'rgba(255,255,255,0.3)');

            // ---- PARTICLES ----
            for (var i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].draw(elapsedTime);
                if (!this.particles[i].active && this.particles[i].particles.length === 0) {
                    this.particles.splice(i, 1);
                }
            }

            // ---- HUD ----
            this._drawHUD(drawer);

            // Wave countdown banner
            if (!this.waveActive) {
                var cd = Math.ceil(this.waveDelay - this.waveTimer);
                var wtxt = "Wave " + this.wave + " in " + cd + "...";
                var ww = drawer.textWidth(wtxt, 28, 'monospace', 'bold');
                var sw = this.engine.screenSize().width;
                drawer.text(wtxt, new Vec2(sw / 2 - ww / 2, 80), 28, 'monospace', 'bold', 'white', 0.7);
            }

            // Debug toggle
            if (input.isKeyPressed(Keys.F1)) {
                this.engine.debug.showCollisionBoxes = !this.engine.debug.showCollisionBoxes;
                this.engine.debug.showObjectCount = !this.engine.debug.showObjectCount;
            }
        }

        _drawHUD(drawer) {
            var sw = this.engine.screenSize().width;

            // Health bar
            var hpW = 200, hpH = 16, hpX = 20, hpY = 30;
            var hpRatio = Math.max(0, this.player.health / this.player.maxHealth);
            drawer.rectangle(new Vec2(hpX, hpY), new Size(hpW, hpH), true, 1, '#333');
            var hpColor = hpRatio > 0.5 ? '#16c79a' : hpRatio > 0.25 ? '#ffc107' : '#e94560';
            drawer.rectangle(new Vec2(hpX, hpY), new Size(hpW * hpRatio, hpH), true, 1, hpColor);
            drawer.rectangle(new Vec2(hpX, hpY), new Size(hpW, hpH), false, 1, '#555');
            drawer.text(Math.ceil(this.player.health) + ' HP', new Vec2(hpX + 5, hpY + 13), 12, 'monospace', 'bold', 'white');

            // Score & wave
            drawer.text('Score: ' + this.score, new Vec2(sw - 200, 42), 18, 'monospace', 'bold', '#ffdd57');
            drawer.text('Wave: ' + this.wave, new Vec2(sw - 200, 62), 14, 'monospace', 'normal', '#aaa');

            // Dash cooldown
            var dashReady = this.player.dashCooldown <= 0;
            var dashTxt = dashReady ? 'DASH [SPACE] ready' : 'DASH ' + (Math.ceil(this.player.dashCooldown * 10) / 10).toFixed(1) + 's';
            drawer.text(dashTxt, new Vec2(20, 62), 12, 'monospace', 'normal', dashReady ? '#16c79a' : '#666');

            // Enemies remaining
            drawer.text('Enemies: ' + this.enemies.length, new Vec2(sw - 200, 80), 12, 'monospace', 'normal', '#e94560');
        }

        _goToGameOver() {
            var over = new GameOverScene(this.engine);
            this.engine.registerScene(over);
            this.engine.goToScene(over, { score: this.score, wave: this.wave }, 'fade', 0.8);
        }

        OnDestroy() {
            this.engine.tweens.clear();
            this.engine.debug.showCollisionBoxes = false;
            this.engine.debug.showObjectCount = false;
        }
    }

    // ============================================
    // GAME OVER SCENE
    // ============================================
    class GameOverScene extends Scene {

        constructor(engine) {
            super('GameOverScene', engine);
            this.titleY = { value: -100 };
            this.scoreAlpha = { value: 0 };
            this.restartAlpha = { value: 0 };
            this.fireEmitter = null;
            this.pulseTime = 0;
            this.finalScore = 0;
            this.finalWave = 1;
        }

        OnCreate() {
            var sh = this.engine.screenSize().height;
            var data = this.getIncomingData() || {};
            this.finalScore = data.score || 0;
            this.finalWave = data.wave || 1;

            // Tween title bounce in
            this.engine.tweens.to(this.titleY, { value: sh / 2 - 60 }, 1.2, Easing.bounce);
            this.engine.tweens.to(this.scoreAlpha, { value: 1 }, 1.5, Easing.easeOut);
            this.engine.tweens.to(this.restartAlpha, { value: 1 }, 2.5, Easing.easeInOut);

            // Fire at bottom
            var sw = this.engine.screenSize().width;
            this.fireEmitter = ParticleEmitter.fire(this.engine, new Vec2(sw / 2, sh - 20));
            this.fireEmitter.rate = 12;
        }

        OnUpdate(elapsedTime) {
            var drawer = this.engine.drawer;
            var input = this.engine.input;
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            this.pulseTime += elapsedTime;

            drawer.clearWithColor('#16213e');

            // Fire particles
            this.fireEmitter.position = new Vec2(sw / 2, sh - 20);
            this.fireEmitter.draw(elapsedTime);

            // Title with bounce tween
            var title = "GAME OVER";
            var titleWidth = drawer.textWidth(title, 64, 'monospace', 'bold');
            drawer.text(title,
                new Vec2(sw / 2 - titleWidth / 2, this.titleY.value),
                64, 'monospace', 'bold', '#e94560');

            // Score
            var scoreText = "Score: " + this.finalScore;
            var scoreWidth = drawer.textWidth(scoreText, 36, 'monospace', 'bold');
            drawer.text(scoreText,
                new Vec2(sw / 2 - scoreWidth / 2, sh / 2 + 20),
                36, 'monospace', 'bold', '#ffdd57', this.scoreAlpha.value);

            // Wave
            var waveText = "Survived to Wave " + this.finalWave;
            var waveWidth = drawer.textWidth(waveText, 18, 'monospace', 'normal');
            drawer.text(waveText,
                new Vec2(sw / 2 - waveWidth / 2, sh / 2 + 60),
                18, 'monospace', 'normal', '#aaa', this.scoreAlpha.value);

            // Restart prompt
            var flashAlpha = (Math.sin(this.pulseTime * 3) + 1) / 2;
            var restartText = "Press ENTER to play again";
            var restartWidth = drawer.textWidth(restartText, 20, 'monospace', 'normal');
            drawer.text(restartText,
                new Vec2(sw / 2 - restartWidth / 2, sh / 2 + 120),
                20, 'monospace', 'normal', 'white', this.restartAlpha.value * flashAlpha);

            if (input.isKeyPressed(Keys.Enter)) {
                var arena = new ArenaScene(this.engine);
                this.engine.registerScene(arena);
                this.engine.goToScene(arena, null, 'fade', 0.5);
            }
        }

        OnDestroy() {
            this.engine.tweens.clear();
        }
    }

    // ============================================
    // BOOT
    // ============================================
    var canvas = document.getElementById("canvas");
    var engine = new Engine(canvas);

    engine.jumpEngineIntro = false;
    engine.displayFPS = true;

    engine.OnCreate = function() {
        var menu = new MenuScene(engine);
        engine.registerScene(menu);
    };

    engine.start();
});
