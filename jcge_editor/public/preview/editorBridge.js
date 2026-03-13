/**
 * Editor Bridge — loads engine scripts into the preview iframe
 * and handles postMessage communication with the React editor.
 */
(function () {
  // Engine file list (mirrors engine-core.js)
  var engineFiles = [
    "util/rgb.js", "util/buttons.js", "util/vec2.js", "util/size.js",
    "objects/gameObject.js",
    "particles/particle.js", "particles/fire.js",
    "lights/lighting.js", "lights/lightSpot.js", "lights/lightTile.js",
    "shadows/shadowCaster.js", "shadows/shadowSystem.js",
    "objects/element.js", "objects/camera.js",
    "cameras/fixedCamera.js", "cameras/worldCamera.js",
    "buffer/drawer.js", "buffer/sprite.js", "buffer/spriteSheet.js",
    "audio/sound.js", "audio/soundManager.js",
    "animations/animation.js", "animations/geometricAnimation.js",
    "physics/collision.js", "input/inputManager.js",
    "particles/particleEmitter.js",
    "animations/easing.js", "animations/tween.js",
    "util/eventEmitter.js",
    "tilemap/tileset.js", "tilemap/tilemap.js",
    "isometric/isometricUtils.js", "isometric/isometricMap.js", "isometric/pathFinder.js",
    "assets/assetManager.js", "debug/debugOverlay.js",
    "engine-parts/layer.js", "ui/uiLayer.js",
    "ui/uiButton.js", "ui/uiLabel.js", "ui/uiPanel.js",
    "engine-parts/scene.js", "scenes/introScene.js",
    "engine-parts/engine.js"
  ];

  var engineBasePath = null;
  var engine = null;
  var editorScene = null;
  var savedSceneState = null;
  var gridEnabled = true;
  var selectedObjectId = null;

  // ── Load engine scripts sequentially via fetch + eval ──
  // Using fetch instead of <script> tags to avoid cross-origin/CSP issues
  // with the custom jcge:// protocol in iframes.
  function loadEngineScripts(basePath, callback) {
    var index = 0;

    function loadNext() {
      if (index >= engineFiles.length) {
        console.log('[EditorBridge] All engine scripts loaded.');
        callback();
        return;
      }

      var url = basePath + '/' + engineFiles[index];
      fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.text();
        })
        .then(function (code) {
          try {
            // Execute in global scope
            var script = document.createElement('script');
            script.textContent = code;
            document.head.appendChild(script);
          } catch (e) {
            console.warn('[EditorBridge] Error executing: ' + engineFiles[index], e);
          }
          index++;
          loadNext();
        })
        .catch(function (err) {
          console.warn('[EditorBridge] Failed to load: ' + engineFiles[index], err);
          index++;
          loadNext();
        });
    }

    loadNext();
  }

  // ── EditorScene: custom scene for edit mode ──
  function createEditorScene(sceneData) {
    if (typeof Scene === 'undefined') { console.error('[EditorBridge] Scene class not available'); return null; }

    var scene = new Scene('EditorScene', engine);

    scene.OnCreate = function () {
      if (sceneData) {
        this.loadSceneData(sceneData);
      }
    };

    // OnUpdate only handles game logic (movement etc.) — NOT drawing.
    // The engine's built-in pipeline draws objects with loaded sprites.
    // Our overlay pass (drawEditorOverlays) runs AFTER the engine draw.
    scene.OnUpdate = function (elapsedTime) {
      return true;
    };

    // Load scene data into the scene
    scene.loadSceneData = function (data) {
      this.gameObjects = [];
      this.layers = [];

      if (data.layers) {
        for (var i = 0; i < data.layers.length; i++) {
          var ld = data.layers[i];
          var layer;
          if (ld.isUI) {
            layer = new UILayer(ld.name);
          } else {
            layer = new Layer(ld.name);
          }
          layer.z_order = ld.zOrder || 0;

          // Load game objects
          if (ld.gameObjects) {
            for (var j = 0; j < ld.gameObjects.length; j++) {
              var goData = ld.gameObjects[j];
              var sprite = createSpriteFromData(goData.sprite);
              var pos = new Vec2(goData.position.X, goData.position.Y);
              var obj = new GameObject(sprite, pos, goData.opacity !== undefined ? goData.opacity : 1);
              obj.id = goData.id;
              obj.name = goData.name || 'GameObject';
              obj.showIt = goData.showIt !== undefined ? goData.showIt : true;
              obj.isStatic = goData.isStatic || false;
              obj.hasSimpleSprite = goData.hasSimpleSprite !== undefined ? goData.hasSimpleSprite : true;
              if (goData.velocity) obj.velocity = new Vec2(goData.velocity.X, goData.velocity.Y);
              layer.registerGameObject(obj);
            }
          }

          // Load elements
          if (ld.elements) {
            for (var j = 0; j < ld.elements.length; j++) {
              var elData = ld.elements[j];
              var sprite = createSpriteFromData(elData.sprite);
              var pos = new Vec2(elData.position.X, elData.position.Y);
              var el = new Element(sprite, pos, elData.opacity !== undefined ? elData.opacity : 1);
              el.id = elData.id;
              el.showIt = elData.showIt !== undefined ? elData.showIt : true;
              layer.registerElement(el);
            }
          }

          this.layers.push({ zOrder: layer.z_order, layer: layer });
        }
      }

      // Set up camera if provided
      if (data.camera) {
        var cam = data.camera;
        var camera;
        if (cam.type === 'world') {
          camera = new WorldCamera(
            cam.screenWidth || 960, cam.screenHeight || 540,
            cam.levelWidth || 2000, cam.levelHeight || 1200,
            cam.speed || 10
          );
          if (cam.smoothFollow !== undefined) camera.smoothFollow = cam.smoothFollow;
          if (cam.followLerp !== undefined) camera.followLerp = cam.followLerp;
          if (cam.zoom !== undefined) camera._zoom = cam.zoom;
        } else {
          camera = new Camera(
            cam.screenWidth || 960, cam.screenHeight || 540,
            cam.levelWidth || cam.screenWidth || 960,
            cam.levelHeight || cam.screenHeight || 540,
            cam.speed || 10
          );
        }
        if (cam.position) camera.position = new Vec2(cam.position.X, cam.position.Y);
        camera.addOffset = cam.addOffset || false;
        camera.getOffset();
        this.currentCamera = camera;
      }
    };

    return scene;
  }

  // ── Editor overlay drawing (runs AFTER engine's built-in draw) ──
  function drawEditorOverlays(ctx) {
    if (!editorScene) return;
    if (!engine.isPaused()) return;

    var w = engine.canvas.width;
    var h = engine.canvas.height;

    // 1. Grid
    if (gridEnabled) {
      drawGrid(ctx, w, h);
    }

    // 2. Camera bounds
    if (editorScene.currentCamera) {
      drawCameraBounds(ctx, editorScene.currentCamera);
    }

    // 3. Object contours, placeholders, and labels
    for (var i = 0; i < editorScene.layers.length; i++) {
      var layer = editorScene.layers[i].layer;

      for (var j = 0; j < layer.gameObjects.length; j++) {
        var obj = layer.gameObjects[j];
        if (!obj.showIt) continue;
        var sw = obj.sprite ? obj.sprite.width : 32;
        var sh = obj.sprite ? obj.sprite.height : 32;
        var hasImage = obj.sprite && obj.sprite.image && obj.sprite.imageLoaded;
        var isSelected = obj.id === selectedObjectId;

        // Placeholder fill for objects without a loaded sprite
        if (!hasImage) {
          ctx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1;
          ctx.fillStyle = 'rgba(100, 149, 237, 0.25)';
          ctx.fillRect(obj.position.X, obj.position.Y, sw, sh);
          ctx.globalAlpha = 1;
        }

        // Contour outline on every object
        if (isSelected) {
          ctx.strokeStyle = '#89b4fa';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(obj.position.X - 1, obj.position.Y - 1, sw + 2, sh + 2);
          ctx.setLineDash([]);
          // Corner handles
          drawSelectionHandles(ctx, obj.position.X - 1, obj.position.Y - 1, sw + 2, sh + 2);
        } else {
          ctx.strokeStyle = 'rgba(100, 149, 237, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(obj.position.X, obj.position.Y, sw, sh);
        }

        // Name label
        ctx.font = '10px sans-serif';
        ctx.fillStyle = isSelected ? '#89b4fa' : '#cdd6f4';
        ctx.globalAlpha = isSelected ? 1 : 0.7;
        ctx.fillText(obj.name || 'GameObject', obj.position.X, obj.position.Y - 4);
        ctx.globalAlpha = 1;
      }

      for (var j = 0; j < layer.elements.length; j++) {
        var el = layer.elements[j];
        if (!el.showIt) continue;
        var sw = el.sprite ? el.sprite.width : 32;
        var sh = el.sprite ? el.sprite.height : 32;
        var hasImage = el.sprite && el.sprite.image && el.sprite.imageLoaded;
        var isSelected = el.id === selectedObjectId;

        // Placeholder fill
        if (!hasImage) {
          ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;
          ctx.fillStyle = 'rgba(160, 120, 200, 0.25)';
          ctx.fillRect(el.position.X, el.position.Y, sw, sh);
          ctx.globalAlpha = 1;
        }

        // Contour outline
        if (isSelected) {
          ctx.strokeStyle = '#89b4fa';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(el.position.X - 1, el.position.Y - 1, sw + 2, sh + 2);
          ctx.setLineDash([]);
          drawSelectionHandles(ctx, el.position.X - 1, el.position.Y - 1, sw + 2, sh + 2);
        } else {
          ctx.strokeStyle = 'rgba(160, 120, 200, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(el.position.X, el.position.Y, sw, sh);
        }

        // Name label
        ctx.font = '10px sans-serif';
        ctx.fillStyle = isSelected ? '#89b4fa' : '#cdd6f4';
        ctx.globalAlpha = isSelected ? 1 : 0.7;
        ctx.fillText(el.name || el.type || 'Element', el.position.X, el.position.Y - 4);
        ctx.globalAlpha = 1;
      }
    }

    // 4. Guide lines from selected object to ruler edges
    if (selectedObjectId) {
      var selected = findObjectById(editorScene, selectedObjectId);
      if (selected) {
        var sw = selected.sprite ? selected.sprite.width : 32;
        var sh = selected.sprite ? selected.sprite.height : 32;
        ctx.strokeStyle = 'rgba(137, 180, 250, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        // Horizontal guide
        ctx.beginPath();
        ctx.moveTo(0, selected.position.Y);
        ctx.lineTo(w, selected.position.Y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, selected.position.Y + sh);
        ctx.lineTo(w, selected.position.Y + sh);
        ctx.stroke();
        // Vertical guide
        ctx.beginPath();
        ctx.moveTo(selected.position.X, 0);
        ctx.lineTo(selected.position.X, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(selected.position.X + sw, 0);
        ctx.lineTo(selected.position.X + sw, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Position badge
        ctx.fillStyle = 'rgba(30, 30, 46, 0.85)';
        var label = Math.round(selected.position.X) + ', ' + Math.round(selected.position.Y);
        var labelW = ctx.measureText(label).width + 8;
        ctx.fillRect(selected.position.X, selected.position.Y + sh + 4, labelW, 16);
        ctx.fillStyle = '#89b4fa';
        ctx.font = '10px var(--font-mono, monospace)';
        ctx.fillText(label, selected.position.X + 4, selected.position.Y + sh + 15);
      }
    }
  }

  function drawSelectionHandles(ctx, x, y, w, h) {
    var size = 5;
    ctx.fillStyle = '#89b4fa';
    // corners
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.fillRect(x + w - size / 2, y - size / 2, size, size);
    ctx.fillRect(x - size / 2, y + h - size / 2, size, size);
    ctx.fillRect(x + w - size / 2, y + h - size / 2, size, size);
    // midpoints
    ctx.fillRect(x + w / 2 - size / 2, y - size / 2, size, size);
    ctx.fillRect(x + w / 2 - size / 2, y + h - size / 2, size, size);
    ctx.fillRect(x - size / 2, y + h / 2 - size / 2, size, size);
    ctx.fillRect(x + w - size / 2, y + h / 2 - size / 2, size, size);
  }

  function drawCameraBounds(ctx, camera) {
    var cx = camera.position ? camera.position.X : 0;
    var cy = camera.position ? camera.position.Y : 0;
    var cw = camera.screenWidth || engine.canvas.width;
    var ch = camera.screenHeight || engine.canvas.height;

    ctx.strokeStyle = '#f9e2af';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(cx + 0.5, cy + 0.5, cw, ch);
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = 'rgba(249, 226, 175, 0.85)';
    ctx.font = '10px sans-serif';
    ctx.fillText('Camera (' + cw + 'x' + ch + ')', cx + 4, cy - 4);
  }

  function createSpriteFromData(data) {
    if (!data) return new Sprite(32, 32, null);
    if (data.type === 'spritesheet') {
      return new SpriteSheet(
        data.name || 'anim', data.width, data.height,
        data.frameSpeed || 6, data.startFrame || 0, data.endFrame || 0,
        resolveAssetPath(data.path),
        data.once || false, null,
        data.once_max_frame !== undefined ? data.once_max_frame : -1
      );
    }
    return new Sprite(data.width || 32, data.height || 32, resolveAssetPath(data.path));
  }

  function resolveAssetPath(assetPath) {
    if (!assetPath) return null;
    // If it's already an absolute URL (jcge:// or http://), use as-is
    if (assetPath.indexOf('://') !== -1) return assetPath;
    // Resolve relative paths (e.g. "assets/sprites/player.png") against the project dir
    if (engineBasePath) {
      // engineBasePath is like "jcge:///C:/projects/mygame/engine"
      // Strip "/engine" to get project root
      var projectRoot = engineBasePath.replace(/\/engine\/?$/, '');
      return projectRoot + '/' + assetPath;
    }
    return assetPath;
  }

  function findObjectById(scene, id) {
    for (var i = 0; i < scene.layers.length; i++) {
      var layer = scene.layers[i].layer;
      for (var j = 0; j < layer.gameObjects.length; j++) {
        if (layer.gameObjects[j].id === id) return layer.gameObjects[j];
      }
      for (var j = 0; j < layer.elements.length; j++) {
        if (layer.elements[j].id === id) return layer.elements[j];
      }
    }
    return null;
  }

  function findObjectAtPosition(scene, x, y) {
    for (var i = scene.layers.length - 1; i >= 0; i--) {
      var layer = scene.layers[i].layer;

      for (var j = layer.elements.length - 1; j >= 0; j--) {
        var el = layer.elements[j];
        if (!el.showIt) continue;
        var w = el.sprite ? el.sprite.width : 32;
        var h = el.sprite ? el.sprite.height : 32;
        if (x >= el.position.X && x <= el.position.X + w &&
          y >= el.position.Y && y <= el.position.Y + h) {
          return { obj: el, type: 'element' };
        }
      }

      for (var j = layer.gameObjects.length - 1; j >= 0; j--) {
        var go = layer.gameObjects[j];
        if (!go.showIt) continue;
        var w = go.sprite ? go.sprite.width : 32;
        var h = go.sprite ? go.sprite.height : 32;
        if (x >= go.position.X && x <= go.position.X + w &&
          y >= go.position.Y && y <= go.position.Y + h) {
          return { obj: go, type: 'gameobject' };
        }
      }
    }
    return null;
  }

  function drawGrid(ctx, width, height) {
    var gridSize = 32;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (var x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    for (var y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }
  }

  // ── Click handling for object selection and drag ──
  function setupClickHandler(canvas) {
    var isDragging = false;
    var dragObject = null;
    var dragOffset = { X: 0, Y: 0 };

    canvas.addEventListener('mousedown', function (e) {
      if (!engine || !engine.isPaused() || !editorScene) return;

      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;

      var hit = findObjectAtPosition(editorScene, x, y);
      if (hit) {
        selectedObjectId = hit.obj.id;
        isDragging = true;
        dragObject = hit.obj;
        dragOffset.X = x - hit.obj.position.X;
        dragOffset.Y = y - hit.obj.position.Y;

        window.parent.postMessage({
          type: 'objectClicked',
          id: hit.obj.id,
          objectType: hit.type
        }, '*');
      } else {
        selectedObjectId = null;
        isDragging = false;
        dragObject = null;
      }
    });

    canvas.addEventListener('mousemove', function (e) {
      if (!isDragging || !dragObject) return;

      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left - dragOffset.X;
      var y = e.clientY - rect.top - dragOffset.Y;

      dragObject.position = new Vec2(Math.round(x), Math.round(y));
    });

    canvas.addEventListener('mouseup', function () {
      if (isDragging && dragObject) {
        window.parent.postMessage({
          type: 'objectMoved',
          id: dragObject.id,
          position: { X: dragObject.position.X, Y: dragObject.position.Y }
        }, '*');
      }
      isDragging = false;
      dragObject = null;
    });
  }

  // ── Message handler ──
  window.addEventListener('message', function (event) {
    var msg = event.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'init':
        if (engine) break; // Already initialized
        engineBasePath = msg.enginePath;
        loadEngineScripts(engineBasePath, function () {
          initEngine(msg.canvasWidth || 960, msg.canvasHeight || 540);
        });
        break;

      case 'loadScene':
        if (editorScene) {
          editorScene.loadSceneData(msg.sceneData);
          savedSceneState = JSON.parse(JSON.stringify(msg.sceneData));
        }
        break;

      case 'addObject':
        if (editorScene) {
          addObjectToScene(editorScene, msg.layerId, msg.objectData);
        }
        break;

      case 'removeObject':
        if (editorScene) {
          removeObjectFromScene(editorScene, msg.objectId);
        }
        break;

      case 'updateObject':
        if (editorScene) {
          var obj = findObjectById(editorScene, msg.objectId);
          if (obj && msg.properties) {
            for (var key in msg.properties) {
              if (key === 'position') {
                obj.position = new Vec2(msg.properties.position.X, msg.properties.position.Y);
              } else if (key === 'velocity' && obj.velocity) {
                obj.velocity = new Vec2(msg.properties.velocity.X, msg.properties.velocity.Y);
              } else if (key === 'sprite') {
                // Create a proper Sprite instance so the engine can load and draw it
                obj.sprite = createSpriteFromData(msg.properties.sprite);
              } else {
                obj[key] = msg.properties[key];
              }
            }
          }
        }
        break;

      case 'selectObject':
        selectedObjectId = msg.objectId;
        break;

      case 'play':
        if (engine) engine.resume();
        break;

      case 'pause':
        if (engine) engine.pause();
        break;

      case 'step':
        if (engine) {
          engine.resume();
          setTimeout(function () { engine.pause(); }, 16);
        }
        break;

      case 'reset':
        if (editorScene && savedSceneState) {
          editorScene.loadSceneData(savedSceneState);
          if (engine) engine.pause();
        }
        break;

      case 'setCanvasSize':
        if (engine) {
          engine.setCanvasSize(msg.width, msg.height);
        }
        break;
    }
  });

  function addObjectToScene(scene, layerId, objectData) {
    for (var i = 0; i < scene.layers.length; i++) {
      var layer = scene.layers[i].layer;
      if (!layerId || layer.name === layerId || i === 0) {
        if (objectData.type === 'gameobject') {
          var sprite = createSpriteFromData(objectData.sprite);
          var pos = new Vec2(objectData.position.X, objectData.position.Y);
          var obj = new GameObject(sprite, pos, objectData.opacity || 1);
          obj.id = objectData.id;
          obj.name = objectData.name;
          obj.showIt = objectData.showIt !== undefined ? objectData.showIt : true;
          layer.registerGameObject(obj);
        } else {
          var sprite = createSpriteFromData(objectData.sprite);
          var pos = new Vec2(objectData.position.X, objectData.position.Y);
          var el = new Element(sprite, pos, objectData.opacity || 1);
          el.id = objectData.id;
          el.showIt = objectData.showIt !== undefined ? objectData.showIt : true;
          layer.registerElement(el);
        }
        return;
      }
    }
  }

  function removeObjectFromScene(scene, objectId) {
    for (var i = 0; i < scene.layers.length; i++) {
      var layer = scene.layers[i].layer;
      layer.gameObjects = layer.gameObjects.filter(function (o) { return o.id !== objectId; });
      layer.elements = layer.elements.filter(function (o) { return o.id !== objectId; });
    }
  }

  // ── Initialize engine ──
  function initEngine(width, height) {
    var canvas = document.getElementById('gameCanvas');
    canvas.width = width;
    canvas.height = height;

    engine = new Engine(canvas);
    engine.setCanvasSize(width, height);

    // Prevent Drawer's constructor from resizing canvas to window size
    // by removing the resize listener and restoring the size
    engine.drawer.resize = function () {}; // no-op — editor controls canvas size

    editorScene = createEditorScene(null);
    engine.registerScene(editorScene);

    engine.jumpEngineIntro = true;

    setupClickHandler(canvas);

    // Patch the engine's game loop to add editor overlays after drawing
    var originalTimerElapsed = engine.timerElapsed.bind(engine);
    engine.timerElapsed = function (timestamp) {
      originalTimerElapsed(timestamp);
      // Draw editor overlays on top of everything
      drawEditorOverlays(engine.ctx);
    };

    engine.start();

    // Restore canvas size after engine.start() (Drawer constructor may resize)
    engine.setCanvasSize(width, height);

    engine.pause();

    window.parent.postMessage({ type: 'ready' }, '*');
  }

  // Engine is loaded via 'init' postMessage from the editor
  console.log('[EditorBridge] Waiting for init message with engine path...');
})();
