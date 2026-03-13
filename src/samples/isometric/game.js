window.addEventListener("engineReady", function() {

    class IsometricGameScene extends Scene {

        constructor(engine) {
            super('IsometricGameScene', engine);

            this.mapCols = 20;
            this.mapRows = 20;
            this.tileW = 64;
            this.tileH = 32;
            this.heightStep = 16;

            this.isoMap = null;
            this.cam = null;

            // Player
            this.player = {
                col: 10,
                row: 10,
                screenPos: new Vec2(0, 0),
                moving: false,
                path: [],
                pathIndex: 0
            };

            // Scene objects (trees, rocks)
            this.objects = [];

            // Hover tile
            this.hoverTile = new Vec2(-1, -1);

            // Path preview
            this.previewPath = [];

            // Camera target for tweening
            this.camTarget = new Vec2(0, 0);
        }

        OnCreate() {
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            // Create map
            this.isoMap = new IsometricMap(this.mapCols, this.mapRows, this.tileW, this.tileH, this.heightStep);

            // Center map on screen
            var mapWorldW = (this.mapCols + this.mapRows) * this.tileW / 2;
            var mapWorldH = (this.mapCols + this.mapRows) * this.tileH / 2 + 4 * this.heightStep;
            this.isoMap.offset = new Vec2(mapWorldW / 2, 80);

            // Generate terrain
            this._generateTerrain();

            // Find walkable start for player
            this._placePlayer();

            // Place objects
            this._placeObjects();

            // Set initial screen position
            this.player.screenPos = this.isoMap.toScreen(this.player.col, this.player.row).clone();
            this.camTarget = this.player.screenPos.clone();

            // Camera
            this.cam = new WorldCamera(sw, sh, mapWorldW + 200, mapWorldH + 200);
            this.cam.addOffset = true;
            this.cam.smoothFollow = true;
            this.cam.followLerp = 0.08;

            // Position camera on player
            this.cam.location = new Vec2(
                this.player.screenPos.X + this.isoMap.offset.X,
                this.player.screenPos.Y + this.isoMap.offset.Y
            );

            this.setCamera(this.cam);

            return true;
        }

        _generateTerrain() {
            var map = this.isoMap;

            // Height generation using layered sine waves
            for (var r = 0; r < map.rows; r++) {
                for (var c = 0; c < map.cols; c++) {
                    var n = Math.sin(c * 0.3) * Math.sin(r * 0.4)
                          + Math.sin(c * 0.15 + r * 0.15) * 0.5
                          + Math.sin(c * 0.5 + 1.0) * Math.sin(r * 0.6 + 0.5) * 0.3;
                    var h = Math.floor((n + 1.5) * 1.2);
                    h = Math.max(0, Math.min(3, h));
                    map.heightMap[r][c] = h;

                    // Tile type from height
                    if (h <= 1) map.tiles[r][c] = 0;       // grass
                    else if (h === 2) map.tiles[r][c] = 1;  // dirt
                    else map.tiles[r][c] = 2;                // stone
                }
            }

            // Water patches at height 0
            for (var r = 0; r < map.rows; r++) {
                for (var c = 0; c < map.cols; c++) {
                    if (map.heightMap[r][c] === 0 && Math.random() < 0.25) {
                        map.tiles[r][c] = 3; // water
                        map.collisionMap[r][c] = 1; // blocked

                        // Spread to adjacent height-0 tiles
                        var adj = [[-1,0],[1,0],[0,-1],[0,1]];
                        for (var a = 0; a < adj.length; a++) {
                            var ar = r + adj[a][0];
                            var ac = c + adj[a][1];
                            if (map.inBounds(ac, ar) && map.heightMap[ar][ac] === 0 && Math.random() < 0.5) {
                                map.tiles[ar][ac] = 3;
                                map.collisionMap[ar][ac] = 1;
                            }
                        }
                    }
                }
            }
        }

        _placePlayer() {
            var map = this.isoMap;
            var startCol = 10;
            var startRow = 10;

            // Search outward for a walkable tile
            for (var radius = 0; radius < 10; radius++) {
                for (var dr = -radius; dr <= radius; dr++) {
                    for (var dc = -radius; dc <= radius; dc++) {
                        var c = startCol + dc;
                        var r = startRow + dr;
                        if (map.inBounds(c, r) && map.isWalkable(c, r)) {
                            this.player.col = c;
                            this.player.row = r;
                            return;
                        }
                    }
                }
            }
        }

        _placeObjects() {
            var map = this.isoMap;

            // Trees on grass (height 0-1)
            var treeCount = 0;
            var maxTrees = 20;
            for (var attempts = 0; attempts < 200 && treeCount < maxTrees; attempts++) {
                var c = Math.floor(Math.random() * map.cols);
                var r = Math.floor(Math.random() * map.rows);
                if (map.isWalkable(c, r) && map.tiles[r][c] <= 1
                    && !(c === this.player.col && r === this.player.row)) {
                    this.objects.push({ col: c, row: r, type: 'tree' });
                    map.collisionMap[r][c] = 1;
                    treeCount++;
                }
            }

            // Rocks on dirt/stone (height 2-3)
            var rockCount = 0;
            var maxRocks = 12;
            for (var attempts = 0; attempts < 200 && rockCount < maxRocks; attempts++) {
                var c = Math.floor(Math.random() * map.cols);
                var r = Math.floor(Math.random() * map.rows);
                if (map.isWalkable(c, r) && map.heightMap[r][c] >= 2
                    && !(c === this.player.col && r === this.player.row)) {
                    this.objects.push({ col: c, row: r, type: 'rock' });
                    map.collisionMap[r][c] = 1;
                    rockCount++;
                }
            }
        }

        _tryMove(dc, dr) {
            if (this.player.moving) return;

            var toCol = this.player.col + dc;
            var toRow = this.player.row + dr;

            if (!this.isoMap.canMoveTo(this.player.col, this.player.row, toCol, toRow)) return;

            // Cancel any active path
            this.player.path = [];
            this.player.pathIndex = 0;

            this._movePlayerTo(toCol, toRow);
        }

        _movePlayerTo(toCol, toRow) {
            this.player.moving = true;
            this.player.col = toCol;
            this.player.row = toRow;

            var target = this.isoMap.toScreen(toCol, toRow);
            var self = this;

            this.engine.tweens.to(this.player.screenPos, { X: target.X, Y: target.Y }, 0.18, Easing.easeOut)
                .onComplete(function() {
                    self.player.moving = false;
                    self._followPath();
                });
        }

        _followPath() {
            if (this.player.pathIndex >= this.player.path.length) {
                this.player.path = [];
                this.player.pathIndex = 0;
                this.previewPath = [];
                return;
            }

            var next = this.player.path[this.player.pathIndex];
            this.player.pathIndex++;
            this._movePlayerTo(next.col, next.row);
        }

        _drawTree(ctx, sx, sy, tileH, camOffX, camOffY) {
            var bx = sx + camOffX;
            var by = sy + camOffY + tileH / 2;

            // Trunk
            ctx.fillStyle = '#6b4423';
            ctx.fillRect(bx - 3, by - 18, 6, 12);

            // Canopy
            ctx.fillStyle = '#2d8a2d';
            ctx.beginPath();
            ctx.arc(bx, by - 22, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3aaa3a';
            ctx.beginPath();
            ctx.arc(bx - 2, by - 24, 7, 0, Math.PI * 2);
            ctx.fill();
        }

        _drawRock(ctx, sx, sy, tileH, camOffX, camOffY) {
            var bx = sx + camOffX;
            var by = sy + camOffY + tileH / 2;

            ctx.fillStyle = '#8a8a95';
            ctx.beginPath();
            ctx.ellipse(bx, by - 5, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#6a6a75';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        _drawPlayer(ctx, camOffX, camOffY) {
            var px = this.player.screenPos.X + camOffX;
            var py = this.player.screenPos.Y + camOffY + this.tileH / 2;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(px, py, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = '#e94560';
            ctx.fillRect(px - 5, py - 18, 10, 14);

            // Head
            ctx.fillStyle = '#ffccaa';
            ctx.beginPath();
            ctx.arc(px, py - 22, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        OnUpdate(elapsedTime) {
            var drawer = this.engine.drawer;
            var input = this.engine.input;
            var ctx = drawer.ctx;
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            var camOffX = this.cam.addOffset ? this.cam.offset.X : 0;
            var camOffY = this.cam.addOffset ? this.cam.offset.Y : 0;

            // --- Input: WASD movement ---
            if (input.isKeyPressed(Keys.W)) this._tryMove(0, -1);
            if (input.isKeyPressed(Keys.S)) this._tryMove(0, 1);
            if (input.isKeyPressed(Keys.A)) this._tryMove(-1, 0);
            if (input.isKeyPressed(Keys.D)) this._tryMove(1, 0);

            // Also support arrow keys
            if (input.isKeyPressed(Keys.ArrowUp)) this._tryMove(0, -1);
            if (input.isKeyPressed(Keys.ArrowDown)) this._tryMove(0, 1);
            if (input.isKeyPressed(Keys.ArrowLeft)) this._tryMove(-1, 0);
            if (input.isKeyPressed(Keys.ArrowRight)) this._tryMove(1, 0);

            // --- Input: Click to pathfind ---
            var mousePos = input.getMousePosition();
            var worldMX = mousePos.X - camOffX;
            var worldMY = mousePos.Y - camOffY;
            this.hoverTile = this.isoMap.toGrid(worldMX, worldMY);

            if (input.isMousePressed(0) && !this.player.moving) {
                var ht = this.hoverTile;
                if (this.isoMap.inBounds(ht.X, ht.Y) && this.isoMap.isWalkable(ht.X, ht.Y)) {
                    var path = PathFinder.findPath(this.isoMap, this.player.col, this.player.row, ht.X, ht.Y);
                    if (path.length > 0) {
                        this.player.path = path;
                        this.player.pathIndex = 0;
                        this.previewPath = path.slice();
                        this._followPath();
                    }
                }
            }

            // --- Update camera to follow player ---
            this.camTarget.X = this.player.screenPos.X;
            this.camTarget.Y = this.player.screenPos.Y;

            // Smooth camera follow
            var targetLocX = this.camTarget.X;
            var targetLocY = this.camTarget.Y;
            this.cam.location.X += (targetLocX - this.cam.location.X) * 0.08;
            this.cam.location.Y += (targetLocY - this.cam.location.Y) * 0.08;
            this.cam.position = new Vec2(
                this.cam.location.X - this.cam.cameraSize.width / 2,
                this.cam.location.Y - this.cam.cameraSize.height / 2
            );
            this.cam.getOffset();

            // --- Draw ---
            // Sky gradient background
            var grad = ctx.createLinearGradient(0, 0, 0, sh);
            grad.addColorStop(0, '#6baed6');
            grad.addColorStop(1, '#d4e8d4');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, sw, sh);

            // Draw isometric map with entity callback for depth sorting
            var self = this;
            this.isoMap.draw(drawer, this.cam, function(col, row, sx, sy) {
                // Draw objects at this tile
                for (var i = 0; i < self.objects.length; i++) {
                    var obj = self.objects[i];
                    if (obj.col === col && obj.row === row) {
                        if (obj.type === 'tree') {
                            self._drawTree(ctx, sx, sy, self.tileH, 0, 0);
                        } else {
                            self._drawRock(ctx, sx, sy, self.tileH, 0, 0);
                        }
                    }
                }

                // Draw player at this tile
                if (self.player.col === col && self.player.row === row) {
                    self._drawPlayer(ctx, camOffX, camOffY);
                }
            });

            // --- Draw path preview ---
            if (this.previewPath.length > 0 && this.player.path.length > 0) {
                ctx.fillStyle = 'rgba(255, 220, 87, 0.6)';
                for (var i = this.player.pathIndex; i < this.previewPath.length; i++) {
                    var wp = this.previewPath[i];
                    var wps = this.isoMap.toScreen(wp.col, wp.row);
                    var wpx = wps.X + camOffX;
                    var wpy = wps.Y + camOffY + this.tileH / 2;
                    ctx.beginPath();
                    ctx.arc(wpx, wpy, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // --- Hover tile highlight ---
            if (this.isoMap.inBounds(this.hoverTile.X, this.hoverTile.Y)) {
                this.isoMap.drawTileHighlight(drawer, this.hoverTile.X, this.hoverTile.Y, 'rgba(255,255,255,0.15)', this.cam);
            }

            // --- UI text ---
            drawer.text('Isometric World', new Vec2(15, 22), 18, 'monospace', 'bold', 'rgba(255,255,255,0.9)');

            var tileInfo = '';
            if (this.isoMap.inBounds(this.hoverTile.X, this.hoverTile.Y)) {
                var hc = this.hoverTile.X;
                var hr = this.hoverTile.Y;
                var ht = this.isoMap.tiles[hr][hc];
                var hh = this.isoMap.heightMap[hr][hc];
                var typeNames = ['Grass', 'Dirt', 'Stone', 'Water'];
                tileInfo = '  |  Tile: (' + hc + ',' + hr + ')  Height: ' + hh + '  ' + (typeNames[ht] || '?');
            }

            drawer.text(
                'WASD/Arrows: Move  |  Click: Pathfind  |  Player: (' + this.player.col + ',' + this.player.row + ')' + tileInfo,
                new Vec2(15, sh - 15), 11, 'monospace', 'normal', 'rgba(255,255,255,0.5)'
            );

            drawer.text('Objects: ' + this.objects.length,
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
        var scene = new IsometricGameScene(engine);
        engine.registerScene(scene);
    };
    engine.start();
});
