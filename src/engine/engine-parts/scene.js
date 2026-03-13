class Scene {

    constructor(name, engine) {
        this.name = name;
        this.isEnded = false;
        this.isCreated = false;
        this.engine = engine;
        this.gameObjects = [];
        this.currentCamera = null;
        this.layers = [];
        this._incomingData = null;
        this.registerLayer(new Layer('ground'));
    }

    /**
     * Register new gameobject to the engine to be draw by default
     * @param {*} gameObject 
     * @returns bool
     */
    registerGameObject(gameObject) {
        if (gameObject === null || gameObject === undefined) {
            console.error('No game object was defined');
            return false;
        }

        this.gameObjects.push(gameObject);
        return true;
    }

    /**
     * Add Layer to the layers
     * @param {Layer} layer 
     * @returns 
     */
    registerLayer(layer) {
        if (layer === null || layer === undefined) {
            console.error('No valid layer was found to be register to the scene ' + this.name);
            return false;
        }

        layer.z_order = this.layers.length;
        this.layers.push({ zOrder: layer.z_order, layer: layer });
        return true;
    }

    /**
     * Remove a layer
     * @param {Layer} layer 
     * @returns 
     */
    removeLayer(layer) {
        if (layer === null || layer === undefined) {
            console.error('No valid layer was found to be removed from the scene ' + this.name);
            return false;
        }
        // Remove the filter
        this.layers = this.layers.filter(function(_layer) {
            return _layer.layer.name !== layer.name;
        });
        // set the zOrder of the other layers
        for (var i = 0; i < this.layers.length; i++) {
            this.layers[i].zOrder = i;
            this.layers[i].layer.z_order = i;
        };
        return true;
    }

    /**
     * Set a camera to the full engine
     * @param {Camera} camera 
     * @returns 
     */
    setCamera(camera) {
        if (camera === null || camera === undefined) {
            console.error('No valid camera was found to be add to the engine');
            return false;
        }

        this.currentCamera = camera;
        return true;
    }

    /**
     * Get top layer
     * @returns {Layer} layer
     */
    getTopLayer() {
        if (this.layers.length == 1) {
            return this.layers[0];
        }

        if (this.layers.length > 1) {
            let layer = this.layers[0].layer;
            for (var i = 1; i < this.layers.length; i++) {
                if (this.layers[i].layer.z_order > layer.z_order) {
                    layer = this.layers[i].layer;
                }
            }

            return layer;
        }

        return null;
    }

    /**
     * Get data passed from a previous scene via goToScene
     * @returns {Object|null}
     */
    getIncomingData() {
        return this._incomingData;
    }

    /**
     * Set the scene to created
     */
    created() { this.isCreated = true; }

    /**
     * End scene and run the OnDestroy
     */
    ended() {
        this.OnDestroy();
        this.isEnded = true;
        this.engine.nextScene();
    }

    /**
     * OnCreate function run's Once
     * @returns {boolean}
     */
    OnCreate() { return true; }

    /**
     * Run every second
     * @param {float} elapsedTime 
     * @returns {boolean}
     */
    OnUpdate(elapsedTime) { return true; }

    /**
     * Run's once after the end of the scene
     * @returns {boolean}
     */
    OnDestroy() { return true; }
}