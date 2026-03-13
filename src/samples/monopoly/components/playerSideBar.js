class PlayerSideBar {

    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.position = new Position(0, 20);
        this.size = new Size(160, (this.game.players.length * 52) + 40);
        this.isOpen = true;
        this.viewedPlayer = null;
        this.clickSound = new Sound('./assets/audio/click.mp3', 80);
        this._closeHovered = false;
        this._openHovered = false;
        this._playerHovered = -1;
    }

    cards() {
        if (!this.game) return;
        var drawer = this.engine.drawer;
        var colors = ['#44aaff', '#ff6644', '#44cc66'];

        for (var i = 0; i < this.game.players.length; i++) {
            var py = this.position.Y + 30 + (i * 52);
            var px = this.position.X + 8;
            var player = this.game.players[i];
            var isCurrent = this.game.currentPlayer.name === player.name;
            var cardW = this.size.width - 16;
            var cardH = 46;

            // Highlight current player
            if (isCurrent) {
                drawer.rectangle(new Position(px, py), new Size(cardW, cardH), true, 1, 'rgba(68, 170, 255, 0.15)');
                drawer.rectangle(new Position(px, py), new Size(cardW, cardH), false, 1, '#44aaff');
            }

            // Player color indicator
            var pColor = colors[i % colors.length];
            drawer.rectangle(new Position(px, py), new Size(4, cardH), true, 1, pColor);

            // Player name and money
            var nameColor = isCurrent ? '#ffffff' : '#aabbcc';
            drawer.text(player.name, new Position(px + 12, py + 16), 11, 'monospace', 'bold', nameColor);
            drawer.text('$' + player.solde, new Position(px + 12, py + 32), 10, 'monospace', 'normal', '#44cc66');

            // Properties count
            var propCount = player.getSortedTiles().length;
            drawer.text(propCount + 'p', new Position(px + cardW - 22, py + 16), 9, 'monospace', 'normal', '#667788');

            // Hover detection
            var isHovered = this.engine.mouseOnTopOfPosition(new Position(px, py), new Size(cardW, cardH));
            if (isHovered) {
                drawer.rectangle(new Position(px, py), new Size(cardW, cardH), true, 1, 'rgba(255,255,255,0.06)');
                if (this.engine.mouseClicked(MouseButton.LEFT)) {
                    this.clickSound.play();
                    this.viewedPlayer = player;
                }
            }
        }
    }

    mainCore() {
        this.size = new Size(160, (this.game.players.length * 52) + 40);
        var drawer = this.engine.drawer;

        // Dark panel
        drawer.rectangle(this.position, this.size, true, 1, 'rgba(10, 10, 28, 0.92)');
        drawer.rectangle(this.position, this.size, false, 1, '#334455');

        // Title
        drawer.text('PLAYERS', new Position(this.position.X + 35, this.position.Y + 20), 11, 'monospace', 'bold', '#667788');

        if (!this.isOpen) {
            // Collapsed: show small open tab
            var tabX = this.position.X + this.size.width + 5;
            var tabY = this.position.Y;
            var tabW = 28;
            var tabH = 60;
            this._openHovered = this.engine.mouseOnTopOfPosition(new Position(tabX, tabY), new Size(tabW, tabH));
            var tabColor = this._openHovered ? '#3a5a7a' : '#2a3a5a';
            drawer.rectangle(new Position(tabX, tabY), new Size(tabW, tabH), true, 1, tabColor);
            drawer.rectangle(new Position(tabX, tabY), new Size(tabW, tabH), false, 1, '#334455');
            drawer.text('>', new Position(tabX + 9, tabY + 35), 12, 'monospace', 'bold', 'white');
            if (this._openHovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                this.clickSound.play();
                this.isOpen = true;
                this.viewedPlayer = null;
            }
        } else {
            // Close button at bottom
            var cbx = this.position.X + 30;
            var cby = this.position.Y + this.size.height - 6;
            var cbw = 100;
            var cbh = 22;
            this._closeHovered = this.engine.mouseOnTopOfPosition(new Position(cbx, cby), new Size(cbw, cbh));
            var closeColor = this._closeHovered ? '#5c2a2a' : '#3a2020';
            drawer.rectangle(new Position(cbx, cby), new Size(cbw, cbh), true, 1, closeColor);
            var tw = drawer.textWidth('Close', 10, 'monospace', 'bold');
            drawer.text('Close', new Position(cbx + (cbw - tw) / 2, cby + 15), 10, 'monospace', 'bold', '#ccaaaa');
            if (this._closeHovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                this.clickSound.play();
                this.isOpen = false;
                this.viewedPlayer = null;
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
