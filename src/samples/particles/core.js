window.addEventListener("engineReady", function() {

    class ParticleDemoScene extends Scene {

        constructor(engine) {
            super('ParticleDemoScene', engine);
            this.emitter = null;
            this.pinned = [];
            this.currentPreset = 'fire';
            this.presetLabel = null;
            this.countLabel = null;
            this.followMouse = true;
        }

        _createEmitter(preset, pos) {
            var p = pos || new Vec2(
                this.engine.screenSize().width / 2,
                this.engine.screenSize().height / 2
            );
            switch (preset) {
                case 'fire':
                    return ParticleEmitter.fire(this.engine, p);
                case 'smoke':
                    return ParticleEmitter.smoke(this.engine, p);
                case 'sparkle':
                    return ParticleEmitter.sparkle(this.engine, p);
                case 'explosion':
                    return ParticleEmitter.explosion(this.engine, p);
                default:
                    return ParticleEmitter.fire(this.engine, p);
            }
        }

        _switchPreset(preset) {
            this.currentPreset = preset;
            if (this.emitter) this.emitter.clear();
            this.emitter = this._createEmitter(preset);
            this.presetLabel.setText('Preset: ' + preset.charAt(0).toUpperCase() + preset.slice(1));

            // Explosion is one-shot, so don't follow mouse
            if (preset === 'explosion') {
                this.followMouse = false;
            } else {
                this.followMouse = true;
            }
        }

        OnCreate() {
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            // Create initial emitter
            this.emitter = this._createEmitter('fire');

            // --- UI Layer ---
            this.uiLayer = new UILayer("controls");
            this.registerLayer(this.uiLayer);

            // Top panel
            var topPanel = new UIPanel(new Position(10, 10), new Size(300, 95), {
                fillColor: 'rgba(10, 10, 30, 0.85)',
                borderColor: '#ff8844',
                borderWidth: 2
            });
            this.uiLayer.registerElement(topPanel);

            this.uiLayer.registerElement(new UILabel('Particle Playground', new Position(25, 35), {
                fontSize: 16, fontStyle: 'bold', color: '#ff8844'
            }));

            this.presetLabel = new UILabel('Preset: Fire', new Position(25, 58), {
                fontSize: 13, color: '#ffcc66'
            });
            this.uiLayer.registerElement(this.presetLabel);

            this.countLabel = new UILabel('Particles: 0  |  Pinned: 0', new Position(25, 80), {
                fontSize: 11, color: '#778899'
            });
            this.uiLayer.registerElement(this.countLabel);

            // --- Preset buttons ---
            var self = this;
            var btnY = sh - 55;
            var presets = [
                { name: 'fire',      color: '#8b3a00', hover: '#b34d00', label: 'Fire' },
                { name: 'smoke',     color: '#3a3a4a', hover: '#5a5a6a', label: 'Smoke' },
                { name: 'sparkle',   color: '#2a2a6a', hover: '#3a3a8a', label: 'Sparkle' },
                { name: 'explosion', color: '#6a2a2a', hover: '#8a3a3a', label: 'Explosion' }
            ];

            for (var i = 0; i < presets.length; i++) {
                (function(preset) {
                    var btn = new UIButton(new Position(10 + i * 115, btnY), new Size(105, 42), {
                        normalColor: preset.color,
                        hoverColor: preset.hover,
                        pressedColor: '#111122',
                        label: preset.label,
                        fontSize: 13,
                        fontColor: 'white',
                        onClick: function() { self._switchPreset(preset.name); }
                    });
                    self.uiLayer.registerElement(btn);
                })(presets[i]);
            }

            // Pin / Clear buttons
            var btnPin = new UIButton(new Position(sw - 230, btnY), new Size(105, 42), {
                normalColor: '#1a5c2a',
                hoverColor: '#2a7a3e',
                pressedColor: '#0f3a1a',
                label: 'Pin Here',
                fontSize: 13,
                fontColor: 'white',
                onClick: function() {
                    var mouse = self.engine.input.getMousePosition();
                    var pinned = self._createEmitter(self.currentPreset, mouse.clone());
                    self.pinned.push(pinned);
                }
            });
            this.uiLayer.registerElement(btnPin);

            var btnClear = new UIButton(new Position(sw - 115, btnY), new Size(105, 42), {
                normalColor: '#5c1a1a',
                hoverColor: '#7a2a2a',
                pressedColor: '#3a0f0f',
                label: 'Clear All',
                fontSize: 13,
                fontColor: 'white',
                onClick: function() {
                    for (var j = 0; j < self.pinned.length; j++) {
                        self.pinned[j].clear();
                    }
                    self.pinned = [];
                    self.emitter.clear();
                }
            });
            this.uiLayer.registerElement(btnClear);

            // Instructions
            this.uiLayer.registerElement(new UILabel(
                'Move mouse to aim  |  Click: trigger explosion  |  Pin: anchor emitter at cursor',
                new Position(15, sh - 12), {
                    fontSize: 10, color: 'rgba(255,255,255,0.35)'
                }
            ));

            return true;
        }

        OnUpdate(elapsedTime) {
            var drawer = this.engine.drawer;
            var input = this.engine.input;
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            drawer.clearWithColor('#0a0a14');

            // Subtle radial vignette
            var ctx = drawer.ctx;
            ctx.save();
            var vignette = ctx.createRadialGradient(sw / 2, sh / 2, sw * 0.2, sw / 2, sh / 2, sw * 0.7);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, sw, sh);
            ctx.restore();

            // Update emitter position to mouse
            var mouse = input.getMousePosition();
            if (this.followMouse && this.emitter) {
                this.emitter.position = mouse.clone();
            }

            // Click triggers explosion (one-shot re-emit)
            if (input.isMousePressed(0) && this.currentPreset === 'explosion') {
                this.emitter = this._createEmitter('explosion', mouse.clone());
            }

            // Draw main emitter
            if (this.emitter) {
                this.emitter.draw(elapsedTime);
            }

            // Draw pinned emitters
            var totalParticles = this.emitter ? this.emitter.particles.length : 0;
            for (var i = this.pinned.length - 1; i >= 0; i--) {
                this.pinned[i].draw(elapsedTime);
                totalParticles += this.pinned[i].particles.length;

                // Remove explosion emitters once their particles die
                if (!this.pinned[i].active && this.pinned[i].particles.length === 0) {
                    this.pinned.splice(i, 1);
                }
            }

            // Update count label
            this.countLabel.setText('Particles: ' + totalParticles + '  |  Pinned: ' + this.pinned.length);

            return true;
        }
    }

    var canvas = document.getElementById("canvas");
    var engine = new Engine(canvas);
    engine.jumpEngineIntro = true;
    engine.displayFPS = true;
    engine.setCanvasSize(960, 540);
    engine.OnCreate = function() {
        var scene = new ParticleDemoScene(engine);
        engine.registerScene(scene);
    };
    engine.start();
});
