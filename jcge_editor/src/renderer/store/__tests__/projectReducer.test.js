import { describe, it, expect } from 'vitest';
import {
  createEmptyProject,
  projectReducer,
  initialState,
  getSelectedScene,
  getSelectedLayer,
  getSelectedObject
} from '../ProjectContext.jsx';

// ── Helpers ──

function newProjectState(overrides = {}) {
  const project = createEmptyProject('Test', 800, 600);
  return projectReducer(initialState, {
    type: 'NEW_PROJECT',
    name: 'Test',
    width: 800,
    height: 600,
    ...overrides
  });
}

function stateWithScene(state, name) {
  return projectReducer(state, { type: 'ADD_SCENE', name });
}

function stateWithLayer(state, name, isUI = false) {
  return projectReducer(state, { type: 'ADD_LAYER', name, isUI });
}

function stateWithObject(state, obj, objectType = 'gameobject') {
  return projectReducer(state, {
    type: 'ADD_OBJECT',
    object: obj,
    objectType
  });
}

// ── Tests ──

describe('createEmptyProject', () => {
  it('returns a project with default values', () => {
    const p = createEmptyProject();
    expect(p.version).toBe(1);
    expect(p.name).toBe('Untitled');
    expect(p.filePath).toBeNull();
    expect(p.settings.canvasWidth).toBe(960);
    expect(p.settings.canvasHeight).toBe(540);
  });

  it('accepts custom name and size', () => {
    const p = createEmptyProject('MyGame', 1280, 720);
    expect(p.name).toBe('MyGame');
    expect(p.settings.canvasWidth).toBe(1280);
    expect(p.settings.canvasHeight).toBe(720);
  });

  it('has one scene with one layer', () => {
    const p = createEmptyProject();
    expect(p.scenes).toHaveLength(1);
    expect(p.scenes[0].name).toBe('MainScene');
    expect(p.scenes[0].isDefault).toBe(true);
    expect(p.scenes[0].layers).toHaveLength(1);
  });

  it('has empty assets', () => {
    const p = createEmptyProject();
    expect(p.assets.sprites).toEqual([]);
    expect(p.assets.audio).toEqual([]);
  });

  it('has empty scripts array', () => {
    const p = createEmptyProject();
    expect(p.scripts).toEqual([]);
  });

  it('scene has script object with empty strings', () => {
    const p = createEmptyProject();
    expect(p.scenes[0].script).toEqual({ onUpdate: '', onCreate: '', onDestroy: '' });
  });
});

describe('projectReducer', () => {
  // ── NEW_PROJECT ──
  describe('NEW_PROJECT', () => {
    it('initializes project state', () => {
      const state = newProjectState();
      expect(state.project).not.toBeNull();
      expect(state.project.name).toBe('Test');
      expect(state.dirty).toBe(false);
    });

    it('selects first scene and layer', () => {
      const state = newProjectState();
      expect(state.selectedSceneId).toBe(state.project.scenes[0].id);
      expect(state.selectedLayerId).toBe(state.project.scenes[0].layers[0].id);
    });

    it('clears selection and undo', () => {
      const state = newProjectState();
      expect(state.selectedObjectId).toBeNull();
      expect(state.undoStack).toEqual([]);
      expect(state.redoStack).toEqual([]);
    });

    it('sets filePath when provided', () => {
      const state = newProjectState({ filePath: '/path/to/project.jcge' });
      expect(state.project.filePath).toBe('/path/to/project.jcge');
    });
  });

  // ── LOAD_PROJECT ──
  describe('LOAD_PROJECT', () => {
    it('loads project and selects defaults', () => {
      const project = createEmptyProject('Loaded');
      const state = projectReducer(initialState, { type: 'LOAD_PROJECT', project });
      expect(state.project.name).toBe('Loaded');
      expect(state.dirty).toBe(false);
      expect(state.selectedSceneId).toBe(project.scenes[0].id);
    });

    it('handles project with no scenes', () => {
      const project = { ...createEmptyProject(), scenes: [] };
      const state = projectReducer(initialState, { type: 'LOAD_PROJECT', project });
      expect(state.selectedSceneId).toBeNull();
      expect(state.selectedLayerId).toBeNull();
    });
  });

  // ── RELOAD_PROJECT ──
  describe('RELOAD_PROJECT', () => {
    it('increments reloadKey', () => {
      const state = newProjectState();
      const project = createEmptyProject('Reloaded');
      const reloaded = projectReducer(state, { type: 'RELOAD_PROJECT', project });
      expect(reloaded.reloadKey).toBe((state.reloadKey || 0) + 1);
    });

    it('resets previewMode to edit', () => {
      let state = newProjectState();
      state = projectReducer(state, { type: 'SET_PREVIEW_MODE', mode: 'play' });
      const project = createEmptyProject('Reloaded');
      const reloaded = projectReducer(state, { type: 'RELOAD_PROJECT', project });
      expect(reloaded.previewMode).toBe('edit');
    });
  });

  // ── SET_PROJECT_PATH ──
  describe('SET_PROJECT_PATH', () => {
    it('updates filePath and clears dirty', () => {
      let state = newProjectState();
      state = projectReducer(state, { type: 'ADD_SCENE', name: 'X' }); // make dirty
      expect(state.dirty).toBe(true);
      state = projectReducer(state, { type: 'SET_PROJECT_PATH', filePath: '/new.jcge' });
      expect(state.project.filePath).toBe('/new.jcge');
      expect(state.dirty).toBe(false);
    });
  });

  // ── MARK_SAVED ──
  describe('MARK_SAVED', () => {
    it('clears dirty flag', () => {
      let state = newProjectState();
      state = projectReducer(state, { type: 'ADD_SCENE', name: 'X' });
      expect(state.dirty).toBe(true);
      state = projectReducer(state, { type: 'MARK_SAVED' });
      expect(state.dirty).toBe(false);
    });
  });

  // ── Selection ──
  describe('SELECT_SCENE', () => {
    it('sets selectedSceneId and clears object selection', () => {
      const state = projectReducer(newProjectState(), { type: 'SELECT_SCENE', id: 'abc' });
      expect(state.selectedSceneId).toBe('abc');
      expect(state.selectedLayerId).toBeNull();
      expect(state.selectedObjectType).toBe('scene');
    });
  });

  describe('SELECT_LAYER', () => {
    it('sets selectedLayerId', () => {
      const state = projectReducer(newProjectState(), { type: 'SELECT_LAYER', id: 'lyr1' });
      expect(state.selectedLayerId).toBe('lyr1');
      expect(state.selectedObjectId).toBeNull();
      expect(state.selectedObjectType).toBe('layer');
    });
  });

  describe('SELECT_OBJECT', () => {
    it('sets selectedObjectId and type', () => {
      const state = projectReducer(newProjectState(), {
        type: 'SELECT_OBJECT', id: 'obj1', objectType: 'element'
      });
      expect(state.selectedObjectId).toBe('obj1');
      expect(state.selectedObjectType).toBe('element');
    });

    it('defaults objectType to gameobject', () => {
      const state = projectReducer(newProjectState(), { type: 'SELECT_OBJECT', id: 'obj1' });
      expect(state.selectedObjectType).toBe('gameobject');
    });
  });

  describe('DESELECT', () => {
    it('clears object selection', () => {
      let state = projectReducer(newProjectState(), {
        type: 'SELECT_OBJECT', id: 'obj1', objectType: 'gameobject'
      });
      state = projectReducer(state, { type: 'DESELECT' });
      expect(state.selectedObjectId).toBeNull();
      expect(state.selectedObjectType).toBeNull();
    });
  });

  // ── Scene CRUD ──
  describe('ADD_SCENE', () => {
    it('adds a scene and marks dirty', () => {
      const state = stateWithScene(newProjectState(), 'Level2');
      expect(state.project.scenes).toHaveLength(2);
      expect(state.project.scenes[1].name).toBe('Level2');
      expect(state.dirty).toBe(true);
    });

    it('new scene has one default layer', () => {
      const state = stateWithScene(newProjectState(), 'Level2');
      const scene = state.project.scenes[1];
      expect(scene.layers).toHaveLength(1);
      expect(scene.layers[0].name).toBe('ground');
    });

    it('new scene is not default', () => {
      const state = stateWithScene(newProjectState(), 'Level2');
      expect(state.project.scenes[1].isDefault).toBe(false);
    });
  });

  describe('REMOVE_SCENE', () => {
    it('removes scene by id', () => {
      let state = newProjectState();
      state = stateWithScene(state, 'Level2');
      const sceneId = state.project.scenes[1].id;
      state = projectReducer(state, { type: 'REMOVE_SCENE', id: sceneId });
      expect(state.project.scenes).toHaveLength(1);
    });

    it('selects first remaining scene', () => {
      let state = newProjectState();
      state = stateWithScene(state, 'Level2');
      const firstId = state.project.scenes[0].id;
      const secondId = state.project.scenes[1].id;
      state = projectReducer(state, { type: 'REMOVE_SCENE', id: firstId });
      expect(state.selectedSceneId).toBe(secondId);
    });

    it('nullifies selection when all scenes removed', () => {
      let state = newProjectState();
      const sceneId = state.project.scenes[0].id;
      state = projectReducer(state, { type: 'REMOVE_SCENE', id: sceneId });
      expect(state.selectedSceneId).toBeNull();
    });
  });

  describe('SET_DEFAULT_SCENE', () => {
    it('marks only the target scene as default', () => {
      let state = newProjectState();
      state = stateWithScene(state, 'Level2');
      const secondId = state.project.scenes[1].id;
      state = projectReducer(state, { type: 'SET_DEFAULT_SCENE', id: secondId });
      expect(state.project.scenes[0].isDefault).toBe(false);
      expect(state.project.scenes[1].isDefault).toBe(true);
    });
  });

  describe('RENAME_SCENE', () => {
    it('renames the target scene', () => {
      let state = newProjectState();
      const sceneId = state.project.scenes[0].id;
      state = projectReducer(state, { type: 'RENAME_SCENE', id: sceneId, name: 'Renamed' });
      expect(state.project.scenes[0].name).toBe('Renamed');
      expect(state.dirty).toBe(true);
    });
  });

  describe('UPDATE_SCENE_BGCOLOR', () => {
    it('updates background color of selected scene', () => {
      let state = newProjectState();
      state = projectReducer(state, { type: 'UPDATE_SCENE_BGCOLOR', color: '#ff0000' });
      const scene = state.project.scenes.find(s => s.id === state.selectedSceneId);
      expect(scene.backgroundColor).toBe('#ff0000');
    });
  });

  describe('UPDATE_SCENE_LIGHTING', () => {
    it('sets lighting on selected scene', () => {
      let state = newProjectState();
      const lighting = { enabled: true, ambient: 0.5 };
      state = projectReducer(state, { type: 'UPDATE_SCENE_LIGHTING', lighting });
      const scene = state.project.scenes.find(s => s.id === state.selectedSceneId);
      expect(scene.lighting).toEqual(lighting);
    });
  });

  describe('UPDATE_SCENE_SCRIPT', () => {
    it('merges script properties on target scene', () => {
      let state = newProjectState();
      const sceneId = state.project.scenes[0].id;
      state = projectReducer(state, {
        type: 'UPDATE_SCENE_SCRIPT',
        sceneId,
        script: { onCreate: 'console.log("hi")' }
      });
      const scene = state.project.scenes[0];
      expect(scene.script.onCreate).toBe('console.log("hi")');
      expect(scene.script.onUpdate).toBe('');
    });
  });

  // ── Layer CRUD ──
  describe('ADD_LAYER', () => {
    it('adds layer to selected scene', () => {
      let state = newProjectState();
      state = stateWithLayer(state, 'foreground');
      const scene = state.project.scenes.find(s => s.id === state.selectedSceneId);
      expect(scene.layers).toHaveLength(2);
      expect(scene.layers[1].name).toBe('foreground');
    });

    it('sets zOrder based on index', () => {
      let state = newProjectState();
      state = stateWithLayer(state, 'fg');
      const scene = state.project.scenes.find(s => s.id === state.selectedSceneId);
      expect(scene.layers[1].zOrder).toBe(1);
    });

    it('supports isUI flag', () => {
      let state = newProjectState();
      state = stateWithLayer(state, 'ui', true);
      const scene = state.project.scenes.find(s => s.id === state.selectedSceneId);
      expect(scene.layers[1].isUI).toBe(true);
    });
  });

  describe('TOGGLE_LAYER_UI', () => {
    it('toggles isUI on layer', () => {
      let state = newProjectState();
      const layerId = state.project.scenes[0].layers[0].id;
      expect(state.project.scenes[0].layers[0].isUI).toBe(false);
      state = projectReducer(state, { type: 'TOGGLE_LAYER_UI', id: layerId });
      expect(state.project.scenes[0].layers[0].isUI).toBe(true);
      state = projectReducer(state, { type: 'TOGGLE_LAYER_UI', id: layerId });
      expect(state.project.scenes[0].layers[0].isUI).toBe(false);
    });
  });

  describe('REMOVE_LAYER', () => {
    it('removes layer and reindexes zOrder', () => {
      let state = newProjectState();
      state = stateWithLayer(state, 'fg');
      state = stateWithLayer(state, 'top');
      const scene0 = state.project.scenes.find(s => s.id === state.selectedSceneId);
      const fgId = scene0.layers[1].id;
      state = projectReducer(state, { type: 'REMOVE_LAYER', id: fgId });
      const scene = state.project.scenes.find(s => s.id === state.selectedSceneId);
      expect(scene.layers).toHaveLength(2);
      expect(scene.layers[0].zOrder).toBe(0);
      expect(scene.layers[1].zOrder).toBe(1);
    });

    it('clears layer and object selection', () => {
      let state = newProjectState();
      const layerId = state.project.scenes[0].layers[0].id;
      state = projectReducer(state, { type: 'REMOVE_LAYER', id: layerId });
      expect(state.selectedLayerId).toBeNull();
      expect(state.selectedObjectId).toBeNull();
    });
  });

  // ── Object CRUD ──
  describe('ADD_OBJECT', () => {
    it('adds gameobject to selected layer', () => {
      let state = newProjectState();
      const obj = { id: 'go1', name: 'Player', x: 0, y: 0 };
      state = stateWithObject(state, obj);
      const layer = state.project.scenes[0].layers[0];
      expect(layer.gameObjects).toHaveLength(1);
      expect(layer.gameObjects[0].id).toBe('go1');
    });

    it('adds element to selected layer', () => {
      let state = newProjectState();
      const el = { id: 'el1', name: 'Label', x: 0, y: 0 };
      state = projectReducer(state, {
        type: 'ADD_OBJECT', object: el, objectType: 'element'
      });
      const layer = state.project.scenes[0].layers[0];
      expect(layer.elements).toHaveLength(1);
      expect(layer.elements[0].id).toBe('el1');
    });
  });

  describe('REMOVE_OBJECT', () => {
    it('removes object and clears selection', () => {
      let state = newProjectState();
      state = stateWithObject(state, { id: 'go1', name: 'P' });
      state = projectReducer(state, { type: 'REMOVE_OBJECT', id: 'go1' });
      const layer = state.project.scenes[0].layers[0];
      expect(layer.gameObjects).toHaveLength(0);
      expect(state.selectedObjectId).toBeNull();
    });

    it('clears parentId on other objects referencing deleted one', () => {
      let state = newProjectState();
      state = stateWithObject(state, { id: 'parent', name: 'Parent' });
      state = stateWithObject(state, { id: 'child', name: 'Child', parentId: 'parent', attachOffset: { x: 5 } });
      state = projectReducer(state, { type: 'REMOVE_OBJECT', id: 'parent' });
      const layer = state.project.scenes[0].layers[0];
      const child = layer.gameObjects.find(o => o.id === 'child');
      expect(child.parentId).toBeNull();
      expect(child.attachOffset).toBeNull();
    });
  });

  describe('UPDATE_OBJECT', () => {
    it('merges properties on target object', () => {
      let state = newProjectState();
      state = stateWithObject(state, { id: 'go1', name: 'P', x: 0, y: 0 });
      state = projectReducer(state, {
        type: 'UPDATE_OBJECT', id: 'go1', properties: { x: 100, y: 200 }
      });
      const obj = state.project.scenes[0].layers[0].gameObjects[0];
      expect(obj.x).toBe(100);
      expect(obj.y).toBe(200);
      expect(obj.name).toBe('P');
    });
  });

  describe('UPDATE_PIVOT', () => {
    it('updates sprite pivot', () => {
      let state = newProjectState();
      state = stateWithObject(state, {
        id: 'go1', name: 'P',
        sprite: { path: 'assets/sprites/img.png', pivotX: 0, pivotY: 0 }
      });
      state = projectReducer(state, {
        type: 'UPDATE_PIVOT', id: 'go1', pivotX: 0.5, pivotY: 0.5
      });
      const obj = state.project.scenes[0].layers[0].gameObjects[0];
      expect(obj.sprite.pivotX).toBe(0.5);
      expect(obj.sprite.pivotY).toBe(0.5);
    });

    it('updates pivot on atlas region', () => {
      let state = newProjectState();
      state = stateWithObject(state, {
        id: 'go1', name: 'P',
        sprite: {
          path: 'atlas.png',
          regions: { idle: { x: 0, y: 0, w: 32, h: 32, pivotX: 0, pivotY: 0 } }
        }
      });
      state = projectReducer(state, {
        type: 'UPDATE_PIVOT', id: 'go1', regionName: 'idle', pivotX: 0.5, pivotY: 1
      });
      const obj = state.project.scenes[0].layers[0].gameObjects[0];
      expect(obj.sprite.regions.idle.pivotX).toBe(0.5);
      expect(obj.sprite.regions.idle.pivotY).toBe(1);
    });
  });

  // ── Camera ──
  describe('SET_CAMERA', () => {
    it('sets camera on selected scene', () => {
      let state = newProjectState();
      const cam = { type: 'world', followTarget: 'player' };
      state = projectReducer(state, { type: 'SET_CAMERA', camera: cam });
      const scene = state.project.scenes.find(s => s.id === state.selectedSceneId);
      expect(scene.camera).toEqual(cam);
    });
  });

  describe('UPDATE_CAMERA', () => {
    it('merges properties on camera', () => {
      let state = newProjectState();
      state = projectReducer(state, { type: 'SET_CAMERA', camera: { type: 'world', zoom: 1 } });
      state = projectReducer(state, { type: 'UPDATE_CAMERA', properties: { zoom: 2 } });
      const scene = state.project.scenes.find(s => s.id === state.selectedSceneId);
      expect(scene.camera.zoom).toBe(2);
      expect(scene.camera.type).toBe('world');
    });
  });

  // ── Settings ──
  describe('UPDATE_SETTINGS', () => {
    it('merges settings', () => {
      let state = newProjectState();
      state = projectReducer(state, { type: 'UPDATE_SETTINGS', settings: { displayFPS: true } });
      expect(state.project.settings.displayFPS).toBe(true);
      expect(state.project.settings.canvasWidth).toBe(800); // unchanged
    });
  });

  // ── Assets ──
  describe('ADD_ASSET', () => {
    it('adds sprite asset', () => {
      let state = newProjectState();
      state = projectReducer(state, {
        type: 'ADD_ASSET', category: 'sprites',
        asset: { key: 'player', filename: 'player.png' }
      });
      expect(state.project.assets.sprites).toHaveLength(1);
      expect(state.project.assets.sprites[0].key).toBe('player');
    });

    it('adds audio asset', () => {
      let state = newProjectState();
      state = projectReducer(state, {
        type: 'ADD_ASSET', category: 'audio',
        asset: { key: 'bgm', filename: 'bgm.mp3' }
      });
      expect(state.project.assets.audio).toHaveLength(1);
    });
  });

  describe('REMOVE_ASSET', () => {
    it('removes asset by key', () => {
      let state = newProjectState();
      state = projectReducer(state, {
        type: 'ADD_ASSET', category: 'sprites',
        asset: { key: 'player', filename: 'player.png' }
      });
      state = projectReducer(state, { type: 'REMOVE_ASSET', category: 'sprites', key: 'player' });
      expect(state.project.assets.sprites).toHaveLength(0);
    });
  });

  describe('RENAME_ASSET', () => {
    it('updates asset key and filename', () => {
      let state = newProjectState();
      state = projectReducer(state, {
        type: 'ADD_ASSET', category: 'sprites',
        asset: { key: 'old', filename: 'old.png' }
      });
      state = projectReducer(state, {
        type: 'RENAME_ASSET',
        category: 'sprites',
        oldKey: 'old',
        newKey: 'new',
        oldFilename: 'old.png',
        newFilename: 'new.png'
      });
      expect(state.project.assets.sprites[0].key).toBe('new');
      expect(state.project.assets.sprites[0].filename).toBe('new.png');
    });

    it('updates sprite path references in gameObjects', () => {
      let state = newProjectState();
      state = stateWithObject(state, {
        id: 'go1', name: 'P',
        sprite: { path: 'assets/sprites/old.png' }
      });
      state = projectReducer(state, {
        type: 'ADD_ASSET', category: 'sprites',
        asset: { key: 'old', filename: 'old.png' }
      });
      state = projectReducer(state, {
        type: 'RENAME_ASSET',
        category: 'sprites',
        oldKey: 'old',
        newKey: 'new',
        oldFilename: 'old.png',
        newFilename: 'new.png'
      });
      const obj = state.project.scenes[0].layers[0].gameObjects[0];
      expect(obj.sprite.path).toBe('assets/sprites/new.png');
    });

    it('updates animation path references', () => {
      let state = newProjectState();
      state = stateWithObject(state, {
        id: 'go1', name: 'P',
        sprite: { path: 'assets/sprites/other.png' },
        animations: [{ path: 'assets/sprites/old.png', name: 'walk' }]
      });
      state = projectReducer(state, {
        type: 'RENAME_ASSET',
        category: 'sprites',
        oldKey: 'old', newKey: 'new',
        oldFilename: 'old.png', newFilename: 'new.png'
      });
      const obj = state.project.scenes[0].layers[0].gameObjects[0];
      expect(obj.animations[0].path).toBe('assets/sprites/new.png');
    });
  });

  // ── Isometric Map ──
  describe('UPDATE_ISOMETRIC_MAP', () => {
    it('sets isometric map on selected scene', () => {
      let state = newProjectState();
      const isoMap = { cols: 10, rows: 10, tiles: [] };
      state = projectReducer(state, { type: 'UPDATE_ISOMETRIC_MAP', isometricMap: isoMap });
      const scene = state.project.scenes.find(s => s.id === state.selectedSceneId);
      expect(scene.isometricMap).toEqual(isoMap);
    });
  });

  describe('UPDATE_ISO_TILE', () => {
    it('updates tile value at col,row', () => {
      let state = newProjectState();
      const tiles = [[0, 0], [0, 0]];
      const heights = [[0, 0], [0, 0]];
      state = projectReducer(state, {
        type: 'UPDATE_ISOMETRIC_MAP',
        isometricMap: { tiles, heightMap: heights }
      });
      state = projectReducer(state, {
        type: 'UPDATE_ISO_TILE', col: 1, row: 0, property: 'tiles', value: 2
      });
      const scene = state.project.scenes.find(s => s.id === state.selectedSceneId);
      expect(scene.isometricMap.tiles[0][1]).toBe(2);
      expect(scene.isometricMap.tiles[0][0]).toBe(0); // unchanged
    });
  });

  // ── Script Files ──
  describe('ADD_SCRIPT_FILE', () => {
    it('adds script file', () => {
      let state = newProjectState();
      state = projectReducer(state, {
        type: 'ADD_SCRIPT_FILE', script: { key: 'enemy', filename: 'enemy.js' }
      });
      expect(state.project.scripts).toHaveLength(1);
      expect(state.project.scripts[0].key).toBe('enemy');
    });
  });

  describe('REMOVE_SCRIPT_FILE', () => {
    it('removes script by key', () => {
      let state = newProjectState();
      state = projectReducer(state, {
        type: 'ADD_SCRIPT_FILE', script: { key: 'enemy', filename: 'enemy.js' }
      });
      state = projectReducer(state, { type: 'REMOVE_SCRIPT_FILE', key: 'enemy' });
      expect(state.project.scripts).toHaveLength(0);
    });
  });

  describe('RENAME_SCRIPT_FILE', () => {
    it('renames script key and filename', () => {
      let state = newProjectState();
      state = projectReducer(state, {
        type: 'ADD_SCRIPT_FILE', script: { key: 'old', filename: 'old.js' }
      });
      state = projectReducer(state, {
        type: 'RENAME_SCRIPT_FILE', oldKey: 'old', newKey: 'newScript'
      });
      expect(state.project.scripts[0].key).toBe('newScript');
      expect(state.project.scripts[0].filename).toBe('newScript.js');
    });
  });

  // ── Preview / Engine ──
  describe('SET_PREVIEW_MODE', () => {
    it('sets preview mode', () => {
      let state = newProjectState();
      state = projectReducer(state, { type: 'SET_PREVIEW_MODE', mode: 'play' });
      expect(state.previewMode).toBe('play');
    });
  });

  describe('SET_ENGINE_PATH', () => {
    it('sets engine path', () => {
      let state = newProjectState();
      state = projectReducer(state, { type: 'SET_ENGINE_PATH', path: '/engine' });
      expect(state.enginePath).toBe('/engine');
    });
  });

  // ── Unknown action ──
  describe('unknown action', () => {
    it('returns state unchanged', () => {
      const state = newProjectState();
      const result = projectReducer(state, { type: 'NONSENSE' });
      expect(result).toBe(state);
    });
  });
});

// ── Selectors ──
describe('Selectors', () => {
  describe('getSelectedScene', () => {
    it('returns selected scene', () => {
      const state = newProjectState();
      const scene = getSelectedScene(state);
      expect(scene).not.toBeNull();
      expect(scene.id).toBe(state.selectedSceneId);
    });

    it('returns null when no project', () => {
      expect(getSelectedScene(initialState)).toBeNull();
    });

    it('returns null when no scene selected', () => {
      const state = { ...newProjectState(), selectedSceneId: null };
      expect(getSelectedScene(state)).toBeNull();
    });
  });

  describe('getSelectedLayer', () => {
    it('returns selected layer', () => {
      const state = newProjectState();
      const layer = getSelectedLayer(state);
      expect(layer).not.toBeNull();
      expect(layer.id).toBe(state.selectedLayerId);
    });

    it('returns null when no layer selected', () => {
      const state = { ...newProjectState(), selectedLayerId: null };
      expect(getSelectedLayer(state)).toBeNull();
    });
  });

  describe('getSelectedObject', () => {
    it('returns selected gameObject', () => {
      let state = newProjectState();
      state = stateWithObject(state, { id: 'go1', name: 'P' });
      state = projectReducer(state, { type: 'SELECT_OBJECT', id: 'go1' });
      const obj = getSelectedObject(state);
      expect(obj).not.toBeNull();
      expect(obj.id).toBe('go1');
    });

    it('returns selected element', () => {
      let state = newProjectState();
      state = projectReducer(state, {
        type: 'ADD_OBJECT', object: { id: 'el1', name: 'Lbl' }, objectType: 'element'
      });
      state = projectReducer(state, { type: 'SELECT_OBJECT', id: 'el1', objectType: 'element' });
      const obj = getSelectedObject(state);
      expect(obj).not.toBeNull();
      expect(obj.id).toBe('el1');
    });

    it('returns null when no object selected', () => {
      const state = newProjectState();
      expect(getSelectedObject(state)).toBeNull();
    });
  });
});
