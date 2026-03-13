window.addEventListener("engineReady", function() {

    class SpriteSheetDemoScene extends Scene {

        constructor(engine) {
            super('SpriteSheetDemoScene', engine);
            this.spriteSheet = null;
            this.fullImage = null;
            this.gameObject = null;
            this.animation = null;
            this.paused = false;
        }

        OnCreate() {
            var imagePath = '../../assets/spritesheet_numbered.png';

            // Animated sprite sheet (125x125 frames, speed 5, frames 0-15)
            this.spriteSheet = new SpriteSheet('moving', 125, 125, 5, 0, 15, imagePath);
            this.gameObject = new GameObject(this.spriteSheet, new Position(60, 180));
            this.animation = new Animation();
            this.animation.registerAnimation(this.spriteSheet);
            this.gameObject.registerAnimation(this.animation);
            this.gameObject.setAnimation('moving');

            // Full sprite sheet image (displayed as-is)
            this.fullImage = new Sprite(0, 0, imagePath);

            return true;
        }

        OnUpdate(elapsedTime) {
            var drawer = this.engine.drawer;
            var input = this.engine.input;
            var sw = this.engine.screenSize().width;
            var sh = this.engine.screenSize().height;

            drawer.clearWithColor('#12121e');

            // Toggle pause with Space
            if (input.isKeyPressed(Keys.Space)) {
                this.paused = !this.paused;
            }

            // --- Left side: Animated character ---
            var animX = 60;
            var animY = 180;
            this.gameObject.position = new Position(animX, animY);

            // Draw the animated game object (engine handles spriteSheet draw)
            // Only advance animation when not paused
            if (!this.paused) {
                drawer.spriteSheet(this.spriteSheet, this.gameObject.position);
            } else {
                // Draw current frame without advancing
                var f = this.spriteSheet.frame();
                if (this.spriteSheet.imageLoaded) {
                    drawer.ctx.drawImage(
                        this.spriteSheet.image,
                        f.X, f.Y, this.spriteSheet.width, this.spriteSheet.height,
                        animX, animY, this.spriteSheet.width, this.spriteSheet.height
                    );
                }
            }

            // Border around animated frame
            drawer.rectangle(new Vec2(animX - 2, animY - 2), new Size(129, 129), false, 2, '#ff8844');

            // --- Right side: Full sprite sheet ---
            var sheetX = 280;
            var sheetY = 50;

            if (this.fullImage.imageLoaded) {
                var imgW = this.fullImage.image.width;
                var imgH = this.fullImage.image.height;

                // Scale the full sheet to fit nicely
                var maxW = sw - sheetX - 30;
                var maxH = sh - sheetY - 80;
                var scale = Math.min(maxW / imgW, maxH / imgH, 1);
                var drawW = imgW * scale;
                var drawH = imgH * scale;

                // Draw the full sprite sheet
                drawer.ctx.drawImage(this.fullImage.image, sheetX, sheetY, drawW, drawH);

                // Draw grid lines over the sheet
                var frameW = this.spriteSheet.width * scale;
                var frameH = this.spriteSheet.height * scale;
                var cols = this.spriteSheet.framesPerRow || 1;
                var totalFrames = this.spriteSheet.animationSequence.length;
                var rows = Math.ceil(totalFrames / cols);

                // Grid lines
                drawer.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                drawer.ctx.lineWidth = 1;
                for (var c = 0; c <= cols; c++) {
                    var lx = sheetX + c * frameW;
                    drawer.ctx.beginPath();
                    drawer.ctx.moveTo(lx, sheetY);
                    drawer.ctx.lineTo(lx, sheetY + rows * frameH);
                    drawer.ctx.stroke();
                }
                for (var r = 0; r <= rows; r++) {
                    var ly = sheetY + r * frameH;
                    drawer.ctx.beginPath();
                    drawer.ctx.moveTo(sheetX, ly);
                    drawer.ctx.lineTo(sheetX + cols * frameW, ly);
                    drawer.ctx.stroke();
                }

                // Frame numbers
                for (var i = 0; i < totalFrames; i++) {
                    var fc = i % cols;
                    var fr = Math.floor(i / cols);
                    var fx = sheetX + fc * frameW;
                    var fy = sheetY + fr * frameH;
                    drawer.text('' + i, new Vec2(fx + 4, fy + 14), 10, 'monospace', 'normal', 'rgba(255,255,255,0.4)');
                }

                // Highlight current frame on the sheet
                var curIdx = this.spriteSheet.currentFrame;
                var curFrameNum = this.spriteSheet.animationSequence[curIdx];
                var hCol = curFrameNum % cols;
                var hRow = Math.floor(curFrameNum / cols);
                var hx = sheetX + hCol * frameW;
                var hy = sheetY + hRow * frameH;

                // Glow effect
                drawer.ctx.save();
                drawer.ctx.shadowColor = '#ff8844';
                drawer.ctx.shadowBlur = 10;
                drawer.rectangle(new Vec2(hx, hy), new Size(frameW, frameH), false, 2, '#ff8844');
                drawer.ctx.restore();

                // Sheet border
                drawer.rectangle(new Vec2(sheetX - 1, sheetY - 1), new Size(drawW + 2, drawH + 2), false, 1, 'rgba(255,255,255,0.15)');

                // --- Info text ---
                var src = this.spriteSheet.frame();
                var infoY = sheetY + drawH + 25;
                drawer.text('Full Sprite Sheet (' + imgW + 'x' + imgH + ')', new Vec2(sheetX, sheetY - 8), 12, 'monospace', 'normal', '#888');
                drawer.text('Frame: ' + curFrameNum + '/' + (totalFrames - 1) + '  |  Source: (' + src.X + ', ' + src.Y + ')  |  Size: ' + this.spriteSheet.width + 'x' + this.spriteSheet.height, new Vec2(sheetX, infoY), 11, 'monospace', 'normal', '#aaa');
                drawer.text('Frames/Row: ' + cols + '  |  Speed: ' + this.spriteSheet.frameSpeed + '  |  Sequence: [' + this.spriteSheet.startFrame + '-' + this.spriteSheet.endFrame + ']', new Vec2(sheetX, infoY + 18), 11, 'monospace', 'normal', '#777');
            }

            // --- Labels ---
            drawer.text('SpriteSheet Animation Demo', new Vec2(15, 22), 16, 'monospace', 'bold', '#ff8844');
            drawer.text('Animated Frame', new Vec2(animX, animY - 15), 12, 'monospace', 'normal', '#ccc');
            drawer.text(this.paused ? '[PAUSED]' : '[PLAYING]', new Vec2(animX, animY + 145), 11, 'monospace', 'normal', this.paused ? '#ff4444' : '#44ff44');

            // Controls
            drawer.text('Space: pause/resume', new Vec2(15, sh - 15), 10, 'monospace', 'normal', 'rgba(255,255,255,0.35)');

            return true;
        }
    }

    var canvas = document.getElementById("canvas");
    var engine = new Engine(canvas);
    engine.jumpEngineIntro = true;
    engine.displayFPS = true;
    engine.setCanvasSize(960, 540);
    engine.OnCreate = function() {
        var scene = new SpriteSheetDemoScene(engine);
        engine.registerScene(scene);
    };
    engine.start();
});
