class BottomBar {

    constructor(engine, messageBox, game) {
        this.engine = engine;
        this.messageBox = messageBox;
        this.maxPositionY = this.engine.screenSize().height - 300;
        this.position = new Position(5, this.engine.screenSize().height);
        this.isOpen = false;
        this.isMoving = false;
        this.game = game;

        this.openBar = false;
        this.closeBar = false;
        this.properties = [];
        this.currentPlayer = null;
        this.cardSize = new Size(160, 210);
        this.startIndex = 0;
        this.clickSound = new Sound('./assets/audio/click.mp3', 80);

        this._toggleHovered = false;
        this._leftHovered = false;
        this._rightHovered = false;
    }

    display(elapsedTime) {
        if (this.isMoving || this.isOpen) {
            var drawer = this.engine.drawer;
            var sw = this.engine.screenSize().width - 10;

            // Dark panel background
            drawer.rectangle(this.position, new Size(sw, 300), true, 1, 'rgba(10, 10, 28, 0.92)');
            drawer.rectangle(this.position, new Size(sw, 300), false, 2, '#ff8844');

            // Header
            if (this.currentPlayer) {
                var headerY = this.position.Y + 22;
                drawer.text(this.currentPlayer.name, new Position(this.position.X + 20, headerY), 14, 'monospace', 'bold', '#44aaff');
                drawer.text('$' + this.currentPlayer.solde, new Position(this.position.X + 200, headerY), 14, 'monospace', 'bold', '#44cc66');
                var propCount = this.currentPlayer.getSortedTiles().length;
                drawer.text(propCount + ' properties', new Position(this.position.X + 350, headerY), 12, 'monospace', 'normal', '#667788');
            }

            // Draw property cards
            var visibleCards = 5;
            var i = 0;
            for (var j = this.startIndex; j < this.properties.length; j++) {
                if (i >= visibleCards) break;
                this.properties[j].position = new Position(this.position.X + ((this.cardSize.width + 8) * i) + 50, this.position.Y + 40);
                this.card(this.properties[j]);
                i++;
            }
        }
        this.movingButton();
        this.openBtn(elapsedTime);
        this.checkPosition();
    }

    setPlayer(player) {
        this.properties = [];
        for (var i = 0; i < player.getSortedTiles().length; i++) {
            var property = new PropertyCard(player.getSortedTiles()[i], new Position(this.position.X + ((this.cardSize.width + 8) * i) + 50, this.position.Y + 40));
            this.properties.push(property);
        }
        this.currentPlayer = player;
    }

    _drawSmallBtn(label, x, y, w, h, baseColor, hoverColor, isHovered) {
        var color = isHovered ? hoverColor : baseColor;
        this.engine.drawer.rectangle(new Position(x, y), new Size(w, h), true, 1, color);
        this.engine.drawer.rectangle(new Position(x, y), new Size(w, h), false, 1, 'rgba(255,255,255,0.1)');
        var tw = this.engine.drawer.textWidth(label, 10, 'monospace', 'bold');
        var tx = x + (w - tw) / 2;
        var ty = y + (h + 10) / 2 - 1;
        this.engine.drawer.text(label, new Position(tx, ty), 10, 'monospace', 'bold', 'white');
    }

    movingButton() {
        if (this.properties.length > 5) {
            var navY = this.position.Y + 130;
            var navW = 28;
            var navH = 28;

            // Left arrow
            if (this.startIndex > 0) {
                var lx = this.position.X + 14;
                this._leftHovered = this.engine.mouseOnTopOfPosition(new Position(lx, navY), new Size(navW, navH));
                this._drawSmallBtn('<', lx, navY, navW, navH, '#2a3a5a', '#3a5a7a', this._leftHovered);
                if (this._leftHovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                    this.clickSound.play();
                    this.toRight();
                }
            }

            // Right arrow
            if (this.startIndex + 5 < this.properties.length) {
                var rx = this.engine.screenSize().width - 44;
                this._rightHovered = this.engine.mouseOnTopOfPosition(new Position(rx, navY), new Size(navW, navH));
                this._drawSmallBtn('>', rx, navY, navW, navH, '#2a3a5a', '#3a5a7a', this._rightHovered);
                if (this._rightHovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                    this.clickSound.play();
                    this.toLeft();
                }
            }
        }
    }

    toLeft() {
        if (this.startIndex < this.properties.length) {
            this.startIndex++;
        }
    }

    toRight() {
        if (this.startIndex > 0) {
            this.startIndex--;
        }
    }

    card(property) {
        var drawer = this.engine.drawer;
        var px = property.position.X;
        var py = property.position.Y;
        var cw = this.cardSize.width;
        var ch = this.cardSize.height;

        // Dark card background
        drawer.rectangle(property.position, new Size(cw, ch), true, 1, 'rgba(20, 20, 40, 0.95)');
        drawer.rectangle(property.position, new Size(cw, ch), false, 1, '#334455');

        // Color header bar
        drawer.rectangle(new Position(px + 4, py + 4), new Size(cw - 8, 28), true, 1, property.tile.color || '#555');

        // Title
        var fontSize = 10;
        var tileWidth = drawer.textWidth(property.tile.streetName, fontSize, 'monospace', 'bold');
        if (tileWidth > cw - 20) fontSize = 8;
        drawer.text(property.tile.streetName, new Position(px + 10, py + 22), fontSize, 'monospace', 'bold', 'white');

        this.propertyText(property);
        this.utilsButtons(property);
    }

    utilsButtons(property) {
        if (!property) return;

        var px = property.position.X;
        var py = property.position.Y;
        var btnW = 60;
        var btnH = 20;
        var isCurrentPlayer = this.currentPlayer.name === this.game.currentPlayer.name && !this.game.currentPlayer.isCPU;

        if (isCurrentPlayer) {
            var btnY = py + this.cardSize.height - btnH - 8;

            if (property.tile.numberHouses <= 0) {
                // Mortgage button
                if (this.currentPlayer.canMortgagaTile(property.tile)) {
                    var mx = px + 10;
                    var mHovered = this.engine.mouseOnTopOfPosition(new Position(mx, btnY), new Size(btnW, btnH));
                    this._drawSmallBtn('Mortgage', mx, btnY, btnW, btnH, '#5c4a1a', '#7c6a2a', mHovered);
                    if (mHovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                        this.clickSound.play();
                        if (this.currentPlayer.mortgageTileById(property.tile.id)) {
                            this.messageBox.simple(property.tile.streetName + ' is Mortgage, you receive $' + property.tile.getMortgageValue() + '.', function() { this.messageBox.remove(); }.bind(this), false, 500, 200);
                        }
                    }
                }
                // Pay mortgage button
                if (property.tile.mortgage) {
                    var pmx = px + 20;
                    var pmY = py + 120;
                    var pmW = 120;
                    var pmH = 24;
                    var pmHovered = this.engine.mouseOnTopOfPosition(new Position(pmx, pmY), new Size(pmW, pmH));
                    this._drawSmallBtn('Pay Mortgage', pmx, pmY, pmW, pmH, '#1a5c2a', '#2a7a3e', pmHovered);
                    if (pmHovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                        this.clickSound.play();
                        if (this.currentPlayer.payMortgageTileById(property.tile.id)) {
                            this.messageBox.simple(property.tile.streetName + ' is no more Mortgage, you payed $' + property.tile.getMortgagePayement() + '.', function() { this.messageBox.remove(); }.bind(this), false, 500, 200);
                        }
                    }
                }
            }

            if (!property.tile.mortgage && property.tile.type === TileType.LAND) {
                // Build button
                if (this.currentPlayer.canBuildOnTile(property.tile)) {
                    var bx = px + this.cardSize.width - btnW - 10;
                    var bHovered = this.engine.mouseOnTopOfPosition(new Position(bx, btnY), new Size(btnW, btnH));
                    this._drawSmallBtn('Build', bx, btnY, btnW, btnH, '#1a5c2a', '#2a7a3e', bHovered);
                    if (bHovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                        this.clickSound.play();
                        if (this.currentPlayer.solde >= property.tile.houseContruction) {
                            if (this.currentPlayer.buildHouse(property.tile.id)) {
                                this.messageBox.simple('You built another property on ' + property.tile.streetName + '.', function() { this.messageBox.remove(); }.bind(this), false, 500, 200);
                            } else {
                                this.messageBox.simple('You can\'t build another property on ' + property.tile.streetName + '.', function() { this.messageBox.remove(); }.bind(this), false, 500, 200);
                            }
                        }
                    }
                }

                // Sell button
                if (property.tile.numberHouses > 0) {
                    var sx = px + 10;
                    var sHovered = this.engine.mouseOnTopOfPosition(new Position(sx, btnY), new Size(btnW, btnH));
                    this._drawSmallBtn('Sell', sx, btnY, btnW, btnH, '#5c1a1a', '#7a2a2a', sHovered);
                    if (sHovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                        this.clickSound.play();
                        if (this.currentPlayer.sellHouse(property.tile.id)) {
                            this.messageBox.simple('You sold a house on ' + property.tile.streetName + '.', function() { this.messageBox.remove(); }.bind(this), false, 500, 200);
                        } else {
                            this.messageBox.simple('You can\'t sell on ' + property.tile.streetName + '.', function() { this.messageBox.remove(); }.bind(this), false, 500, 200);
                        }
                    }
                }
            }
        } else {
            // Offer to buy from other player
            if (this.currentPlayer.solde >= (property.tile.purchaseValue * 3) && this.currentPlayer.canSellTile(this.game.currentPlayer, property.tile) && property.tile.numberHouses <= 0) {
                var btnY = py + this.cardSize.height - 28;
                var obx = px + 30;
                var obW = 100;
                var obH = 22;
                var obHovered = this.engine.mouseOnTopOfPosition(new Position(obx, btnY), new Size(obW, obH));
                this._drawSmallBtn('Offer to Buy', obx, btnY, obW, obH, '#2a4a6a', '#3a6a8a', obHovered);
                if (obHovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                    this.clickSound.play();
                    var offer = new BuyingOffer(this.game.currentPlayer, property.tile);
                    this.currentPlayer.addOffer(offer);
                }
            }
        }
    }

    propertyText(property) {
        if (!property.tile) return;
        var drawer = this.engine.drawer;
        var px = property.position.X;
        var py = property.position.Y;
        var textColor = '#aabbcc';
        var dimColor = '#667788';

        if (property.tile.canBuy) {
            if (!property.tile.mortgage) {
                if (property.tile.type == TileType.LAND) {
                    drawer.text('RENT $' + property.tile.houseRent, new Position(px + 50, py + 50), 10, 'monospace', 'bold', textColor);
                    for (var i = 0; i < 4; i++) {
                        var rent = (property.tile.houseRent * (i + 1)) + ((i + 1) * 15);
                        drawer.text((i + 1) + ' Houses  $' + rent, new Position(px + 10, py + 64 + (i * 12)), 9, 'monospace', 'normal', dimColor);
                    }
                    var hotelRent = (property.tile.houseRent * 5) + (5 * 15);
                    drawer.text('HOTEL    $' + hotelRent, new Position(px + 10, py + 64 + (4 * 12)), 9, 'monospace', 'normal', dimColor);
                } else if (property.tile.type == TileType.RAILROAD) {
                    drawer.text('RENT $' + property.tile.houseRent, new Position(px + 50, py + 50), 10, 'monospace', 'bold', textColor);
                    for (var i = 0; i < 3; i++) {
                        drawer.text((i + 2) + ' R.R.  $' + (property.tile.houseRent * (i + 2)), new Position(px + 10, py + 64 + (i * 12)), 9, 'monospace', 'normal', dimColor);
                    }
                } else if (property.tile.type == TileType.COMPANY) {
                    drawer.text('1 Utility: 4x dice', new Position(px + 10, py + 50), 9, 'monospace', 'normal', dimColor);
                    drawer.text('2 Utilities: 10x dice', new Position(px + 10, py + 64), 9, 'monospace', 'normal', dimColor);
                }

                if (property.tile.type == TileType.LAND || property.tile.type == TileType.RAILROAD || property.tile.type == TileType.COMPANY) {
                    var mortVal = parseInt(property.tile.purchaseValue / 2);
                    drawer.text('Mortgage  $' + mortVal, new Position(px + 10, py + this.cardSize.height - 40), 9, 'monospace', 'normal', '#886644');
                }
            } else {
                drawer.text('MORTGAGED', new Position(px + 40, py + 60), 12, 'monospace', 'bold', '#cc4444');
                drawer.text('Pay $' + property.tile.getMortgagePayement(), new Position(px + 30, py + 80), 10, 'monospace', 'normal', dimColor);
            }
        }
    }

    open(elapsedTime) {
        if (this.position.Y > this.maxPositionY) {
            this.isMoving = true;
            this.position = new Position(5, this.position.Y - (800 * elapsedTime));
        } else {
            this.isMoving = false;
            this.isOpen = true;
            this.openBar = false;
        }
    }

    close(elapsedTime) {
        if (this.position.Y < this.engine.screenSize().height) {
            this.isMoving = true;
            this.position = new Position(5, this.position.Y + (800 * elapsedTime));
        } else {
            this.isMoving = false;
            this.closeBar = false;
            this.isOpen = false;
        }
    }

    checkPosition() {
        if (this.position.Y > this.maxPositionY && this.isOpen && !this.isMoving) {
            this.position = new Position(5, this.maxPositionY);
        }
        if (this.position.Y < this.engine.screenSize().height && !this.isOpen && !this.isMoving) {
            this.position = new Position(5, this.engine.screenSize().height);
        }
    }

    openBtn(elapsedTime) {
        var btnW = 140;
        var btnH = 30;
        var btnX = this.position.X + 10;
        var btnY = this.position.Y - 38;
        var label = this.isOpen ? 'Hide Cards' : 'View Cards';

        this._toggleHovered = this.engine.mouseOnTopOfPosition(new Position(btnX, btnY), new Size(btnW, btnH));

        if (this._toggleHovered && this.engine.mouseClicked(MouseButton.LEFT)) {
            this.clickSound.play();
            if (!this.openBar && !this.isMoving && !this.isOpen)
                this.openBar = true;
            else if (!this.closeBar && !this.isMoving && this.isOpen)
                this.closeBar = true;
        }

        if (this.openBar) this.open(elapsedTime);
        if (this.closeBar) this.close(elapsedTime);

        // Draw toggle button
        var color = this._toggleHovered ? '#3a5a7a' : '#2a3a5a';
        this.engine.drawer.rectangle(new Position(btnX, btnY), new Size(btnW, btnH), true, 1, color);
        this.engine.drawer.rectangle(new Position(btnX, btnY), new Size(btnW, btnH), false, 1, '#ff8844');
        var tw = this.engine.drawer.textWidth(label, 11, 'monospace', 'bold');
        var tx = btnX + (btnW - tw) / 2;
        var ty = btnY + (btnH + 11) / 2 - 1;
        this.engine.drawer.text(label, new Position(tx, ty), 11, 'monospace', 'bold', 'white');
    }
}
