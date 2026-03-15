(function () {
    var engine = null;
    var scenes = {};
    var activeTab = null;

    var factories = {
        'cutscene': 'createCutscene',
        'tower-defense': 'createTowerDefense',
        'shooter': 'createShooter'
    };

    window.addEventListener('engineReady', function () {
        var canvas = document.getElementById('demo-canvas');
        if (!canvas) return;

        engine = new Engine(canvas);
        engine.jumpEngineIntro = true;

        // Prevent Drawer from auto-resizing canvas to window
        engine.drawer.resize = function () {};
        canvas.width = 960;
        canvas.height = 540;
        canvas.style.width = '';
        canvas.style.height = '';

        // Fix mouse coordinates for CSS-scaled canvas.
        // The engine's built-in listener sets mousePoint in CSS pixel space,
        // but when the canvas is displayed smaller than its internal resolution
        // we need to scale to canvas coordinates. This listener fires after
        // the engine's own listener and overwrites with the corrected value.
        canvas.addEventListener('mousemove', function (e) {
            var rect = canvas.getBoundingClientRect();
            var scaleX = canvas.width / rect.width;
            var scaleY = canvas.height / rect.height;
            engine.mousePoint = new Point(
                (e.clientX - rect.left) * scaleX,
                (e.clientY - rect.top) * scaleY
            );
        });

        // Create all scenes
        for (var key in factories) {
            var fn = window.DemoGames && window.DemoGames[factories[key]];
            if (fn) {
                scenes[key] = fn(engine);
                engine.registerScene(scenes[key]);
            }
        }

        // Tab click handlers
        var tabs = document.querySelectorAll('.demo-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function () {
                switchTab(this.getAttribute('data-tab'));
            });
        }

        // Start with first tab
        switchTab('cutscene');
        engine.start();
    });

    function switchTab(tabName) {
        if (tabName === activeTab) return;
        activeTab = tabName;

        // Update tab buttons
        var tabs = document.querySelectorAll('.demo-tab');
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].getAttribute('data-tab') === tabName) {
                tabs[i].classList.add('active');
            } else {
                tabs[i].classList.remove('active');
            }
        }

        // Switch scene
        var scene = scenes[tabName];
        if (scene && engine) {
            engine.goToScene(scene, null, 'none');
        }
    }
})();
