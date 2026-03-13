class Movement {
    constructor(game, cpu) {
        this.game = game;
        this.cpu = cpu;
    }

    /**
     * Move a piece to tile position
     * @param {Piece} piece 
     * @param {Position} tilePosition 
     */
    goToTile(piece, tilePosition, salary = true) {
        if (piece) {
            let dist = 0;
            dist = this.calculateSteps(piece.cartesianPosition, tilePosition);
            this.movePiece(piece, dist, salary, false);
        }
    }

    /**
     * Calcule the steps between two positions
     * @param {Position} piecePosition 
     * @param {Position} tilePosition 
     * @returns {Int}
     */
    calculateSteps(piecePosition, tilePosition) {
        if (piecePosition.X == 0 && piecePosition.Y == 0) {
            if (tilePosition.Y == 0) {
                if (piecePosition.X < tilePosition.X) {
                    return tilePosition.X - piecePosition.X;
                } else {
                    const step = 10 - piecePosition.X;
                    return step + this.calculateSteps(new Position(10, piecePosition.Y), tilePosition);
                }
            } else {
                const step = 10 - piecePosition.X;
                return step + this.calculateSteps(new Position(10, piecePosition.Y), tilePosition);
            }
        }

        if (piecePosition.X == 10 && piecePosition.Y == 10) {
            if (tilePosition.Y == 10) {
                if (piecePosition.X > tilePosition.X) {
                    return piecePosition.X - tilePosition.X;
                } else {
                    const step = piecePosition.X;
                    return step + this.calculateSteps(new Position(0, piecePosition.Y), tilePosition);
                }
            } else {
                const step = piecePosition.X;
                return step + this.calculateSteps(new Position(0, piecePosition.Y), tilePosition);
            }
        }

        if (piecePosition.X == 10) {
            if (tilePosition.X == 10) {
                if (piecePosition.Y < tilePosition.Y) {
                    return tilePosition.Y - piecePosition.Y;
                } else {
                    const step = 10 - piecePosition.Y;
                    return step + this.calculateSteps(new Position(piecePosition.X, 10), tilePosition);
                }
            } else {
                const step = 10 - piecePosition.Y;
                return step + this.calculateSteps(new Position(piecePosition.X, 10), tilePosition);
            }
        } else if (piecePosition.X == 0) {
            if (tilePosition.X == 0) {
                if (piecePosition.Y > tilePosition.Y) {
                    return piecePosition.Y - tilePosition.Y;
                } else {
                    const step = piecePosition.Y;
                    return step + this.calculateSteps(new Position(piecePosition.X, 0), tilePosition);
                }
            } else {
                const step = piecePosition.Y;
                return step + this.calculateSteps(new Position(piecePosition.X, 0), tilePosition);
            }
        }

        if (piecePosition.Y == 10) {
            if (tilePosition.Y == 10) {
                if (piecePosition.X > tilePosition.X) {
                    return piecePosition.X - tilePosition.X;
                } else {
                    const step = piecePosition.X;
                    return step + this.calculateSteps(new Position(0, piecePosition.Y), tilePosition);
                }
            } else {
                const step = piecePosition.X;
                return step + this.calculateSteps(new Position(0, piecePosition.Y), tilePosition);
            }

        } else if (piecePosition.Y == 0) {
            if (tilePosition.Y == 0) {
                if (piecePosition.X < tilePosition.X) {
                    return tilePosition.X - piecePosition.X;
                } else {
                    const step = 10 - piecePosition.X;
                    return step + this.calculateSteps(new Position(10, piecePosition.Y), tilePosition);
                }
            } else {
                const step = 10 - piecePosition.X;
                return step + this.calculateSteps(new Position(10, piecePosition.Y), tilePosition);
            }
        }
    }

    /**
     * Move a piece a number of steps
     * @param {Piece} piece 
     * @param {Integer} steps 
     * @param {Boolean} salary 
     * @param {Boolean} double 
     */
    movePiece(piece, steps, salary = true, double = false) {
        piece.geoAnimation = new GeometricAnimation('moving', piece);
        piece.geoAnimation.startFrom(null);
        this.initPieceDirection(piece);
        this.calculePosition(piece, steps, salary);
        let newPosition = this.isometricPosition(piece.cartesianPosition, new Size(128, 64), new Point(
            this.middlePosition().start.X,
            this.middlePosition().start.Y,
        ));
        piece.geoAnimation.endAt(newPosition, 200, function() {
            piece.moving = false;
            this.checkPieceCurrentTile(piece, double);
            if (this.canPlaySirenAnimation) {
                this.canPlaySirenAnimation = false;
            }
            if (piece.owner.isCPU && this.cpu) {
                this.cpu.pieceMoved = true;
            }
        }.bind(this.game));
        piece.moving = true;
    }

    /**
     * Set the piece sprite for the current direction
     * @param {Piece} piece 
     */
    initPieceDirection(piece) {
        if (piece.cartesianPosition.X == 10 && piece.cartesianPosition.Y < 10) {
            piece.setDirection('rightToLeft');
        } else if (piece.cartesianPosition.X > 0 && piece.cartesianPosition.Y == 10) {
            piece.setDirection('bottomToTop');
        } else if (piece.cartesianPosition.X == 0 && piece.cartesianPosition.Y > 0) {
            piece.setDirection('leftToRight');
        } else if (piece.cartesianPosition.X < 10 && piece.cartesianPosition.Y == 0) {
            piece.setDirection('topToBottom');
        }
    }

    /**
     * Get the positions for the moving animations and checking if the piece pass's by the salary tile
     * @param {Piece} piece 
     * @param {Integer} steps 
     * @param {Boolean} salary 
     * @returns {Boolean}
     */
    calculePosition(piece, steps, salary = true) {
        if (steps < 1)
            return false;

        if (piece.cartesianPosition.X == 10 && piece.cartesianPosition.Y < 10) {
            if (piece.cartesianPosition.Y + steps <= 10) {
                piece.cartesianPosition.Y += steps;
            } else {
                let restY = (steps + piece.cartesianPosition.Y) - 10;
                piece.cartesianPosition.Y = 10;
                if (restY > 0) {
                    let toPosition = this.isometricPosition(piece.cartesianPosition, new Size(128, 64), new Point(
                        this.middlePosition().start.X,
                        this.middlePosition().start.Y,
                    ));;
                    piece.geoAnimation.to(toPosition, 200, function() { piece.setDirection('bottomToTop'); }.bind(this));
                    if (salary)
                        this.checkForPassingByGo(piece, piece.cartesianPosition);
                    this.calculePosition(piece, restY);
                }
            }
        } else if (piece.cartesianPosition.X > 0 && piece.cartesianPosition.Y == 10) {
            if (piece.cartesianPosition.X - steps >= 0) {
                piece.cartesianPosition.X -= steps;
            } else {
                let restX = steps - piece.cartesianPosition.X;
                piece.cartesianPosition.X = 0;
                if (restX > 0) {
                    let toPosition = this.isometricPosition(piece.cartesianPosition, new Size(128, 64), new Point(
                        this.middlePosition().start.X,
                        this.middlePosition().start.Y,
                    ));;
                    piece.geoAnimation.to(toPosition, 200, function() { piece.setDirection('leftToRight'); }.bind(this));
                    if (salary)
                        this.checkForPassingByGo(piece, piece.cartesianPosition);
                    this.calculePosition(piece, restX);
                }
            }
        } else if (piece.cartesianPosition.X == 0 && piece.cartesianPosition.Y > 0) {
            if (piece.cartesianPosition.Y - steps >= 0) {
                piece.cartesianPosition.Y -= steps;
            } else {
                let restY = steps - piece.cartesianPosition.Y;
                piece.cartesianPosition.Y = 0;
                if (restY > 0) {
                    let toPosition = this.isometricPosition(piece.cartesianPosition, new Size(128, 64), new Point(
                        this.middlePosition().start.X,
                        this.middlePosition().start.Y,
                    ));;
                    piece.geoAnimation.to(toPosition, 200, function() { piece.setDirection('topToBottom'); }.bind(this));
                    if (salary)
                        this.checkForPassingByGo(piece, piece.cartesianPosition);
                    this.calculePosition(piece, restY);
                }
            }
        } else if (piece.cartesianPosition.X < 10 && piece.cartesianPosition.Y == 0) {
            if (piece.cartesianPosition.X + steps <= 10) {
                piece.cartesianPosition.X += steps;
            } else {
                let restX = (steps + piece.cartesianPosition.X) - 10;
                piece.cartesianPosition.X = 10;
                if (restX > 0) {
                    let toPosition = this.isometricPosition(piece.cartesianPosition, new Size(128, 64), new Point(
                        this.middlePosition().start.X,
                        this.middlePosition().start.Y,
                    ));;
                    piece.geoAnimation.to(toPosition, 200, function() { piece.setDirection('rightToLeft'); }.bind(this));
                    if (salary)
                        this.checkForPassingByGo(piece, piece.cartesianPosition);
                    this.calculePosition(piece, restX);
                }
            }
        }
    }

    /**
     * Check if the position is Go tile
     * @param {Piece} piece 
     * @param {Position} position 
     */
    checkForPassingByGo(piece, position) {
        if (piece) {
            let currentTile = this.game.map.tiles.filter(tile => {
                return (tile.position.X == position.X && tile.position.Y == position.Y);
            })[0];
            if (currentTile) {
                if (currentTile.type === TileType.GO) {
                    piece.owner.solde += 200;
                }
            }
        }
    }

    /**
     * Get the middle position of the screen
     * @returns Start and end {Point}
     */
    middlePosition() {
        let width = this.game.engine.screenSize().width;
        let height = this.game.engine.screenSize().height;
        let x = (width / 2) - 50;
        let y = 50;
        let maxX = (width / 2);
        let maxY = (height / 2);
        return { start: new Point(x, y), end: new Point(maxX, maxY) };
    }

    /**
     * Get a piece position on the Board
     * @param {Position} position 
     * @param {Size} size 
     * @returns {Position}
     */
    cartesianPosition(position, size) {
        let x = ((position.X - this.middlePosition().start.X) / (size.width / 2) + (position.Y - this.middlePosition().start.Y) / (size.height / 2)) / 2;
        let y = ((position.Y - this.middlePosition().start.Y) / (size.height / 2) - (position.X - this.middlePosition().start.X) / (size.width / 2)) / 2;
        return new Position(parseInt(x), parseInt(y));
    }

    /**
     * Get the screen position
     * @param {Position} position 
     * @param {Size} size 
     * @param {Point} offset 
     * @returns {Position}
     */
    isometricPosition(position, size, offset) {
        let x = (position.X - position.Y) * (size.width / 2);
        let y = (position.X + position.Y) * (size.height / 2);
        return new Position(parseInt(x + offset.X), parseInt(y + offset.Y));
    }
}