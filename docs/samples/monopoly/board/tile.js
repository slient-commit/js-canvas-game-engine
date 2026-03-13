class Tile {

    constructor(size, sprite) {
        this.id = 0;
        this.size = size;
        this.sprite = sprite;
        this.position = new Position(0, 0);
        this.streetName = '';
        this.owner = null;
        this.houseContruction = 0;
        this.houseRent = 0;
        this.purchaseValue = 0;
        this.numberHouses = 0;
        this.color = 'gray';
        this.canBuy = true;
        this.canBuild = true;
        this.type = TileType.Land;
        this.groupId = -1;
        this.groupTotal = 0;
        this.mortgage = false;
    }

    getRandomArbitrary(min, max) {
        return parseInt(Math.random() * (max - min) + min);
    }

    // Get houses Rent with their count
    getRent() {
        if (this.type === TileType.LAND) {
            let number = this.numberHouses > 0 ? this.numberHouses : 1;
            return (this.houseRent * number) + (this.numberHouses * 15);
        }

        if (this.type == TileType.RAILROAD)
            return this.houseRent * this.owner.railRoadCount();

        if (this.type == TileType.COMPANY) {
            let count = this.owner.companiesCount() === 1 ? 4 : 10;
            return this.houseRent * count;
        }

        return 0;
    }

    getMortgageValue() {
        return parseInt(this.purchaseValue / 2);
    }

    getMortgagePayement() {
        let mor = parseInt(this.purchaseValue / 2);
        let per = mor * 0.1;
        return parseInt(mor + per);
    }

}