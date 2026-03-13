class Layer {

    constructor(name) {
        this.name = name;
        this.gameObjects = [];
        this.elements = [];
        this.z_order = 0;
        this.isUI = false;
    }

    /**
     * Register GameObject to the layer
     * @param {GameObject} gameObject 
     * @returns {boolean}
     */
    registerGameObject(gameObject) {
        if (gameObject === null || gameObject === undefined) {
            console.error('No valid GameObject found to be added to the layer ' + this.name);
            return false;
        }

        this.gameObjects.push(gameObject);
        return true;
    }

    /**
     * Register Element to the layer
     * @param {Element} gameObject 
     * @returns {boolean}
     */
    registerElement(element) {
        if (element === null || element === undefined) {
            console.error('No valid Element found to be added to the layer ' + this.name);
            return false;
        }

        this.elements.push(element);
        return true;
    }
}