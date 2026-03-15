(function () {
    window.DemoGames = window.DemoGames || {};

    window.DemoGames.createTowerDefense = function (engine) {
        var scene = new Scene('tower-defense', engine);
        var W = 960, H = 540;
        var ctx = engine.ctx;

        // Game state
        var isoMap, pathWaypoints, pathScreen;
        var towers, enemies, projectiles, explosions;
        var gold, lives, wave, waveActive, spawnTimer, spawnIndex, enemiesPerWave;
        var gameOver, victory, hoverTile;
        var waveConfigs = [
            { count: 6, hp: 60, speed: 1.2, reward: 10, color: [220, 60, 60] },
            { count: 8, hp: 90, speed: 1.4, reward: 12, color: [220, 160, 30] },
            { count: 10, hp: 130, speed: 1.3, reward: 15, color: [60, 180, 220] },
            { count: 12, hp: 180, speed: 1.5, reward: 18, color: [180, 60, 220] },
            { count: 15, hp: 250, speed: 1.6, reward: 22, color: [220, 60, 150] }
        ];

        // Path definition (col, row waypoints)
        var pathDef = [
            { col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 },
            { col: 3, row: 4 }, { col: 3, row: 5 }, { col: 3, row: 6 },
            { col: 4, row: 6 }, { col: 5, row: 6 }, { col: 6, row: 6 },
            { col: 6, row: 5 }, { col: 6, row: 4 }, { col: 6, row: 3 },
            { col: 7, row: 3 }, { col: 8, row: 3 }, { col: 9, row: 3 }
        ];

        var TOWER_COST = 25;
        var TOWER_RANGE = 120;
        var TOWER_FIRE_RATE = 0.8; // seconds between shots
        var PROJ_SPEED = 250;

        function buildMap() {
            isoMap = new IsometricMap(10, 8, 64, 32, 16);
            isoMap.offset = new Vec2(W / 2, 60);

            // Set all grass
            for (var r = 0; r < 8; r++)
                for (var c = 0; c < 10; c++)
                    isoMap.tiles[r][c] = 0;

            // Path tiles = dirt
            for (var i = 0; i < pathDef.length; i++) {
                isoMap.tiles[pathDef[i].row][pathDef[i].col] = 1;
            }

            // Some water decoration
            isoMap.tiles[0][8] = 3; isoMap.tiles[0][9] = 3;
            isoMap.tiles[1][9] = 3;
            isoMap.tiles[7][0] = 3; isoMap.tiles[7][1] = 3;

            // Mark water + path as collision (can't build)
            for (var r = 0; r < 8; r++)
                for (var c = 0; c < 10; c++)
                    isoMap.collisionMap[r][c] = 0;
            // Block path tiles from building
            for (var i = 0; i < pathDef.length; i++)
                isoMap.collisionMap[pathDef[i].row][pathDef[i].col] = 1;
            // Block water
            isoMap.collisionMap[0][8] = 1; isoMap.collisionMap[0][9] = 1;
            isoMap.collisionMap[1][9] = 1;
            isoMap.collisionMap[7][0] = 1; isoMap.collisionMap[7][1] = 1;

            // Height on some decorative tiles
            isoMap.heightMap[1][1] = 1;
            isoMap.heightMap[5][8] = 1;

            // Pre-compute path screen positions
            pathScreen = [];
            for (var i = 0; i < pathDef.length; i++) {
                var sp = isoMap.toScreen(pathDef[i].col, pathDef[i].row);
                // Center of diamond: offset by tileH/2 down
                pathScreen.push({ X: sp.X, Y: sp.Y + isoMap.tileHeight / 2 });
            }
        }

        function spawnEnemy() {
            var cfg = waveConfigs[wave];
            enemies.push({
                pathIndex: 0,
                progress: 0, // 0-1 between current and next waypoint
                hp: cfg.hp,
                maxHp: cfg.hp,
                speed: cfg.speed,
                reward: cfg.reward,
                color: cfg.color,
                x: pathScreen[0].X,
                y: pathScreen[0].Y,
                dead: false
            });
        }

        function distSq(ax, ay, bx, by) {
            var dx = ax - bx, dy = ay - by;
            return dx * dx + dy * dy;
        }

        scene.OnCreate = function () {
            buildMap();
            towers = [];
            enemies = [];
            projectiles = [];
            explosions = [];
            gold = 60;
            lives = 15;
            wave = 0;
            waveActive = false;
            spawnTimer = 0;
            spawnIndex = 0;
            gameOver = false;
            victory = false;
            hoverTile = null;
        };

        scene.OnUpdate = function (dt) {
            // --- Background ---
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, W, H);

            // --- Draw Isometric Map ---
            isoMap.draw(engine.drawer);

            // --- Draw path highlights ---
            for (var i = 0; i < pathDef.length; i++) {
                var pw = pathDef[i];
                if (i === 0) {
                    isoMap.drawTileHighlight(engine.drawer, pw.col, pw.row, 'rgba(0,255,100,0.2)');
                } else if (i === pathDef.length - 1) {
                    isoMap.drawTileHighlight(engine.drawer, pw.col, pw.row, 'rgba(255,50,50,0.2)');
                }
            }

            // --- Hover tile ---
            var mx = engine.mousePosition().X;
            var my = engine.mousePosition().Y;
            var gridPos = isoMap.toGrid(mx, my);
            hoverTile = null;
            if (isoMap.inBounds(gridPos.X, gridPos.Y)) {
                hoverTile = { col: gridPos.X, row: gridPos.Y };
                var canBuild = isoMap.collisionMap[gridPos.Y][gridPos.X] === 0;
                var hColor = canBuild ? 'rgba(100,200,255,0.3)' : 'rgba(255,80,80,0.2)';
                isoMap.drawTileHighlight(engine.drawer, gridPos.X, gridPos.Y, hColor);
            }

            // --- Place tower on click ---
            if (!gameOver && !victory && engine.mouseClicked(MouseButton.LEFT) && hoverTile) {
                var tc = hoverTile.col, tr = hoverTile.row;
                if (isoMap.collisionMap[tr][tc] === 0 && gold >= TOWER_COST) {
                    var sp = isoMap.toScreen(tc, tr);
                    towers.push({
                        col: tc, row: tr,
                        x: sp.X, y: sp.Y + isoMap.tileHeight / 2,
                        cooldown: 0, angle: 0
                    });
                    isoMap.collisionMap[tr][tc] = 1; // block tile
                    gold -= TOWER_COST;
                }
            }

            // --- Wave spawning ---
            if (waveActive && wave < waveConfigs.length) {
                spawnTimer -= dt;
                if (spawnTimer <= 0 && spawnIndex < waveConfigs[wave].count) {
                    spawnEnemy();
                    spawnIndex++;
                    spawnTimer = 0.9;
                }
                // Wave complete when all spawned and all dead or escaped
                if (spawnIndex >= waveConfigs[wave].count && enemies.length === 0) {
                    waveActive = false;
                    wave++;
                    if (wave >= waveConfigs.length) victory = true;
                }
            }

            // --- Start wave with SPACE ---
            if (!waveActive && !gameOver && !victory && wave < waveConfigs.length) {
                if (engine.keys.includes(Keys.Space)) {
                    waveActive = true;
                    spawnIndex = 0;
                    spawnTimer = 0;
                }
            }

            // --- Update enemies ---
            for (var ei = enemies.length - 1; ei >= 0; ei--) {
                var e = enemies[ei];
                if (e.dead) { enemies.splice(ei, 1); continue; }

                // Move along path
                if (e.pathIndex < pathScreen.length - 1) {
                    var target = pathScreen[e.pathIndex + 1];
                    var dx = target.X - e.x;
                    var dy = target.Y - e.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    var moveAmt = e.speed * 60 * dt;

                    if (dist <= moveAmt) {
                        e.x = target.X;
                        e.y = target.Y;
                        e.pathIndex++;
                    } else {
                        e.x += (dx / dist) * moveAmt;
                        e.y += (dy / dist) * moveAmt;
                    }
                } else {
                    // Reached end
                    lives--;
                    enemies.splice(ei, 1);
                    if (lives <= 0) { gameOver = true; lives = 0; }
                    continue;
                }
            }

            // --- Tower AI ---
            for (var ti = 0; ti < towers.length; ti++) {
                var t = towers[ti];
                t.cooldown -= dt;

                // Find closest enemy in range
                var closest = null, closestDist = TOWER_RANGE * TOWER_RANGE;
                for (var ei2 = 0; ei2 < enemies.length; ei2++) {
                    var d2 = distSq(t.x, t.y, enemies[ei2].x, enemies[ei2].y);
                    if (d2 < closestDist) {
                        closestDist = d2;
                        closest = enemies[ei2];
                    }
                }

                if (closest) {
                    t.angle = Math.atan2(closest.y - t.y, closest.x - t.x);
                    if (t.cooldown <= 0) {
                        t.cooldown = TOWER_FIRE_RATE;
                        projectiles.push({
                            x: t.x, y: t.y,
                            tx: closest.x, ty: closest.y,
                            target: closest,
                            speed: PROJ_SPEED,
                            damage: 25
                        });
                    }
                }
            }

            // --- Update projectiles ---
            for (var pi = projectiles.length - 1; pi >= 0; pi--) {
                var pr = projectiles[pi];
                // Move toward target position
                var tdx = pr.tx - pr.x;
                var tdy = pr.ty - pr.y;
                var tDist = Math.sqrt(tdx * tdx + tdy * tdy);

                if (tDist < 8 || pr.target.dead) {
                    // Hit or target dead
                    if (!pr.target.dead) {
                        pr.target.hp -= pr.damage;
                        if (pr.target.hp <= 0) {
                            pr.target.dead = true;
                            gold += pr.target.reward;
                            // Explosion
                            explosions.push({ x: pr.target.x, y: pr.target.y, life: 0.4, maxLife: 0.4 });
                        }
                    }
                    projectiles.splice(pi, 1);
                    continue;
                }

                var pSpeed = pr.speed * dt;
                pr.x += (tdx / tDist) * pSpeed;
                pr.y += (tdy / tDist) * pSpeed;
                // Track moving target
                if (!pr.target.dead) {
                    pr.tx = pr.target.x;
                    pr.ty = pr.target.y;
                }
            }

            // --- Draw towers ---
            for (var ti2 = 0; ti2 < towers.length; ti2++) {
                var tw = towers[ti2];
                // Base
                ctx.fillStyle = '#445';
                ctx.fillRect(tw.x - 8, tw.y - 14, 16, 14);
                // Turret
                ctx.save();
                ctx.translate(tw.x, tw.y - 10);
                ctx.rotate(tw.angle);
                ctx.fillStyle = '#0af';
                ctx.fillRect(0, -2, 16, 4);
                ctx.restore();
                // Top dome
                ctx.beginPath();
                ctx.arc(tw.x, tw.y - 12, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#07d';
                ctx.fill();
            }

            // --- Draw enemies ---
            for (var ei3 = 0; ei3 < enemies.length; ei3++) {
                var en = enemies[ei3];
                // Body (diamond)
                ctx.save();
                ctx.translate(en.x, en.y);
                ctx.rotate(Math.PI / 4);
                ctx.fillStyle = 'rgb(' + en.color[0] + ',' + en.color[1] + ',' + en.color[2] + ')';
                ctx.fillRect(-6, -6, 12, 12);
                ctx.restore();

                // Health bar
                var hbW = 20, hbH = 3;
                var hpPct = en.hp / en.maxHp;
                ctx.fillStyle = '#300';
                ctx.fillRect(en.x - hbW / 2, en.y - 16, hbW, hbH);
                ctx.fillStyle = hpPct > 0.5 ? '#0c0' : hpPct > 0.25 ? '#cc0' : '#c00';
                ctx.fillRect(en.x - hbW / 2, en.y - 16, hbW * hpPct, hbH);
            }

            // --- Draw projectiles ---
            ctx.fillStyle = '#ff0';
            for (var pi2 = 0; pi2 < projectiles.length; pi2++) {
                var pp = projectiles[pi2];
                ctx.beginPath();
                ctx.arc(pp.x, pp.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- Draw explosions ---
            for (var xi = explosions.length - 1; xi >= 0; xi--) {
                var ex = explosions[xi];
                ex.life -= dt;
                if (ex.life <= 0) { explosions.splice(xi, 1); continue; }
                var exP = 1 - ex.life / ex.maxLife;
                var exR = 5 + exP * 20;
                ctx.globalAlpha = 1 - exP;
                ctx.beginPath();
                ctx.arc(ex.x, ex.y, exR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,200,50,0.8)';
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // --- UI Panel ---
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(8, 8, 220, 70);
            ctx.font = 'bold 14px monospace';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('Gold: ' + gold, 18, 28);
            ctx.fillStyle = '#ff4444';
            ctx.fillText('Lives: ' + lives, 18, 46);
            ctx.fillStyle = '#aaa';
            ctx.fillText('Wave: ' + (wave + 1) + ' / ' + waveConfigs.length, 18, 64);
            // Tower cost
            ctx.fillStyle = '#0af';
            ctx.font = '12px monospace';
            ctx.fillText('Click grass to build (' + TOWER_COST + 'g)', 110, 28);

            // Start wave prompt
            if (!waveActive && !gameOver && !victory && wave < waveConfigs.length) {
                var blinkA = 0.5 + 0.4 * Math.sin(performance.now() / 300);
                ctx.globalAlpha = blinkA;
                ctx.font = 'bold 16px "Segoe UI", sans-serif';
                ctx.fillStyle = '#0f0';
                ctx.textAlign = 'center';
                ctx.fillText('Press SPACE to start Wave ' + (wave + 1), W / 2, H - 20);
                ctx.textAlign = 'left';
                ctx.globalAlpha = 1;
            }

            // --- Game Over / Victory ---
            if (gameOver) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(0, 0, W, H);
                ctx.font = 'bold 40px "Segoe UI", sans-serif';
                ctx.fillStyle = '#ff4444';
                ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
                ctx.font = '16px "Segoe UI", sans-serif';
                ctx.fillStyle = '#aaa';
                ctx.fillText('Press R to restart', W / 2, H / 2 + 25);
                ctx.textAlign = 'left';
                if (engine.keys.includes(Keys.R)) {
                    scene.reset();
                    scene.isCreated = false;
                }
            }

            if (victory) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, W, H);
                ctx.font = 'bold 40px "Segoe UI", sans-serif';
                ctx.fillStyle = '#0f0';
                ctx.textAlign = 'center';
                ctx.fillText('VICTORY!', W / 2, H / 2 - 10);
                ctx.font = '16px "Segoe UI", sans-serif';
                ctx.fillStyle = '#aaa';
                ctx.fillText('All waves cleared! Press R to play again', W / 2, H / 2 + 25);
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
