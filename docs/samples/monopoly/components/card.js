class Card {
    constructor(text, type, game) {
        this.text = text;
        this.type = type;
        this.action = null;
        this.player = null;
        this.game = game;
    }

    setPlayer(player) {
        this.player = player;
    }
}