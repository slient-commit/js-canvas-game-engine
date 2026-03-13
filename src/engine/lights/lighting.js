class Lighting {
    constructor(engine, tileWidth = 2, tileHeight = 2) {
        this.engine = engine;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.width = this.engine.screenSize().width / tileWidth;
        this.height = this.engine.screenSize().height / tileHeight;
        this.grid = this.Create2DArray(parseInt(this.width));
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.grid[x][y] = new LightTile(new Position(x, y));
            }
        }
    }

    addLightSpot(lightSpot, convertCordinate = true) {
        if (lightSpot == null || lightSpot == undefined) {
            console.error("No light spot was given");
            return false;
        }
        var position = lightSpot.position;
        if (convertCordinate) {
            var tmp = this.PositionByGrid(lightSpot.position);
            position = new Position(tmp.X, tmp.Y);
            lightSpot.position = new Position(position.X, position.Y);
        }

        this.grid[position.X][position.Y] = new LightTile(new Position(position.X, position.Y), lightSpot);
        if (lightSpot.distance > 0) {
            var distance = (lightSpot.distance * 10) + 1;
            for (var i = 1; i < lightSpot.distance + 1; i++) {
                if (position.X - i > 0) {
                    this.grid[position.X - i][position.Y] = new LightTile(new Position(position.X - i, position.Y), null, 0, true);
                }

                if (position.Y - i > 0) {
                    this.grid[position.X][position.Y - i] = new LightTile(new Position(position.X, position.Y - i), null, 0, true);
                }

                if (position.X + i < this.width) {
                    this.grid[position.X + i][position.Y] = new LightTile(new Position(position.X + i, position.Y), null, 0, true);
                }

                if (position.Y + i < this.height) {
                    this.grid[position.X][position.Y + i] = new LightTile(new Position(position.X, position.Y + i), null, 0, true);
                }

                if (position.X - i > 0 && position.Y - i > 0) {
                    this.grid[position.X - i][position.Y - i] = new LightTile(new Position(position.X - i, position.Y - i), null, 0, true);
                }

                if (position.X - i > 0 && position.Y + i < this.height) {
                    this.grid[position.X - i][position.Y + i] = new LightTile(new Position(position.X - i, position.Y + i), null, 0, true);
                }

                if (position.X + i < this.width && position.Y + i < this.height) {
                    this.grid[position.X + i][position.Y + i] = new LightTile(new Position(position.X + i, position.Y + i), null, 0, true);
                }

                if (position.X + i < this.width && position.Y - i > 0) {
                    this.grid[position.X + i][position.Y - i] = new LightTile(new Position(position.X + i, position.Y - i), null, 0, true);
                }

                for (var k = 1; k < i; k++) {
                    if (position.X - i > 0 && position.Y - k > 0) {
                        this.grid[position.X - i][position.Y - k] = new LightTile(new Position(position.X - i, position.Y - k), null, 0, true);
                    }
                    if (position.X - k > 0 && position.Y - i > 0) {
                        this.grid[position.X - k][position.Y - i] = new LightTile(new Position(position.X - k, position.Y - i), null, 0, true);
                    }

                    if (position.X - i > 0 && position.Y + k < this.height) {
                        this.grid[position.X - i][position.Y + k] = new LightTile(new Position(position.X - i, position.Y + k), null, 0, true);
                    }

                    if (position.X - k > 0 && position.Y + i < this.height) {
                        this.grid[position.X - k][position.Y + i] = new LightTile(new Position(position.X - k, position.Y + i), null, 0, true);
                    }

                    if (position.X + k < this.width && position.Y + i < this.height) {
                        this.grid[position.X + k][position.Y + i] = new LightTile(new Position(position.X + k, position.Y + i), null, 0, true);
                    }

                    if (position.X + i < this.width && position.Y + k < this.height) {
                        this.grid[position.X + i][position.Y + k] = new LightTile(new Position(position.X + i, position.Y + k), null, 0, true);
                    }

                    if (position.X + k < this.width && position.Y - i > 0) {
                        this.grid[position.X + k][position.Y - i] = new LightTile(new Position(position.X + k, position.Y - i), null, 0, true);
                    }

                    if (position.X + i < this.width && position.Y - k > 0) {
                        this.grid[position.X + i][position.Y - k] = new LightTile(new Position(position.X + i, position.Y - k), null, 0, true);
                    }
                }
            }
        }
        return true;
    }

    Create2DArray(rows) {
        var arr = [];
        for (var i = 0; i < rows; i++) {
            arr[i] = [];
        }
        return arr;
    }

    PositionByGrid(position) {
        var result = new Position(position.X, position.Y);
        result.X = parseInt(result.X / this.width) * this.width;
        result.Y = parseInt(result.Y / this.height) * this.height;
        console.log(result);
        return result;
    }

    draw() {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                var tile = this.grid[x][y];
                if (tile.reflexion) {
                    // this.engine.drawer.rectangle(new Position(x * this.tileWidth, y * this.tileHeight), new Size(this.tileWidth, this.tileHeight), true, 1, new RGB(255, 255, 255).toStringWithoutAlpha(), 0);
                } else if (tile.lightSpot != null) {
                    for (var i = 1; i < tile.lightSpot.distance + 1; i++) {
                        this.engine.drawer.circle(new Position(x * this.tileWidth, y * this.tileHeight), i * 10, 0, -1, true, 1, tile.lightSpot.color.toStringWithoutAlpha(), tile.lightSpot.color.alpha * tile.lightSpot.tension);
                    }
                    // this.engine.drawer.rectangle(new Position(x * this.tileWidth, y * this.tileHeight), new Size(this.tileWidth, this.tileHeight), true, 1, tile.lightSpot.color.toStringWithoutAlpha(), tile.lightSpot.color.alpha);
                } else {
                    this.engine.drawer.rectangle(new Position(x * this.tileWidth, y * this.tileHeight), new Size(this.tileWidth, this.tileHeight), true, 1, new RGB(0, 0, 0).toStringWithoutAlpha(), .5);
                }
                // this.engine.drawer.rectangle(new Position(x * this.tileWidth, y * this.tileHeight), new Size(this.tileWidth, this.tileHeight), false, 1, 'red');
            }
        }
    }
}