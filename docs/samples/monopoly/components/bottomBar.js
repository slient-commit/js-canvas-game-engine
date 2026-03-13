class BottomBar {

    constructor(engine, messageBox, game) {
        this.engine = engine;
        this.messageBox = messageBox;
        this.maxPositionY = this.engine.screenSize().height - 300;
        this.position = new Position(5, this.engine.screenSize().height);
        this.isOpen = false;
        this.isMoving = false;
        this.game = game;

        this.openButtonSprite = new Sprite(200, 50);
        this.openButtonSprite.loadImage('./assets/sprites/buttons/viewCads.png');
        this.openButton = new GameObject(this.openButtonSprite, new Position(this.position.X + 10, this.position.Y - 55));
        this.openBar = false;
        this.closeBar = false;
        this.properties = [];
        this.currentPlayer = null;
        this.cardSize = new Size(200, 220);
        this.startIndex = 0;

        this.btnLeftSprite = new Sprite(32, 32);
        this.btnLeftSprite.loadImage('./assets/sprites/buttons/to_left_off.png');
        this.btnLeft = new GameObject(this.btnLeftSprite, new Position(this.position.X + 10, this.position.Y + 50));
        this.btnRightSprite = new Sprite(32, 32);
        this.btnRightSprite.loadImage('./assets/sprites/buttons/to_right_off.png');
        this.btnRight = new GameObject(this.btnRightSprite, new Position(this.engine.screenSize().width - 50, this.position.Y + 50));
    }

    display(elapsedTime) {
        if (this.isMoving || this.isOpen) {
            this.engine.drawer.rectangle(this.position, new Size(this.engine.screenSize().width - 10, 300), true, 5, 'white');
            this.engine.drawer.rectangle(this.position, new Size(this.engine.screenSize().width - 10, 300), false, 10, 'crimson');
            this.engine.drawer.text(`Solde: $${this.currentPlayer.solde}                                                       Name: ${this.currentPlayer.name}`, new Position(this.position.X + 50, this.position.Y + 30), 18, 'Arial');
            let i = 0;
            for (var j = this.startIndex; j < this.properties.length; j++) {
                if (i > 6)
                    break;
                this.properties[j].position = new Position(this.position.X + ((this.cardSize.width + 10) * i) + 50, this.position.Y + 60);
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
            let property = new PropertyCard(player.getSortedTiles()[i], new Position(this.position.X + ((this.cardSize.width + 10) * i) + 50, this.position.Y + 60));
            this.properties.push(property);
        }
        this.currentPlayer = player;
    }

    movingButton() {
        if (this.properties.length > 6) {
            this.btnLeft.position = new Position(this.position.X + 10, this.position.Y + 130);
            this.btnRight.position = new Position(this.engine.screenSize().width - 50, this.position.Y + 130);
            if (this.startIndex > 0) {
                if (this.engine.mouseOnTopOf(this.btnLeft)) {
                    this.btnLeftSprite.loadImage('./assets/sprites/buttons/to_left_on.png');
                    if (this.engine.mouseClicked(MouseButton.LEFT))
                        this.toRight();
                } else {
                    this.btnLeftSprite.loadImage('./assets/sprites/buttons/to_left_off.png');
                }
                this.engine.drawer.gameObject(this.btnLeft);
            }

            if (this.startIndex <= 6) {
                if (this.engine.mouseOnTopOf(this.btnRight)) {
                    this.btnRightSprite.loadImage('./assets/sprites/buttons/to_right_on.png');
                    if (this.engine.mouseClicked(MouseButton.LEFT))
                        this.toLeft();
                } else {
                    this.btnRightSprite.loadImage('./assets/sprites/buttons/to_right_off.png');
                }
                this.engine.drawer.gameObject(this.btnRight);
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
        this.engine.drawer.rectangle(property.position, new Size(this.cardSize.width, this.cardSize.height), true, 10, 'white');
        this.engine.drawer.rectangle(property.position, new Size(this.cardSize.width, this.cardSize.height), false, 1, 'black');
        this.engine.drawer.rectangle(new Position(property.position.X + 10, property.position.Y + 10), new Size(this.cardSize.width - 20, this.cardSize.height - 20), false, 1, 'Gray');
        this.engine.drawer.rectangle(new Position(property.position.X + 15, property.position.Y + 15), new Size(this.cardSize.width - 30, 30), true, 5, property.tile.color);
        let tileWidth = this.engine.drawer.textWidth(property.tile.streetName, '12', 'Arial', 'bold');
        let fontSize = '12';
        if (tileWidth > 96 && tileWidth <= 120)
            fontSize = '9';
        else if (tileWidth > 120)
            fontSize = '8';
        this.engine.drawer.text('TITLE DEED', new Position(property.position.X + 85, property.position.Y + 28), 8, 'Arial', 'bold');
        this.engine.drawer.text(property.tile.streetName, new Position(property.position.X + 70, property.position.Y + 38), fontSize, 'Arial', 'bold');
        this.propertyText(property);
        this.utilsButtons(property);
    }

    utilsButtons(property) {
        if (property) {
            let btnMortgageSprite = new Sprite(64, 24);
            btnMortgageSprite.loadImage('./assets/sprites/buttons/small_mortgage_off.png');

            let btnBuildSprite = new Sprite(64, 24);
            btnBuildSprite.loadImage('./assets/sprites/buttons/build_off.png');

            let btnSellSprite = new Sprite(64, 24);
            btnSellSprite.loadImage('./assets/sprites/buttons/small_sell_off.png');

            let btnPaySprite = new Sprite(128, 32);
            btnPaySprite.loadImage('./assets/sprites/buttons/pay_mortgage_off.png');

            let btnMortgage = new GameObject(btnMortgageSprite, new Position(property.position.X + 30, property.position.Y + 180));
            let btnSell = new GameObject(btnSellSprite, new Position(property.position.X + 30, property.position.Y + 180));
            let btnBuild = new GameObject(btnBuildSprite, new Position(property.position.X + 110, property.position.Y + 180));
            let btnPay = new GameObject(btnPaySprite, new Position(property.position.X + 40, property.position.Y + 130));
            if (this.currentPlayer.name === this.game.currentPlayer.name && !this.game.currentPlayer.isCPU) {
                if (property.tile.numberHouses <= 0) {
                    if (this.currentPlayer.canMortgagaTile(property.tile)) {
                        if (this.engine.mouseOnTopOf(btnMortgage)) {
                            btnMortgageSprite.loadImage('./assets/sprites/buttons/small_mortgage_on.png');
                            if (this.engine.mouseClicked(MouseButton.LEFT)) {
                                if (this.currentPlayer.mortgageTileById(property.tile.id)) {
                                    this.messageBox.simple(`${property.tile.streetName} is Mortgage, you receive $${property.tile.getMortgageValue()}.`, function() { this.messageBox.remove(); }.bind(this), 500, 200);
                                }
                            }
                        } else {
                            btnMortgageSprite.loadImage('./assets/sprites/buttons/small_mortgage_off.png');
                        }
                        this.engine.drawer.gameObject(btnMortgage);
                    }
                    if (property.tile.mortgage) {
                        if (this.engine.mouseOnTopOf(btnPay)) {
                            btnPaySprite.loadImage('./assets/sprites/buttons/pay_mortgage_on.png');
                            if (this.engine.mouseClicked(MouseButton.LEFT)) {
                                if (this.currentPlayer.payMortgageTileById(property.tile.id)) {
                                    this.messageBox.simple(`${property.tile.streetName} is no more Mortgage, you payed $${property.tile.getMortgagePayement()}.`, function() { this.messageBox.remove(); }.bind(this), 500, 200);
                                }
                            }
                        } else {
                            btnPaySprite.loadImage('./assets/sprites/buttons/pay_mortgage_off.png');
                        }
                        this.engine.drawer.gameObject(btnPay);
                    }
                }

                if (!property.tile.mortgage && property.tile.type === TileType.LAND) {
                    if (this.currentPlayer.canBuildOnTile(property.tile)) {
                        if (this.engine.mouseOnTopOf(btnBuild)) {
                            btnBuildSprite.loadImage('./assets/sprites/buttons/build_on.png');
                            if (this.engine.mouseClicked(MouseButton.LEFT)) {
                                // build
                                if (this.currentPlayer.solde >= property.tile.houseContruction) {
                                    if (this.currentPlayer.buildHouse(property.tile.id)) {
                                        this.messageBox.simple(`You built another property on ${property.tile.streetName}.`, function() { this.messageBox.remove(); }.bind(this), 500, 200);
                                    } else {
                                        this.messageBox.simple(`You can't built another property on ${property.tile.streetName}.`, function() { this.messageBox.remove(); }.bind(this), 500, 200);
                                    }
                                }
                            }
                        } else {
                            btnBuildSprite.loadImage('./assets/sprites/buttons/build_off.png');
                        }
                        this.engine.drawer.gameObject(btnBuild);
                    }

                    if (property.tile.numberHouses > 0) {
                        if (this.engine.mouseOnTopOf(btnSell)) {
                            btnSellSprite.loadImage('./assets/sprites/buttons/small_sell_on.png');
                            if (this.engine.mouseClicked(MouseButton.LEFT)) {
                                // build
                                if (this.currentPlayer.solde >= property.tile.houseContruction) {
                                    if (this.currentPlayer.sellHouse(property.tile.id)) {
                                        this.messageBox.simple(`You built another property on ${property.tile.streetName}.`, function() { this.messageBox.remove(); }.bind(this), 500, 200);
                                    } else {
                                        this.messageBox.simple(`You can't built another property on ${property.tile.streetName}.`, function() { this.messageBox.remove(); }.bind(this), 500, 200);
                                    }
                                }
                            }
                        } else {
                            btnSellSprite.loadImage('./assets/sprites/buttons/small_sell_off.png');
                        }
                        this.engine.drawer.gameObject(btnSell);
                    }
                }
            } else {
                if (this.currentPlayer.solde >= (property.tile.purchaseValue * 3) && this.currentPlayer.canSellTile(this.game.currentPlayer, property.tile) && property.tile.numberHouses <= 0) {
                    let btnBuyeSprite = new Sprite(64, 24);
                    btnBuyeSprite.loadImage('./assets/sprites/buttons/small_buy_off.png');
                    let btnBuy = new GameObject(btnBuyeSprite, new Position(property.position.X + 30, property.position.Y + 180));
                    if (this.engine.mouseOnTopOf(btnBuy)) {
                        btnBuyeSprite.loadImage('./assets/sprites/buttons/small_buy_on.png');
                        if (this.engine.mouseClicked(MouseButton.LEFT)) {
                            let offer = new BuyingOffer(this.game.currentPlayer, property.tile);
                            this.currentPlayer.addOffer(offer);
                        }
                    } else {
                        btnBuyeSprite.loadImage('./assets/sprites/buttons/small_buy_off.png');
                    }
                    this.engine.drawer.gameObject(btnBuy);
                }
            }

        }
    }


    propertyText(property) {
        if (property.tile) {
            if (property.tile.canBuy) {
                if (!property.tile.mortgage) {
                    if (property.tile.type == TileType.LAND) {
                        this.engine.drawer.text(`RENT $${property.tile.houseRent}`, new Position(property.position.X + 85, property.position.Y + 60), 11, 'Arial');
                        for (var i = 0; i < 4; i++) {
                            this.engine.drawer.text(`with ${i+1} Houses                   $${(property.tile.houseRent * (i+1)) + ((i+1) * 15)}`, new Position(property.position.X + 25, property.position.Y + 65 + ((i + 1) * 12)), 11, 'Arial');
                        }
                        this.engine.drawer.text(`with HOTEL                   $${(property.tile.houseRent * 5) + (5 * 15)}`, new Position(property.position.X + 25, property.position.Y + 65 + (7 * 10)), 11, 'Arial');
                    } else if (property.tile.type == TileType.RAILROAD) {
                        this.engine.drawer.text(`RENT $${property.tile.houseRent}`, new Position(property.position.X + 55, property.position.Y + 60), 11, 'Arial');
                        for (var i = 0; i < 3; i++) {
                            this.engine.drawer.text(`if ${i+2} R.R.'s are owned     $${property.tile.houseRent * (i+2)}`, new Position(property.position.X + 25, property.position.Y + 65 + ((i + 1) * 10)), 11, 'Arial');
                        }
                    } else if (property.tile.type == TileType.COMPANY) {
                        this.engine.drawer.text('If one Utility is owned,', new Position(property.position.X + 40, property.position.Y + 65), 11, 'Arial');
                        this.engine.drawer.text('rent is 4 times amount', new Position(property.position.X + 40, property.position.Y + 75), 11, 'Arial');
                        this.engine.drawer.text('shown on dice.', new Position(property.position.X + 40, property.position.Y + 85), 9, 'Arial');
                        this.engine.drawer.text('If both Utilities are owned,', new Position(property.position.X + 40, property.position.Y + 105), 11, 'Arial');
                        this.engine.drawer.text('rent is 10 times amount', new Position(property.position.X + 40, property.position.Y + 115), 11, 'Arial');
                        this.engine.drawer.text('shown on dice.', new Position(property.position.X + 40, property.position.Y + 125), 11, 'Arial');
                    }

                    if (property.tile.type == TileType.LAND || property.tile.type == TileType.RAILROAD || property.tile.type == TileType.COMPANY) {
                        this.engine.drawer.text(`Moratge value                   $${parseInt((property.tile.purchaseValue /2))}`, new Position(property.position.X + 25, property.position.Y + 65 + (9 * 10)), 11, 'Arial');
                    }
                } else {
                    this.engine.drawer.text(`This property is mortgage.\nyou need to pay $${property.tile.getMortgagePayement()}`, new Position(property.position.X + 40, property.position.Y + 65), 11, 'Arial');
                }
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
            this.openButtonSprite.loadImage('./assets/sprites/buttons/hideCards.png');
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
            this.openButtonSprite.loadImage('./assets/sprites/buttons/viewCads.png');
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
        this.openButton.position = new Position(this.position.X + 10, this.position.Y - 55);
        if (this.engine.mouseOnTopOf(this.openButton)) {
            if (this.engine.mouseClicked(MouseButton.LEFT)) {
                if (!this.openBar && !this.isMoving && !this.isOpen)
                    this.openBar = true;
                else if (!this.closeBar && !this.isMoving && this.isOpen)
                    this.closeBar = true;

            }
        }
        if (this.openBar)
            this.open(elapsedTime);

        if (this.closeBar)
            this.close(elapsedTime);

        this.engine.drawer.gameObject(this.openButton);
    }
}