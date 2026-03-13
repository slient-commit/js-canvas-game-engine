class Game {
    constructor(engine) {
        this.map = new Map(new Size(10, 10), engine, this);
        this.events = new GameEvent(this.engine, this);
        this.cpu = new CPU(this);
        this.movements = new Movement(this, this.cpu);
        this.moving = false;
        this.engine = engine;
        this.players = [];
        this.currentPlayer = null;
        this.currentPlayerIndex = -1;
        this.dices = [];
        this.totalSteps = 0;
        this.isDicesThrowing = false;
        this.canThrow = true;
        this.canEnd = false;
        this.doubleCount = 0;
        this.last_round_had_double = false;

        this.sirenAnimation = new SpriteSheet('siren', 800, 150, 20, 0, 2, './assets/sprites/siren.png', false);
        this.canPlaySirenAnimation = false;

        this.messageBox = new MessageBox(this.engine, this);

        this.bottomBar = new BottomBar(this.engine, this.messageBox, this);

        this.cards = new Cards(this);
        this.sidePlayers = new PlayerSideBar(this.engine, this);

        this.lastStep = 0.5;
        this.timeBetweenSteps = 0.1;

        this.throwButtonSprite = new Sprite(200, 50);
        this.throwButtonSprite.loadImage('./assets/sprites/buttons/throw_off.png');
        this.throwButton = new GameObject(this.throwButtonSprite, new Position((this.engine.screenSize().width / 2) - 80, 180));

        this.endButtonSprite = new Sprite(200, 50);
        this.endButtonSprite.loadImage('./assets/sprites/buttons/end_turn_off.png');
        this.endTurnButton = new GameObject(this.endButtonSprite, new Position((this.engine.screenSize().width / 2) - 80, 280));

        this.lockNeedMoney = false;
        this.shortOnMoney = false;
        this.afterGotMoneyObject = { action: 'rent', value: 50 };

        this.clickSound = new Sound('./assets/audio/click.mp3', 80);
        this.dicesSound = new Sound('./assets/audio/dices.mp3', 80);
        this.notifSound = new Sound('./assets/audio/notif.wav', 10);
        this.payedSound = new Sound('./assets/audio/payed.wav', 80);
        this.jailSound = new Sound('./assets/audio/jail.mp3', 30);
        this.failedSound = new Sound('./assets/audio/failed.mp3', 10);
        this.backgroundMusic = new Sound('./assets/audio/background.mp3', 6, true);

        this.loadingSprite = new SpriteSheet('loading', 128, 128, 35, 0, 9, './assets/sprites/loading.png', true, function() {
            this.displayLoading = false;
        }.bind(this));
        this.displayLoading = true;
    }

    OnCreate() {
        this.map.OnCreate();
        let jeep = new Piece('./assets/sprites/simple_jeep.png', new Position(0, 0));
        jeep.cartesianPosition = new Position(10, 0);
        jeep.position = this.movements.isometricPosition(jeep.cartesianPosition, new Size(128, 64), new Point(
            this.movements.middlePosition().start.X,
            this.movements.middlePosition().start.Y,
        ));
        let car = new Piece('./assets/sprites/simple_car.png', new Position(0, 0));
        car.cartesianPosition = new Position(10, 0);
        car.position = this.movements.isometricPosition(car.cartesianPosition, new Size(128, 64), new Point(
            this.movements.middlePosition().start.X,
            this.movements.middlePosition().start.Y,
        ));

        let car2 = new Piece('./assets/sprites/simple_car.png', new Position(0, 0));
        car2.cartesianPosition = new Position(10, 0);
        car2.position = this.movements.isometricPosition(car2.cartesianPosition, new Size(128, 64), new Point(
            this.movements.middlePosition().start.X,
            this.movements.middlePosition().start.Y,
        ));

        let player1 = new Player('Player_1');
        player1.piece = jeep;
        jeep.owner = player1;
        this.players.push(player1);

        let player2 = new Player('Player_2');
        player2.piece = car;
        player2.isCPU = true;
        car.owner = player2;
        this.players.push(player2);

        let player3 = new Player('Player_3');
        player3.piece = car2;
        player3.isCPU = true;
        car2.owner = player3;

        this.players.push(player3);
        if (this.engine.playMusic)
            this.backgroundMusic.play();
        this.initDices();
        this.giveTurn();
    }

    OnUpdate(elapsedTime) {
        if (this.displayLoading) {
            this.showLoading();
            return true;
        }

        this.map.OnUpdate(elapsedTime);
        // this.engine.drawer.gradient(new Position(0, 0), this.engine.screenSize(), new Point(0, 0), new Point(0, this.engine.screenSize().height - 100), '#757F9A', '#D7DDE8');
        this.drawPieces();

        if (this.currentPlayer.isCPU || this.last_round_had_double) {
            this.cpu.makeDecision();
        }

        // Draw Dices
        for (var d = 0; d < 2; d++) {
            if (this.dices[d]) {
                this.dices[d].position = this.movements.isometricPosition(this.dices[d].location, new Size(128, 64), new Point(
                    this.movements.middlePosition().start.X,
                    this.movements.middlePosition().start.Y,
                ));
                this.engine.drawer.gameObject(this.dices[d]);
            }
        }

        // Draw Throw button
        if (this.canThrow && !this.lockNeedMoney && !this.messageBox.isOpen) {
            if (this.engine.mouseOnTopOf(this.throwButton)) {
                this.throwButtonSprite.loadImage('./assets/sprites/buttons/throw_on.png');
                if (this.engine.mouseClicked(MouseButton.LEFT) && !this.isDicesThrowing && this.canThrow) {
                    if (this.engine.sfx)
                        this.clickSound.play();
                    this.isDicesThrowing = true;
                    this.canThrow = false;
                }

            } else
                this.throwButtonSprite.loadImage('./assets/sprites/buttons/throw_off.png');
            this.engine.drawer.gameObject(this.throwButton);
        } else if (!this.canThrow && this.canEnd && !this.lockNeedMoney && !this.messageBox.isOpen) {
            if (this.engine.mouseOnTopOf(this.endTurnButton)) {
                this.endButtonSprite.loadImage('./assets/sprites/buttons/end_turn_on.png');
                if (this.engine.mouseClicked(MouseButton.LEFT) && !this.isDicesThrowing && !this.canThrow) {
                    if (this.engine.sfx)
                        this.clickSound.play();
                    this.endTurn();
                }

            } else
                this.endButtonSprite.loadImage('./assets/sprites/buttons/end_turn_off.png');
            this.engine.drawer.gameObject(this.endTurnButton);
        }

        if (this.currentPlayer.piece.moving) {
            this.canEnd = false;
            this.currentPlayer.piece.geoAnimation.animate(elapsedTime);
        } else {
            this.canEnd = true;
        }

        if (this.isDicesThrowing) {
            this.throwDices();
        }

        if (this.lockNeedMoney) {
            this.checkForNeedingMoney();
        }

        if (this.sidePlayers.viewedPlayer) {
            this.bottomBar.setPlayer(this.sidePlayers.viewedPlayer);

        } else {
            this.bottomBar.setPlayer(this.currentPlayer);
        }
        this.bottomBar.display(elapsedTime);
        this.sidePlayers.display(elapsedTime);
        this.playSirenAnimation();
        if (this.messageBox)
            this.messageBox.draw();
    }

    /**
     * Init Dices positions and sprites
     */
    initDices() {
        let dice1 = new Dice(new Position(7, 4), 'dice 1');
        let dice2 = new Dice(new Position(7, 5), 'dice 2');
        this.dices.push(dice1);
        this.dices.push(dice2);
    }

    /**
     * Get a random int
     */
    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Throw the dices and check the events like double
     * @returns {Boolean}
     */
    throwDices() {
        this.totalSteps = 0;
        if (this.dices[0].isStoped && this.dices[0].selectedNumber > 0 &&
            this.dices[1].isStoped && this.dices[1].selectedNumber > 0 &&
            this.isDicesThrowing) {
            this.isDicesThrowing = false;
            let double = this.dices[0].selectedNumber == this.dices[1].selectedNumber;
            this.cpu.isDouble = double;
            this.last_round_had_double = double;

            this.totalSteps = this.dices[0].selectedNumber + this.dices[1].selectedNumber;
            this.dices[0].selectedNumber = -1;
            this.dices[1].selectedNumber = -1;
            this.canThrow = false;
            if (this.currentPlayer.inJail) {
                if (double || this.currentPlayer.doubleCount >= 3) {
                    this.currentPlayer.inJail = false;
                    this.currentPlayer.doubleCount = 0;
                    this.movements.movePiece(this.currentPlayer.piece, this.totalSteps, true, double);
                } else {
                    this.currentPlayer.doubleCount++;
                    this.canEnd = true;
                    return true;
                }
            }
            if (double) {
                if (this.doubleCount < 3) {
                    this.doubleCount++;
                } else {
                    this.messageBox.simple(`You are going to Jail, you had 3 doubles in a row.`, function() { this.messageBox.remove(); }.bind(this), this.currentPlayer.isCPU, 400, 200).deleteAfter(4);
                    this.events.goToJail(this.currentPlayer.piece);
                    return true;
                }
            } else
                this.doubleCount = 0;
            this.movements.movePiece(this.currentPlayer.piece, this.totalSteps, true, double);
            return true;
        }
        if (this.engine.sfx)
            this.dicesSound.play();
        for (var d = 0; d < 2; d++) {
            if (this.dices[d].isStoped && this.dices[d].selectedNumber < 0)
                this.dices[d].throwDice();
        }
    }

    /**
     * Check the current tile type and throw the correct event
     * @param {Piece} piece 
     * @param {Boolean} double 
     */
    checkPieceCurrentTile(piece, double = false) {
        let currentTile = this.map.tiles.filter(tile => {
            return (tile.position.X == piece.cartesianPosition.X && tile.position.Y == piece.cartesianPosition.Y);
        })[0];

        if (currentTile) {
            if (currentTile.type === TileType.GO) {
                this.currentPlayer.solde += 200;
                this.checkForDouble(double);
            } else if (currentTile.type === TileType.GOTOJAIL) {
                this.events.goToJail(piece);
                this.messageBox.simple(`You going to jail!!!`, function() { this.messageBox.remove(); }.bind(this), piece.owner.isCPU).deleteAfter(4);
            } else if (currentTile.type === TileType.LAND || currentTile.type === TileType.RAILROAD || currentTile.type === TileType.COMPANY) {
                if (currentTile.owner) {
                    if (this.currentPlayer.name !== currentTile.owner.name) {
                        if (!currentTile.mortgage) {
                            if (this.currentPlayer.solde >= currentTile.getRent()) {
                                this.events.payRent(currentTile);
                                this.messageBox.simple(`You paid $${currentTile.getRent()} rent to ${currentTile.owner.name}`, function() {
                                    this.checkForDouble(double);
                                    this.messageBox.remove();
                                }.bind(this), piece.owner.isCPU);
                            } else {
                                this.needMoney({ action: 'rent', tile: currentTile, value: currentTile.getRent(), required: true }, double);
                            }
                        }
                    }
                } else {
                    if (this.currentPlayer.isCPU) {
                        this.cpu.property(currentTile, double);
                    } else {
                        let message = `Do you want to buy ${currentTile.streetName} for $${currentTile.purchaseValue}?\nRent Value: $${currentTile.houseRent}\nMoratge Value: $${currentTile.purchaseValue / 2}`;
                        let button1 = {
                            imageOn: './assets/sprites/buttons/yes_on.png',
                            imageOff: './assets/sprites/buttons/yes_off.png',
                            callback: function() {
                                this.events.buyBlankLand(currentTile);
                                this.messageBox.remove();
                                this.checkForDouble(double);
                            }.bind(this)
                        };
                        if (this.currentPlayer.solde < currentTile.purchaseValue) {
                            button1 = null;
                            message = 'You can\'t buy this property...';
                            this.needMoney({ action: 'buyEmpty', tile: currentTile, value: currentTile.purchaseValue, required: false }, double);
                        } else {

                            this.messageBox.custom(message, button1, {
                                imageOn: './assets/sprites/buttons/no_on.png',
                                imageOff: './assets/sprites/buttons/no_off.png',
                                callback: function() {
                                    this.messageBox.remove();
                                    this.checkForDouble(double);
                                }.bind(this)
                            }, piece.owner.isCPU);
                        }
                    }
                }
            } else if (currentTile.type == TileType.CHANCE) {
                this.getCard('chance', double);
                this.checkForDouble(double);
            } else if (currentTile.type == TileType.COMMUNITY) {
                this.getCard('chest', double);
                this.checkForDouble(double);
            } else if (currentTile.type == TileType.TAX) {
                if (this.currentPlayer.solde >= currentTile.purchaseValue) {
                    this.events.payTax(currentTile);
                    this.messageBox.simple(`You paid $${currentTile.purchaseValue} on taxes`, function() {
                        this.checkForDouble(double);
                        this.messageBox.remove();
                    }.bind(this), piece.owner.isCPU);
                    this.checkForDouble(double);
                } else {
                    // need more money
                    this.needMoney({ action: 'tax', tile: currentTile, value: currentTile.purchaseValue, required: true }, double);
                }
            }
        }

    }

    /**
     * When the player dont have more money to pay the required amount, when throw sell event or bankrupt event
     * @param {Object} objectAction 
     * @param {Boolean} double 
     */
    needMoney(objectAction, double = false) {
        let required = objectAction.required ? objectAction.required : false;
        let button2 = {
            imageOn: './assets/sprites/buttons/no_on.png',
            imageOff: './assets/sprites/buttons/no_off.png',
            callback: function() {
                this.checkForDouble(double);
                this.messageBox.remove();
            }.bind(this)
        };

        if (required) { button2 = null; }
        if (this.currentPlayer.totalValueForNeedingMoney() >= objectAction.value) {
            this.shortOnMoney = true;
            if (this.engine.sfx)
                this.notifSound.play();
            this.messageBox.custom('You need more money, sell or mortgage, your choice.', {
                imageOn: './assets/sprites/buttons/mortgage_on.png',
                imageOff: './assets/sprites/buttons/mortgage_off.png',
                callback: function() {
                    this.lockNeedMoney = true;
                    this.afterGotMoneyObject = objectAction;
                    this.checkForDouble(double);
                    this.messageBox.remove();
                }.bind(this)
            }, button2, this.currentPlayer.isCPU);
        } else {
            if (required) {
                this.messageBox.simple('You need more money, but you don\'t have any more properties.\nYour are Bankrupt.', function() {
                    this.lockNeedMoney = false;
                    this.shortOnMoney = false;
                    this.events.bankrupt(objectAction);
                    this.messageBox.remove();
                }.bind(this), this.currentPlayer.isCPU, 550, 200);
            } else {
                this.checkForDouble(double);
            }
        }
    }

    /**
     * Check if there any buying requests
     */
    verifyBuyingOffers() {
        for (var i = 0; i < this.currentPlayer.myOffers.length; i++) {
            let offer = this.currentPlayer.myOffers[i];
            let offerTile = offer.tile;
            let buyer = this.currentPlayer.myOffers[i].buyer;
            if (offerTile.purchaseValue == undefined) {
                this.currentPlayer.clearOffers();
                return;
            }
            if (buyer.solde >= offerTile.purchaseValue * 2) {
                if (this.engine.sfx)
                    this.notifSound.play();
                if (this.currentPlayer.isCPU) {
                    if (this.cpu.verifySelling(buyer, offer)) {
                        this.buyPropety(buyer, offer);
                    }
                } else {
                    this.messageBox.custom(`${buyer.name} want to buy ${offerTile.streetName} for $${offerTile.purchaseValue * 2}, sell?`, {
                        imageOn: './assets/sprites/buttons/sell_on.png',
                        imageOff: './assets/sprites/buttons/sell_off.png',
                        callback: function() {
                            this.buyPropety(buyer, offer);
                        }.bind(this)
                    }, {
                        imageOn: './assets/sprites/buttons/no_on.png',
                        imageOff: './assets/sprites/buttons/no_off.png',
                        callback: function() {
                            this.messageBox.remove();
                        }.bind(this)
                    }, this.currentPlayer.isCPU);
                }
            }
        }

        this.currentPlayer.clearOffers();
    }

    buyPropety(buyer, offer) {
        let offerTile = offer.tile;
        this.currentPlayer.tiles = this.currentPlayer.tiles.filter(tile => {
            return tile.id != offerTile.id;
        });
        offerTile.owner = buyer;
        buyer.tiles.push(offerTile);
        buyer.solde -= offerTile.purchaseValue * 3;
        this.currentPlayer.solde += offerTile.purchaseValue * 3;
        this.messageBox.remove();
    }

    /**
     * Check if the player have a double dices, if more than 3, straight to jail
     * @param {Boolean} double 
     */
    checkForDouble(double) {
        if (double) {
            if (this.doubleCount < 3) {
                this.messageBox.simple(`You have a double`, function() { this.messageBox.remove(); }.bind(this), this.currentPlayer.isCPU);
                if (this.engine.sfx)
                    this.payedSound.play();
                this.canEnd = false;
                this.canThrow = true;
                this.cpu.play();
            } else {
                this.messageBox.simple(`You going to jail!!!`, function() { this.messageBox.remove(); }.bind(this), this.currentPlayer.isCPU);
                this.events.goToJail(this.currentPlayer.piece);
            }
        }
    }

    /**
     * Get a card for chance, or community chest
     * @param {String} type 
     * @param {Boolean} double 
     */
    getCard(type = 'chance', double = false) {
        this.cards.setPlayer(this.currentPlayer);
        let _cards = this.cards.getCards();
        let typeCards = _cards.filter(card => {
            return card.type === type;
        });
        let index = parseInt(this.getRandomArbitrary(0, typeCards.length));
        this.messageBox.simple(typeCards[index].text, function() {
            if (typeCards[index].action())
                this.messageBox.remove();
            this.checkForDouble(double);
        }.bind(this), this.currentPlayer.isCPU);
    }

    /**
     * If the player need money, after sell, this function throw if he have enough money
     */
    checkForNeedingMoney() {
        if (this.lockNeedMoney) {
            if (this.currentPlayer.solde >= this.afterGotMoneyObject.value) {
                if (this.shortOnMoney) {
                    this.messageBox.simple(`Now your solde is $${this.currentPlayer.solde}, you can pay Now!`, function() {
                        this.executeAfterShort(this.afterGotMoneyObject);
                        if (this.engine.sfx)
                            this.payedSound.play();
                        this.messageBox.remove();
                    }.bind(this), this.currentPlayer.isCPU, 400, 150);
                    this.shortOnMoney = false;
                }
            }
        }
    }

    /**
     * If the player have enough money after being short on money, this function throw the last event action
     * @param {Object} action 
     */
    executeAfterShort(action) {
        if (action) {
            switch (action.action) {
                case 'tax':
                    this.events.payTax(action.tile);
                    break;
                case 'rent':
                    this.events.payRent(action.tile);
                    break;
                case 'buyEmpty':
                    this.events.buyBlankLand(action.tile);
                    break;
                case 'jail':
                    this.bailOut();
                    break;
                case 'pay':
                    this.currentPlayer.solde -= action.value;
                    break;
            }
        }
        if (action.callback) {
            action.callback();
        }
        this.lockNeedMoney = false;
    }

    /**
     * Draw the pieces
     */
    drawPieces() {
        for (var i = 0; i < this.players.length; i++) {
            this.engine.drawer.gameObject(this.players[i].piece);
        }
    }

    /**
     * Give turn to the next player
     * @returns {Boolean}
     */
    giveTurn() {
        if (this.players.length > 0) {
            this.last_round_had_double = false;
            if (this.currentPlayerIndex == -1) {
                this.currentPlayerIndex = 0;
                this.currentPlayer = this.players[this.currentPlayerIndex];
                this.bottomBar.setPlayer(this.currentPlayer);
                this.cards.setPlayer(this.currentPlayer);
                return true;
            }
            if (this.currentPlayerIndex + 1 < this.players.length) {
                this.currentPlayerIndex++;
                this.currentPlayer = this.players[this.currentPlayerIndex];
                this.cards.setPlayer(this.currentPlayer);
                this.bottomBar.setPlayer(this.currentPlayer);
                return true;
            }

            this.currentPlayerIndex = 0;
            this.currentPlayer = this.players[this.currentPlayerIndex];
            this.cards.setPlayer(this.currentPlayer);
            this.bottomBar.setPlayer(this.currentPlayer);
            return true;
        }
    }

    /**
     * End current player turn
     */
    endTurn() {
        this.sidePlayers.viewedPlayer = null;
        this.cpu.reset();
        this.giveTurn();
        // check jail
        if (this.currentPlayer.inJail) {
            if (this.currentPlayer.isCPU) {
                this.cpu.bailOut();
            } else {
                this.bailOut();
            }
        }
        this.verifyBuyingOffers();
        this.canThrow = true;
    }

    /**
     * If the player want to pay the $50 to bailout
     */
    bailOut() {
        if (this.currentPlayer.solde >= 50) {
            this.messageBox.custom('Pay your Bail out of Jail?', {
                imageOn: './assets/sprites/buttons/yes_on.png',
                imageOff: './assets/sprites/buttons/yes_off.png',
                callback: function() {
                    this.payBailOut();
                    this.messageBox.remove();
                }.bind(this)
            }, {
                imageOn: './assets/sprites/buttons/no_on.png',
                imageOff: './assets/sprites/buttons/no_off.png',
                callback: function() {
                    this.messageBox.remove();
                }.bind(this)
            }, this.currentPlayer.isCPU);
        } else {
            this.needMoney({ action: 'jail', value: '50' });
        }
    }

    /**
     * Pay  50$ of bail out
     */
    payBailOut() {
        this.currentPlayer.solde -= 50;
        this.currentPlayer.inJail = false;
        this.currentPlayer.doubleCount = 0;
    }

    /**
     * Draw siren animation
     */
    playSirenAnimation() {
        if (this.canPlaySirenAnimation) {
            this.sirenAnimation.update();
            this.engine.drawer.spriteSheet(this.sirenAnimation, new Position((this.engine.screenSize().width / 2) - 400, (this.engine.screenSize().height / 2) - 75));
        }
    }

    showLoading() {
        this.engine.drawer.rectangle(new Position(0, 0), this.engine.screenSize(), true, 5, 'black', 0.3);
        this.engine.drawer.spriteSheet(this.loadingSprite, new Position((this.engine.screenSize().width / 2) - 64, (this.engine.screenSize().height / 2) - 64));
    }

}