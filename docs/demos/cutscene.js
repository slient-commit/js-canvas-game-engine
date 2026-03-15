(function () {
    window.DemoGames = window.DemoGames || {};

    window.DemoGames.createCutscene = function (engine) {
        var scene = new Scene('cutscene', engine);
        var W = 960, H = 540;
        var ctx = engine.ctx;
        var time, fadeAlpha, titleAlpha;

        // Procedural data
        var stars, mountains, birdFlocks;

        var dialogues = [
            { text: 'In a world of pixels...', start: 7, end: 11 },
            { text: 'Where code becomes art...', start: 11, end: 15 },
            { text: 'The engine awakens.', start: 15, end: 19 }
        ];

        function rand(min, max) { return min + Math.random() * (max - min); }

        function lerpC(a, b, t) {
            t = Math.max(0, Math.min(1, t));
            return [
                Math.round(a[0] + (b[0] - a[0]) * t),
                Math.round(a[1] + (b[1] - a[1]) * t),
                Math.round(a[2] + (b[2] - a[2]) * t)
            ];
        }
        function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }

        function makeStars() {
            stars = [];
            for (var i = 0; i < 160; i++) {
                stars.push({
                    x: Math.random() * W,
                    y: Math.random() * H * 0.55,
                    r: rand(0.4, 2.2),
                    phase: rand(0, Math.PI * 2),
                    speed: rand(0.8, 3)
                });
            }
        }

        function makeMountains() {
            mountains = [];
            var configs = [
                { base: 0.52, pMin: 70, pMax: 160, segs: 10, c: [35, 30, 65] },
                { base: 0.60, pMin: 45, pMax: 110, segs: 14, c: [28, 38, 55] },
                { base: 0.70, pMin: 25, pMax: 65, segs: 18, c: [22, 28, 42] }
            ];
            for (var l = 0; l < configs.length; l++) {
                var cf = configs[l];
                var pts = [];
                var segW = W / cf.segs;
                for (var i = 0; i <= cf.segs; i++) {
                    pts.push({
                        x: i * segW,
                        y: H * cf.base - cf.pMin - rand(0, cf.pMax - cf.pMin) + Math.sin(i * 0.7) * 15
                    });
                }
                mountains.push({ pts: pts, c: cf.c, base: H * cf.base });
            }
        }

        function makeBirds() {
            birdFlocks = [];
            for (var i = 0; i < 3; i++) {
                var flock = {
                    x: -150 - i * 280,
                    y: H * 0.18 + rand(0, H * 0.14),
                    speed: rand(75, 120),
                    start: 9 + i * 1.8,
                    birds: []
                };
                var n = 5 + Math.floor(rand(0, 4));
                for (var j = 0; j < n; j++) {
                    var side = j % 2 === 0 ? 1 : -1;
                    var idx = Math.ceil(j / 2);
                    flock.birds.push({
                        ox: -idx * 16, oy: side * idx * 11,
                        wp: rand(0, Math.PI * 2), ws: rand(5, 8)
                    });
                }
                birdFlocks.push(flock);
            }
        }

        function skyColors(t) {
            var nT = [5, 5, 25], nB = [15, 15, 50];
            var dT = [30, 20, 65], dB = [190, 100, 55];
            var sT = [65, 110, 190], sB = [230, 150, 65];
            var dayT = [85, 155, 225], dayB = [170, 210, 245];
            if (t < 4) return { top: nT, bot: nB };
            if (t < 8) { var p = (t - 4) / 4; return { top: lerpC(nT, dT, p), bot: lerpC(nB, dB, p) }; }
            if (t < 12) { var p = (t - 8) / 4; return { top: lerpC(dT, sT, p), bot: lerpC(dB, sB, p) }; }
            var p = Math.min(1, (t - 12) / 4);
            return { top: lerpC(sT, dayT, p), bot: lerpC(sB, dayB, p) };
        }

        // Firefly particles (manual, not ParticleEmitter)
        var fireflies;
        function makeFireflies() {
            fireflies = [];
            for (var i = 0; i < 30; i++) {
                fireflies.push({
                    x: rand(0, W), y: rand(H * 0.55, H * 0.85),
                    vx: rand(-15, 15), vy: rand(-10, 10),
                    phase: rand(0, Math.PI * 2), blinkSpeed: rand(1.5, 4),
                    r: rand(1.5, 3)
                });
            }
        }

        scene.OnCreate = function () {
            time = 0; fadeAlpha = 0; titleAlpha = 0;
            makeStars(); makeMountains(); makeBirds(); makeFireflies();
        };

        scene.OnUpdate = function (dt) {
            time += dt;

            // --- Sky ---
            var sky = skyColors(time);
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, rgb(sky.top));
            grad.addColorStop(0.55, rgb(sky.bot));
            grad.addColorStop(1, rgb(lerpC(sky.bot, [25, 22, 18], 0.5)));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // --- Moon (fades out at dawn) ---
            if (time < 10) {
                var moonA = time < 5 ? 0.7 : Math.max(0, 0.7 - (time - 5) / 5 * 0.7);
                ctx.globalAlpha = moonA;
                ctx.beginPath();
                ctx.arc(W * 0.15, H * 0.15, 22, 0, Math.PI * 2);
                ctx.fillStyle = '#e8e8d0';
                ctx.fill();
                // Crescent shadow
                ctx.beginPath();
                ctx.arc(W * 0.15 + 8, H * 0.15 - 3, 18, 0, Math.PI * 2);
                ctx.fillStyle = rgb(sky.top);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // --- Stars ---
            var starA = time < 4 ? 1 : time < 10 ? Math.max(0, 1 - (time - 4) / 6) : 0;
            if (starA > 0) {
                for (var i = 0; i < stars.length; i++) {
                    var s = stars[i];
                    var tw = 0.4 + 0.6 * Math.sin(time * s.speed + s.phase);
                    ctx.globalAlpha = starA * tw;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // --- Sun ---
            if (time > 6) {
                var sp = Math.min(1, (time - 6) / 8);
                var sunY = H * 0.58 - sp * H * 0.3;
                var sunX = W * 0.72;
                var sunR = 28 + sp * 16;

                // Glow
                var glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 5);
                var ga = Math.min(0.35, sp * 0.45);
                glow.addColorStop(0, 'rgba(255,210,90,' + ga + ')');
                glow.addColorStop(0.4, 'rgba(255,150,50,' + ga * 0.3 + ')');
                glow.addColorStop(1, 'rgba(255,100,30,0)');
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, W, H);

                // Disc
                ctx.beginPath();
                ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
                ctx.fillStyle = rgb(lerpC([255, 190, 90], [255, 240, 200], sp));
                ctx.globalAlpha = Math.min(1, sp * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // --- Mountains ---
            for (var l = 0; l < mountains.length; l++) {
                var mt = mountains[l];
                var bright = time < 8 ? 0.35 : Math.min(1, 0.35 + (time - 8) / 7);
                var mc = [
                    Math.min(255, Math.round(mt.c[0] * (0.5 + bright * 0.9))),
                    Math.min(255, Math.round(mt.c[1] * (0.5 + bright * 0.9))),
                    Math.min(255, Math.round(mt.c[2] * (0.5 + bright * 0.7)))
                ];

                ctx.beginPath();
                ctx.moveTo(0, H);
                ctx.lineTo(0, mt.base);
                for (var p = 0; p < mt.pts.length; p++) {
                    if (p === 0) { ctx.lineTo(mt.pts[0].x, mt.pts[0].y); continue; }
                    // Smooth with quadratic curves
                    var prev = mt.pts[p - 1];
                    var cur = mt.pts[p];
                    var cpx = (prev.x + cur.x) / 2;
                    var cpy = (prev.y + cur.y) / 2;
                    ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
                }
                ctx.lineTo(W, mt.pts[mt.pts.length - 1].y);
                ctx.lineTo(W, H);
                ctx.closePath();
                ctx.fillStyle = rgb(mc);
                ctx.fill();
            }

            // --- Ground ---
            var gy = H * 0.70;
            var gg = ctx.createLinearGradient(0, gy, 0, H);
            var gb = time < 8 ? 0.3 : Math.min(1, 0.3 + (time - 8) / 6);
            gg.addColorStop(0, rgb([Math.round(25 * gb + 12), Math.round(45 * gb + 18), Math.round(22 * gb + 10)]));
            gg.addColorStop(1, rgb([Math.round(18 * gb + 8), Math.round(35 * gb + 12), Math.round(18 * gb + 8)]));
            ctx.fillStyle = gg;
            ctx.fillRect(0, gy, W, H - gy);

            // --- Trees (simple silhouettes) ---
            if (time > 8) {
                var treeA = Math.min(0.9, (time - 8) / 4);
                ctx.globalAlpha = treeA;
                ctx.fillStyle = '#0a140a';
                var treePositions = [
                    { x: 120, s: 1.0 }, { x: 260, s: 0.7 }, { x: 380, s: 0.85 },
                    { x: 620, s: 0.9 }, { x: 750, s: 0.65 }, { x: 870, s: 1.1 }
                ];
                for (var ti = 0; ti < treePositions.length; ti++) {
                    var tp = treePositions[ti];
                    var tx = tp.x, ty = gy, ts = tp.s;
                    // Trunk
                    ctx.fillRect(tx - 3 * ts, ty - 25 * ts, 6 * ts, 25 * ts);
                    // Canopy (triangle)
                    ctx.beginPath();
                    ctx.moveTo(tx, ty - 55 * ts);
                    ctx.lineTo(tx + 20 * ts, ty - 18 * ts);
                    ctx.lineTo(tx - 20 * ts, ty - 18 * ts);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // --- Character Silhouette ---
            if (time > 10) {
                var ca = Math.min(1, (time - 10) / 2);
                ctx.globalAlpha = ca;
                var cx = W * 0.25, cy = gy;
                ctx.fillStyle = '#0d0d0d';
                // Body
                ctx.fillRect(cx - 7, cy - 48, 14, 28);
                // Head
                ctx.beginPath();
                ctx.arc(cx, cy - 56, 9, 0, Math.PI * 2);
                ctx.fill();
                // Legs
                ctx.fillRect(cx - 6, cy - 20, 5, 20);
                ctx.fillRect(cx + 1, cy - 20, 5, 20);
                // Cape
                ctx.beginPath();
                ctx.moveTo(cx + 7, cy - 44);
                ctx.quadraticCurveTo(cx + 28 + Math.sin(time * 2) * 5, cy - 28, cx + 14 + Math.sin(time * 1.5) * 3, cy - 8);
                ctx.lineTo(cx + 7, cy - 18);
                ctx.closePath();
                ctx.fill();
                // Sword (small line)
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx - 10, cy - 38);
                ctx.lineTo(cx - 18, cy - 52);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // --- Fireflies ---
            if (time > 12) {
                var ffA = Math.min(1, (time - 12) / 2);
                for (var fi = 0; fi < fireflies.length; fi++) {
                    var ff = fireflies[fi];
                    ff.x += ff.vx * dt;
                    ff.y += ff.vy * dt;
                    // Wrap
                    if (ff.x < -10) ff.x = W + 10;
                    if (ff.x > W + 10) ff.x = -10;
                    if (ff.y < H * 0.5) ff.vy = Math.abs(ff.vy);
                    if (ff.y > H * 0.9) ff.vy = -Math.abs(ff.vy);

                    var blink = 0.3 + 0.7 * Math.max(0, Math.sin(time * ff.blinkSpeed + ff.phase));
                    ctx.globalAlpha = ffA * blink;
                    var glow2 = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, ff.r * 4);
                    glow2.addColorStop(0, 'rgba(200,255,100,0.8)');
                    glow2.addColorStop(1, 'rgba(200,255,100,0)');
                    ctx.fillStyle = glow2;
                    ctx.fillRect(ff.x - ff.r * 4, ff.y - ff.r * 4, ff.r * 8, ff.r * 8);
                    ctx.beginPath();
                    ctx.arc(ff.x, ff.y, ff.r, 0, Math.PI * 2);
                    ctx.fillStyle = '#ccff66';
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // --- Bird Flocks ---
            for (var f = 0; f < birdFlocks.length; f++) {
                var fl = birdFlocks[f];
                if (time < fl.start) continue;
                var ft = time - fl.start;
                var fx = fl.x + ft * fl.speed;
                if (fx > W + 200) continue;
                for (var b = 0; b < fl.birds.length; b++) {
                    var bd = fl.birds[b];
                    var bx = fx + bd.ox;
                    var by = fl.y + bd.oy;
                    var wing = Math.sin(time * bd.ws + bd.wp) * 5;
                    ctx.strokeStyle = time < 10 ? '#ddd' : '#333';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(bx - 7, by + wing);
                    ctx.lineTo(bx, by);
                    ctx.lineTo(bx + 7, by + wing);
                    ctx.stroke();
                }
            }

            // --- Dialogue ---
            for (var d = 0; d < dialogues.length; d++) {
                var dlg = dialogues[d];
                if (time >= dlg.start && time <= dlg.end) {
                    var fi2 = Math.min(1, (time - dlg.start) / 1.2);
                    var fo = Math.min(1, (dlg.end - time) / 1);
                    ctx.globalAlpha = Math.min(fi2, fo);
                    ctx.font = '20px "Segoe UI", sans-serif';
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = 'rgba(0,0,0,0.7)';
                    ctx.shadowBlur = 8;
                    ctx.fillText(dlg.text, W / 2, H * 0.90);
                    ctx.shadowBlur = 0;
                    ctx.textAlign = 'left';
                    ctx.globalAlpha = 1;
                }
            }

            // --- Fade to Black + Title ---
            if (time > 19) {
                fadeAlpha = Math.min(1, (time - 19) / 2);
                ctx.globalAlpha = fadeAlpha;
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, W, H);
                ctx.globalAlpha = 1;

                if (time > 20) {
                    titleAlpha = Math.min(1, (time - 20) / 1.5);
                    ctx.globalAlpha = titleAlpha;
                    ctx.font = 'bold 52px "Segoe UI", sans-serif';
                    ctx.fillStyle = '#00bbff';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = 'rgba(0,187,255,0.4)';
                    ctx.shadowBlur = 20;
                    ctx.fillText('JCGE', W / 2, H / 2 - 10);
                    ctx.shadowBlur = 0;
                    ctx.font = '16px "Segoe UI", sans-serif';
                    ctx.fillStyle = '#888';
                    ctx.fillText('JS Canvas Game Engine', W / 2, H / 2 + 28);
                    ctx.textAlign = 'left';
                    ctx.globalAlpha = 1;
                }

                if (time > 22) {
                    var blinkA = 0.4 + 0.3 * Math.sin(time * 3);
                    ctx.globalAlpha = blinkA;
                    ctx.font = '13px "Segoe UI", sans-serif';
                    ctx.fillStyle = '#666';
                    ctx.textAlign = 'center';
                    ctx.fillText('Press SPACE to replay', W / 2, H / 2 + 65);
                    ctx.textAlign = 'left';
                    ctx.globalAlpha = 1;
                }
            }

            // --- Replay ---
            if (time > 21 && engine.keys.includes(Keys.Space)) {
                scene.reset();
                scene.isCreated = false;
            }

            return true;
        };

        return scene;
    };
})();
