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
    "buffer/drawer.js", "buffer/sprite.js", "buffer/spriteSheet.js", "buffer/spriteAtlas.js",
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
    "ui/uiButton.js", "ui/uiLabel.js", "ui/uiPanel.js", "ui/uiCircle.js",
    "engine-parts/scene.js", "scenes/introScene.js",
    "engine-parts/engine.js"
  ];

  var engineBasePath = null;
  var engine = null;
  var editorScene = null;
  var savedSceneState = null;
  var gridEnabled = true;
  var selectedObjectId = null;
  var _OriginalAudio = window.Audio;
  var _audioCacheActive = false;

  // Custom script tracking (filename → content)
  var injectedScripts = {};

  // Scene background color
  var sceneBgColor = '#0a0a1a';

  // Isometric map state
  var editorIsoMap = null;
  var isoToolMode = null; // null | 'tile' | 'height' | 'collision'
  var isoToolTileType = 0;
  var isoToolHeightDelta = 1;
  var isoHoverCol = -1;
  var isoHoverRow = -1;
  var isIsoPainting = false;
  var lastPaintCol = -1;
  var lastPaintRow = -1;

  // Lighting/shadow state
  var editorLighting = null;
  var editorShadowSystem = null;
  var editorLightMappings = [];
  var editorCasterMappings = [];
  var sceneLightingSettings = null;

  function hexToRGB(hex) {
    hex = (hex || '#ffffff').replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return new RGB(
      parseInt(hex.substring(0, 2), 16) || 0,
      parseInt(hex.substring(2, 4), 16) || 0,
      parseInt(hex.substring(4, 6), 16) || 0
    );
  }

  function buildIsoMapFromData(isoData) {
    if (!isoData || !isoData.enabled) return null;
    var map = new IsometricMap(
      isoData.cols, isoData.rows,
      isoData.tileWidth, isoData.tileHeight,
      isoData.heightStep
    );
    map.offset = new Vec2(isoData.offsetX || 0, isoData.offsetY || 0);
    for (var r = 0; r < isoData.rows; r++) {
      for (var c = 0; c < isoData.cols; c++) {
        if (isoData.tiles && isoData.tiles[r]) map.tiles[r][c] = isoData.tiles[r][c] || 0;
        if (isoData.heightMap && isoData.heightMap[r]) map.heightMap[r][c] = isoData.heightMap[r][c] || 0;
        if (isoData.collisionMap && isoData.collisionMap[r]) map.collisionMap[r][c] = isoData.collisionMap[r][c] || 0;
      }
    }
    return map;
  }

  function handleIsoToolClick(col, row) {
    if (!editorIsoMap || !editorIsoMap.inBounds(col, row)) return;
    var property, value;
    if (isoToolMode === 'tile') {
      property = 'tiles';
      value = isoToolTileType;
      editorIsoMap.tiles[row][col] = value;
    } else if (isoToolMode === 'height') {
      property = 'heightMap';
      value = Math.max(0, editorIsoMap.heightMap[row][col] + isoToolHeightDelta);
      editorIsoMap.heightMap[row][col] = value;
    } else if (isoToolMode === 'collision') {
      property = 'collisionMap';
      value = editorIsoMap.collisionMap[row][col] === 0 ? 1 : 0;
      editorIsoMap.collisionMap[row][col] = value;
    }
    window.parent.postMessage({
      type: 'isoTileUpdated',
      col: col, row: row,
      property: property, value: value
    }, '*');
  }

  // ── Console interception ──
  var _origConsoleLog = console.log;
  var _origConsoleWarn = console.warn;
  var _origConsoleError = console.error;

  function safeStringify(val, depth, seen) {
    if (depth === undefined) depth = 3;
    if (!seen) seen = new WeakSet();

    if (val === null) return { type: 'null', value: 'null' };
    if (val === undefined) return { type: 'undefined', value: 'undefined' };

    var t = typeof val;
    if (t === 'string') return { type: 'string', value: val };
    if (t === 'number' || t === 'boolean') return { type: t, value: String(val) };
    if (t === 'function') return { type: 'function', value: '[Function: ' + (val.name || 'anonymous') + ']' };

    if (val instanceof Error) {
      return { type: 'error', value: val.name + ': ' + val.message };
    }

    if (t === 'object') {
      if (seen.has(val)) return { type: 'string', value: '[Circular]' };
      seen.add(val);

      if (depth <= 0) return { type: 'string', value: Array.isArray(val) ? '[Array]' : '[Object]' };

      if (Array.isArray(val)) {
        var arr = [];
        var len = Math.min(val.length, 100);
        for (var i = 0; i < len; i++) {
          arr.push(safeStringify(val[i], depth - 1, seen));
        }
        if (val.length > 100) arr.push({ type: 'string', value: '...' + (val.length - 100) + ' more' });
        return { type: 'array', value: arr, length: val.length };
      }

      if (val.nodeType) return { type: 'string', value: '[' + (val.constructor.name || 'HTMLElement') + ']' };

      var obj = {};
      var keys = Object.keys(val);
      var keyLen = Math.min(keys.length, 50);
      for (var i = 0; i < keyLen; i++) {
        try { obj[keys[i]] = safeStringify(val[keys[i]], depth - 1, seen); }
        catch (e) { obj[keys[i]] = { type: 'string', value: '[Error reading property]' }; }
      }
      if (keys.length > 50) obj['...'] = { type: 'string', value: (keys.length - 50) + ' more keys' };
      return { type: 'object', value: obj };
    }

    return { type: 'string', value: String(val) };
  }

  function sendConsoleMessage(level, args) {
    // Filter out internal bridge logs
    if (args.length > 0 && typeof args[0] === 'string' && args[0].indexOf('[EditorBridge]') === 0) return;
    if (args.length > 0 && typeof args[0] === 'string' && args[0].indexOf('[editorBridge]') === 0) return;

    var serialized = [];
    for (var i = 0; i < args.length; i++) {
      serialized.push(safeStringify(args[i]));
    }
    try {
      window.parent.postMessage({
        type: 'consoleLog',
        level: level,
        args: serialized,
        timestamp: Date.now()
      }, '*');
    } catch (e) { /* silently fail */ }
  }

  console.log = function() {
    _origConsoleLog.apply(console, arguments);
    sendConsoleMessage('log', Array.prototype.slice.call(arguments));
  };
  console.warn = function() {
    _origConsoleWarn.apply(console, arguments);
    sendConsoleMessage('warn', Array.prototype.slice.call(arguments));
  };
  console.error = function() {
    _origConsoleError.apply(console, arguments);
    sendConsoleMessage('error', Array.prototype.slice.call(arguments));
  };

  // Provide game.log/warn/error as user-facing API
  window.game = window.game || {};
  window.game.log = function() {
    _origConsoleLog.apply(console, arguments);
    sendConsoleMessage('log', Array.prototype.slice.call(arguments));
  };
  window.game.warn = function() {
    _origConsoleWarn.apply(console, arguments);
    sendConsoleMessage('warn', Array.prototype.slice.call(arguments));
  };
  window.game.error = function() {
    _origConsoleError.apply(console, arguments);
    sendConsoleMessage('error', Array.prototype.slice.call(arguments));
  };

  function installAudioCache(cache) {
    window.AUDIO_CACHE = cache;
    if (!_audioCacheActive) {
      window.Audio = function(src) {
        return new _OriginalAudio((window.AUDIO_CACHE && window.AUDIO_CACHE[src]) || src);
      };
      window.Audio.prototype = _OriginalAudio.prototype;
      _audioCacheActive = true;
    }
  }

  function removeAudioCache() {
    if (_audioCacheActive) {
      window.Audio = _OriginalAudio;
      _audioCacheActive = false;
    }
    delete window.AUDIO_CACHE;
  }

  // ── Load engine scripts sequentially via fetch + eval ──
  // Using fetch instead of <script> tags to avoid cross-origin/CSP issues
  // with the custom jcge:// protocol in iframes.
  function loadEngineScripts(basePath, callback) {
    var index = 0;

    function loadNext() {
      if (index >= engineFiles.length) {
        console.log('[EditorBridge] All engine scripts loaded.');
        // Ensure engine globals are on window for new Function() access
        // (class/const declarations create lexical bindings, not window properties)
        var globals = ['Keys', 'Collision', 'Vec2', 'Sprite', 'SpriteSheet', 'SpriteAtlas',
          'GameObject', 'Element', 'Layer', 'UILayer', 'Scene', 'Engine',
          'Camera', 'WorldCamera', 'Size', 'MouseButton',
          'ParticleEmitter', 'RGB', 'UILabel', 'UIPanel', 'UIButton', 'Fire', 'Particle',
          'Sound', 'SoundManager', 'UICircle',
          'IsometricMap', 'IsometricUtils', 'PathFinder', 'Easing', 'Tween'];
        // Promote class/const declarations to window properties safely
        // (class/const create lexical bindings, not window properties)
        var assignScript = document.createElement('script');
        assignScript.textContent = globals.map(function(name) {
          return 'try{if(typeof ' + name + '!=="undefined"&&!window["' + name + '"])window["' + name + '"]=' + name + ';}catch(e){}';
        }).join('\n');
        document.head.appendChild(assignScript);
        document.head.removeChild(assignScript);
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
              var obj = createGameObjectFromData(goData);
              layer.registerGameObject(obj);
            }
          }

          // Load elements (type-aware: UILabel, UIButton, UIPanel, UICircle, Element)
          if (ld.elements) {
            for (var j = 0; j < ld.elements.length; j++) {
              var el = createElementFromData(ld.elements[j]);
              layer.registerElement(el);
            }
          }

          this.layers.push({ zOrder: layer.z_order, layer: layer });
        }
      }

      // Resolve parent-child attachments (must happen after all objects are created)
      var self = this;
      for (var i = 0; i < this.layers.length; i++) {
        var layer = this.layers[i].layer;
        var allObjects = layer.gameObjects.concat(layer.elements);
        for (var k = 0; k < allObjects.length; k++) {
          var obj = allObjects[k];
          if (obj._pendingParentId) {
            var parent = findObjectById(self, obj._pendingParentId);
            if (parent) {
              if (typeof obj.attachTo === 'function') {
                obj.attachTo(parent, obj._pendingAttachOffset.X, obj._pendingAttachOffset.Y);
              } else {
                obj._attachParent = parent;
                obj._attachOffset = new Vec2(obj._pendingAttachOffset.X || 0, obj._pendingAttachOffset.Y || 0);
              }
            }
            delete obj._pendingParentId;
            delete obj._pendingAttachOffset;
          }
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

      // Scene background color
      sceneBgColor = data.backgroundColor || '#0a0a1a';

      // Isometric map
      editorIsoMap = buildIsoMapFromData(data.isometricMap);
      window.game = window.game || {};
      window.game.isoMap = editorIsoMap;

      // Store lighting settings and rebuild systems
      sceneLightingSettings = data.lighting || null;
      rebuildLightingSystems();
    };

    // Find an object by name across all layers
    scene.findByName = function (name) {
      for (var i = 0; i < this.layers.length; i++) {
        var layer = this.layers[i].layer;
        for (var j = 0; j < layer.gameObjects.length; j++) {
          if (layer.gameObjects[j].name === name) return layer.gameObjects[j];
        }
        for (var j = 0; j < layer.elements.length; j++) {
          if (layer.elements[j].name === name) return layer.elements[j];
        }
      }
      return null;
    };

    return scene;
  }

  // ── User script execution ──
  var originalOnUpdate = null;

  function applyUserScript(scene, scriptData) {
    if (!scene || !scriptData) return;

    // Save original OnUpdate for reset
    if (!originalOnUpdate) originalOnUpdate = scene.OnUpdate;

    // Preamble injects engine/Keys/Collision into the function body directly
    // so new Function() can access them regardless of scope chain issues
    var preamble = 'var engine = window.engine;\n'
      + 'var Keys = window.Keys;\n'
      + 'var Collision = window.Collision;\n'
      + 'var Vec2 = window.Vec2;\n'
      + 'var ParticleEmitter = window.ParticleEmitter;\n'
      + 'var RGB = window.RGB;\n'
      + 'var UILabel = window.UILabel;\n'
      + 'var UIPanel = window.UIPanel;\n'
      + 'var Size = window.Size;\n'
      + 'var Sound = window.Sound;\n'
      + 'var Easing = window.Easing;\n'
      + 'var Tween = window.Tween;\n'
      + 'var IsometricMap = window.IsometricMap;\n'
      + 'var IsometricUtils = window.IsometricUtils;\n'
      + 'var PathFinder = window.PathFinder;\n'
      + 'var game = window.game;\n';

    // Compile and attach OnUpdate
    if (scriptData.onUpdate && scriptData.onUpdate.trim()) {
      try {
        var updateFn = new Function('elapsedTime', preamble + scriptData.onUpdate + '\nreturn true;');
        scene.OnUpdate = function (elapsedTime) {
          try {
            return updateFn.call(this, elapsedTime);
          } catch (e) {
            console.error('[Script Error in OnUpdate]', e.message);
            window.parent.postMessage({ type: 'scriptError', error: e.message, hook: 'onUpdate' }, '*');
            return true;
          }
        };
      } catch (e) {
        console.error('[Script Compile Error]', e.message);
        window.parent.postMessage({ type: 'scriptError', error: e.message, hook: 'onUpdate' }, '*');
      }
    }

    // Run onCreate immediately (scene already exists)
    if (scriptData.onCreate && scriptData.onCreate.trim()) {
      try {
        var createFn = new Function(preamble + scriptData.onCreate);
        createFn.call(scene);
      } catch (e) {
        console.error('[Script Error in OnCreate]', e.message);
        window.parent.postMessage({ type: 'scriptError', error: e.message, hook: 'onCreate' }, '*');
      }
    }
  }

  function restoreOriginalScript(scene) {
    if (originalOnUpdate) {
      scene.OnUpdate = originalOnUpdate;
      originalOnUpdate = null;
    }
  }

  // ── Editor overlay drawing (runs AFTER engine's built-in draw) ──
  function drawEditorOverlays(ctx) {
    if (!editorScene) return;

    var editMode = engine.isPaused();
    var w = engine.canvas.width;
    var h = engine.canvas.height;

    // 1. Grid (edit mode only)
    if (editMode && gridEnabled) {
      drawGrid(ctx, w, h);
    }

    // 2. Camera bounds (edit mode only)
    if (editMode && editorScene.currentCamera) {
      drawCameraBounds(ctx, editorScene.currentCamera);
    }

    // 2.5. Isometric tool overlays (edit mode only)
    if (editMode && editorIsoMap) {
      // Draw collision overlay when collision tool is active
      if (isoToolMode === 'collision') {
        for (var ir = 0; ir < editorIsoMap.rows; ir++) {
          for (var ic = 0; ic < editorIsoMap.cols; ic++) {
            if (editorIsoMap.collisionMap[ir][ic] !== 0) {
              editorIsoMap.drawTileHighlight(engine.drawer, ic, ir, 'rgba(255, 50, 50, 0.35)');
            }
          }
        }
      }

      // Draw hover highlight
      if (isoToolMode && isoHoverCol >= 0 && isoHoverRow >= 0 && editorIsoMap.inBounds(isoHoverCol, isoHoverRow)) {
        var hColor = isoToolMode === 'tile' ? 'rgba(76, 200, 76, 0.4)'
          : isoToolMode === 'height' ? 'rgba(255, 200, 50, 0.4)'
          : 'rgba(255, 80, 80, 0.4)';
        editorIsoMap.drawTileHighlight(engine.drawer, isoHoverCol, isoHoverRow, hColor);

        // Tile info tooltip
        var infoPos = editorIsoMap.toScreen(isoHoverCol, isoHoverRow);
        var tileNames = ['Grass', 'Dirt', 'Stone', 'Water'];
        var tileType = editorIsoMap.tiles[isoHoverRow][isoHoverCol];
        var tileH = editorIsoMap.heightMap[isoHoverRow][isoHoverCol];
        var blocked = editorIsoMap.collisionMap[isoHoverRow][isoHoverCol] !== 0;
        var info = '(' + isoHoverCol + ',' + isoHoverRow + ') ' + (tileNames[tileType] || '?') + ' h:' + tileH + (blocked ? ' [X]' : '');
        ctx.font = '10px monospace';
        var infoW = ctx.measureText(info).width + 8;
        ctx.fillStyle = 'rgba(30, 30, 46, 0.85)';
        ctx.fillRect(infoPos.X - infoW / 2, infoPos.Y - 20, infoW, 16);
        ctx.fillStyle = '#89b4fa';
        ctx.fillText(info, infoPos.X - infoW / 2 + 4, infoPos.Y - 8);
      }
    }

    // ── Pass 1: Draw shapes and visual elements (always) ──
    // Engine's drawer may skip shapes depending on camera state,
    // so we always draw them here to guarantee visibility.
    for (var i = 0; i < editorScene.layers.length; i++) {
      var layer = editorScene.layers[i].layer;

      for (var j = 0; j < layer.gameObjects.length; j++) {
        var obj = layer.gameObjects[j];
        if (!obj.showIt) continue;
        if (obj._editorType === 'light' || obj._editorType === 'shadowCaster') continue;

        if (obj._shapeType) {
          ctx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1;
          var bounds = getElementBounds(obj);
          var sw = bounds.w || (obj.sprite ? obj.sprite.width : 32);
          var sh = bounds.h || (obj.sprite ? obj.sprite.height : 32);
          var drawX = obj.position.X + (bounds.offsetX || 0);
          var drawY = obj.position.Y + (bounds.offsetY || 0);
          if (obj._shapeType === 'rectangle') {
            ctx.fillStyle = obj._fillColor || '#e74c3c';
            ctx.fillRect(drawX, drawY, sw, sh);
            if (obj._borderColor) {
              ctx.strokeStyle = obj._borderColor;
              ctx.lineWidth = obj._borderWidth || 1;
              ctx.strokeRect(drawX, drawY, sw, sh);
            }
          } else if (obj._shapeType === 'circle') {
            var cr = obj._radius || 20;
            ctx.fillStyle = obj._fillColor || '#3498db';
            ctx.beginPath();
            ctx.arc(obj.position.X, obj.position.Y, cr, 0, 2 * Math.PI);
            ctx.fill();
            if (obj._borderColor) {
              ctx.strokeStyle = obj._borderColor;
              ctx.lineWidth = obj._borderWidth || 1;
              ctx.stroke();
            }
          } else if (obj._shapeType === 'triangle') {
            ctx.fillStyle = obj._fillColor || '#2ecc71';
            ctx.beginPath();
            ctx.moveTo(obj.position.X + sw / 2, obj.position.Y);
            ctx.lineTo(obj.position.X + sw, obj.position.Y + sh);
            ctx.lineTo(obj.position.X, obj.position.Y + sh);
            ctx.closePath();
            ctx.fill();
            if (obj._borderColor) {
              ctx.strokeStyle = obj._borderColor;
              ctx.lineWidth = obj._borderWidth || 1;
              ctx.stroke();
            }
          }
          ctx.globalAlpha = 1;
        }
      }

      for (var j = 0; j < layer.elements.length; j++) {
        var el = layer.elements[j];
        if (!el.showIt) continue;
        var hasVisualType = el._editorType && el._editorType !== 'element';
        if (!hasVisualType) continue;

        var bounds = getElementBounds(el);
        var sw = bounds.w;
        var sh = bounds.h;
        var drawX = el.position.X + (bounds.offsetX || 0);
        var drawY = el.position.Y + (bounds.offsetY || 0);

        ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;
        if (el._editorType === 'uiPanel' || el._editorType === 'rectangle') {
          ctx.fillStyle = el.fillColor || 'rgba(0,0,0,0.5)';
          ctx.fillRect(drawX, drawY, sw, sh);
          if (el.borderColor) {
            ctx.strokeStyle = el.borderColor;
            ctx.lineWidth = el.borderWidth || 1;
            ctx.strokeRect(drawX, drawY, sw, sh);
          }
        } else if (el._editorType === 'circle') {
          var cr = el.radius || 20;
          ctx.fillStyle = el.fillColor || '#3498db';
          ctx.beginPath();
          ctx.arc(el.position.X, el.position.Y, cr, 0, 2 * Math.PI);
          ctx.fill();
          if (el.borderColor) {
            ctx.strokeStyle = el.borderColor;
            ctx.lineWidth = el.borderWidth || 1;
            ctx.stroke();
          }
        } else if (el._editorType === 'uiText' || el._editorType === 'uiLabel') {
          ctx.font = (el.fontStyle || 'normal') + ' ' + (el.fontSize || 14) + 'px ' + (el.fontFamily || 'sans-serif');
          ctx.fillStyle = el.color || 'white';
          ctx.fillText(el.text || '', el.position.X, el.position.Y + (el.fontSize || 14));
        } else if (el._editorType === 'uiButton') {
          ctx.fillStyle = el.normalColor || '#444';
          ctx.fillRect(drawX, drawY, sw, sh);
          if (el.label) {
            ctx.fillStyle = el.fontColor || 'white';
            ctx.font = (el.fontSize || 14) + 'px sans-serif';
            var textW = ctx.measureText(el.label).width;
            ctx.fillText(el.label, drawX + (sw - textW) / 2, drawY + sh / 2 + (el.fontSize || 14) / 3);
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    // ── Lighting and shadow overlay (always, sits on top of shapes) ──
    try { renderSceneLightingEffects(); } catch (e) { console.error('[editorBridge] Lighting error:', e); }

    // ── Pass 2: Editor chrome (edit mode only, on top of lighting) ──
    if (!editMode) return;

    for (var i = 0; i < editorScene.layers.length; i++) {
      var layer = editorScene.layers[i].layer;

      for (var j = 0; j < layer.gameObjects.length; j++) {
        var obj = layer.gameObjects[j];
        if (!obj.showIt) continue;
        var isSelected = obj.id === selectedObjectId;

        // ── Light object indicator ──
        if (obj._editorType === 'light') {
          var lx = obj.position.X;
          var ly = obj.position.Y;
          var lr = obj._lightRadius || 150;
          var lc = obj._lightColor || '#ffffff';

          // Radius circle outline
          ctx.strokeStyle = lc;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(lx, ly, lr, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.setLineDash([]);

          // Center crosshair + sun dot
          ctx.strokeStyle = lc;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(lx - 10, ly); ctx.lineTo(lx + 10, ly); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(lx, ly - 10); ctx.lineTo(lx, ly + 10); ctx.stroke();
          for (var r = 0; r < 4; r++) {
            var ra = r * Math.PI / 4 + Math.PI / 8;
            ctx.beginPath();
            ctx.moveTo(lx + Math.cos(ra) * 6, ly + Math.sin(ra) * 6);
            ctx.lineTo(lx + Math.cos(ra) * 10, ly + Math.sin(ra) * 10);
            ctx.stroke();
          }
          ctx.fillStyle = lc;
          ctx.beginPath();
          ctx.arc(lx, ly, 4, 0, 2 * Math.PI);
          ctx.fill();

          if (isSelected) {
            ctx.strokeStyle = '#89b4fa';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.arc(lx, ly, lr, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          ctx.font = '10px sans-serif';
          ctx.fillStyle = isSelected ? '#89b4fa' : '#cdd6f4';
          ctx.globalAlpha = isSelected ? 1 : 0.7;
          ctx.fillText(obj.name || 'Light', lx - lr, ly - lr - 4);
          ctx.globalAlpha = 1;
          continue;
        }

        // ── Shadow caster indicator ──
        if (obj._editorType === 'shadowCaster') {
          var sx = obj.position.X;
          var sy = obj.position.Y;
          var scw = obj._shapeSize ? obj._shapeSize.width : 32;
          var sch = obj._shapeSize ? obj._shapeSize.height : 32;

          ctx.globalAlpha = 0.2;
          ctx.fillStyle = '#6c7086';
          if (obj._shadowType === 'ellipse') {
            ctx.beginPath();
            ctx.ellipse(sx + scw / 2, sy + sch / 2, scw / 2, sch / 2, 0, 0, 2 * Math.PI);
            ctx.fill();
          } else {
            ctx.fillRect(sx, sy, scw, sch);
          }
          ctx.globalAlpha = 1;

          ctx.strokeStyle = isSelected ? '#89b4fa' : '#6c7086';
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.setLineDash([4, 4]);
          if (obj._shadowType === 'ellipse') {
            ctx.beginPath();
            ctx.ellipse(sx + scw / 2, sy + sch / 2, scw / 2, sch / 2, 0, 0, 2 * Math.PI);
            ctx.stroke();
          } else {
            ctx.strokeRect(sx, sy, scw, sch);
          }
          ctx.setLineDash([]);

          if (sceneLightingSettings && sceneLightingSettings.shadowEnabled) {
            var sAngle = (sceneLightingSettings.lightAngle || 225) * Math.PI / 180;
            var arrowLen = 15;
            var ax = sx + scw / 2;
            var ay = sy + sch / 2;
            var adx = Math.cos(sAngle + Math.PI) * arrowLen;
            var ady = Math.sin(sAngle + Math.PI) * arrowLen;
            ctx.strokeStyle = '#a6adc8';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax + adx, ay + ady);
            ctx.stroke();
            ctx.fillStyle = '#a6adc8';
            ctx.beginPath();
            ctx.moveTo(ax + adx, ay + ady);
            ctx.lineTo(ax + adx - Math.cos(sAngle + Math.PI - 0.5) * 5, ay + ady - Math.sin(sAngle + Math.PI - 0.5) * 5);
            ctx.lineTo(ax + adx - Math.cos(sAngle + Math.PI + 0.5) * 5, ay + ady - Math.sin(sAngle + Math.PI + 0.5) * 5);
            ctx.closePath();
            ctx.fill();
          }

          if (isSelected) {
            drawSelectionHandles(ctx, sx - 1, sy - 1, scw + 2, sch + 2);
          }

          ctx.font = '10px sans-serif';
          ctx.fillStyle = isSelected ? '#89b4fa' : '#cdd6f4';
          ctx.globalAlpha = isSelected ? 1 : 0.7;
          ctx.fillText(obj.name || 'Shadow Caster', sx, sy - 4);
          ctx.globalAlpha = 1;
          continue;
        }

        // ── Regular game objects: editor chrome ──
        var bounds = getElementBounds(obj);
        var sw = bounds.w || (obj.sprite ? obj.sprite.width : 32);
        var sh = bounds.h || (obj.sprite ? obj.sprite.height : 32);
        var drawX = obj.position.X + (bounds.offsetX || 0);
        var drawY = obj.position.Y + (bounds.offsetY || 0);
        var hasImage = !obj._shapeType && obj.sprite && obj.sprite.image && obj.sprite.imageLoaded;

        // Placeholder fill for objects without a loaded sprite or shape
        if (!hasImage && !obj._shapeType) {
          ctx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1;
          ctx.fillStyle = 'rgba(100, 149, 237, 0.25)';
          ctx.fillRect(drawX, drawY, sw, sh);
          ctx.globalAlpha = 1;
        }

        // Contour outline
        if (isSelected) {
          ctx.strokeStyle = '#89b4fa';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(drawX - 1, drawY - 1, sw + 2, sh + 2);
          ctx.setLineDash([]);
          drawSelectionHandles(ctx, drawX - 1, drawY - 1, sw + 2, sh + 2);

          if (obj.sprite && !obj._shapeType) {
            var pivot = getSpritePivot(obj.sprite, sw, sh);
            drawPivotDot(ctx, drawX + pivot.x, drawY + pivot.y);
          }
        } else {
          ctx.strokeStyle = 'rgba(100, 149, 237, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(drawX, drawY, sw, sh);
        }

        ctx.font = '10px sans-serif';
        ctx.fillStyle = isSelected ? '#89b4fa' : '#cdd6f4';
        ctx.globalAlpha = isSelected ? 1 : 0.7;
        ctx.fillText(obj.name || 'GameObject', drawX, drawY - 4);
        ctx.globalAlpha = 1;
      }

      for (var j = 0; j < layer.elements.length; j++) {
        var el = layer.elements[j];
        if (!el.showIt) continue;
        var bounds = getElementBounds(el);
        var sw = bounds.w;
        var sh = bounds.h;
        var drawX = el.position.X + (bounds.offsetX || 0);
        var drawY = el.position.Y + (bounds.offsetY || 0);
        var hasVisualType = el._editorType && el._editorType !== 'element';
        var hasImage = !hasVisualType && el.sprite && el.sprite.image && el.sprite.imageLoaded;
        var isSelected = el.id === selectedObjectId;

        // Placeholder fill for plain elements without loaded sprite
        if (!hasImage && !hasVisualType) {
          ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;
          ctx.fillStyle = 'rgba(160, 120, 200, 0.25)';
          ctx.fillRect(drawX, drawY, sw, sh);
          ctx.globalAlpha = 1;
        }

        // Contour outline
        if (isSelected) {
          ctx.strokeStyle = '#89b4fa';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(drawX - 1, drawY - 1, sw + 2, sh + 2);
          ctx.setLineDash([]);
          drawSelectionHandles(ctx, drawX - 1, drawY - 1, sw + 2, sh + 2);

          if (el.sprite && !hasVisualType) {
            var pivot = getSpritePivot(el.sprite, sw, sh);
            drawPivotDot(ctx, drawX + pivot.x, drawY + pivot.y);
          }
        } else {
          ctx.strokeStyle = 'rgba(160, 120, 200, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(drawX, drawY, sw, sh);
        }

        ctx.font = '10px sans-serif';
        ctx.fillStyle = isSelected ? '#89b4fa' : '#cdd6f4';
        ctx.globalAlpha = isSelected ? 1 : 0.7;
        ctx.fillText(el.name || el._editorType || 'Element', drawX, drawY - 4);
        ctx.globalAlpha = 1;
      }
    }

    // 4. Guide lines from selected object to ruler edges (edit mode only)
    if (selectedObjectId) {
      var selected = findObjectById(editorScene, selectedObjectId);
      if (selected) {
        var selBounds = getElementBounds(selected);
        var sw = selBounds.w || (selected.sprite ? selected.sprite.width : 32);
        var sh = selBounds.h || (selected.sprite ? selected.sprite.height : 32);
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

    // 5. Attachment lines (edit mode only)
    if (editMode) {
      for (var i = 0; i < editorScene.layers.length; i++) {
        var layer = editorScene.layers[i].layer;
        var allObjects = layer.gameObjects.concat(layer.elements);
        for (var k = 0; k < allObjects.length; k++) {
          var obj = allObjects[k];
          if (obj._attachParent && obj._attachParent.showIt !== false) {
            var childBounds = getElementBounds(obj);
            var parentBounds = getElementBounds(obj._attachParent);
            var cx = obj.position.X + (childBounds.offsetX || 0) + childBounds.w / 2;
            var cy = obj.position.Y + (childBounds.offsetY || 0) + childBounds.h / 2;
            var px = obj._attachParent.position.X + (parentBounds.offsetX || 0) + parentBounds.w / 2;
            var py = obj._attachParent.position.Y + (parentBounds.offsetY || 0) + parentBounds.h / 2;
            ctx.strokeStyle = '#f9e2af';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(px, py);
            ctx.stroke();
            ctx.setLineDash([]);
            // Small diamond at child end
            ctx.fillStyle = '#f9e2af';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 3);
            ctx.lineTo(cx + 3, cy);
            ctx.lineTo(cx, cy + 3);
            ctx.lineTo(cx - 3, cy);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    }
  }

  // Get pivot point from any sprite type
  function getSpritePivot(sprite, fallbackW, fallbackH) {
    if (sprite && sprite._isAtlas && sprite.currentRegion) {
      var region = sprite.regions[sprite.currentRegion];
      if (region) {
        return {
          x: region.pivotX !== undefined ? region.pivotX : Math.round(region.width / 2),
          y: region.pivotY !== undefined ? region.pivotY : Math.round(region.height / 2)
        };
      }
    }
    if (sprite) {
      var w = sprite.width || fallbackW || 32;
      var h = sprite.height || fallbackH || 32;
      return {
        x: sprite.pivotX !== undefined ? sprite.pivotX : Math.round(w / 2),
        y: sprite.pivotY !== undefined ? sprite.pivotY : Math.round(h / 2)
      };
    }
    return { x: Math.round((fallbackW || 32) / 2), y: Math.round((fallbackH || 32) / 2) };
  }

  // Draw pivot crosshair + dot at screen position
  function drawPivotDot(ctx, dotX, dotY) {
    ctx.strokeStyle = '#f38ba8';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(dotX - 8, dotY);
    ctx.lineTo(dotX + 8, dotY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dotX, dotY - 8);
    ctx.lineTo(dotX, dotY + 8);
    ctx.stroke();
    ctx.fillStyle = '#f38ba8';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#1e1e2e';
    ctx.lineWidth = 1;
    ctx.stroke();
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
    var path = resolveAssetPath(data.path);
    var spr;

    // Create sprites WITHOUT a path to prevent image loading before crossOrigin is set.
    // This avoids tainted canvas errors when chroma key calls getImageData() on
    // cross-origin images (preview iframe origin differs from jcge:// protocol).
    if (data.type === 'spritesheet') {
      spr = new SpriteSheet(
        data.name || 'anim', data.width, data.height,
        data.frameSpeed || 6, data.startFrame || 0, data.endFrame || 0,
        null, // don't load yet — need to set crossOrigin first
        data.once || false, null,
        data.once_max_frame !== undefined ? data.once_max_frame : -1
      );
    } else if (data.type === 'spriteatlas') {
      spr = new SpriteAtlas(
        null, // don't load yet
        data.regions || {},
        data.currentRegion || null
      );
    } else {
      spr = new Sprite(data.width || 32, data.height || 32, null); // don't load yet
    }

    // Apply pivot for non-atlas sprites (atlas stores pivot per region)
    if (!spr._isAtlas) {
      if (data.pivotX !== undefined) spr.pivotX = data.pivotX;
      if (data.pivotY !== undefined) spr.pivotY = data.pivotY;
    }

    // Set chroma key properties BEFORE loading so the onload handler can apply them
    if (data.chromaKey) {
      spr.chromaKey = data.chromaKey;
      spr.chromaKeyTolerance = data.chromaKeyTolerance !== undefined ? data.chromaKeyTolerance : 30;
    }

    // Now load the image with crossOrigin set to avoid tainted canvas
    if (path) {
      spr.spritePath = path;
      spr.image.crossOrigin = 'anonymous';
      var self = spr;
      spr.image.onload = function() {
        self.imageLoaded = true;
        // SpriteSheet needs framesPerRow calculated from loaded image
        if (data.type === 'spritesheet') {
          self.framesPerRow = Math.floor(self.image.width / self.dWidth);
        }
        if (self.chromaKey) {
          try { self._applyChromaKey(); } catch (e) { console.warn('Chroma key failed:', e); }
        }
      };
      spr.image.src = path;
    }

    return spr;
  }

  function createGameObjectFromData(goData) {
    var pos = new Vec2(goData.position.X, goData.position.Y);
    var sprite = createSpriteFromData(goData.sprite);
    var obj = new GameObject(sprite, pos, goData.opacity !== undefined ? goData.opacity : 1);
    obj.id = goData.id;
    obj.name = goData.name || 'GameObject';
    obj.showIt = goData.showIt !== undefined ? goData.showIt : true;
    obj.isStatic = goData.isStatic || false;
    obj.hasSimpleSprite = goData.hasSimpleSprite !== undefined
      ? goData.hasSimpleSprite
      : (goData.sprite && goData.sprite.type === 'spritesheet' ? false : true);
    if (goData.velocity) obj.velocity = new Vec2(goData.velocity.X, goData.velocity.Y);
    obj._editorType = goData.type || 'gameobject';

    // Shape game objects
    if (goData.type === 'goRectangle') {
      obj._shapeType = 'rectangle';
      obj._shapeSize = new Size(goData.size ? goData.size.width : 80, goData.size ? goData.size.height : 50);
      obj._fillColor = goData.fillColor || '#e74c3c';
      obj._borderColor = goData.borderColor || null;
      obj._borderWidth = goData.borderWidth || 1;
    } else if (goData.type === 'goCircle') {
      obj._shapeType = 'circle';
      obj._radius = goData.radius || 30;
      obj._fillColor = goData.fillColor || '#3498db';
      obj._borderColor = goData.borderColor || null;
      obj._borderWidth = goData.borderWidth || 1;
    } else if (goData.type === 'goTriangle') {
      obj._shapeType = 'triangle';
      obj._shapeSize = new Size(goData.size ? goData.size.width : 60, goData.size ? goData.size.height : 60);
      obj._fillColor = goData.fillColor || '#2ecc71';
      obj._borderColor = goData.borderColor || null;
      obj._borderWidth = goData.borderWidth || 1;
    }

    // Light objects
    if (goData.type === 'light') {
      obj._editorType = 'light';
      obj._lightColor = goData.color || '#ffffff';
      obj._lightRadius = goData.radius || 150;
      obj._lightIntensity = goData.intensity !== undefined ? goData.intensity : 1.0;
      obj._lightFlicker = goData.flicker || 0;
    }

    // Shadow caster objects
    if (goData.type === 'shadowCaster') {
      obj._editorType = 'shadowCaster';
      obj._shapeSize = new Size(goData.size ? goData.size.width : 32, goData.size ? goData.size.height : 32);
      obj._shadowType = goData.shadowType || 'rectangle';
      obj._heightScale = goData.heightScale !== undefined ? goData.heightScale : 1.0;
    }

    // Reconstruct Animation container from serialized animations
    if (goData.animations && goData.animations.length > 0) {
      var animation = new Animation();
      for (var a = 0; a < goData.animations.length; a++) {
        var sheet = createSpriteFromData(goData.animations[a]);
        animation.registerAnimation(sheet);
      }
      obj.registerAnimation(animation);
    }

    // Parent-child attachment (pending resolution)
    if (goData.parentId) {
      obj._pendingParentId = goData.parentId;
      obj._pendingAttachOffset = goData.attachOffset || { X: 0, Y: 0 };
    }

    return obj;
  }

  function createElementFromData(elData) {
    var pos = new Vec2(elData.position.X, elData.position.Y);
    var el;

    switch (elData.type) {
      case 'uiText':
        el = new UILabel(elData.text || 'Text', pos, {
          fontSize: elData.fontSize || 20,
          fontFamily: elData.fontFamily || 'sans-serif',
          fontStyle: elData.fontStyle || 'normal',
          color: elData.color || 'white'
        });
        break;

      case 'uiLabel':
        el = new UILabel(elData.text || 'Label', pos, {
          fontSize: elData.fontSize || 14,
          fontFamily: elData.fontFamily || 'monospace',
          fontStyle: elData.fontStyle || 'normal',
          color: elData.color || 'white'
        });
        break;

      case 'uiButton':
        el = new UIButton(pos, new Size(
          elData.size ? elData.size.width : 120,
          elData.size ? elData.size.height : 40
        ), {
          label: elData.label || 'Button',
          fontSize: elData.fontSize || 14,
          fontColor: elData.fontColor || 'white',
          normalColor: elData.normalColor || '#444',
          hoverColor: elData.hoverColor || '#666',
          pressedColor: elData.pressedColor || '#222'
        });
        break;

      case 'uiPanel':
      case 'rectangle':
        el = new UIPanel(pos, new Size(
          elData.size ? elData.size.width : 200,
          elData.size ? elData.size.height : 150
        ), {
          fillColor: elData.fillColor || 'rgba(0,0,0,0.5)',
          borderColor: elData.borderColor || null,
          borderWidth: elData.borderWidth || 1
        });
        break;

      case 'circle':
        el = new UICircle(pos, {
          radius: elData.radius || 20,
          fillColor: elData.fillColor || '#3498db',
          borderColor: elData.borderColor || null,
          borderWidth: elData.borderWidth || 1
        });
        break;

      default: {
        var sprite = createSpriteFromData(elData.sprite);
        el = new Element(sprite, pos, elData.opacity !== undefined ? elData.opacity : 1);
        break;
      }
    }

    el.id = elData.id;
    el.name = elData.name || 'Element';
    el.showIt = elData.showIt !== undefined ? elData.showIt : true;
    el.opacity = elData.opacity !== undefined ? elData.opacity : 1;
    el._editorType = elData.type || 'element';

    // Parent-child attachment (pending resolution)
    if (elData.parentId) {
      el._pendingParentId = elData.parentId;
      el._pendingAttachOffset = elData.attachOffset || { X: 0, Y: 0 };
    }

    return el;
  }

  function getElementBounds(el) {
    if (el._editorType === 'light') {
      return { w: 24, h: 24, offsetX: -12, offsetY: -12 };
    }
    if (el._editorType === 'shadowCaster') {
      return { w: el._shapeSize ? el._shapeSize.width : 32, h: el._shapeSize ? el._shapeSize.height : 32, offsetX: 0, offsetY: 0 };
    }
    if (el._editorType === 'circle' || el._isCircle) {
      var r = el.radius || 20;
      return { w: r * 2, h: r * 2, offsetX: -r, offsetY: -r };
    }
    // Shape game objects
    if (el._shapeType === 'circle') {
      var r = el._radius || 20;
      return { w: r * 2, h: r * 2, offsetX: 0, offsetY: 0 };
    }
    if (el._shapeType) {
      return { w: el._shapeSize ? el._shapeSize.width : 60, h: el._shapeSize ? el._shapeSize.height : 60, offsetX: 0, offsetY: 0 };
    }
    if (el.size) return { w: el.size.width, h: el.size.height, offsetX: 0, offsetY: 0 };
    if (el._isLabel) {
      var tw = Math.max((el.text || '').length * el.fontSize * 0.6, 40);
      return { w: tw, h: el.fontSize + 4, offsetX: 0, offsetY: 0 };
    }
    return {
      w: el.sprite ? el.sprite.width : 32,
      h: el.sprite ? el.sprite.height : 32,
      offsetX: 0, offsetY: 0
    };
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
        var bounds = getElementBounds(el);
        var bx = el.position.X + (bounds.offsetX || 0);
        var by = el.position.Y + (bounds.offsetY || 0);
        if (x >= bx && x <= bx + bounds.w &&
          y >= by && y <= by + bounds.h) {
          return { obj: el, type: 'element' };
        }
      }

      for (var j = layer.gameObjects.length - 1; j >= 0; j--) {
        var go = layer.gameObjects[j];
        if (!go.showIt) continue;

        // Light objects: hit test near center (small area so objects underneath stay clickable)
        if (go._editorType === 'light') {
          var dist = Math.sqrt((x - go.position.X) * (x - go.position.X) + (y - go.position.Y) * (y - go.position.Y));
          if (dist <= 15) {
            return { obj: go, type: 'gameobject' };
          }
          continue;
        }

        var goBounds = getElementBounds(go);
        var gx = go.position.X + (goBounds.offsetX || 0);
        var gy = go.position.Y + (goBounds.offsetY || 0);
        var gw = goBounds.w || (go.sprite ? go.sprite.width : 32);
        var gh = goBounds.h || (go.sprite ? go.sprite.height : 32);
        if (x >= gx && x <= gx + gw &&
          y >= gy && y <= gy + gh) {
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

  // ── Lighting/Shadow system management ──
  function rebuildLightingSystems() {
    editorLighting = null;
    editorShadowSystem = null;
    editorLightMappings = [];
    editorCasterMappings = [];

    if (!sceneLightingSettings || !editorScene || !engine) return;

    if (sceneLightingSettings.enabled) {
      editorLighting = new Lighting(engine);
      editorLighting.ambientAlpha = sceneLightingSettings.ambientAlpha !== undefined ? sceneLightingSettings.ambientAlpha : 0.85;
      editorLighting.ambientColor = sceneLightingSettings.ambientColor || 'black';

      for (var i = 0; i < editorScene.layers.length; i++) {
        var layer = editorScene.layers[i].layer;
        for (var j = 0; j < layer.gameObjects.length; j++) {
          var obj = layer.gameObjects[j];
          if (obj._editorType === 'light' && obj.showIt !== false) {
            var color = hexToRGB(obj._lightColor || '#ffffff');
            var lightSpot = new LightSpot(obj.position, color, obj._lightRadius || 150, obj._lightIntensity !== undefined ? obj._lightIntensity : 1.0);
            lightSpot.flicker = obj._lightFlicker || 0;
            editorLighting.addLightSpot(lightSpot);
            editorLightMappings.push({ obj: obj, lightSpot: lightSpot });
          }
        }
      }
    }

    if (sceneLightingSettings.shadowEnabled) {
      editorShadowSystem = new ShadowSystem(engine);
      editorShadowSystem.lightAngle = sceneLightingSettings.lightAngle !== undefined ? sceneLightingSettings.lightAngle : 225;
      editorShadowSystem.shadowLength = sceneLightingSettings.shadowLength !== undefined ? sceneLightingSettings.shadowLength : 40;
      editorShadowSystem.shadowOpacity = sceneLightingSettings.shadowOpacity !== undefined ? sceneLightingSettings.shadowOpacity : 0.4;
      editorShadowSystem.blur = sceneLightingSettings.shadowBlur !== undefined ? sceneLightingSettings.shadowBlur : 4;

      for (var i = 0; i < editorScene.layers.length; i++) {
        var layer = editorScene.layers[i].layer;
        for (var j = 0; j < layer.gameObjects.length; j++) {
          var obj = layer.gameObjects[j];
          if (obj._editorType === 'shadowCaster' && obj.showIt !== false) {
            var caster = new ShadowCaster(
              obj.position,
              obj._shapeSize || new Size(32, 32),
              obj._shadowType || 'rectangle',
              obj._heightScale !== undefined ? obj._heightScale : 1.0
            );
            editorShadowSystem.addCaster(caster);
            editorCasterMappings.push({ obj: obj, caster: caster });
          }
        }
      }
    }
  }

  function renderSceneLightingEffects() {
    // Sync positions from game objects to lighting objects
    for (var i = 0; i < editorLightMappings.length; i++) {
      var m = editorLightMappings[i];
      m.lightSpot.position = m.obj.position;
      m.lightSpot.radius = m.obj._lightRadius || 150;
      m.lightSpot.intensity = m.obj._lightIntensity !== undefined ? m.obj._lightIntensity : 1.0;
      m.lightSpot.flicker = m.obj._lightFlicker || 0;
    }
    for (var i = 0; i < editorCasterMappings.length; i++) {
      var m = editorCasterMappings[i];
      m.caster.position = m.obj.position;
      if (m.obj._shapeSize) m.caster.size = m.obj._shapeSize;
      m.caster.heightScale = m.obj._heightScale !== undefined ? m.obj._heightScale : 1.0;
    }

    if (editorShadowSystem) editorShadowSystem.draw();
    if (editorLighting) editorLighting.draw(0.016);
  }

  // ── Click handling for object selection and drag ──
  function setupClickHandler(canvas) {
    var isDragging = false;
    var dragObject = null;
    var dragOffset = { X: 0, Y: 0 };
    var isDraggingPivot = false;
    var pivotDragObj = null;

    // Check if mouse is near the pivot dot of any sprite object
    function hitTestPivotDot(obj, mx, my) {
      if (!obj || !obj.sprite || obj._shapeType) return false;
      var bounds = getElementBounds(obj);
      var drawX = obj.position.X + (bounds.offsetX || 0);
      var drawY = obj.position.Y + (bounds.offsetY || 0);
      var sw = bounds.w || (obj.sprite ? obj.sprite.width : 32);
      var sh = bounds.h || (obj.sprite ? obj.sprite.height : 32);
      var pivot = getSpritePivot(obj.sprite, sw, sh);
      var dotX = drawX + pivot.x;
      var dotY = drawY + pivot.y;
      var dist = Math.sqrt((mx - dotX) * (mx - dotX) + (my - dotY) * (my - dotY));
      return dist <= 8;
    }

    canvas.addEventListener('mousedown', function (e) {
      if (!engine || !engine.isPaused() || !editorScene) return;

      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;

      // Iso tool painting
      if (isoToolMode && editorIsoMap) {
        var gridPos = editorIsoMap.toGrid(x, y);
        if (editorIsoMap.inBounds(gridPos.X, gridPos.Y)) {
          handleIsoToolClick(gridPos.X, gridPos.Y);
          isIsoPainting = true;
          lastPaintCol = gridPos.X;
          lastPaintRow = gridPos.Y;
          return;
        }
      }

      // Check if clicking on the pivot dot of the selected object first
      if (selectedObjectId) {
        var selected = findObjectById(editorScene, selectedObjectId);
        if (selected && hitTestPivotDot(selected, x, y)) {
          isDraggingPivot = true;
          pivotDragObj = selected;
          canvas.style.cursor = 'crosshair';
          return;
        }
      }

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
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;

      // Iso hover tracking
      if (engine && engine.isPaused() && editorIsoMap) {
        if (isoToolMode) {
          var gridPos = editorIsoMap.toGrid(mx, my);
          isoHoverCol = gridPos.X;
          isoHoverRow = gridPos.Y;
        } else {
          isoHoverCol = -1;
          isoHoverRow = -1;
        }
      }

      // Iso drag painting
      if (isIsoPainting && isoToolMode && editorIsoMap) {
        if (isoHoverCol >= 0 && isoHoverRow >= 0 && editorIsoMap.inBounds(isoHoverCol, isoHoverRow)) {
          if (isoHoverCol !== lastPaintCol || isoHoverRow !== lastPaintRow) {
            if (isoToolMode !== 'height') { // No drag for height mode
              handleIsoToolClick(isoHoverCol, isoHoverRow);
            }
            lastPaintCol = isoHoverCol;
            lastPaintRow = isoHoverRow;
          }
        }
        return;
      }

      // Handle pivot dot dragging
      if (isDraggingPivot && pivotDragObj) {
        var bounds = getElementBounds(pivotDragObj);
        var drawX = pivotDragObj.position.X + (bounds.offsetX || 0);
        var drawY = pivotDragObj.position.Y + (bounds.offsetY || 0);
        var sw = bounds.w || (pivotDragObj.sprite ? pivotDragObj.sprite.width : 32);
        var sh = bounds.h || (pivotDragObj.sprite ? pivotDragObj.sprite.height : 32);
        var newPX = Math.round(Math.max(0, Math.min(sw, mx - drawX)));
        var newPY = Math.round(Math.max(0, Math.min(sh, my - drawY)));
        // Update pivot on the live sprite object
        if (pivotDragObj.sprite._isAtlas && pivotDragObj.sprite.currentRegion) {
          var region = pivotDragObj.sprite.regions[pivotDragObj.sprite.currentRegion];
          if (region) {
            region.pivotX = newPX;
            region.pivotY = newPY;
          }
        } else {
          pivotDragObj.sprite.pivotX = newPX;
          pivotDragObj.sprite.pivotY = newPY;
        }
        return;
      }

      // Update cursor when hovering over pivot dot
      if (selectedObjectId && !isDragging) {
        var selected = findObjectById(editorScene, selectedObjectId);
        if (selected && hitTestPivotDot(selected, mx, my)) {
          canvas.style.cursor = 'crosshair';
        } else {
          canvas.style.cursor = '';
        }
      }

      if (!isDragging || !dragObject) return;

      var x = mx - dragOffset.X;
      var y = my - dragOffset.Y;

      dragObject.position = new Vec2(Math.round(x), Math.round(y));

      // Recalculate attachment offset if this is a child
      if (dragObject._attachParent) {
        dragObject._attachOffset = new Vec2(
          Math.round(x) - dragObject._attachParent.position.X,
          Math.round(y) - dragObject._attachParent.position.Y
        );
      }
    });

    canvas.addEventListener('mouseup', function () {
      // Stop iso painting
      if (isIsoPainting) {
        isIsoPainting = false;
        lastPaintCol = -1;
        lastPaintRow = -1;
        return;
      }

      // Send pivot update when done dragging the pivot dot
      if (isDraggingPivot && pivotDragObj) {
        var msg = { type: 'pivotMoved', id: pivotDragObj.id };
        if (pivotDragObj.sprite._isAtlas && pivotDragObj.sprite.currentRegion) {
          var region = pivotDragObj.sprite.regions[pivotDragObj.sprite.currentRegion];
          if (region) {
            msg.regionName = pivotDragObj.sprite.currentRegion;
            msg.pivotX = region.pivotX;
            msg.pivotY = region.pivotY;
          }
        } else {
          msg.pivotX = pivotDragObj.sprite.pivotX;
          msg.pivotY = pivotDragObj.sprite.pivotY;
        }
        window.parent.postMessage(msg, '*');
        isDraggingPivot = false;
        pivotDragObj = null;
        canvas.style.cursor = '';
        return;
      }

      if (isDragging && dragObject) {
        var moveMsg = {
          type: 'objectMoved',
          id: dragObject.id,
          position: { X: dragObject.position.X, Y: dragObject.position.Y }
        };
        // Send updated offset if child is attached
        if (dragObject._attachParent && dragObject._attachOffset) {
          moveMsg.attachOffset = { X: dragObject._attachOffset.X, Y: dragObject._attachOffset.Y };
        }
        window.parent.postMessage(moveMsg, '*');
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
          if (msg.objectData.type === 'light' || msg.objectData.type === 'shadowCaster') {
            rebuildLightingSystems();
          }
        }
        break;

      case 'removeObject':
        if (editorScene) {
          removeObjectFromScene(editorScene, msg.objectId);
          rebuildLightingSystems();
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
                obj.sprite = createSpriteFromData(msg.properties.sprite);
              } else if (key === 'color' && obj._editorType === 'light') {
                obj._lightColor = msg.properties[key];
              } else if (key === 'radius' && obj._editorType === 'light') {
                obj._lightRadius = msg.properties[key];
              } else if (key === 'intensity' && obj._editorType === 'light') {
                obj._lightIntensity = msg.properties[key];
              } else if (key === 'flicker' && obj._editorType === 'light') {
                obj._lightFlicker = msg.properties[key];
              } else if (key === 'size' && obj._editorType === 'shadowCaster') {
                obj._shapeSize = new Size(msg.properties.size.width, msg.properties.size.height);
              } else if (key === 'shadowType') {
                obj._shadowType = msg.properties[key];
              } else if (key === 'heightScale') {
                obj._heightScale = msg.properties[key];
              } else if (key === 'size' && obj.size) {
                obj.size = new Size(msg.properties.size.width, msg.properties.size.height);
              } else if (key === 'size' && obj._shapeSize) {
                obj._shapeSize = new Size(msg.properties.size.width, msg.properties.size.height);
              } else if (key === 'fillColor') {
                obj._fillColor = msg.properties.fillColor;
                if (obj.fillColor !== undefined) obj.fillColor = msg.properties.fillColor;
              } else if (key === 'borderColor') {
                obj._borderColor = msg.properties.borderColor;
                if (obj.borderColor !== undefined) obj.borderColor = msg.properties.borderColor;
              } else if (key === 'borderWidth') {
                obj._borderWidth = msg.properties.borderWidth;
                if (obj.borderWidth !== undefined) obj.borderWidth = msg.properties.borderWidth;
              } else if (key === 'radius') {
                obj._radius = msg.properties.radius;
                if (obj.radius !== undefined) obj.radius = msg.properties.radius;
              } else if (key === 'parentId') {
                var parentId = msg.properties.parentId;
                if (parentId) {
                  var parent = findObjectById(editorScene, parentId);
                  if (parent) {
                    var offset = msg.properties.attachOffset || { X: 0, Y: 0 };
                    if (typeof obj.attachTo === 'function') {
                      obj.attachTo(parent, offset.X, offset.Y);
                    } else {
                      obj._attachParent = parent;
                      obj._attachOffset = new Vec2(offset.X || 0, offset.Y || 0);
                    }
                  }
                } else {
                  if (typeof obj.detach === 'function') {
                    obj.detach();
                  } else {
                    obj._attachParent = null;
                    obj._attachOffset = null;
                  }
                }
              } else if (key === 'attachOffset') {
                if (obj._attachParent) {
                  obj._attachOffset = new Vec2(msg.properties.attachOffset.X, msg.properties.attachOffset.Y);
                }
              } else if (key === 'animations') {
                var animData = msg.properties.animations;
                if (animData && animData.length > 0) {
                  var anim = new Animation();
                  for (var a = 0; a < animData.length; a++) {
                    var sheet = createSpriteFromData(animData[a]);
                    anim.registerAnimation(sheet);
                  }
                  obj.registerAnimation(anim);
                } else {
                  obj.animations = new Animation();
                }
              } else {
                obj[key] = msg.properties[key];
              }
            }
          }
        }
        break;

      case 'updateSceneLighting':
        sceneLightingSettings = msg.lighting || null;
        rebuildLightingSystems();
        break;

      case 'updateIsometricMap':
        editorIsoMap = buildIsoMapFromData(msg.isoData);
        break;

      case 'setIsoTool':
        isoToolMode = msg.mode || null;
        isoToolTileType = msg.tileType !== undefined ? msg.tileType : 0;
        isoToolHeightDelta = msg.heightDelta !== undefined ? msg.heightDelta : 1;
        break;

      case 'updateSceneBgColor':
        sceneBgColor = msg.color || '#0a0a1a';
        break;

      case 'selectObject':
        selectedObjectId = msg.objectId;
        break;

      case 'loadScript':
        if (editorScene) {
          applyUserScript(editorScene, msg.script);
        }
        break;

      case 'loadCustomScripts':
        if (msg.scripts && msg.scripts.length > 0) {
          for (var i = 0; i < msg.scripts.length; i++) {
            var scriptInfo = msg.scripts[i];
            // Skip if already injected with identical content
            if (injectedScripts[scriptInfo.filename] === scriptInfo.content) continue;
            // Remove old version if exists
            var existingScript = document.querySelector('script[data-custom-script="' + scriptInfo.filename + '"]');
            if (existingScript) existingScript.parentNode.removeChild(existingScript);
            try {
              // Extract top-level declaration names to export to window
              // Track brace depth to skip declarations inside functions/methods
              var content = scriptInfo.content;
              var exportNames = [];
              var braceDepth = 0;
              var srcLines = content.split('\n');
              for (var k = 0; k < srcLines.length; k++) {
                var trimmed = srcLines[k].trim();
                // Only match declarations at brace depth 0 (true top-level)
                if (braceDepth === 0) {
                  var cm = trimmed.match(/^(?:export\s+)?(?:class|function)\s+(\w+)/);
                  if (cm) exportNames.push(cm[1]);
                  var vm = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+(\w+)/);
                  if (vm) exportNames.push(vm[1]);
                }
                // Update brace depth after checking (count braces on this line)
                for (var c = 0; c < srcLines[k].length; c++) {
                  if (srcLines[k][c] === '{') braceDepth++;
                  else if (srcLines[k][c] === '}') braceDepth--;
                }
              }
              // Wrap in IIFE to avoid lexical re-declaration errors,
              // then assign declarations to window for global access
              // Use try-catch per export in case of false positives
              var exportLines = '';
              for (var n = 0; n < exportNames.length; n++) {
                exportLines += 'try{window["' + exportNames[n] + '"]=' + exportNames[n] + ';}catch(_){}\n';
              }
              var wrapped = '(function(){\n' + content + '\n' + exportLines + '})();\n';
              var scriptEl = document.createElement('script');
              scriptEl.textContent = wrapped;
              scriptEl.setAttribute('data-custom-script', scriptInfo.filename);
              document.head.appendChild(scriptEl);
              injectedScripts[scriptInfo.filename] = scriptInfo.content;
            } catch (e) {
              console.error('[EditorBridge] Error loading custom script: ' + scriptInfo.filename, e);
            }
          }
        }
        break;

      case 'loadAudioCache':
        if (msg.audioCache) {
          installAudioCache(msg.audioCache);
        }
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
          restoreOriginalScript(editorScene);
          // Stop all audio
          if (engine && engine.sound) {
            engine.sound.stopMusic();
          }
          var audios = document.querySelectorAll('audio');
          for (var i = 0; i < audios.length; i++) {
            audios[i].pause();
            audios[i].currentTime = 0;
          }
          // Remove audio cache and restore original Audio constructor
          removeAudioCache();
          // Custom scripts are kept in DOM (lexical bindings persist anyway)
          // loadCustomScripts skips already-injected scripts
          editorScene.loadSceneData(savedSceneState);
          if (engine) engine.pause();
          window.parent.postMessage({ type: 'consoleClear' }, '*');
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
        if (objectData.type === 'gameobject' || objectData.type === 'goRectangle' || objectData.type === 'goCircle' || objectData.type === 'goTriangle' || objectData.type === 'light' || objectData.type === 'shadowCaster') {
          var obj = createGameObjectFromData(objectData);
          layer.registerGameObject(obj);
        } else {
          var el = createElementFromData(objectData);
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
    window.engine = engine; // Expose globally so user scripts can access it
    engine.setCanvasSize(width, height);

    // Prevent Drawer's constructor from resizing canvas to window size
    // by removing the resize listener and restoring the size
    engine.drawer.resize = function () {}; // no-op — editor controls canvas size

    // Patch drawer.clear to fill with scene background color
    var originalClear = engine.drawer.clear.bind(engine.drawer);
    engine.drawer.clear = function () {
      originalClear();
      if (sceneBgColor) {
        engine.drawer.ctx.fillStyle = sceneBgColor;
        engine.drawer.ctx.fillRect(0, 0, engine.canvas.width, engine.canvas.height);
      }
      // Draw isometric map as ground layer (before objects)
      if (editorIsoMap) {
        editorIsoMap.draw(engine.drawer, editorScene ? editorScene.currentCamera : null);
      }
    };

    editorScene = createEditorScene(null);
    engine.registerScene(editorScene);

    engine.jumpEngineIntro = true;

    setupClickHandler(canvas);

    // Patch the engine's game loop to add editor overlays after drawing
    var originalTimerElapsed = engine.timerElapsed.bind(engine);
    engine.timerElapsed = function (timestamp) {
      try {
        originalTimerElapsed(timestamp);
      } catch (e) {
        // Prevent broken sprites from crashing the render loop
        if (e.message && e.message.indexOf('broken') === -1) {
          console.error('[editorBridge] Render error:', e);
        }
      }
      // Draw editor overlays (shapes → lighting → editor chrome)
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
