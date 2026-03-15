class DebugOverlay {
    constructor(engine) {
        this.engine = engine;
        this.showCollisionBoxes = false;
        this.showCameraBounds = false;
        this.showObjectCount = false;
    }

    /**
     * Draw debug info (call at end of update loop)
     */
    draw() {
        var drawer = this.engine.drawer;
        var scene = this.engine.currentScene;
        if (!scene) return;

        var y = 40;

        // Object count
        if (this.showObjectCount) {
            var objCount = scene.gameObjects.length;
            var layerObjCount = 0;
            var elementCount = 0;
            for (var i = 0; i < scene.layers.length; i++) {
                layerObjCount += scene.layers[i].layer.gameObjects.length;
                elementCount += scene.layers[i].layer.elements.length;
            }
            drawer.text(`Objects: ${objCount + layerObjCount} | Elements: ${elementCount} | Layers: ${scene.layers.length}`,
                { X: 10, Y: y }, 12, 'monospace', 'bold', 'lime');
            y += 16;
        }

        // Camera bounds
        if (this.showCameraBounds && scene.currentCamera) {
            drawer.camera(scene.currentCamera);
        }

        // Collision boxes
        if (this.showCollisionBoxes) {
            for (var i = 0; i < scene.gameObjects.length; i++) {
                var obj = scene.gameObjects[i];
                if (obj.showIt && obj.sprite) {
                    drawer.rectangle(obj.position, new Size(obj.sprite.width, obj.sprite.height), false, 1, 'lime', 0.5);
                }
            }
            for (var i = 0; i < scene.layers.length; i++) {
                var layer = scene.layers[i].layer;
                for (var j = 0; j < layer.gameObjects.length; j++) {
                    var obj = layer.gameObjects[j];
                    if (obj.showIt && obj.sprite) {
                        drawer.rectangle(obj.position, new Size(obj.sprite.width, obj.sprite.height), false, 1, 'lime', 0.5);
                    }
                }
            }
        }
    }
}
