class PlayerSideBar {

    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.position = new Position(0, 20);
        this.size = new Size(64, (this.game.players.length * 64) + 30);
        this.openButtonSprite = new Sprite(32, 32);
        this.openButtonSprite.loadImage('./assets/sprites/player_icon.png');
        this.openButton = new GameObject(this.openButtonSprite, new Position(this.position.X + this.size.width, this.position.Y));
        this.closeButton = new GameObject(new Sprite(64, 30), new Position(this.position.X + 10, this.size.height - 10));
        this.isOpen = true;
        this.viewedPlayer = null;
    }

    cards() {
        if (this.game) {
            for (var i = 0; i < this.game.players.length; i++) {
                if (this.game.currentPlayer.name === this.game.players[i].name) {
                    this.engine.drawer.rectangle(new Position(this.position.X, this.position.Y + (i * 64)), new Size(64, 64), true, 5, 'yellow', .5);
                }
                let cardSprite = new Sprite(32, 32);
                cardSprite.loadImage('./assets/sprites/player_icon.png');
                let card = new GameObject(this.openButtonSprite, new Position(this.position.X + 16, this.position.Y + (i * 64) + 16));

                this.engine.drawer.gameObject(card);
                this.engine.drawer.text(this.game.players[i].name, new Position(this.position.X + 16, this.position.Y + (i * 64) + 55), 10);
                if (this.engine.mouseOnTopOf(card)) {
                    this.engine.drawer.rectangle(new Position(this.position.X, this.position.Y + (i * 64)), new Size(64, 64), true, 5, 'red', .5);
                    if (this.engine.mouseClicked(MouseButton.LEFT)) {
                        this.viewedPlayer = this.game.players[i];
                    }
                }
            }
        }
    }

    mainCore() {
        this.size = new Size(64, (this.game.players.length * 64) + 30);
        this.engine.drawer.rectangle(this.position, this.size, true, 5, 'white');
        this.engine.drawer.rectangle(this.position, this.size, false, 2, 'black');

        // Open Button
        if (!this.isOpen) {
            this.openButton.position = new Position(this.position.X + this.size.width + 10, this.position.Y);
            this.engine.drawer.gameObject(this.openButton);
            this.engine.drawer.text(this.game.currentPlayer.name, new Position(this.position.X + this.size.width + 10, this.position.Y + 40), 10);
            this.engine.drawer.text(`$${this.game.currentPlayer.solde}`, new Position(this.position.X + this.size.width + 10, this.position.Y + 52), 11);
            if (this.engine.mouseOnTopOf(this.openButton)) {
                this.engine.drawer.rectangle(this.openButton.position, new Size(32, 42), true, 5, 'red', .2);
                if (this.engine.mouseClicked(MouseButton.LEFT)) {
                    this.isOpen = true;
                    this.viewedPlayer = null;
                }
            }
        } else {
            this.closeButton.position = new Position(this.position.X, this.size.height - 10);
            this.engine.drawer.text('Close', new Position(this.position.X + 16, this.size.height + 10));
            if (this.engine.mouseOnTopOf(this.closeButton)) {
                this.engine.drawer.rectangle(this.closeButton.position, new Size(64, 30), true, 5, 'red', .2);
                if (this.engine.mouseClicked(MouseButton.LEFT)) {
                    this.isOpen = false;
                    this.viewedPlayer = null;
                }
            }
        }
    }

    display(elapsedTime) {
        this.mainCore();
        this.cards();
        this.move(elapsedTime);
    }

    move(elapsedTime) {
        if (this.isOpen) {
            if (this.position.X < 0) {
                this.position.X += 200 * elapsedTime;
            }
        } else {
            if (this.position.X > -this.size.width - 5) {
                this.position.X -= 200 * elapsedTime;
            }
        }
    }
}