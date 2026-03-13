class GameEvent {
    constructor(engine, game) {
        this.game = game;
        this.messageBox = new MessageBox(engine, this.game);
    }

    /**
     * Launch the bankrupt event
     * @param {Object} action 
     */
    bankrupt(action) {
        if (action) {
            switch (action.action) {
                case 'tax':
                    this.game.currentPlayer.bankrupt(null);
                    break;
                case 'jail':
                    this.game.currentPlayer.bankrupt(null);
                    break;
                case 'pay':
                    this.game.currentPlayer.bankrupt(null);
                    break;
                case 'rent':
                    this.game.currentPlayer.bankrupt(action.tile.owner);
                    break;
            }

            this.game.players = this.game.players.filter(player => {
                return player.name !== this.game.currentPlayer.name;
            });

            this.game.endTurn();
        }
    }

    /**
     * Buy a blank Land
     * @param {Tile} tile 
     */
    buyBlankLand(tile) {
        if (tile) {
            if (tile.type === TileType.COMPANY) {
                tile.houseRent = this.game.totalSteps;
            }
            this.game.currentPlayer.tiles.push(tile);
            tile.owner = this.game.currentPlayer;
            this.game.currentPlayer.solde -= tile.purchaseValue;
            this.messageBox.simple(`${this.game.currentPlayer.name} bought ${tile.streetName}`).deleteAfter(2);
        }
    }

    /**
     * Pay rent to the tile owner
     * @param {Tile} tile 
     */
    payRent(tile) {
        if (tile) {
            if (this.game.engine.sfx)
                this.game.failedSound.play();
            this.game.currentPlayer.solde -= tile.getRent();
            tile.owner.solde += tile.getRent();
            this.messageBox.simple(`${this.game.currentPlayer.name} payed rent to ${tile.owner.name}`).deleteAfter(2);
        }
    }

    /**
     * Pay tax on tax Tile
     * @param {Tile} tile 
     */
    payTax(tile) {
        if (tile) {
            if (this.game.engine.sfx)
                this.game.failedSound.play();
            this.game.currentPlayer.solde -= tile.purchaseValue;
        }
    }

    /**
     * Send a piece to jail
     * @param {Piece} piece 
     */
    goToJail(piece) {
        if (piece) {
            if (this.game.engine.sfx)
                this.game.jailSound.play();
            this.game.canPlaySirenAnimation = true;
            this.game.currentPlayer.inJail = true;
            this.game.doubleCount = 0;
            let jailPosition = new Position(10, 10);
            this.game.movements.goToTile(piece, jailPosition, false);
        }
    }
}