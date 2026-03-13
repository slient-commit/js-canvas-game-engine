class CPU {
    constructor(game) {
        this.isPlaying = false;
        this.pieceMoved = false;
        this.isDouble = false;
        this.game = game;
    }

    reset() {
        this.pieceMoved = false;
        this.isPlaying = false;
    }

    makeDecision(currentTile = null) {
        if (!this.isPlaying) {
            this.isPlaying = true;
            if (!this.game.isDicesThrowing && this.game.canThrow) {
                this.play();
            }
        }
        if (this.isDouble) {
            this.play();
        } else if (this.isPlaying && !this.game.canThrow && this.game.canEnd && this.pieceMoved && !this.isDouble) {
            this.checkToBuyLandFromOtherPlayers();
            if (this.game.engine.sfx)
                this.game.clickSound.play();
            this.game.endTurn();
            this.isPlaying = false;
        }
    }

    play() {
        if (this.game.engine.sfx)
            this.game.clickSound.play();
        this.game.isDicesThrowing = true;
        this.game.canThrow = false;
    }

    property(currentTile, double) {
        if (currentTile != null) {
            if (!currentTile.owner) {
                this.game.events.buyBlankLand(currentTile);
            }
            this.game.checkForDouble(double);
        }
    }

    bailOut() {
        if (((50 / this.game.currentPlayer.solde) * 100) < 10 && this.game.currentPlayer.tiles.length > 0) {
            this.game.payBailOut();
        }
    }

    checkToBuyLandFromOtherPlayers() {
        let lastGroupId = -1;
        let lastGroupCount = 0;
        let lastGroupTotal = 0;

        for (let i = 0; i < this.game.currentPlayer.tiles.length; i++) {
            if (lastGroupId == -1) {
                lastGroupId = this.game.currentPlayer.tiles[i].groupId;
                lastGroupTotal = this.game.currentPlayer.tiles[i].groupTotal;
            } else if (lastGroupId == this.game.currentPlayer.tiles[i].groupId) {
                lastGroupCount++
            }

            if (lastGroupCount >= this.game.currentPlayer.tiles[i].groupTotal - 2) {
                for (let p = 0; p < this.game.players.length; p++) {
                    if (this.game.currentPlayer.name != this.game.players[p].name) {
                        let ts = this.game.players[p].tiles;
                        for (let t = 0; t < ts.length; t++) {
                            if (ts[t].groupId == lastGroupId) {
                                let offer = new BuyingOffer(this.game.currentPlayer, ts[t].tile);
                                this.game.players[p].addOffer(offer);
                                lastGroupId = -1;
                                lastGroupCount = 0;
                                lastGroupTotal = 0;
                            }
                        }
                    }
                }
            }
        }
    }

    verifySelling(buyer, offer) {
        // TODO
        return true;
    }

}