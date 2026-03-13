class IntroScene extends Scene {

    constructor(engine) {
        super('IntroScene', engine);
        this.timer = 0;
        this.sparkles = null;
    }

    OnCreate() {
        var sw = this.engine.screenSize().width;
        var sh = this.engine.screenSize().height;
        this.sparkles = new ParticleEmitter(this.engine, {
            position: new Vec2(sw / 2, sh / 2),
            minSpeed: 5,
            maxSpeed: 25,
            minAngle: 0,
            maxAngle: Math.PI * 2,
            minLife: 1.0,
            maxLife: 2.5,
            minSize: 1,
            maxSize: 3,
            startColor: new RGB(0, 180, 255, 0.6),
            endColor: new RGB(0, 80, 180, 0),
            gravity: new Vec2(0, 0),
            rate: 3,
            shape: 'circle'
        });
    }

    // Returns 0-1 progress for timer between start and end
    _t(start, end) {
        if (this.timer <= start) return 0;
        if (this.timer >= end) return 1;
        return (this.timer - start) / (end - start);
    }

    // Ease-out cubic
    _eo(t) { return 1 - Math.pow(1 - t, 3); }

    OnUpdate(elapsedTime) {
        this.timer += elapsedTime;

        var drawer = this.engine.drawer;
        var sw = this.engine.screenSize().width;
        var sh = this.engine.screenSize().height;
        var cx = sw / 2;
        var cy = sh / 2;

        // Master opacity: fade in 0-0.4s, fade out 3.2-3.8s
        var master = Math.min(
            this._eo(this._t(0, 0.4)),
            1 - this._eo(this._t(3.2, 3.8))
        );

        drawer.clearWithColor('#0a0a1a');

        // ---- Accent dot (appears first, pulses gently) ----
        var dotAlpha = master * this._eo(this._t(0.15, 0.4));
        var dotPulse = 1 + Math.sin(this.timer * 4) * 0.25;
        drawer.circle(
            new Vec2(cx, cy - 40),
            3 * dotPulse, 0, -1, true, 1, '#00bbff', dotAlpha
        );

        // ---- Corner brackets (frame that draws itself) ----
        var bp = this._eo(this._t(0.3, 0.9));
        var ba = master * this._eo(this._t(0.3, 0.7));
        var fw = Math.min(260, sw * 0.38);
        var fh = Math.min(70, sh * 0.12);
        var bl = 35 * bp;

        // Top-left
        drawer.line(new Vec2(cx - fw, cy - fh), new Vec2(cx - fw + bl, cy - fh), 2, '#00bbff', ba);
        drawer.line(new Vec2(cx - fw, cy - fh), new Vec2(cx - fw, cy - fh + bl), 2, '#00bbff', ba);
        // Top-right
        drawer.line(new Vec2(cx + fw, cy - fh), new Vec2(cx + fw - bl, cy - fh), 2, '#00bbff', ba);
        drawer.line(new Vec2(cx + fw, cy - fh), new Vec2(cx + fw, cy - fh + bl), 2, '#00bbff', ba);
        // Bottom-left
        drawer.line(new Vec2(cx - fw, cy + fh), new Vec2(cx - fw + bl, cy + fh), 2, '#00bbff', ba);
        drawer.line(new Vec2(cx - fw, cy + fh), new Vec2(cx - fw, cy + fh - bl), 2, '#00bbff', ba);
        // Bottom-right
        drawer.line(new Vec2(cx + fw, cy + fh), new Vec2(cx + fw - bl, cy + fh), 2, '#00bbff', ba);
        drawer.line(new Vec2(cx + fw, cy + fh), new Vec2(cx + fw, cy + fh - bl), 2, '#00bbff', ba);

        // ---- Horizontal separator (extends from center) ----
        var lineLen = 80 * this._eo(this._t(0.5, 1.0));
        var lineAlpha = master * this._eo(this._t(0.5, 0.9)) * 0.4;
        drawer.line(
            new Vec2(cx - lineLen, cy + 15),
            new Vec2(cx + lineLen, cy + 15),
            1, '#00bbff', lineAlpha
        );

        // ---- Title "JCGE" (slides up slightly as it fades in) ----
        var titleProg = this._eo(this._t(0.6, 1.2));
        var titleAlpha = master * titleProg;
        var titleText = "JCGE";
        var titleSize = Math.min(64, sw * 0.07);
        var titleW = drawer.textWidth(titleText, titleSize, 'monospace', 'bold');
        var titleSlide = (1 - titleProg) * 10;
        drawer.text(titleText,
            new Vec2(cx - titleW / 2, cy + titleSlide),
            titleSize, 'monospace', 'bold', 'white', titleAlpha
        );

        // ---- Subtitle ----
        var subAlpha = master * this._eo(this._t(1.0, 1.5));
        var subText = "JS Canvas Game Engine";
        var subW = drawer.textWidth(subText, 14, 'monospace', 'normal');
        drawer.text(subText,
            new Vec2(cx - subW / 2, cy + 35),
            14, 'monospace', 'normal', '#7799bb', subAlpha
        );

        // ---- Version ----
        var verAlpha = master * this._eo(this._t(1.3, 1.7));
        var verText = "v1.0";
        var verW = drawer.textWidth(verText, 11, 'monospace', 'normal');
        drawer.text(verText,
            new Vec2(cx - verW / 2, cy + 55),
            11, 'monospace', 'normal', '#445566', verAlpha
        );

        // ---- Author credit ----
        var authAlpha = master * this._eo(this._t(1.5, 2.0));
        var authText = "by MOURCHID Mohamed Kamal";
        var authW = drawer.textWidth(authText, 11, 'monospace', 'normal');
        drawer.text(authText,
            new Vec2(cx - authW / 2, sh - 35),
            11, 'monospace', 'normal', '#445566', authAlpha
        );

        // ---- Sparkle particles ----
        if (this.sparkles) {
            this.sparkles.position = new Vec2(cx, cy);
            this.sparkles.active = this.timer > 0.8 && this.timer < 3.2;
            this.sparkles.draw(elapsedTime);
        }

        // End scene after 4 seconds
        if (this.timer >= 4.0) {
            this.ended();
        }
    }
}
