class Lighting {
    /**
     * 2D lighting system using offscreen canvas with radial gradients
     * @param {Engine} engine
     */
    constructor(engine) {
        this.engine = engine;
        this.lights = [];
        this.ambientColor = 'black';
        this.ambientAlpha = 0.85;
        this._shadowCanvas = null;
        this._shadowCtx = null;
        this._time = 0;
    }

    /**
     * Add a light source
     * @param {LightSpot} light
     * @returns {LightSpot}
     */
    addLightSpot(light) {
        this.lights.push(light);
        return light;
    }

    /**
     * Remove a light source
     * @param {LightSpot} light
     */
    removeLightSpot(light) {
        var idx = this.lights.indexOf(light);
        if (idx !== -1) this.lights.splice(idx, 1);
    }

    /**
     * Remove all lights
     */
    clearLights() {
        this.lights = [];
    }

    /**
     * Ensure offscreen canvas exists and matches main canvas size
     */
    _ensureCanvas() {
        var w = this.engine.canvas.width;
        var h = this.engine.canvas.height;
        if (!this._shadowCanvas || this._shadowCanvas.width !== w || this._shadowCanvas.height !== h) {
            this._shadowCanvas = document.createElement('canvas');
            this._shadowCanvas.width = w;
            this._shadowCanvas.height = h;
            this._shadowCtx = this._shadowCanvas.getContext('2d');
        }
    }

    /**
     * Draw the lighting overlay
     * @param {number} elapsedTime - delta time for flicker animation
     * @param {Camera} camera - optional camera for world-space offset
     */
    draw(elapsedTime, camera) {
        if (elapsedTime === undefined) elapsedTime = 0.016;
        this._time += elapsedTime;
        this._ensureCanvas();

        var ctx = this._shadowCtx;
        var w = this._shadowCanvas.width;
        var h = this._shadowCanvas.height;

        // Camera zoom support
        var zoom = (camera && typeof camera.getZoom === 'function') ? camera.getZoom() : 1;
        var useWorldCamera = camera && camera.location && typeof camera.getZoom === 'function';
        var hw = camera ? camera.cameraSize.width / 2 : 0;
        var hh = camera ? camera.cameraSize.height / 2 : 0;

        // Fill with ambient darkness
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.ambientColor;
        ctx.fillRect(0, 0, w, h);

        // Skip drawing if fully transparent (daytime optimization)
        if (this.ambientAlpha < 0.01) {
            return;
        }

        // Cut light holes using destination-out
        ctx.globalCompositeOperation = 'destination-out';

        for (var i = 0; i < this.lights.length; i++) {
            var light = this.lights[i];
            if (!light.active) continue;

            var lx = light.position.X;
            var ly = light.position.Y;

            // Apply camera transform (zoom-aware or legacy offset)
            if (useWorldCamera) {
                lx = hw + (lx - camera.location.X) * zoom;
                ly = hh + (ly - camera.location.Y) * zoom;
            } else if (camera && camera.addOffset) {
                lx += camera.offset.X;
                ly += camera.offset.Y;
            }

            // Compute effective radius with flicker + zoom
            var radius = light.radius * zoom;

            // Frustum culling — skip lights fully off-screen
            if (lx + radius < 0 || lx - radius > w || ly + radius < 0 || ly - radius > h) continue;
            if (light.flicker > 0) {
                var f1 = Math.sin(this._time * 8.7 + light._flickerOffset) * 0.5;
                var f2 = Math.sin(this._time * 13.3 + light._flickerOffset * 2.1) * 0.3;
                var f3 = Math.sin(this._time * 5.1 + light._flickerOffset * 0.7) * 0.2;
                radius *= 1.0 + (f1 + f2 + f3) * light.flicker;
            }

            // Radial gradient: bright center -> transparent edge
            var grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius);
            grad.addColorStop(0, 'rgba(0,0,0,' + light.intensity + ')');
            grad.addColorStop(0.4, 'rgba(0,0,0,' + (light.intensity * 0.6) + ')');
            grad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = grad;
            this._fillLightShape(ctx, light, lx, ly, radius);
        }

        // Add colored light glow using lighter blending
        ctx.globalCompositeOperation = 'lighter';

        for (var i = 0; i < this.lights.length; i++) {
            var light = this.lights[i];
            if (!light.active) continue;

            if (light.color.red === 255 && light.color.green === 255 && light.color.blue === 255) continue;

            var lx = light.position.X;
            var ly = light.position.Y;

            if (useWorldCamera) {
                lx = hw + (lx - camera.location.X) * zoom;
                ly = hh + (ly - camera.location.Y) * zoom;
            } else if (camera && camera.addOffset) {
                lx += camera.offset.X;
                ly += camera.offset.Y;
            }

            var radius = light.radius * zoom;

            // Frustum culling
            if (lx + radius < 0 || lx - radius > w || ly + radius < 0 || ly - radius > h) continue;

            if (light.flicker > 0) {
                var f1 = Math.sin(this._time * 8.7 + light._flickerOffset) * 0.5;
                var f2 = Math.sin(this._time * 13.3 + light._flickerOffset * 2.1) * 0.3;
                var f3 = Math.sin(this._time * 5.1 + light._flickerOffset * 0.7) * 0.2;
                radius *= 1.0 + (f1 + f2 + f3) * light.flicker;
            }

            var r = light.color.red;
            var g = light.color.green;
            var b = light.color.blue;
            var a = light.intensity * 0.3;

            var grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius * 0.8);
            grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')');
            grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');

            ctx.fillStyle = grad;
            this._fillLightShape(ctx, light, lx, ly, radius * 0.8);
            ctx.fill();
        }

        // Draw shadow canvas onto main canvas
        ctx.globalCompositeOperation = 'source-over';
        var mainCtx = this.engine.drawer.ctx;
        mainCtx.save();
        mainCtx.globalAlpha = this.ambientAlpha;
        mainCtx.drawImage(this._shadowCanvas, 0, 0);
        mainCtx.restore();
    }

    /**
     * Fill a light shape — circle or cone (triangle)
     * @param {CanvasRenderingContext2D} ctx
     * @param {LightSpot} light
     * @param {number} lx - screen X
     * @param {number} ly - screen Y
     * @param {number} radius - effective radius (with zoom/flicker applied)
     */
    _fillLightShape(ctx, light, lx, ly, radius) {
        ctx.beginPath();
        if (light.shape === 'cone') {
            // Triangle/cone: starts at position, fans out in direction
            var dir = light.direction;
            var spread = light.spread;
            ctx.moveTo(lx, ly);
            ctx.arc(lx, ly, radius, dir - spread, dir + spread);
            ctx.closePath();
        } else {
            // Default circle
            ctx.arc(lx, ly, radius, 0, Math.PI * 2);
        }
        ctx.fill();
    }
}
