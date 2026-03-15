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

    /**
     * Serialize layer to a plain object
     * @returns {Object}
     */
    toJSON() {
        var gameObjectsData = [];
        for (var i = 0; i < this.gameObjects.length; i++) {
            gameObjectsData.push(this.gameObjects[i].toJSON());
        }

        var elementsData = [];
        for (var i = 0; i < this.elements.length; i++) {
            elementsData.push(this.elements[i].toJSON());
        }

        return {
            type: 'layer',
            name: this.name,
            z_order: this.z_order,
            isUI: this.isUI,
            gameObjects: gameObjectsData,
            elements: elementsData
        };
    }

    /**
     * Create a Layer from serialized data
     * @param {Object} data
     * @returns {Layer}
     */
    static fromJSON(data) {
        var layer;
        if (data.isUI) {
            layer = new UILayer(data.name);
        } else {
            layer = new Layer(data.name);
        }
        layer.z_order = data.z_order || 0;

        if (data.gameObjects) {
            for (var i = 0; i < data.gameObjects.length; i++) {
                layer.registerGameObject(GameObject.fromJSON(data.gameObjects[i]));
            }
        }

        if (data.elements) {
            for (var i = 0; i < data.elements.length; i++) {
                layer.registerElement(Element.fromJSON(data.elements[i]));
            }
        }

        return layer;
    }
}