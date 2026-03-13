class MessageBox {
    constructor(engine, game) {
        this.message = '';
        this.engine = engine;
        this.isOpen = false;
        this.ok = new Sprite(200, 50);

        this.game = game;

        this.yes = new Sprite(200, 50);
        this.no = new Sprite(200, 50);
        this.type = 'none';

        this.button1 = null;
        this.button2 = null;
        this.message = '';
        this.callback = null;
        this.size = new Size(300, 200);

        this.cpu = false;

        this.clickSound = new Sound('./assets/audio/click.mp3', 80);

    }

    simple(message, callback = null, cpu = false, width = 300, height = 200) {
        this.type = 'simple';
        this.size = new Size(width, height);
        this.callback = callback;
        this.message = message;
        this.cpu = cpu;
        this.ok = new Sprite(200, 50);
        this.ok.loadImage('./assets/sprites/buttons/ok_off.png');
        if (cpu) {
            this.deleteAfter(1);
        }
        return this;
    }

    custom(message, button1, button2, cpu = false, width = 600, height = 300) {
        this.type = 'custom';
        this.size = new Size(width, height);
        this.message = message;
        this.button1 = button1;
        this.button2 = button2;
        this.game.canEnd = false;
        this.cpu = cpu;
        this.yes = new Sprite(200, 50);
        this.no = new Sprite(200, 50);
        this.yes.loadImage('./assets/sprites/buttons/ok_off.png');
        this.no.loadImage('./assets/sprites/buttons/ok_off.png');
        if (cpu) {
            this.deleteAfter(1);
        }
        return this;
    }

    deleteAfter(second = 5) {
        second = second * 1000;
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
        this.ok.image = null;
        this.yes.image = null;
        this.no.image = null;
        this.size = new Size(300, 200);
        this.game.canEnd = true;
        this.isOpen = false;
    }

    draw() {
        if (this.type == 'none') {
            this.isOpen = false;
            // 
        } else if (this.type == 'simple') {
            this.isOpen = true;
            let x = (this.engine.screenSize().width / 2) - (this.size.width / 2);
            let y = (this.engine.screenSize().height / 2) - (this.size.height / 2);
            this.engine.drawer.rectangle(new Position(0, 0), this.engine.screenSize(), true, 5, 'gray', 0.8);
            this.engine.drawer.rectangle(new Position(x, y), this.size, true, 5, 'white');
            this.engine.drawer.rectangle(new Position(x, y), this.size, false, 5, 'green');

            let bx = (x + (this.size.width / 2)) - 100;
            let by = (y + this.size.height) - 60;
            let tx = x + 30;
            let ty = y + 50;
            this.engine.drawer.text(this.message, new Position(tx, ty), 14, 'Consolas');
            if (!this.cpu) {
                if (this.ok) {
                    if (this.engine.mouseOnTopOfPosition(new Position(bx, by), new Size(200, 50))) {
                        this.ok.loadImage('./assets/sprites/buttons/ok_on.png');
                        if (this.engine.mouseClicked(MouseButton.LEFT)) {
                            this.clickSound.play();
                            if (this.callback)
                                this.callback();
                        }
                    } else {
                        this.ok.loadImage('./assets/sprites/buttons/ok_off.png');
                    }
                    this.engine.drawer.sprite(this.ok, new Position(bx, by));
                }
            }
        } else {
            this.isOpen = true;
            let x = (this.engine.screenSize().width / 2) - (this.size.width / 2);
            let y = (this.engine.screenSize().height / 2) - (this.size.height / 2);

            this.engine.drawer.rectangle(new Position(0, 0), this.engine.screenSize(), true, 5, 'gray', 0.8);
            this.engine.drawer.rectangle(new Position(x, y), this.size, true, 5, 'white');
            this.engine.drawer.rectangle(new Position(x, y), this.size, false, 5, 'green');

            let bx1 = x + 50;
            let by1 = y + 200;
            let ty = y + 50;
            let bx2 = bx1 + 300;

            this.engine.drawer.text(this.message, new Position(bx1, ty), 14, 'Consolas');
            if (!this.cpu) {
                if (this.button1) {
                    this.engine.drawer.sprite(this.yes, new Position(bx1, by1));
                    if (this.engine.mouseOnTopOfPosition(new Position(bx1, by1), new Size(200, 50))) {
                        this.yes.loadImage(this.button1.imageOn);
                        if (this.engine.mouseClicked(MouseButton.LEFT)) {
                            this.clickSound.play();
                            if (this.button1.callback)
                                this.button1.callback();
                        }
                    } else {
                        this.yes.loadImage(this.button1.imageOff);
                    }
                }

                if (this.button2) {
                    this.engine.drawer.sprite(this.no, new Position(bx2, by1));
                    if (this.engine.mouseOnTopOfPosition(new Position(bx2, by1), new Size(200, 50))) {
                        this.no.loadImage(this.button2.imageOn);
                        if (this.engine.mouseClicked(MouseButton.LEFT)) {
                            this.clickSound.play();
                            if (this.button2.callback)
                                this.button2.callback();
                        }
                    } else {
                        this.no.loadImage(this.button2.imageOff);
                    }
                }
            }
        }
    }
}