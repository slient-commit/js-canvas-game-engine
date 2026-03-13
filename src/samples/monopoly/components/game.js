class Game {
    constructor(engine, scene) {
        this.engine = engine;
        this.scene = scene;
        this.map = new Map(new Size(10, 10), engine, this);
        this.events = new GameEvent(this.engine, this);
        this.cpu = new CPU(this);
        this.movements = new Movement(this, this.cpu);
        this.moving = false;
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

        this.gameOver = false;
        this.winner = null;

        // Turn announcement
        this.turnAnnouncementTimer = 0;

        // Dice result
        this.lastDiceResult = '';

        // Player colors for visual identification
        this.playerColors = ['#44aaff', '#ff6644', '#44cc66'];
    }

    OnCreate() {
        this.map.OnCreate();

        var jeep = new Piece('./assets/sprites/simple_jeep.png', new Position(0, 0));
        jeep.cartesianPosition = new Position(10, 0);
        jeep.position = this.movements.isometricPosition(jeep.cartesianPosition, new Size(128, 64), new Point(
            this.movements.middlePosition().start.X,
            this.movements.middlePosition().start.Y
        ));
        var car = new Piece('./assets/sprites/simple_car.png', new Position(0, 0));
        car.cartesianPosition = new Position(10, 0);
        car.position = this.movements.isometricPosition(car.cartesianPosition, new Size(128, 64), new Point(
            this.movements.middlePosition().start.X,
            this.movements.middlePosition().start.Y
        ));
        var car2 = new Piece('./assets/sprites/simple_car.png', new Position(0, 0));
        car2.cartesianPosition = new Position(10, 0);
        car2.position = this.movements.isometricPosition(car2.cartesianPosition, new Size(128, 64), new Point(
            this.movements.middlePosition().start.X,
            this.movements.middlePosition().start.Y
        ));

        var player1 = new Player('Player 1');
        player1.piece = jeep;
        jeep.owner = player1;
        this.players.push(player1);

        var player2 = new Player('CPU Alpha');
        player2.piece = car;
        player2.isCPU = true;
        car.owner = player2;
        this.players.push(player2);

        var player3 = new Player('CPU Beta');
        player3.piece = car2;
        player3.isCPU = true;
        car2.owner = player3;
        this.players.push(player3);

        if (this.engine.playMusic)
            this.backgroundMusic.play();

        this.initDices();

        // --- UILayer HUD ---
        this.setupHUD();

        this.giveTurn();
    }

    setupHUD() {
        var sw = this.engine.screenSize().width;
        var sh = this.engine.screenSize().height;
        var self = this;

        this.uiLayer = new UILayer("gameHUD");
        this.scene.registerLayer(this.uiLayer);

        // Top-right info panel
        this.hudPanel = new UIPanel(new Position(sw - 215, 5), new Size(210, 75), {
            fillColor: 'rgba(10, 10, 30, 0.85)',
            borderColor: '#ff8844',
            borderWidth: 1
        });
        this.uiLayer.registerElement(this.hudPanel);

        this.hudPlayerLabel = new UILabel('Player 1', new Position(sw - 205, 25), {
            fontSize: 13, fontStyle: 'bold', color: '#44aaff'
        });
        this.uiLayer.registerElement(this.hudPlayerLabel);

        this.hudMoneyLabel = new UILabel('$1500', new Position(sw - 205, 45), {
            fontSize: 12, color: '#66cc88'
        });
        this.uiLayer.registerElement(this.hudMoneyLabel);

        this.hudPropsLabel = new UILabel('Properties: 0', new Position(sw - 205, 62), {
            fontSize: 10, color: '#778899'
        });
        this.uiLayer.registerElement(this.hudPropsLabel);

        // Dice result label (centered top)
        this.diceResultLabel = new UILabel('', new Position(sw / 2 - 50, 15), {
            fontSize: 14, fontStyle: 'bold', color: '#ffcc44'
        });
        this.uiLayer.registerElement(this.diceResultLabel);

        // Turn announcement (centered)
        this.turnLabel = new UILabel('', new Position(sw / 2 - 60, sh / 2 - 100), {
            fontSize: 18, fontStyle: 'bold', color: '#ff8844'
        });
        this.uiLayer.registerElement(this.turnLabel);

        // Throw button
        this.throwBtn = new UIButton(new Position(sw / 2 - 65, 160), new Size(130, 40), {
            normalColor: '#1a3a6a',
            hoverColor: '#2a5a8a',
            pressedColor: '#0f2a4a',
            label: 'Throw Dice',
            fontSize: 13,
            fontColor: 'white',
            onClick: function() {
                if (!self.isDicesThrowing && self.canThrow && !self.lockNeedMoney && !self.messageBox.isOpen) {
                    if (self.engine.sfx) self.clickSound.play();
                    self.isDicesThrowing = true;
                    self.canThrow = false;
                }
            }
        });
        this.uiLayer.registerElement(this.throwBtn);

        // End Turn button
        this.endBtn = new UIButton(new Position(sw / 2 - 65, 210), new Size(130, 40), {
            normalColor: '#5c1a1a',
            hoverColor: '#7a2a2a',
            pressedColor: '#3a0f0f',
            label: 'End Turn',
            fontSize: 13,
            fontColor: 'white',
            onClick: function() {
                if (!self.isDicesThrowing && !self.canThrow && self.canEnd && !self.lockNeedMoney && !self.messageBox.isOpen) {
                    if (self.engine.sfx) self.clickSound.play();
                    self.endTurn();
                }
            }
        });
        this.uiLayer.registerElement(this.endBtn);

        // Instructions
        this.uiLayer.registerElement(new UILabel(
            'View Cards: bottom bar  |  Click players: left sidebar',
            new Position(15, sh - 12), {
                fontSize: 9, color: 'rgba(255,255,255,0.25)'
            }
        ));
    }

    OnUpdate(elapsedTime) {
        var drawer = this.engine.drawer;
        var sw = this.engine.screenSize().width;
        var sh = this.engine.screenSize().height;

        // Dark background
        drawer.clearWithColor('#0e0e1a');

        // Game over screen
        if (this.gameOver) {
            this.drawGameOver(drawer, sw, sh);
            return true;
        }

        this.map.OnUpdate(elapsedTime);
        this.drawPieces();

        if (this.currentPlayer.isCPU || this.last_round_had_double) {
            this.cpu.makeDecision();
        }

        // Draw Dices
        for (var d = 0; d < 2; d++) {
            if (this.dices[d]) {
                this.dices[d].position = this.movements.isometricPosition(this.dices[d].location, new Size(128, 64), new Point(
                    this.movements.middlePosition().start.X,
                    this.movements.middlePosition().start.Y
                ));
                this.engine.drawer.gameObject(this.dices[d]);
            }
        }

        // Update HUD button visibility
        this.throwBtn.showIt = this.canThrow && !this.lockNeedMoney && !this.messageBox.isOpen && !this.currentPlayer.isCPU;
        this.endBtn.showIt = !this.canThrow && this.canEnd && !this.lockNeedMoney && !this.messageBox.isOpen && !this.currentPlayer.isCPU;

        // Update HUD labels
        var pIdx = this.players.indexOf(this.currentPlayer);
        var pColor = this.playerColors[pIdx] || '#ffffff';
        this.hudPlayerLabel.color = pColor;
        this.hudPlayerLabel.setText(this.currentPlayer.name + (this.currentPlayer.isCPU ? ' (CPU)' : ''));
        this.hudMoneyLabel.setText('$' + this.currentPlayer.solde);
        this.hudPropsLabel.setText('Properties: ' + this.currentPlayer.tiles.length);

        // Dice result display
        this.diceResultLabel.setText(this.lastDiceResult);

        // Turn announcement fade
        if (this.turnAnnouncementTimer > 0) {
            this.turnAnnouncementTimer -= elapsedTime;
            this.turnLabel.opacity = Math.min(1, this.turnAnnouncementTimer / 0.5);
            if (this.turnAnnouncementTimer <= 0) {
                this.turnLabel.setText('');
                this.turnLabel.opacity = 1;
            }
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

        return true;
    }

    drawGameOver(drawer, sw, sh) {
        drawer.clearWithColor('#0a0a14');
        var ctx = drawer.ctx;
        ctx.save();
        var glow = ctx.createRadialGradient(sw / 2, sh / 2, 50, sw / 2, sh / 2, sw * 0.4);
        glow.addColorStop(0, 'rgba(255, 136, 68, 0.1)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, sw, sh);
        ctx.restore();

        drawer.rectangle(new Vec2(sw / 2 - 200, sh / 2 - 80), new Size(400, 160), true, 1, 'rgba(10,10,30,0.9)');
        drawer.rectangle(new Vec2(sw / 2 - 200, sh / 2 - 80), new Size(400, 160), false, 2, '#ff8844');
        drawer.text('GAME OVER', new Vec2(sw / 2 - 70, sh / 2 - 40), 24, 'monospace', 'bold', '#ff8844');

        if (this.winner) {
            drawer.text(this.winner.name + ' Wins!', new Vec2(sw / 2 - 65, sh / 2), 18, 'monospace', 'bold', '#66cc88');
            drawer.text('Final balance: $' + this.winner.solde, new Vec2(sw / 2 - 80, sh / 2 + 30), 13, 'monospace', 'normal', '#aabbcc');
            drawer.text('Properties: ' + this.winner.tiles.length, new Vec2(sw / 2 - 55, sh / 2 + 50), 13, 'monospace', 'normal', '#778899');
        }
    }

    initDices() {
        var dice1 = new Dice(new Position(7, 4), 'dice 1');
        var dice2 = new Dice(new Position(7, 5), 'dice 2');
        this.dices.push(dice1);
        this.dices.push(dice2);
    }

    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    throwDices() {
        this.totalSteps = 0;
        if (this.dices[0].isStoped && this.dices[0].selectedNumber > 0 &&
            this.dices[1].isStoped && this.dices[1].selectedNumber > 0 &&
            this.isDicesThrowing) {
            this.isDicesThrowing = false;
            var d1 = this.dices[0].selectedNumber;
            var d2 = this.dices[1].selectedNumber;
            var double = d1 == d2;
            this.cpu.isDouble = double;
            this.last_round_had_double = double;

            this.totalSteps = d1 + d2;
            this.lastDiceResult = 'Rolled: ' + d1 + ' + ' + d2 + ' = ' + this.totalSteps + (double ? '  DOUBLE!' : '');
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
                    this.messageBox.simple('You are going to Jail, you had 3 doubles in a row.', function() { this.messageBox.remove(); }.bind(this), this.currentPlayer.isCPU, 400, 200).deleteAfter(4);
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

    checkPieceCurrentTile(piece, double) {
        double = double || false;
        var currentTile = this.map.tiles.filter(function(tile) {
            return (tile.position.X == piece.cartesianPosition.X && tile.position.Y == piece.cartesianPosition.Y);
        })[0];

        if (currentTile) {
            if (currentTile.type === TileType.GO) {
                this.currentPlayer.solde += 200;
                this.checkForDouble(double);
            } else if (currentTile.type === TileType.GOTOJAIL) {
                this.events.goToJail(piece);
                this.messageBox.simple('You going to jail!!!', function() { this.messageBox.remove(); }.bind(this), piece.owner.isCPU).deleteAfter(4);
            } else if (currentTile.type === TileType.LAND || currentTile.type === TileType.RAILROAD || currentTile.type === TileType.COMPANY) {
                if (currentTile.owner) {
                    if (this.currentPlayer.name !== currentTile.owner.name) {
                        if (!currentTile.mortgage) {
                            if (this.currentPlayer.solde >= currentTile.getRent()) {
                                this.events.payRent(currentTile);
                                this.messageBox.simple('You paid $' + currentTile.getRent() + ' rent to ' + currentTile.owner.name, function() {
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
                        var message = 'Buy ' + currentTile.streetName + ' for $' + currentTile.purchaseValue + '?\nRent: $' + currentTile.houseRent + '  |  Mortgage: $' + parseInt(currentTile.purchaseValue / 2);
                        var button1 = {
                            label: 'Buy',
                            color: '#1a5c2a',
                            hoverColor: '#2a7a3e',
                            callback: function() {
                                this.events.buyBlankLand(currentTile);
                                this.messageBox.remove();
                                this.checkForDouble(double);
                            }.bind(this)
                        };
                        if (this.currentPlayer.solde < currentTile.purchaseValue) {
                            button1 = null;
                            message = 'You can\'t afford this property...';
                            this.needMoney({ action: 'buyEmpty', tile: currentTile, value: currentTile.purchaseValue, required: false }, double);
                        } else {
                            this.messageBox.custom(message, button1, {
                                label: 'Pass',
                                color: '#5c1a1a',
                                hoverColor: '#7a2a2a',
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
                    this.messageBox.simple('You paid $' + currentTile.purchaseValue + ' in taxes', function() {
                        this.checkForDouble(double);
                        this.messageBox.remove();
                    }.bind(this), piece.owner.isCPU);
                    this.checkForDouble(double);
                } else {
                    this.needMoney({ action: 'tax', tile: currentTile, value: currentTile.purchaseValue, required: true }, double);
                }
            }
        }
    }

    needMoney(objectAction, double) {
        double = double || false;
        var required = objectAction.required ? objectAction.required : false;
        var button2 = {
            label: 'Skip',
            color: '#5c1a1a',
            hoverColor: '#7a2a2a',
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
            this.messageBox.custom('You need more money!\nSell or mortgage properties.', {
                label: 'Manage',
                color: '#8b5a00',
                hoverColor: '#b37400',
                callback: function() {
                    this.lockNeedMoney = true;
                    this.afterGotMoneyObject = objectAction;
                    this.checkForDouble(double);
                    this.messageBox.remove();
                }.bind(this)
            }, button2, this.currentPlayer.isCPU);
        } else {
            if (required) {
                this.messageBox.simple('You don\'t have enough money or properties.\nYou are Bankrupt!', function() {
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

    verifyBuyingOffers() {
        for (var i = 0; i < this.currentPlayer.myOffers.length; i++) {
            var offer = this.currentPlayer.myOffers[i];
            var offerTile = offer.tile;
            var buyer = this.currentPlayer.myOffers[i].buyer;
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
                    this.messageBox.custom(buyer.name + ' wants to buy ' + offerTile.streetName + ' for $' + (offerTile.purchaseValue * 2) + '. Sell?', {
                        label: 'Sell',
                        color: '#1a5c2a',
                        hoverColor: '#2a7a3e',
                        callback: function() {
                            this.buyPropety(buyer, offer);
                        }.bind(this)
                    }, {
                        label: 'Decline',
                        color: '#5c1a1a',
                        hoverColor: '#7a2a2a',
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
        var offerTile = offer.tile;
        this.currentPlayer.tiles = this.currentPlayer.tiles.filter(function(tile) {
            return tile.id != offerTile.id;
        });
        offerTile.owner = buyer;
        buyer.tiles.push(offerTile);
        buyer.solde -= offerTile.purchaseValue * 3;
        this.currentPlayer.solde += offerTile.purchaseValue * 3;
        this.messageBox.remove();
    }

    checkForDouble(double) {
        if (double) {
            if (this.doubleCount < 3) {
                this.messageBox.simple('You have a double!', function() { this.messageBox.remove(); }.bind(this), this.currentPlayer.isCPU);
                if (this.engine.sfx)
                    this.payedSound.play();
                this.canEnd = false;
                this.canThrow = true;
                this.cpu.play();
            } else {
                this.messageBox.simple('You going to jail!!!', function() { this.messageBox.remove(); }.bind(this), this.currentPlayer.isCPU);
                this.events.goToJail(this.currentPlayer.piece);
            }
        }
    }

    getCard(type, double) {
        type = type || 'chance';
        double = double || false;
        this.cards.setPlayer(this.currentPlayer);
        var _cards = this.cards.getCards();
        var typeCards = _cards.filter(function(card) {
            return card.type === type;
        });
        var index = parseInt(this.getRandomArbitrary(0, typeCards.length));
        this.messageBox.simple(typeCards[index].text, function() {
            if (typeCards[index].action())
                this.messageBox.remove();
            this.checkForDouble(double);
        }.bind(this), this.currentPlayer.isCPU);
    }

    checkForNeedingMoney() {
        if (this.lockNeedMoney) {
            if (this.currentPlayer.solde >= this.afterGotMoneyObject.value) {
                if (this.shortOnMoney) {
                    this.messageBox.simple('Balance: $' + this.currentPlayer.solde + ' — you can pay now!', function() {
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

    drawPieces() {
        for (var i = 0; i < this.players.length; i++) {
            this.engine.drawer.gameObject(this.players[i].piece);
        }
    }

    giveTurn() {
        if (this.players.length > 0) {
            // Win detection
            if (this.players.length === 1) {
                this.gameOver = true;
                this.winner = this.players[0];
                return true;
            }

            this.last_round_had_double = false;
            if (this.currentPlayerIndex == -1) {
                this.currentPlayerIndex = 0;
                this.currentPlayer = this.players[this.currentPlayerIndex];
                this.bottomBar.setPlayer(this.currentPlayer);
                this.cards.setPlayer(this.currentPlayer);
                this.showTurnAnnouncement();
                return true;
            }
            if (this.currentPlayerIndex + 1 < this.players.length) {
                this.currentPlayerIndex++;
                this.currentPlayer = this.players[this.currentPlayerIndex];
                this.cards.setPlayer(this.currentPlayer);
                this.bottomBar.setPlayer(this.currentPlayer);
                this.showTurnAnnouncement();
                return true;
            }

            this.currentPlayerIndex = 0;
            this.currentPlayer = this.players[this.currentPlayerIndex];
            this.cards.setPlayer(this.currentPlayer);
            this.bottomBar.setPlayer(this.currentPlayer);
            this.showTurnAnnouncement();
            return true;
        }
    }

    showTurnAnnouncement() {
        this.turnAnnouncementTimer = 2.0;
        this.turnLabel.setText(this.currentPlayer.name + "'s Turn");
        var pIdx = this.players.indexOf(this.currentPlayer);
        this.turnLabel.color = this.playerColors[pIdx] || '#ff8844';
        this.lastDiceResult = '';
    }

    endTurn() {
        this.sidePlayers.viewedPlayer = null;
        this.cpu.reset();
        this.giveTurn();
        if (this.gameOver) return;
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

    bailOut() {
        if (this.currentPlayer.solde >= 50) {
            this.messageBox.custom('Pay $50 bail to get out of jail?', {
                label: 'Pay $50',
                color: '#1a5c2a',
                hoverColor: '#2a7a3e',
                callback: function() {
                    this.payBailOut();
                    this.messageBox.remove();
                }.bind(this)
            }, {
                label: 'Stay',
                color: '#5c1a1a',
                hoverColor: '#7a2a2a',
                callback: function() {
                    this.messageBox.remove();
                }.bind(this)
            }, this.currentPlayer.isCPU);
        } else {
            this.needMoney({ action: 'jail', value: 50 });
        }
    }

    payBailOut() {
        this.currentPlayer.solde -= 50;
        this.currentPlayer.inJail = false;
        this.currentPlayer.doubleCount = 0;
    }

    playSirenAnimation() {
        if (this.canPlaySirenAnimation) {
            this.sirenAnimation.update();
            this.engine.drawer.spriteSheet(this.sirenAnimation, new Position((this.engine.screenSize().width / 2) - 400, (this.engine.screenSize().height / 2) - 75));
        }
    }
}
