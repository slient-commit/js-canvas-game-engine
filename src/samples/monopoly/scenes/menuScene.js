class MenuScene extends Scene {

    constructor(engine) {
        super('MenuScene', engine);
        this.music = new Sound('./assets/audio/main_menu.mp3', 50, true);
        this.clickSound = new Sound('./assets/audio/click.mp3', 80);
    }

    OnCreate() {
        if (this.engine.playMusic)
            this.music.play();

        var sw = this.engine.screenSize().width;
        var sh = this.engine.screenSize().height;
        var self = this;

        // --- UI Layer ---
        this.uiLayer = new UILayer("menu");
        this.registerLayer(this.uiLayer);

        // Title card panel
        this.uiLayer.registerElement(new UIPanel(new Position(sw / 2 - 200, 60), new Size(400, 120), {
            fillColor: 'rgba(10, 10, 30, 0.9)',
            borderColor: '#ff8844',
            borderWidth: 2
        }));

        // Title
        this.uiLayer.registerElement(new UILabel('MONOPOLY', new Position(sw / 2 - 95, 115), {
            fontSize: 36, fontStyle: 'bold', color: '#ff8844'
        }));

        // Subtitle
        this.uiLayer.registerElement(new UILabel('JS Canvas Game Engine Edition', new Position(sw / 2 - 118, 150), {
            fontSize: 12, color: '#778899'
        }));

        // Play button
        var playBtn = new UIButton(new Position(sw / 2 - 80, 240), new Size(160, 50), {
            normalColor: '#1a5c2a',
            hoverColor: '#2a7a3e',
            pressedColor: '#0f3a1a',
            label: 'Play',
            fontSize: 18,
            fontColor: 'white',
            onClick: function() {
                if (self.engine.sfx) self.clickSound.play();
                var gameScene = new GameScene(self.engine);
                self.engine.goToScene(gameScene);
                self.ended();
            }
        });
        this.uiLayer.registerElement(playBtn);

        // Info panel
        this.uiLayer.registerElement(new UIPanel(new Position(sw / 2 - 180, 330), new Size(360, 110), {
            fillColor: 'rgba(10, 10, 30, 0.7)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1
        }));

        this.uiLayer.registerElement(new UILabel('How to Play', new Position(sw / 2 - 40, 355), {
            fontSize: 13, fontStyle: 'bold', color: '#ffcc66'
        }));
        this.uiLayer.registerElement(new UILabel('Roll dice and buy properties', new Position(sw / 2 - 110, 378), {
            fontSize: 11, color: '#aabbcc'
        }));
        this.uiLayer.registerElement(new UILabel('Collect rent from other players', new Position(sw / 2 - 118, 395), {
            fontSize: 11, color: '#aabbcc'
        }));
        this.uiLayer.registerElement(new UILabel('Build houses to increase rent', new Position(sw / 2 - 110, 412), {
            fontSize: 11, color: '#aabbcc'
        }));
        this.uiLayer.registerElement(new UILabel('Last player standing wins!', new Position(sw / 2 - 98, 429), {
            fontSize: 11, color: '#aabbcc'
        }));

        // Footer
        this.uiLayer.registerElement(new UILabel('1 Player vs 2 CPU opponents', new Position(sw / 2 - 105, sh - 20), {
            fontSize: 10, color: 'rgba(255,255,255,0.3)'
        }));

        return true;
    }

    OnUpdate(elapsedTime) {
        var drawer = this.engine.drawer;
        var sw = this.engine.screenSize().width;
        var sh = this.engine.screenSize().height;

        // Dark background
        drawer.clearWithColor('#0a0a14');

        // Subtle radial vignette
        var ctx = drawer.ctx;
        ctx.save();
        var vignette = ctx.createRadialGradient(sw / 2, sh / 2, sw * 0.15, sw / 2, sh / 2, sw * 0.6);
        vignette.addColorStop(0, 'rgba(30, 20, 10, 0.15)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, sw, sh);
        ctx.restore();

        return true;
    }

    OnDestroy() {
        this.music.stop();
    }
}
