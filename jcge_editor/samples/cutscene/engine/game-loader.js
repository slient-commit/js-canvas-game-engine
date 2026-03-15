function loader(files, gamepath="", onDone=undefined) {
    console.log(`Loading Game Files... (waiting for engine)`);

    function startLoading() {
        function loadScript(index) {
            if (index >= files.length) {
                console.log("All game scripts loaded.");
                if (onDone) onDone();
                window.dispatchEvent(new Event("gameReady"));
                return;
            }

            var file = files[index];
            var script = document.createElement('script');
            script.src = gamepath + file.path;

            script.onload = function() {
                console.log(`game script ${file.name} has loaded`);
                loadScript(index + 1);
            };

            script.onerror = function() {
                console.log(`error loading game script ${file.name}`);
                loadScript(index + 1);
            };

            document.head.appendChild(script);
        }

        loadScript(0);
    }

    // Wait for engine to be ready before loading game scripts
    if (window._engineReady) {
        startLoading();
    } else {
        window.addEventListener('engineReady', startLoading);
    }
}
