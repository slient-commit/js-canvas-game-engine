// First of all, wait to the document is ready
window.addEventListener("gameReady", function() {
    // Get the canas Element
    var canvas = document.getElementById("canvas");

    // Init the Engine
    engine = new Engine(canvas);
    engine.playMusic = false;
    engine.sfx = true;
    engine.OnCreate = function() {
        menuScene = new MenuScene(this);
        engine.registerScene(menuScene);

    };
    engine.OnUpdate = function(elapsedTime) {

    };
    engine.start();
});