class Player {

    constructor(name) {
        this.name = name;
        this.piece = null;
        this.solde = 1500;
        this.tiles = [];
        this.InJail = false;
        this.doubleCount = 0;
        this.myOffers = [];
        this.isCPU = false;
    }

    addOffer(offer) {
        if (offer) {
            this.myOffers.push(offer);
        }
    }

    clearOffers() {
        this.myOffers = [];
    }

    canSellTile(buyer, tile) {
        let offers = this.myOffers.filter(offer => {
            return offer.buyer.name === buyer.name && offer.tile.id === tile.id;
        });

        if (offers.length > 0)
            return false;

        return true;
    }

    railRoadCount(mortgage = false) {
        if (mortgage) {
            return this.tiles.filter(tile => {
                return tile.type === TileType.RAILROAD && tile.mortgage;
            }).length;
        }
        return this.tiles.filter(tile => {
            return tile.type === TileType.RAILROAD;
        }).length;
    }

    companiesCount(mortgage = false) {
        if (mortgage) {
            return this.tiles.filter(tile => {
                return tile.type === TileType.COMPANY && !tile.mortgage;
            }).length;
        }
        return this.tiles.filter(tile => {
            return tile.type === TileType.COMPANY;
        }).length;
    }

    totalPropertiesValues() {
        let total = 0;
        let tiles_to_mortgage = this.tiles.filter(tile => {
            return !tile.mortgage;
        });
        for (var i = 0; i < tiles_to_mortgage.length; i++) {
            total += tiles_to_mortgage[i].getMortgageValue();
            total += ((tiles_to_mortgage[i].houseContruction / 2) * tiles_to_mortgage[i].numberHouses);
        }
        return total;
    }

    totalValueForNeedingMoney() {
        return this.totalPropertiesValues() + this.solde;
    }

    canBuild(tile) {
        if (tile) {
            return this.getTileGroup(tile.groupId, true).length === tile.groupTotal;
        }
    }

    getTileGroup(groupId, mortgage = false) {
        if (groupId) {
            if (mortgage) {
                return this.tiles.filter(tile => {
                    return tile.groupId === groupId && !tile.mortgage;
                });
            } else {

                return this.tiles.filter(tile => {
                    return tile.groupId === groupId;
                });
            }
        }
    }

    canBuildOnTile(tile) {

        if (this.getTileGroup(tile.groupId, true).length < tile.groupTotal)
            return false;

        if (tile.numberHouses >= 5)
            return false;

        return true;
    }

    getSortedTiles() {
        return this.tiles.sort(this.compare);
    }

    compare(a, b) {
        if (a.groupId < b.groupId) {
            return -1;
        }
        if (a.groupId > b.groupId) {
            return 1;
        }
        return 0;
    }

    mortgageTileById(id) {
        let tile = this.tiles.filter(tile => {
            return tile.id === id;
        })[0];

        if (tile) {
            if (tile.type === TileType.LAND || tile.type === TileType.COMPANY || tile.type === TileType.RAILROAD) {
                if (!tile.mortgage && tile.numberHouses <= 0) {
                    tile.mortgage = true;
                    this.solde += tile.getMortgageValue();
                    return true;
                }
            }
        }

        return false;
    }

    payMortgageTileById(id) {
        let tile = this.tiles.filter(tile => {
            return tile.id === id;
        })[0];

        if (tile) {
            if (tile.type === TileType.LAND || tile.type === TileType.COMPANY || tile.type === TileType.RAILROAD) {
                if (tile.mortgage && this.solde >= tile.getMortgagePayement()) {
                    tile.mortgage = false;
                    this.solde -= tile.getMortgagePayement();
                    return true;
                }
            }
        }

        return false;
    }

    bankrupt(newOwner = null) {
        for (var i = 0; i < this.tiles.length; i++) {
            this.tiles[i].owner = newOwner;
        }
    }

    canMortgagaTile(tile) {
        if (tile.type === TileType.COMPANY || tile.type === TileType.RAILROAD) {
            return !tile.mortgage;
        }
        if (tile.mortgage)
            return false;

        if (tile) {
            if (this.getTileGroup(tile.groupId, true).length === tile.groupTotal) {
                let tiles = this.tiles.filter(_tile => {
                    return _tile.groupId === tile.groupId && _tile.id != tile.id;
                });
                if (tile.groupTotal == 2) {
                    if (tile.numberHouses <= 0 && tiles[0].numberHouses <= 0) {
                        return true;
                    }
                } else {
                    // 3
                    if (tile.numberHouses <= 0 && tiles[0].numberHouses <= 0 && tiles[1].numberHouses <= 0) {
                        return true;
                    }
                }
            } else {
                return true;
            }
        }

        return false;
    }

    buildHouse(id) {
        let tile = this.tiles.filter(tile => {
            return tile.id === id;
        })[0];

        if (tile.type !== TileType.LAND)
            return false;

        if (tile) {
            if (this.getTileGroup(tile.groupId, true).length === tile.groupTotal) {
                let tiles = this.tiles.filter(_tile => {
                    return _tile.groupId === tile.groupId && _tile.id != id;
                });
                if (tile.groupTotal == 2) {
                    if (tile.numberHouses <= tiles[0].numberHouses) {
                        if (this.solde >= tile.houseContruction) {
                            tile.numberHouses++;
                            this.solde -= tile.houseContruction;
                            return true;
                        }
                    }
                } else {
                    // 3
                    if (tile.numberHouses <= tiles[0].numberHouses && tile.numberHouses <= tiles[1].numberHouses) {
                        if (this.solde >= tile.houseContruction) {
                            tile.numberHouses++;
                            this.solde -= tile.houseContruction;
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    sellHouse(id) {
        let tile = this.tiles.filter(tile => {
            return tile.id === id;
        })[0];

        if (tile.type !== TileType.LAND)
            return false;

        if (tile) {
            if (this.getTileGroup(tile.groupId, true).length === tile.groupTotal) {
                let tiles = this.tiles.filter(_tile => {
                    return _tile.groupId === tile.groupId && _tile.id != id;
                });
                if (tile.groupTotal == 2) {
                    if (tile.numberHouses >= tiles[0].numberHouses) {
                        tile.numberHouses--;
                        this.solde += parseInt(tile.houseContruction / 2);
                        return true;
                    }
                } else {
                    // 3
                    if (tile.numberHouses >= tiles[0].numberHouses && tile.numberHouses >= tiles[1].numberHouses) {
                        tile.numberHouses--;
                        this.solde += parseInt(tile.houseContruction / 2);
                        return true;
                    }
                }
            }
        }

        return false;
    }

}