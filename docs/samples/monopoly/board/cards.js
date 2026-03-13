class Cards {
    constructor(game) {
        this.player = null;
        this.cadrs = [];
        this.game = game;
        this.getCards();
    }

    setPlayer(player) {
        this.player = player;
    }

    getCards() {
        this.cadrs = [];
        let c1 = new Card('Advance to Go (Collect $200)', 'chance', this.game);
        c1.action = function() {
            this.game.movements.goToTile(this.game.currentPlayer.piece, new Position(10, 0));
            return true;
        }.bind(c1);
        c1.setPlayer(this.player);

        let c2 = new Card('Advance to Al Haouz Avenue. If you pass Go, collect $200', 'chance', this.game);
        c2.action = function() {
            this.game.movements.goToTile(this.game.currentPlayer.piece, new Position(10, 1));
            return true;
        }.bind(c2);
        c2.setPlayer(this.player);

        let c3 = new Card('Advance to Mernissa Street. If you pass Go, collect $200', 'chance', this.game);
        c3.action = function() {
            this.game.goToTile(this.game.currentPlayer.piece, new Position(0, 9));
            return true;
        }.bind(c3);
        c3.setPlayer(this.player);

        let c4 = new Card('Bank pays you dividend of $50', 'chance', this.game);
        c4.action = function() {
            this.game.currentPlayer.solde += 50;
            return true;
        }.bind(c4);
        c4.setPlayer(this.player);

        let c5 = new Card('Go Back 3 Spaces', 'chance', this.game);
        c5.action = function() {
            this.game.movements.movePiece(this.game.currentPlayer.piece, -3, true, false);
            return true;
        }.bind(c5);
        c5.setPlayer(this.player);

        let c6 = new Card('Go to Jail. Go directly to Jail, do not pass Go, do not collect $200', 'chance', this.game);
        c6.action = function() {
            this.game.events.goToJail(this.game.currentPlayer.piece);
            this.game.currentPlayer.inJail = true;
            this.game.doubleCount = 0;
            return true;
        }.bind(c6);
        c6.setPlayer(this.player);

        let c7 = new Card('Speeding fine $15', 'chance', this.game);
        c7.action = function() {
            if (this.player.solde >= 15) {
                this.game.failedSound.play();
                this.player.solde -= 15;
                return true;
            } else {
                this.game.needMoney({ action: 'pay', value: 15, required: true });
                return false;
            }
        }.bind(c7);
        c7.setPlayer(this.player);

        let c8 = new Card('You have been elected Chairman of the Board. Pay each player $50', 'chance', this.game);
        c8.action = function() {
            const players = this.game.players.length - 1;
            if (this.player.solde >= players * 50) {
                this.game.failedSound.play();
                this.player.solde -= players * 50;
                for (var i = 0; i < this.game.players.length; i++) {
                    if (this.game.players[i].name != this.game.currentPlayer.name) {
                        this.game.players[i].solde += 50;
                    }
                }
                return true;
            } else {
                this.game.needMoney({
                    action: 'pay',
                    value: players * 50,
                    required: true,
                    callback: function() {
                        for (var i = 0; i < this.game.players.length; i++) {
                            if (this.game.players[i].name != this.game.currentPlayer.name) {
                                this.game.players[i].solde += 50;
                            }
                        }
                    }.bind(c8)
                });
                return false;
            }
        }.bind(c8);
        c8.setPlayer(this.player);



        let s1 = new Card('Advance to Go (Collect $200)', 'chest', this.game);
        s1.action = function() {
            this.game.movements.goToTile(this.game.currentPlayer.piece, new Position(10, 0));
            return true;
        }.bind(s1);
        s1.setPlayer(this.player);

        let s2 = new Card('Bank error in your favor. Collect $200', 'chest', this.game);
        s2.action = function() {
            this.game.currentPlayer.solde += 200;
            return true;
        }.bind(s2);
        s2.setPlayer(this.player);

        let s3 = new Card('Doctor’s fee. Pay $50', 'chest', this.game);
        s3.action = function() {
            this.game.currentPlayer.solde -= 50;
            return true;
        }.bind(s3);
        s3.setPlayer(this.player);

        let s4 = new Card('From sale of stock you get $50', 'chest', this.game);
        s4.action = function() {
            this.game.currentPlayer.solde += 50;
            return true;
        }.bind(s4);
        s4.setPlayer(this.player);

        let s5 = new Card('Go to Jail. Go directly to Jail, do not pass Go, do not collect $200', 'chest', this.game);
        s5.action = function() {
            this.game.events.goToJail(this.game.currentPlayer.piece);
            this.game.currentPlayer.inJail = true;
            this.game.doubleCount = 0;
            return true;
        }.bind(s5);
        s5.setPlayer(this.player);

        let s6 = new Card('Holiday fund matures. Receive $100', 'chest', this.game);
        s6.action = function() {
            this.game.currentPlayer.solde += 100;
            return true;
        }.bind(s6);
        s6.setPlayer(this.player);

        let s7 = new Card('Income tax refund. Collect $20', 'chest', this.game);
        s7.action = function() {
            this.game.currentPlayer.solde += 20;
            return true;
        }.bind(s7);
        s7.setPlayer(this.player);

        let s8 = new Card('It is your birthday. Collect $10 from every player', 'chest', this.game);
        s8.action = function() {
            const players = this.game.players.length - 1;
            this.player.solde += players * 10;
            for (var i = 0; i < this.game.players.length; i++) {
                if (this.game.players[i].name != this.game.currentPlayer.name) {
                    this.game.players[i].solde -= 10;
                }
            }
            return true;
        }.bind(s8);
        s8.setPlayer(this.player);

        let s9 = new Card('Life insurance matures. Collect $100', 'chest', this.game);
        s9.action = function() {
            this.game.currentPlayer.solde += 100;
            return true;
        }.bind(s9);
        s9.setPlayer(this.player);

        let s10 = new Card('Pay hospital fees of $100', 'chest', this.game);
        s10.action = function() {
            if (this.player.solde >= 100) {
                this.game.failedSound.play();
                this.player.solde -= 100;
                return true;
            } else {
                this.game.needMoney({ action: 'pay', value: 100, required: true });
                return false;
            }
        }.bind(s10);
        s10.setPlayer(this.player);

        let s11 = new Card('Pay school fees of $50', 'chest', this.game);
        s11.action = function() {
            if (this.player.solde >= 50) {
                this.game.failedSound.play();
                this.player.solde -= 50;
                return true;
            } else {
                this.game.needMoney({ action: 'pay', value: 50, required: true });
                return false;
            }
        }.bind(s11);
        s11.setPlayer(this.player);

        let s12 = new Card('Receive $25 consultancy fee', 'chest', this.game);
        s12.action = function() {
            this.player.solde += 25;
            return true;
        }.bind(s12);
        s12.setPlayer(this.player);

        let s13 = new Card('You have won second prize in a beauty contest. Collect $10', 'chest', this.game);
        s13.action = function() {
            this.player.solde += 10;
            return true;
        }.bind(s13);
        s13.setPlayer(this.player);

        let s14 = new Card('You inherit $100', 'chest', this.game);
        s14.action = function() {
            this.player.solde += 100;
            return true;
        }.bind(s14);
        s14.setPlayer(this.player);

        this.cadrs.push(c1);
        this.cadrs.push(c2);
        this.cadrs.push(c3);
        this.cadrs.push(c4);
        this.cadrs.push(c5);
        this.cadrs.push(c6);
        this.cadrs.push(c8);

        this.cadrs.push(s1);
        this.cadrs.push(s2);
        this.cadrs.push(s3);
        this.cadrs.push(s4);
        this.cadrs.push(s5);
        this.cadrs.push(s6);
        this.cadrs.push(s7);
        this.cadrs.push(s8);
        this.cadrs.push(s9);
        this.cadrs.push(s10);
        this.cadrs.push(s11);
        this.cadrs.push(s12);
        this.cadrs.push(s13);
        this.cadrs.push(s14);

        return this.cadrs;
    }
}