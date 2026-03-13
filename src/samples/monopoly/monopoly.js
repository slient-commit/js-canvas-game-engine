window.addEventListener("gameReady", function() {
    var canvas = document.getElementById("canvas");

    var engine = new Engine(canvas);
    engine.jumpEngineIntro = true;
    engine.displayFPS = true;
    engine.playMusic = false;
    engine.sfx = true;
    engine.setFullScreen();
    engine.OnCreate = function() {
        var menuScene = new MenuScene(engine);
        engine.registerScene(menuScene);
    };
    engine.start();
});
