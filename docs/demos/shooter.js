(function () {
    window.DemoGames = window.DemoGames || {};

    window.DemoGames.createShooter = function (engine) {
        var scene = new Scene('shooter', engine);
        var W = 960, H = 540;
        var ctx = engine.ctx;

        // Game state
        var player, bullets, enemies, particles, starfield, powerups;
        var score, combo, comboTimer, gameTime, gameOver;
        var spawnTimer, spawnInterval, difficulty;
        var shakeTimer, shakeAmount;

        function rand(min, max) { return min + Math.random() * (max - min); }

        function makeStarfield() {
            starfield = [];
            for (var i = 0; i < 100; i++) {
                starfield.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    speed: rand(30, 150),
                    size: rand(0.5, 2.5),
                    brightness: rand(0.3, 1)
                });
            }
        }

        function spawnExplosion(x, y, color, count) {
            for (var i = 0; i < count; i++) {
                var angle = rand(0, Math.PI * 2);
                var speed = rand(60, 250);
                particles.push({
                    x: x, y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: rand(0.2, 0.7),
                    maxLife: 0.7,
                    size: rand(1.5, 4),
                    color: color
                });
            }
        }

        function spawnEnemy() {
            var type = Math.random();
            var e;
            if (type < 0.5) {
                // Standard — comes from top
                e = {
                    x: rand(40, W - 40), y: -20,
                    vx: rand(-30, 30), vy: rand(60, 120 + difficulty * 10),
                    hp: 1, maxHp: 1, size: 14,
                    type: 'circle', color: '#e74c3c', score: 10
                };
            } else if (type < 0.8) {
                // Tank — slower, more HP
                e = {
                    x: rand(40, W - 40), y: -25,
                    vx: rand(-20, 20), vy: rand(40, 70 + difficulty * 5),
                    hp: 3, maxHp: 3, size: 20,
                    type: 'square', color: '#e67e22', score: 25
                };
            } else {
                // Fast — comes from side
                var fromLeft = Math.random() > 0.5;
                e = {
                    x: fromLeft ? -15 : W + 15, y: rand(30, H * 0.4),
                    vx: fromLeft ? rand(100, 180) : rand(-180, -100),
                    vy: rand(30, 60),
                    hp: 1, maxHp: 1, size: 10,
                    type: 'diamond', color: '#9b59b6', score: 20
                };
            }
            enemies.push(e);
        }

        scene.OnCreate = function () {
            player = {
                x: W / 2, y: H - 60,
                speed: 300, size: 16,
                hp: 5, maxHp: 5,
                fireRate: 0.15, fireCooldown: 0,
                invincible: 0
            };
            bullets = [];
            enemies = [];
            particles = [];
            powerups = [];
            score = 0;
            combo = 0;
            comboTimer = 0;
            gameTime = 0;
            gameOver = false;
            spawnTimer = 0;
            spawnInterval = 1.2;
            difficulty = 0;
            shakeTimer = 0;
            shakeAmount = 0;
            makeStarfield();
        };

        scene.OnUpdate = function (dt) {
            if (gameOver) dt = 0; // freeze game logic, keep rendering
            gameTime += dt;
            difficulty = Math.floor(gameTime / 10);

            // Screen shake
            var shakeX = 0, shakeY = 0;
            if (shakeTimer > 0) {
                shakeTimer -= dt;
                shakeX = rand(-shakeAmount, shakeAmount);
                shakeY = rand(-shakeAmount, shakeAmount);
            }

            // --- Background ---
            var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, '#050510');
            bgGrad.addColorStop(1, '#0a0a25');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            ctx.save();
            ctx.translate(shakeX, shakeY);

            // --- Starfield ---
            for (var si = 0; si < starfield.length; si++) {
                var st = starfield[si];
                st.y += st.speed * dt;
                if (st.y > H) { st.y = -2; st.x = Math.random() * W; }
                ctx.globalAlpha = st.brightness;
                ctx.fillStyle = '#fff';
                ctx.fillRect(st.x, st.y, st.size, st.size);
            }
            ctx.globalAlpha = 1;

            // --- Player Input ---
            if (!gameOver) {
                if (engine.keys.includes(Keys.A) || engine.keys.includes(Keys.ArrowLeft))
                    player.x -= player.speed * dt;
                if (engine.keys.includes(Keys.D) || engine.keys.includes(Keys.ArrowRight))
                    player.x += player.speed * dt;
                if (engine.keys.includes(Keys.W) || engine.keys.includes(Keys.ArrowUp))
                    player.y -= player.speed * dt;
                if (engine.keys.includes(Keys.S) || engine.keys.includes(Keys.ArrowDown))
                    player.y += player.speed * dt;

                // Clamp
                player.x = Math.max(player.size, Math.min(W - player.size, player.x));
                player.y = Math.max(player.size, Math.min(H - player.size, player.y));

                // Auto-fire (hold SPACE or left mouse)
                player.fireCooldown -= dt;
                if ((engine.keys.includes(Keys.Space) || engine.mouseButton.includes(MouseButton.LEFT)) && player.fireCooldown <= 0) {
                    player.fireCooldown = player.fireRate;
                    bullets.push({
                        x: player.x - 5, y: player.y - 12,
                        vy: -500, size: 3
                    });
                    bullets.push({
                        x: player.x + 5, y: player.y - 12,
                        vy: -500, size: 3
                    });
                }
            }

            // --- Spawn enemies ---
            if (!gameOver) {
                spawnTimer -= dt;
                spawnInterval = Math.max(0.3, 1.2 - difficulty * 0.08);
                if (spawnTimer <= 0) {
                    spawnEnemy();
                    spawnTimer = spawnInterval;
                }
            }

            // --- Update bullets ---
            for (var bi = bullets.length - 1; bi >= 0; bi--) {
                var b = bullets[bi];
                b.y += b.vy * dt;
                if (b.y < -10) { bullets.splice(bi, 1); continue; }

                // Bullet-enemy collision
                var hit = false;
                for (var ei = enemies.length - 1; ei >= 0; ei--) {
                    var e = enemies[ei];
                    var dx = b.x - e.x, dy = b.y - e.y;
                    if (dx * dx + dy * dy < (e.size + b.size) * (e.size + b.size)) {
                        e.hp--;
                        if (e.hp <= 0) {
                            var c = e.color;
                            spawnExplosion(e.x, e.y, c, 15);
                            combo++;
                            comboTimer = 2;
                            var mult = Math.min(5, 1 + Math.floor(combo / 5));
                            score += e.score * mult;
                            // Chance to drop powerup
                            if (Math.random() < 0.12) {
                                powerups.push({
                                    x: e.x, y: e.y, vy: 60,
                                    type: Math.random() < 0.6 ? 'health' : 'rapid',
                                    angle: 0
                                });
                            }
                            enemies.splice(ei, 1);
                        } else {
                            spawnExplosion(b.x, b.y, '#fff', 3);
                        }
                        hit = true;
                        break;
                    }
                }
                if (hit) { bullets.splice(bi, 1); }
            }

            // --- Update enemies ---
            for (var ei2 = enemies.length - 1; ei2 >= 0; ei2--) {
                var en = enemies[ei2];
                en.x += en.vx * dt;
                en.y += en.vy * dt;
                if (en.y > H + 30 || en.x < -40 || en.x > W + 40) {
                    enemies.splice(ei2, 1);
                    combo = 0; // miss resets combo
                    continue;
                }

                // Enemy-player collision
                if (!gameOver && player.invincible <= 0) {
                    var pdx = en.x - player.x, pdy = en.y - player.y;
                    if (pdx * pdx + pdy * pdy < (en.size + player.size) * (en.size + player.size) * 0.6) {
                        player.hp--;
                        player.invincible = 1.5;
                        shakeTimer = 0.3;
                        shakeAmount = 6;
                        spawnExplosion(en.x, en.y, '#ff0', 20);
                        enemies.splice(ei2, 1);
                        if (player.hp <= 0) {
                            gameOver = true;
                            spawnExplosion(player.x, player.y, '#0af', 40);
                        }
                        continue;
                    }
                }
            }

            // --- Update powerups ---
            for (var pi = powerups.length - 1; pi >= 0; pi--) {
                var pw = powerups[pi];
                pw.y += pw.vy * dt;
                pw.angle += dt * 3;
                if (pw.y > H + 20) { powerups.splice(pi, 1); continue; }

                // Pickup collision
                var pdx2 = pw.x - player.x, pdy2 = pw.y - player.y;
                if (pdx2 * pdx2 + pdy2 * pdy2 < 25 * 25) {
                    if (pw.type === 'health') {
                        player.hp = Math.min(player.maxHp, player.hp + 1);
                    } else {
                        player.fireRate = Math.max(0.06, player.fireRate - 0.02);
                    }
                    spawnExplosion(pw.x, pw.y, pw.type === 'health' ? '#0f0' : '#ff0', 8);
                    powerups.splice(pi, 1);
                }
            }

            // --- Update particles ---
            for (var pti = particles.length - 1; pti >= 0; pti--) {
                var pt = particles[pti];
                pt.x += pt.vx * dt;
                pt.y += pt.vy * dt;
                pt.life -= dt;
                if (pt.life <= 0) { particles.splice(pti, 1); continue; }

                var pa = pt.life / pt.maxLife;
                ctx.globalAlpha = pa;
                ctx.fillStyle = pt.color;
                ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
            }
            ctx.globalAlpha = 1;

            // --- Update invincibility ---
            if (player.invincible > 0) player.invincible -= dt;

            // --- Combo timer ---
            if (comboTimer > 0) {
                comboTimer -= dt;
                if (comboTimer <= 0) combo = 0;
            }

            // --- Draw bullets ---
            ctx.fillStyle = '#0ff';
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 6;
            for (var bi2 = 0; bi2 < bullets.length; bi2++) {
                var bl = bullets[bi2];
                ctx.fillRect(bl.x - 1.5, bl.y - 4, 3, 8);
            }
            ctx.shadowBlur = 0;

            // --- Draw enemies ---
            for (var ei3 = 0; ei3 < enemies.length; ei3++) {
                var en2 = enemies[ei3];
                ctx.fillStyle = en2.color;
                if (en2.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(en2.x, en2.y, en2.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (en2.type === 'square') {
                    ctx.fillRect(en2.x - en2.size, en2.y - en2.size, en2.size * 2, en2.size * 2);
                    // HP bar for tanks
                    if (en2.maxHp > 1) {
                        var barW = en2.size * 2;
                        ctx.fillStyle = '#300';
                        ctx.fillRect(en2.x - barW / 2, en2.y - en2.size - 6, barW, 3);
                        ctx.fillStyle = '#0c0';
                        ctx.fillRect(en2.x - barW / 2, en2.y - en2.size - 6, barW * (en2.hp / en2.maxHp), 3);
                    }
                } else {
                    // Diamond
                    ctx.save();
                    ctx.translate(en2.x, en2.y);
                    ctx.rotate(Math.PI / 4);
                    ctx.fillRect(-en2.size, -en2.size, en2.size * 2, en2.size * 2);
                    ctx.restore();
                }
            }

            // --- Draw powerups ---
            for (var pi2 = 0; pi2 < powerups.length; pi2++) {
                var pw2 = powerups[pi2];
                ctx.save();
                ctx.translate(pw2.x, pw2.y);
                ctx.rotate(pw2.angle);
                if (pw2.type === 'health') {
                    ctx.fillStyle = '#2ecc71';
                    ctx.fillRect(-6, -2, 12, 4);
                    ctx.fillRect(-2, -6, 4, 12);
                } else {
                    ctx.fillStyle = '#f1c40f';
                    ctx.beginPath();
                    ctx.moveTo(0, -8);
                    ctx.lineTo(8, 8);
                    ctx.lineTo(-8, 8);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }

            // --- Draw player ---
            if (!gameOver) {
                var pVisible = player.invincible > 0 ? (Math.sin(gameTime * 20) > 0 ? 1 : 0.2) : 1;
                ctx.globalAlpha = pVisible;

                // Engine trail
                for (var tri = 0; tri < 3; tri++) {
                    particles.push({
                        x: player.x + rand(-4, 4), y: player.y + 14,
                        vx: rand(-20, 20), vy: rand(40, 100),
                        life: rand(0.1, 0.25), maxLife: 0.25,
                        size: rand(2, 4), color: '#0af'
                    });
                }

                // Ship body (triangle)
                ctx.fillStyle = '#0af';
                ctx.shadowColor = '#0af';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(player.x, player.y - 16);
                ctx.lineTo(player.x + 14, player.y + 10);
                ctx.lineTo(player.x - 14, player.y + 10);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;

                // Cockpit
                ctx.fillStyle = '#0df';
                ctx.beginPath();
                ctx.arc(player.x, player.y - 2, 4, 0, Math.PI * 2);
                ctx.fill();

                // Wings
                ctx.fillStyle = '#07a';
                ctx.beginPath();
                ctx.moveTo(player.x - 14, player.y + 8);
                ctx.lineTo(player.x - 22, player.y + 14);
                ctx.lineTo(player.x - 8, player.y + 6);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(player.x + 14, player.y + 8);
                ctx.lineTo(player.x + 22, player.y + 14);
                ctx.lineTo(player.x + 8, player.y + 6);
                ctx.closePath();
                ctx.fill();

                ctx.globalAlpha = 1;
            }

            ctx.restore(); // end screen shake

            // --- HUD ---
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(8, 8, 200, 52);
            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = '#0af';
            ctx.fillText('Score: ' + score, 18, 26);
            // Health bar
            ctx.fillStyle = '#300';
            ctx.fillRect(18, 34, 100, 8);
            ctx.fillStyle = player.hp > 2 ? '#0c0' : player.hp > 1 ? '#cc0' : '#c00';
            ctx.fillRect(18, 34, 100 * (player.hp / player.maxHp), 8);
            ctx.fillStyle = '#888';
            ctx.font = '11px monospace';
            ctx.fillText('HP: ' + player.hp + '/' + player.maxHp, 125, 42);

            // Combo indicator
            if (combo >= 5) {
                var mult = Math.min(5, 1 + Math.floor(combo / 5));
                ctx.font = 'bold 18px "Segoe UI", sans-serif';
                ctx.fillStyle = '#ff0';
                ctx.textAlign = 'center';
                ctx.fillText('x' + mult + ' COMBO (' + combo + ')', W / 2, 30);
                ctx.textAlign = 'left';
            }

            // Controls hint
            ctx.font = '11px monospace';
            ctx.fillStyle = '#555';
            ctx.textAlign = 'right';
            ctx.fillText('WASD/Arrows: Move | Space/Click: Shoot', W - 12, H - 10);
            ctx.textAlign = 'left';

            // --- Game Over ---
            if (gameOver) {
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.fillRect(0, 0, W, H);
                ctx.font = 'bold 42px "Segoe UI", sans-serif';
                ctx.fillStyle = '#c00';
                ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
                ctx.font = 'bold 22px "Segoe UI", sans-serif';
                ctx.fillStyle = '#0af';
                ctx.fillText('Final Score: ' + score, W / 2, H / 2 + 15);
                ctx.font = '15px "Segoe UI", sans-serif';
                ctx.fillStyle = '#888';
                ctx.fillText('Press R to restart', W / 2, H / 2 + 45);
                ctx.textAlign = 'left';

                if (engine.keys.includes(Keys.R)) {
                    scene.reset();
                    scene.isCreated = false;
                }
            }

            return true;
        };

        return scene;
    };
})();
