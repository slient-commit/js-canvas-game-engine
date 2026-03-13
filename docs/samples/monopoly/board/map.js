class Map {

    constructor(size, engine, game) {
        this.size = size;
        this.tiles = [];
        this.engine = engine;
        this.game = game;

        this.chanceCardsSprites = new Sprite(256, 128);
        this.chanceCardsSprites.loadImage('./assets/sprites/board/chance_cards.png');

        this.chestCardsSprites = new Sprite(256, 128);
        this.chestCardsSprites.loadImage('./assets/sprites/board/community_chest_cards.png');
    }

    OnCreate() {
        this.initTilesToBoard();
    }

    OnUpdate(elapsedTime) {
        this.drawBoard();

        // this.engine.drawer.text(`Steps: ${this.totalSteps}`, new Position(10, 40 + (10 * d)));

        this.drawBoardCards(); // Chance and chest board cards

        // Draw Houses
        this.drawBoardHouses();
    }

    initTilesToBoard() {
        this.tiles = new Tiles().getBoard();
    }

    drawBoard() {
        for (var i = 0; i < this.size.width * this.size.height; i++) {
            if (this.tiles[i]) {
                let position = this.game.movements.isometricPosition(this.tiles[i].position, this.tiles[i].size, new Point(
                    this.game.movements.middlePosition().start.X,
                    this.game.movements.middlePosition().start.Y,
                ));
                this.engine.drawer.sprite(this.tiles[i].sprite, position);
                // this.engine.drawer.text(`(${this.tiles[i].position.X},${this.tiles[i].position.Y})`, position);
            }
        }
    }

    drawBoardCards() {
        let chance_position = this.game.movements.isometricPosition(new Position(6, 2), new Size(128, 64), new Point(
            this.game.movements.middlePosition().start.X,
            this.game.movements.middlePosition().start.Y,
        ));
        this.engine.drawer.sprite(this.chanceCardsSprites, chance_position);

        let chest_position = this.game.movements.isometricPosition(new Position(2, 7), new Size(128, 64), new Point(
            this.game.movements.middlePosition().start.X,
            this.game.movements.middlePosition().start.Y,
        ));
        this.engine.drawer.sprite(this.chestCardsSprites, chest_position);

    }

    drawBoardHouses() {
        for (var i = 0; i < this.size.width * this.size.height; i++) {
            if (this.tiles[i]) {
                if (this.tiles[i].type === TileType.LAND) {
                    let direction = 'l';
                    if (this.tiles[i].position.X === 0) {
                        direction = 't';
                    } else if (this.tiles[i].position.X === 10) {
                        direction = 'd'
                    } else if (this.tiles[i].position.Y === 0) {
                        direction = 'r';
                    }
                    let house = new House(this.tiles[i].numberHouses, direction, this.tiles[i].position);
                    let position = this.game.movements.isometricPosition(house.position, this.tiles[i].size, new Point(
                        this.game.movements.middlePosition().start.X,
                        this.game.movements.middlePosition().start.Y,
                    ));
                    this.engine.drawer.sprite(house.sprite, position);
                    // this.engine.drawer.text(`(${this.tiles[i].position.X},${this.tiles[i].position.Y})`, position);
                }
            }
        }
    }
}