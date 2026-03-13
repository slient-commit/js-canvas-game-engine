class ShadowSystem {
    /**
     * 2D directional shadow system using offscreen canvas
     * @param {Engine} engine
     */
    constructor(engine) {
        this.engine = engine;
        this.casters = [];
        this.lightAngle = 225;
        this.shadowLength = 40;
        this.shadowColor = 'black';
        this.shadowOpacity = 0.4;
        this.blur = 4;
        this._shadowCanvas = null;
        this._shadowCtx = null;
    }

    /**
     * Add a shadow caster
     * @param {ShadowCaster} caster
     * @returns {ShadowCaster}
     */
    addCaster(caster) {
        this.casters.push(caster);
        return caster;
    }

    /**
     * Remove a shadow caster
     * @param {ShadowCaster} caster
     */
    removeCaster(caster) {
        var idx = this.casters.indexOf(caster);
        if (idx !== -1) this.casters.splice(idx, 1);
    }

    /**
     * Remove all casters
     */
    clearCasters() {
        this.casters = [];
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
     * Draw a projected hexagonal shadow for a rectangle caster
     */
    _drawRectShadow(ctx, sx, sy, cw, ch, dx, dy) {
        var tl  = { x: sx,      y: sy };
        var tr  = { x: sx + cw, y: sy };
        var br  = { x: sx + cw, y: sy + ch };
        var bl  = { x: sx,      y: sy + ch };
        var tl2 = { x: sx + dx,      y: sy + dy };
        var tr2 = { x: sx + cw + dx, y: sy + dy };
        var br2 = { x: sx + cw + dx, y: sy + ch + dy };
        var bl2 = { x: sx + dx,      y: sy + ch + dy };

        var points;
        if (dx >= 0 && dy >= 0) {
            points = [tl, tr, tr2, br2, bl2, bl];
        } else if (dx < 0 && dy >= 0) {
            points = [tl, tr, br, br2, bl2, tl2];
        } else if (dx >= 0 && dy < 0) {
            points = [tl, tl2, tr2, br2, br, bl];
        } else {
            points = [tl2, tr2, tr, br, bl, bl2];
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var j = 1; j < points.length; j++) {
            ctx.lineTo(points[j].x, points[j].y);
        }
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw an ellipse shadow for an ellipse caster
     */
    _drawEllipseShadow(ctx, sx, sy, cw, ch, dx, dy, angleRad) {
        var cx = sx + cw / 2 + dx;
        var cy = sy + ch / 2 + dy * 0.5;
        var rx = cw / 2 * 1.2;
        var ry = ch / 3;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRad + Math.PI);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draw all shadows
     * @param {Camera} [camera] - optional camera for world-space offset
     */
    draw(camera) {
        this._ensureCanvas();

        var ctx = this._shadowCtx;
        var w = this._shadowCanvas.width;
        var h = this._shadowCanvas.height;

        // Clear shadow canvas
        ctx.clearRect(0, 0, w, h);

        // Compute shadow direction (opposite of light angle)
        var angleRad = this.lightAngle * Math.PI / 180;
        var baseDx = Math.cos(angleRad + Math.PI) * this.shadowLength;
        var baseDy = Math.sin(angleRad + Math.PI) * this.shadowLength;

        // Draw all shadows solid on offscreen canvas
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.shadowColor;

        for (var i = 0; i < this.casters.length; i++) {
            var caster = this.casters[i];
            if (!caster.active) continue;

            var dx = baseDx * caster.heightScale;
            var dy = baseDy * caster.heightScale;

            var sx = caster.position.X;
            var sy = caster.position.Y;

            // Apply camera offset
            if (camera && camera.addOffset) {
                sx += camera.offset.X;
                sy += camera.offset.Y;
            }

            var cw = caster.size.width;
            var ch = caster.size.height;

            if (caster.type === 'ellipse') {
                this._drawEllipseShadow(ctx, sx, sy, cw, ch, dx, dy, angleRad);
            } else {
                this._drawRectShadow(ctx, sx, sy, cw, ch, dx, dy);
            }
        }

        // Composite shadow canvas onto main canvas with blur and opacity
        var mainCtx = this.engine.drawer.ctx;
        mainCtx.save();
        mainCtx.globalAlpha = this.shadowOpacity;
        if (this.blur > 0) {
            mainCtx.filter = 'blur(' + this.blur + 'px)';
        }
        mainCtx.drawImage(this._shadowCanvas, 0, 0);
        mainCtx.restore();
    }
}
