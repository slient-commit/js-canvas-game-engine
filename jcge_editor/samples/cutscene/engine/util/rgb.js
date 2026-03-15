class RGB {
    constructor(red = 255, green = 255, blue = 255, alpha = 1) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha;
    }

    toString() {
        return `rgb(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
    }

    toStringWithoutAlpha() {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    }
}