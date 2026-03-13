class MessageBox {
    constructor(engine, game) {
        this.engine = engine;
        this.game = game;
        this.isOpen = false;
        this.type = 'none';
        this.button1 = null;
        this.button2 = null;
        this.message = '';
        this.callback = null;
        this.size = new Size(350, 180);
        this.cpu = false;
        this.clickSound = new Sound('./assets/audio/click.mp3', 80);
        this._btn1Hovered = false;
        this._btn2Hovered = false;
    }

    simple(message, callback, cpu, width, height) {
        this.cpu = cpu || false;
        if (this.cpu) {
            // CPU: fire callback immediately, skip display
            if (callback) callback();
            return this;
        }
        this.type = 'simple';
        this.size = new Size(width || 350, height || 180);
        this.callback = callback || null;
        this.message = message;
        return this;
    }

    custom(message, button1, button2, cpu, width, height) {
        this.cpu = cpu || false;
        if (this.cpu) {
            // CPU: skip display, CPU decisions are handled by the CPU class
            return this;
        }
        this.type = 'custom';
        this.size = new Size(width || 450, height || 220);
        this.message = message;
        this.button1 = button1;
        this.button2 = button2;
        this.game.canEnd = false;
        return this;
    }

    deleteAfter(second) {
        second = (second || 5) * 1000;
        setTimeout(function() {
            this.remove();
        }.bind(this), second);
    }

    remove() {
        this.message = '';
        this.button1 = null;
        this.button2 = null;
        this.callback = null;
        this.type = 'none';
        this.size = new Size(350, 180);
        this.game.canEnd = true;
        this.isOpen = false;
        this._btn1Hovered = false;
        this._btn2Hovered = false;
    }

    _drawButton(label, x, y, w, h, baseColor, hoverColor, isHovered) {
        var color = isHovered ? hoverColor : baseColor;
        this.engine.drawer.rectangle(new Position(x, y), new Size(w, h), true, 1, color);
        this.engine.drawer.rectangle(new Position(x, y), new Size(w, h), false, 1, 'rgba(255,255,255,0.15)');
        var textW = this.engine.drawer.textWidth(label, 13, 'monospace', 'bold');
        var tx = x + (w - textW) / 2;
        var ty = y + (h + 13) / 2 - 2;
        this.engine.drawer.text(label, new Position(tx, ty), 13, 'monospace', 'bold', 'white');
    }

    draw() {
        if (this.type == 'none') {
            this.isOpen = false;
            return;
        }

        var drawer = this.engine.drawer;
        var sw = this.engine.screenSize().width;
        var sh = this.engine.screenSize().height;
        var x = (sw / 2) - (this.size.width / 2);
        var y = (sh / 2) - (this.size.height / 2);

        // Dark overlay
        drawer.rectangle(new Position(0, 0), new Size(sw, sh), true, 1, 'rgba(0,0,0,0.7)');

        // Dark panel
        drawer.rectangle(new Position(x, y), this.size, true, 1, 'rgba(12, 12, 28, 0.95)');
        drawer.rectangle(new Position(x, y), this.size, false, 2, '#ff8844');

        // Message text
        drawer.text(this.message, new Position(x + 25, y + 35), 13, 'monospace', 'normal', '#ddeeff');

        if (this.cpu) return;

        if (this.type == 'simple') {
            this.isOpen = true;
            var bw = 100;
            var bh = 36;
            var bx = x + (this.size.width - bw) / 2;
            var by = y + this.size.height - bh - 20;

            this._btn1Hovered = this.engine.mouseOnTopOfPosition(new Position(bx, by), new Size(bw, bh));
            this._drawButton('OK', bx, by, bw, bh, '#2a4a6a', '#3a6a8a', this._btn1Hovered);

            if (this._btn1Hovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                this.clickSound.play();
                if (this.callback) this.callback();
            }
        } else {
            this.isOpen = true;
            var bw = 120;
            var bh = 36;
            var gap = 20;
            var totalW = this.button1 && this.button2 ? bw * 2 + gap : bw;
            var startX = x + (this.size.width - totalW) / 2;
            var by = y + this.size.height - bh - 20;

            if (this.button1) {
                var b1x = startX;
                this._btn1Hovered = this.engine.mouseOnTopOfPosition(new Position(b1x, by), new Size(bw, bh));
                this._drawButton(
                    this.button1.label || 'Yes', b1x, by, bw, bh,
                    this.button1.color || '#1a5c2a',
                    this.button1.hoverColor || '#2a7a3e',
                    this._btn1Hovered
                );
                if (this._btn1Hovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                    this.clickSound.play();
                    if (this.button1.callback) this.button1.callback();
                }
            }

            if (this.button2) {
                var b2x = this.button1 ? startX + bw + gap : startX;
                this._btn2Hovered = this.engine.mouseOnTopOfPosition(new Position(b2x, by), new Size(bw, bh));
                this._drawButton(
                    this.button2.label || 'No', b2x, by, bw, bh,
                    this.button2.color || '#5c1a1a',
                    this.button2.hoverColor || '#7a2a2a',
                    this._btn2Hovered
                );
                if (this._btn2Hovered && this.engine.mouseClicked(MouseButton.LEFT)) {
                    this.clickSound.play();
                    if (this.button2.callback) this.button2.callback();
                }
            }
        }
    }
}
