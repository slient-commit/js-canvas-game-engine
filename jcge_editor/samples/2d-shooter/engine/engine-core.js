(function() {
    var files = [{
            name: "RGB script",
            path: "util/rgb.js"
        },
        {
            name: "Buttons definition",
            path: "util/buttons.js"
        },
        {
            name: "Vec2 script",
            path: "util/vec2.js"
        },
        {
            name: "Size script",
            path: "util/size.js"
        },
        {
            name: "GameObject script",
            path: "objects/gameObject.js"
        },
        {
            name: "Particle script",
            path: "particles/particle.js"
        },
        {
            name: "Fire script",
            path: "particles/fire.js"
        },
        {
            name: "Lighting script",
            path: "lights/lighting.js"
        },
        {
            name: "Light Spot script",
            path: "lights/lightSpot.js"
        },
        {
            name: "Light Tile script",
            path: "lights/lightTile.js"
        },
        {
            name: "ShadowCaster script",
            path: "shadows/shadowCaster.js"
        },
        {
            name: "ShadowSystem script",
            path: "shadows/shadowSystem.js"
        },
        {
            name: "Element script",
            path: "objects/element.js"
        },
        {
            name: "Camera script",
            path: "objects/camera.js"
        },
        {
            name: "FixedCamera script",
            path: "cameras/fixedCamera.js"
        },
        {
            name: "WorldCamera script",
            path: "cameras/worldCamera.js"
        },
        {
            name: "Drawer script",
            path: "buffer/drawer.js"
        },
        {
            name: "Sprite script",
            path: "buffer/sprite.js"
        },
        {
            name: "SpriteSheet script",
            path: "buffer/spriteSheet.js"
        },
        {
            name: "Sound script",
            path: "audio/sound.js"
        },
        {
            name: "SoundManager script",
            path: "audio/soundManager.js"
        },
        {
            name: "Animation script",
            path: "animations/animation.js"
        },
        {
            name: "GeometricAnimation script",
            path: "animations/geometricAnimation.js"
        },
        {
            name: "Collision script",
            path: "physics/collision.js"
        },
        {
            name: "InputManager script",
            path: "input/inputManager.js"
        },
        {
            name: "ParticleEmitter script",
            path: "particles/particleEmitter.js"
        },
        {
            name: "Easing script",
            path: "animations/easing.js"
        },
        {
            name: "Tween script",
            path: "animations/tween.js"
        },
        {
            name: "EventEmitter script",
            path: "util/eventEmitter.js"
        },
        {
            name: "Tileset script",
            path: "tilemap/tileset.js"
        },
        {
            name: "Tilemap script",
            path: "tilemap/tilemap.js"
        },
        {
            name: "IsometricUtils script",
            path: "isometric/isometricUtils.js"
        },
        {
            name: "IsometricMap script",
            path: "isometric/isometricMap.js"
        },
        {
            name: "PathFinder script",
            path: "isometric/pathFinder.js"
        },
        {
            name: "AssetManager script",
            path: "assets/assetManager.js"
        },
        {
            name: "DebugOverlay script",
            path: "debug/debugOverlay.js"
        },
        {
            name: "Layer script",
            path: "engine-parts/layer.js"
        },
        {
            name: "UILayer script",
            path: "ui/uiLayer.js"
        },
        {
            name: "UIButton script",
            path: "ui/uiButton.js"
        },
        {
            name: "UILabel script",
            path: "ui/uiLabel.js"
        },
        {
            name: "UIPanel script",
            path: "ui/uiPanel.js"
        },
        {
            name: "Scene script",
            path: "engine-parts/scene.js"
        },
        {
            name: "IntroScene script",
            path: "scenes/introScene.js"
        },
        {
            name: "Engine Core script",
            path: "engine-parts/engine.js"
        }
    ]

    var currentFolders = location.href.split("/");
    var path = "";
    var startWriting = false;
    for (var i = 0; i < currentFolders.length - 1; i++) {
        if (startWriting) {
            path += "../";
        }

        if (currentFolders[i] == "src") {
            startWriting = true;
        }
    }
    path += "engine/";

    function loadScript(index) {
        if (index >= files.length) {
            console.log("All engine scripts loaded.");
            window._engineReady = true;
            window.dispatchEvent(new Event('engineReady'));
            return;
        }

        var file = files[index];
        var script = document.createElement('script');
        script.src = path + file.path;

        script.onload = function() {
            console.log(`engine script ${file.name} has loaded`);
            loadScript(index + 1);
        };

        script.onerror = function() {
            console.log(`error loading engine script ${file.name}`);
            loadScript(index + 1);
        };

        document.head.appendChild(script);
    }

    loadScript(0);
})();
