class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
        canvas.style.willChange = 'transform';
        this.drawer = new Drawer(canvas);
        this.input = new InputManager(canvas);
        this.sound = new SoundManager();
        this.tweens = new TweenManager();
        this.assets = new AssetManager();
        this.debug = new DebugOverlay(this);
        this.displayFPS = false;
        this.calculeFPS = false;
        this.engineActive = false;
        this.timerElement = null;
        this.endTime = new Date();
        this.startTime = new Date();
        this.elapsedTime = 0;
        this.paused = false;
        this.frameTimer = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.currentScene = null;
        this.scenes = [];
        this.jumpEngineIntro = false;
        // Track mouse position event
        this.mousePoint = new Point(0, 0);
        this.mouseButton = [];
        this.mouseClicking = false;
        this.keys = [];
        this.isKeyClicked = false;
        this.clickDelay = true;
        this.clickDelayCounter = 0.1;
        this._transition = null;
        // Store bound handlers so they can be removed on stop
        this._onMouseMove = function(e) {
            var rect = this.canvas.getBoundingClientRect();
            this.mousePoint = new Point(e.clientX - rect.left, e.clientY - rect.top);
        }.bind(this);
        this._onMouseDown = function(e) {
            var btn = e.button;
            if (!this.mouseButton.includes(btn)) this.mouseButton.push(btn);
            this.mouseClicking = true;
        }.bind(this);
        this._onMouseUp = function(e) {
            var btn = e.button;
            if (this.mouseButton.includes(btn)) {
                this.mouseButton = this.removeItemAll(this.mouseButton, btn);
            }
            this.mouseClicking = false;
        }.bind(this);
        this._onKeyDown = function(e) {
            if (!this.keys.includes(e.code)) this.keys.push(e.code);
            this.isKeyClicked = true;
        }.bind(this);
        this._onKeyUp = function(e) {
            if (this.keys.includes(e.code)) {
                this.keys = this.removeItemAll(this.keys, e.code);
            }
            this.isKeyClicked = false;
        }.bind(this);

        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('mousedown', this._onMouseDown);
        this.canvas.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('keydown', this._onKeyDown, false);
        window.addEventListener('keyup', this._onKeyUp, false);
    }

    /**
     * Create intro scene for the engine
     */
    addIntroScene() {
        this.scenes.unshift(new IntroScene(this));
    }

    /**
     * Remove all int from an array
     * @param {Array} arr 
     * @param {Int} value 
     * @returns {Array}
     */
    removeItemAll(arr, value) {
        var i = 0;
        while (i < arr.length) {
            if (arr[i] === value) {
                arr.splice(i, 1);
            } else {
                ++i;
            }
        }
        return arr;
    }

    /**
     * Get true/false if a mouse button is clicked
     * @param {MouseButton} button 
     * @returns {boolean}
     */
    mouseClicked(button) {
        if (this.clickDelay) {
            if (this.clickDelayCounter <= 0) {
                this.clickDelayCounter = 0.1;
                return this.mouseButton.includes(button);
            } else {
                this.clickDelayCounter -= this.elapsedTime;
                return false;
            }
        }
        return this.mouseButton.includes(button);
    }

    /**
     * Get true/false if a key is clicked
     * @param {KeyButton} key 
     * @returns {boolean}
     */
    keyClicked(key) {
        if (this.clickDelay) {
            if (this.clickDelayCounter <= 0) {
                this.clickDelayCounter = 0.1;
                return this.keys.includes(key);
            } else {
                this.clickDelayCounter -= this.elapsedTime;
                return false;
            }
        }
        return this.keys.includes(key);
    }

    /**
     * Pause the game simulation. Rendering continues but elapsedTime
     * is zeroed so movement stops. Tweens are frozen.
     */
    pause() { this.paused = true; }

    /**
     * Resume the game simulation
     */
    resume() { this.paused = false; }

    /**
     * Check if the engine is paused
     * @returns {boolean}
     */
    isPaused() { return this.paused; }

    /**
     * Those functions will be overrided by the user
     * OnCreate is fired on time at first to setup the game
     */
    OnCreate() {
        return true;
    }

    /**
     * Those functions will be overrided by the user
     * OnUpdate is executed each time
     * @param {double} elapsedTime 
     * @returns 
     */
    OnUpdate(elapsedTime) {
        return true;
    }

    /**
     * Set canvas size manually
     * @param {number} width
     * @param {number} height
     */
    setCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    /**
     * Make the canvas fill the entire browser window and auto-resize
     */
    setFullScreen() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this._fullScreen = true;
        this._onResize = function() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    /**
     * Get the canvas size
     * @returns Size
     */
    screenSize() {
        return new Size(this.canvas.width, this.canvas.height);
    }

    /**
     * Get current mouse point on the canvas
     * @returns {Point}
     */
    mousePosition() {
        return this.mousePoint;
    }

    /**
     * Start the engine timer
     * @returns bool
     */
    start() {
        if (this.drawer.ctx === null || this.drawer.ctx === undefined) {
            console.error('No canvas was found!');
            return false;
        }
        // add intro scene
        if (!this.jumpEngineIntro) this.addIntroScene();
        return this.startEngine();
    }

    /**
     * Stop's the engine timer
     * @returns bool
     */
    stop() {
        return this.stopEngine();
    }

    /**
     * Execute the OnCreate user function and start the timer
     * @returns bool
     */
    startEngine() {
        var result = this.OnCreate();
        this.engineActive = result !== false; // only explicit 'return false' stops the engine
        this.startTime = performance.now();
        this._boundLoop = this._gameLoop.bind(this);
        this._rafId = requestAnimationFrame(this._boundLoop);
        return this.engineActive;
    }

    /**
     * Main game loop using requestAnimationFrame
     * @param {number} timestamp
     */
    _gameLoop(timestamp) {
        if (!this.engineActive) return;
        this.timerElapsed(timestamp);
        this._rafId = requestAnimationFrame(this._boundLoop);
    }

    /**
     * Stop the engine
     * @returns bool
     */
    stopEngine() {
        this.engineActive = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        // Remove event listeners to prevent leaks
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('mousedown', this._onMouseDown);
        this.canvas.removeEventListener('mouseup', this._onMouseUp);
        window.removeEventListener('keydown', this._onKeyDown, false);
        window.removeEventListener('keyup', this._onKeyUp, false);
        if (this._onResize) {
            window.removeEventListener('resize', this._onResize);
        }
        return true;
    }

    /**
     * Force image to preload
     * @param {string} url 
     * @returns {Image}
     */
    preloadImage(url) {
        const img = new Image();
        img.src = url;
        return img
    }

    /**
     * Register Scene to the engine
     * @param {Scene} scene 
     * @returns 
     */
    registerScene(scene) {
        if (scene === null || scene === undefined) {
            console.error('No valid scene was found to be registred to the engine');
            return false;
        }

        this.scenes.push(scene);
        return true;
    }

    /**
     * Set the current scene to be displayed
     * @param {Scene} scene
     * @param {Object} data - optional data to pass to the new scene
     * @param {string} transition - 'none', 'fade', 'slide-left', 'slide-right'
     * @param {number} duration - transition duration in seconds (default 0.5)
     * @returns {boolean}
     */
    goToScene(scene, data, transition, duration) {
        if (scene === null || scene === undefined) return false;
        if (this._transition) return false; // already transitioning

        transition = transition || 'none';
        duration = duration || 0.5;

        scene._incomingData = data || null;

        if (transition === 'none' || !this.currentScene) {
            if (this.currentScene !== null) {
                this.currentScene.ended();
            }
            scene.reset();
            this.currentScene = scene;
            return true;
        }

        // Start transition — keep old scene visible during fade-out
        this._transition = {
            type: transition,
            duration: duration,
            elapsed: 0,
            newScene: scene,
            phase: 'out' // 'out' then 'in'
        };
        return true;
    }

    /**
     * Go to the next scene
     */
    nextScene() {
        if (this.currentScene !== null) {
            if (this.scenes.length > 0) {
                for (var i = 0; i < this.scenes.length; i++) {
                    if (!this.scenes[i].isEnded) {
                        this.currentScene = this.scenes[i];
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Set the current scene by default
     * @returns {boolean}
     */
    executeScenes() {
        if (this.currentScene === null) {
            if (this.scenes.length > 0) {
                for (var i = 0; i < this.scenes.length; i++) {
                    if (!this.scenes[i].isEnded) {
                        this.currentScene = this.scenes[i];
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Check if the mouse is on top of an object or element
     * @param {GameObject | Element} gameObject 
     */
    mouseOnTopOf(gameObject) {
        if (gameObject === null || gameObject === undefined)
            return false;
        let found = true;
        if (this.currentScene != null) {
            let layer = this.currentScene.getTopLayer();
            if (layer != null) {
                if (!gameObject.showIt) {
                    // hidden
                    found = false;
                }
                if (gameObject instanceof GameObject) {
                    if (layer.gameObjects != undefined) {
                        if (layer.gameObjects.filter(e => e.id === gameObject.id).length <= 0) {
                            // not found in layer
                            found = false;
                        }
                    }
                } else if (gameObject instanceof Element) {
                    if (layer.elements != undefined) {
                        if (layer.elements.filter(e => e.id === gameObject.id).length <= 0) {
                            // not found in layer
                            found = false;
                        }
                    }
                }
            } else {
                if (gameObject instanceof GameObject) {
                    if (this.currentScene.gameObjects != undefined) {
                        if (this.currentScene.gameObjects.filter(e => e.id === gameObject.id).length <= 0) {
                            // not found in scene
                            found = false;
                        }
                    }
                }
            }

            if (!found) {
                for (var i = 0; i < this.currentScene.layers.length; i++) {
                    let layer = this.currentScene.layers[i].layer;
                    if (gameObject instanceof GameObject) {
                        if (layer.gameObjects != undefined) {
                            if (layer.gameObjects.filter(e => e.id === gameObject.id).length > 0) {
                                // found in layer
                                found = true;
                            }
                        }
                    } else if (gameObject instanceof Element) {
                        if (layer.elements != undefined) {
                            if (layer.elements.filter(e => e.id === gameObject.id).length > 0) {
                                // found in layer
                                found = true;
                            }
                        }
                    }
                }
            }
        }

        if (!found) return false;

        return (this.mousePosition().X < gameObject.position.X + gameObject.sprite.width &&
            this.mousePosition().X + 1 > gameObject.position.X &&
            this.mousePosition().Y < gameObject.position.Y + gameObject.sprite.height &&
            this.mousePosition().Y + 1 > gameObject.position.Y);
    }

    /**
     * Check if the mouse is on top of square
     * @param {GameObject} gameObject 
     */
    mouseOnTopOfPosition(position, size) {
        if (position === null || position === undefined || size === null || size === undefined)
            return false;

        return (this.mousePosition().X < position.X + size.width &&
            this.mousePosition().X + 1 > position.X &&
            this.mousePosition().Y < position.Y + size.height &&
            this.mousePosition().Y + 1 > position.Y);
    }

    /**
     * Compare to layer object by zorder
     * @param {object} a 
     * @param {object} b 
     * @returns {int}
     */
    compareLayers(a, b) {
        if (a.zOrder < b.zOrder) {
            return -1;
        }
        if (a.zOrder > b.zOrder) {
            return 1;
        }
        return 0;
    }

    /**
     * Update parent-child attachments across all layers.
     * Called each frame before rendering so children follow their parents.
     */
    _updateAttachments() {
        if (!this.currentScene) return;
        for (var i = 0; i < this.currentScene.layers.length; i++) {
            var layer = this.currentScene.layers[i].layer;
            for (var j = 0; j < layer.gameObjects.length; j++) {
                var go = layer.gameObjects[j];
                if (go._attachParent) go.updateAttachment();
            }
            for (var j = 0; j < layer.elements.length; j++) {
                var el = layer.elements[j];
                if (el._attachParent) el.updateAttachment();
            }
        }
    }

    /**
     * Draw a shape-based game object (rectangle, circle, triangle)
     * @param {GameObject} go
     * @param {Camera} camera
     */
    _drawShapeGameObject(go, camera) {
        var d = this.drawer;
        var op = go.opacity !== undefined ? go.opacity : 1;
        switch (go._shapeType) {
            case 'rectangle':
                d.rectangle(go.position, go._shapeSize, true, 1, go._fillColor || '#e74c3c', op, camera);
                if (go._borderColor) {
                    d.rectangle(go.position, go._shapeSize, false, go._borderWidth || 1, go._borderColor, op, camera);
                }
                break;
            case 'circle':
                d.circle(go.position, go._radius || 20, 0, -1, true, 1, go._fillColor || '#3498db', op, camera);
                if (go._borderColor) {
                    d.circle(go.position, go._radius || 20, 0, -1, false, go._borderWidth || 1, go._borderColor, op, camera);
                }
                break;
            case 'triangle':
                d.triangle(go.position, go._shapeSize, true, 1, go._fillColor || '#2ecc71', op, camera);
                if (go._borderColor) {
                    d.triangle(go.position, go._shapeSize, false, go._borderWidth || 1, go._borderColor, op, camera);
                }
                break;
        }
    }

    /**
     * Timer callback function, where the magic is running
     */
    timerElapsed(timestamp) {
        this.drawer.clear();
        // Calculate the delta time
        if (timestamp === undefined) timestamp = performance.now();
        this.elapsedTime = (timestamp - this.startTime) / 1000;
        if (this.elapsedTime > 0.1) this.elapsedTime = 0.016; // cap to prevent spiral of death
        this.startTime = timestamp;

        // When paused, store real delta for FPS but zero out elapsed for game logic
        var realElapsedTime = this.elapsedTime;
        if (this.paused) {
            this.elapsedTime = 0;
        }
        // Run the user logic everytime
        // this.engineActive = this.OnUpdate(this.elapsedTime);

        this.executeScenes();
        if (this.currentScene !== null) {
            if (!this.currentScene.isCreated) {
                this.currentScene.OnCreate();
                this.currentScene.created();
            }

            // execute the scene logic
            this.currentScene.OnUpdate(this.elapsedTime);

            // Update parent-child attachments before rendering
            this._updateAttachments();

            for (let i = 0; i < this.currentScene.gameObjects.length; i++) {
                if (this.currentScene.gameObjects[i].showIt)
                    this.drawer.gameObject(this.currentScene.gameObjects[i], 1, this.currentScene.currentCamera);
            }
            this.currentScene.layers.sort(this.compareLayers);

            // Pass 1: World layers (affected by camera)
            for (var i = 0; i < this.currentScene.layers.length; i++) {
                let container = this.currentScene.layers[i];
                let layer = container.layer;
                if (layer.isUI) continue;

                for (let j = 0; j < layer.elements.length; j++) {
                    let element = layer.elements[j];
                    if (!element.showIt) continue;
                    if (element._isLabel || element._isPanel || element._isCircle) {
                        element.draw(this.drawer);
                    } else if (!element._useSprites && typeof element.drawFallback === 'function') {
                        element.drawFallback(this.drawer);
                    } else {
                        this.drawer.element(element, element.opacity, this.currentScene.currentCamera);
                    }
                }

                for (let j = 0; j < layer.gameObjects.length; j++) {
                    let gameObject = layer.gameObjects[j];
                    if (!gameObject.showIt) continue;
                    if (gameObject._shapeType) {
                        this._drawShapeGameObject(gameObject, this.currentScene.currentCamera);
                    } else {
                        this.drawer.gameObject(gameObject, gameObject.opacity, this.currentScene.currentCamera);
                    }
                }
            }

            // Pass 2: UI layers (screen space, no camera)
            for (var i = 0; i < this.currentScene.layers.length; i++) {
                let container = this.currentScene.layers[i];
                let layer = container.layer;
                if (!layer.isUI) continue;

                for (let j = 0; j < layer.elements.length; j++) {
                    let element = layer.elements[j];
                    if (!element.showIt) continue;

                    if (typeof element.update === 'function') {
                        element.update(this);
                    }

                    if (element._isLabel || element._isPanel || element._isCircle) {
                        element.draw(this.drawer);
                    } else if (!element._useSprites && typeof element.drawFallback === 'function') {
                        element.drawFallback(this.drawer);
                    } else {
                        this.drawer.element(element, element.opacity, null);
                    }
                }

                for (let j = 0; j < layer.gameObjects.length; j++) {
                    let gameObject = layer.gameObjects[j];
                    if (!gameObject.showIt) continue;
                    if (gameObject._shapeType) {
                        this._drawShapeGameObject(gameObject, null);
                    } else {
                        this.drawer.gameObject(gameObject, gameObject.opacity, null);
                    }
                }
            }
        }
        // Update tweens (skip when paused)
        if (!this.paused) {
            this.tweens.update(this.elapsedTime);
        }

        // Draw scene transition overlay (freeze when paused)
        if (this._transition) {
            this._drawTransition(this.paused ? 0 : this.elapsedTime);
        }

        // Debug overlay
        this.debug.draw();

        // Display FPS
        if (this.calculeFPS || this.displayFPS) {
            this.frameTimer += realElapsedTime;
            this.frameCount += 1;
            if (this.frameTimer >= 1) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.frameTimer = 0;
            }
            if (this.displayFPS) {
                this.drawer.text(`FPS: ${this.fps}`, { X: 10, Y: 20 }, 14, 'monospace', 'bold', 'lime');
            }
        }
        // Clear per-frame input state
        this.input.update();
    }

    /**
     * Draw scene transition effect
     * @param {number} dt
     */
    _drawTransition(dt) {
        var t = this._transition;
        t.elapsed += dt;
        var progress = Math.min(t.elapsed / t.duration, 1);

        var ctx = this.drawer.ctx;
        var w = this.canvas.width;
        var h = this.canvas.height;

        // Draw the overlay
        if (t.type === 'fade') {
            var alpha = t.phase === 'out' ? progress : 1 - progress;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        } else if (t.type === 'slide-left') {
            var offset = t.phase === 'out' ? progress * w : (1 - progress) * w;
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'black';
            ctx.fillRect(w - offset, 0, offset, h);
            ctx.restore();
        } else if (t.type === 'slide-right') {
            var offset = t.phase === 'out' ? progress * w : (1 - progress) * w;
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, offset, h);
            ctx.restore();
        }

        // When fade-out completes, switch scenes at peak black
        if (t.phase === 'out' && progress >= 1) {
            if (this.currentScene) {
                this.currentScene.ended();
            }
            t.newScene.reset();
            this.currentScene = t.newScene;
            t.phase = 'in';
            t.elapsed = 0;
        }

        // When fade-in completes, end transition
        if (t.phase === 'in' && progress >= 1) {
            this._transition = null;
        }
    }

}