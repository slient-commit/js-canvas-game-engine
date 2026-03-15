import React, { createContext, useReducer, useContext } from 'react';

const ProjectContext = createContext(null);
const ProjectDispatchContext = createContext(null);

function createEmptyProject(name = 'Untitled', width = 960, height = 540) {
  return {
    version: 1,
    name: name,
    filePath: null,
    settings: {
      canvasWidth: width,
      canvasHeight: height,
      backgroundColor: '#0a0a1a',
      displayFPS: false,
      jumpEngineIntro: true
    },
    scenes: [{
      id: 'scene_' + Math.random().toString(16).slice(2),
      name: 'MainScene',
      isDefault: true,
      camera: null,
      script: { onUpdate: '', onCreate: '', onDestroy: '' },
      layers: [{
        id: 'layer_' + Math.random().toString(16).slice(2),
        name: 'ground',
        zOrder: 0,
        isUI: false,
        gameObjects: [],
        elements: []
      }]
    }],
    assets: {
      sprites: [],
      audio: []
    },
    scripts: []
  };
}

const initialState = {
  project: null,
  dirty: false,
  selectedSceneId: null,
  selectedLayerId: null,
  selectedObjectId: null,
  selectedObjectType: null, // 'gameobject' | 'element' | 'layer' | 'scene' | 'camera'
  enginePath: null,
  previewMode: 'edit', // 'edit' | 'play'
  reloadKey: 0,
  undoStack: [],
  redoStack: []
};

function projectReducer(state, action) {
  switch (action.type) {
    case 'NEW_PROJECT': {
      const project = createEmptyProject(action.name, action.width, action.height);
      project.filePath = action.filePath || null;
      return {
        ...state,
        project,
        dirty: false,
        selectedSceneId: project.scenes[0].id,
        selectedLayerId: project.scenes[0].layers[0].id,
        selectedObjectId: null,
        selectedObjectType: null,
        undoStack: [],
        redoStack: []
      };
    }

    case 'LOAD_PROJECT': {
      const project = action.project;
      return {
        ...state,
        project,
        dirty: false,
        selectedSceneId: project.scenes.length > 0 ? project.scenes[0].id : null,
        selectedLayerId: project.scenes.length > 0 && project.scenes[0].layers.length > 0
          ? project.scenes[0].layers[0].id : null,
        selectedObjectId: null,
        selectedObjectType: null,
        undoStack: [],
        redoStack: []
      };
    }

    case 'RELOAD_PROJECT': {
      const project = action.project;
      return {
        ...state,
        project,
        dirty: false,
        reloadKey: (state.reloadKey || 0) + 1,
        selectedSceneId: project.scenes.length > 0 ? project.scenes[0].id : null,
        selectedLayerId: project.scenes.length > 0 && project.scenes[0].layers.length > 0
          ? project.scenes[0].layers[0].id : null,
        selectedObjectId: null,
        selectedObjectType: null,
        previewMode: 'edit',
        undoStack: [],
        redoStack: []
      };
    }

    case 'SET_PROJECT_PATH':
      return {
        ...state,
        project: { ...state.project, filePath: action.filePath },
        dirty: false
      };

    case 'MARK_SAVED':
      return { ...state, dirty: false };

    case 'SET_ENGINE_PATH':
      return { ...state, enginePath: action.path };

    case 'SET_PREVIEW_MODE':
      return { ...state, previewMode: action.mode };

    case 'SELECT_SCENE':
      return {
        ...state,
        selectedSceneId: action.id,
        selectedLayerId: null,
        selectedObjectId: null,
        selectedObjectType: 'scene'
      };

    case 'SELECT_LAYER':
      return {
        ...state,
        selectedLayerId: action.id,
        selectedObjectId: null,
        selectedObjectType: 'layer'
      };

    case 'SELECT_OBJECT':
      return {
        ...state,
        selectedObjectId: action.id,
        selectedObjectType: action.objectType || 'gameobject'
      };

    case 'DESELECT':
      return {
        ...state,
        selectedObjectId: null,
        selectedObjectType: null
      };

    // ── Scene mutations ──
    case 'ADD_SCENE': {
      const newScene = {
        id: 'scene_' + Math.random().toString(16).slice(2),
        name: action.name || 'NewScene',
        isDefault: false,
        camera: null,
        script: { onUpdate: '', onCreate: '', onDestroy: '' },
        layers: [{
          id: 'layer_' + Math.random().toString(16).slice(2),
          name: 'ground',
          zOrder: 0,
          isUI: false,
          gameObjects: [],
          elements: []
        }]
      };
      return {
        ...state,
        project: {
          ...state.project,
          scenes: [...state.project.scenes, newScene]
        },
        dirty: true
      };
    }

    case 'REMOVE_SCENE': {
      const scenes = state.project.scenes.filter(s => s.id !== action.id);
      return {
        ...state,
        project: { ...state.project, scenes },
        selectedSceneId: scenes.length > 0 ? scenes[0].id : null,
        selectedLayerId: null,
        selectedObjectId: null,
        dirty: true
      };
    }

    case 'SET_DEFAULT_SCENE': {
      const scenes = state.project.scenes.map(s => ({
        ...s,
        isDefault: s.id === action.id
      }));
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    case 'RENAME_SCENE': {
      const scenes = state.project.scenes.map(s =>
        s.id === action.id ? { ...s, name: action.name } : s
      );
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    case 'UPDATE_SCENE_BGCOLOR': {
      const scenes = state.project.scenes.map(s =>
        s.id === state.selectedSceneId ? { ...s, backgroundColor: action.color } : s
      );
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    // ── Layer mutations ──
    case 'ADD_LAYER': {
      const scenes = state.project.scenes.map(s => {
        if (s.id !== state.selectedSceneId) return s;
        const newLayer = {
          id: 'layer_' + Math.random().toString(16).slice(2),
          name: action.name || 'New Layer',
          zOrder: s.layers.length,
          isUI: action.isUI || false,
          gameObjects: [],
          elements: []
        };
        return { ...s, layers: [...s.layers, newLayer] };
      });
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    case 'TOGGLE_LAYER_UI': {
      const scenes = state.project.scenes.map(s => {
        if (s.id !== state.selectedSceneId) return s;
        const layers = s.layers.map(l =>
          l.id === action.id ? { ...l, isUI: !l.isUI } : l
        );
        return { ...s, layers };
      });
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    case 'REMOVE_LAYER': {
      const scenes = state.project.scenes.map(s => {
        if (s.id !== state.selectedSceneId) return s;
        const layers = s.layers.filter(l => l.id !== action.id)
          .map((l, i) => ({ ...l, zOrder: i }));
        return { ...s, layers };
      });
      return {
        ...state,
        project: { ...state.project, scenes },
        selectedLayerId: null,
        selectedObjectId: null,
        dirty: true
      };
    }

    // ── Object mutations ──
    case 'ADD_OBJECT': {
      const scenes = state.project.scenes.map(s => {
        if (s.id !== state.selectedSceneId) return s;
        const layers = s.layers.map(l => {
          if (l.id !== (action.layerId || state.selectedLayerId)) return l;
          if (action.objectType === 'element') {
            return { ...l, elements: [...l.elements, action.object] };
          }
          return { ...l, gameObjects: [...l.gameObjects, action.object] };
        });
        return { ...s, layers };
      });
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    case 'REMOVE_OBJECT': {
      const deletedId = action.id;
      const clearParent = o => o.parentId === deletedId ? { ...o, parentId: null, attachOffset: null } : o;
      const scenes = state.project.scenes.map(s => {
        if (s.id !== state.selectedSceneId) return s;
        const layers = s.layers.map(l => ({
          ...l,
          gameObjects: l.gameObjects.filter(o => o.id !== deletedId).map(clearParent),
          elements: l.elements.filter(o => o.id !== deletedId).map(clearParent)
        }));
        return { ...s, layers };
      });
      return {
        ...state,
        project: { ...state.project, scenes },
        selectedObjectId: null,
        selectedObjectType: null,
        dirty: true
      };
    }

    case 'UPDATE_OBJECT': {
      const scenes = state.project.scenes.map(s => {
        if (s.id !== state.selectedSceneId) return s;
        const layers = s.layers.map(l => ({
          ...l,
          gameObjects: l.gameObjects.map(o =>
            o.id === action.id ? { ...o, ...action.properties } : o
          ),
          elements: l.elements.map(o =>
            o.id === action.id ? { ...o, ...action.properties } : o
          )
        }));
        return { ...s, layers };
      });
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    case 'UPDATE_PIVOT': {
      const scenes = state.project.scenes.map(s => {
        if (s.id !== state.selectedSceneId) return s;
        const updateObj = (o) => {
          if (o.id !== action.id || !o.sprite) return o;
          // Atlas: update pivot on the specific region
          if (action.regionName && o.sprite.regions) {
            const regions = { ...o.sprite.regions };
            if (regions[action.regionName]) {
              regions[action.regionName] = {
                ...regions[action.regionName],
                pivotX: action.pivotX,
                pivotY: action.pivotY
              };
            }
            return { ...o, sprite: { ...o.sprite, regions } };
          }
          // Sprite / SpriteSheet: update pivot on the sprite itself
          return { ...o, sprite: { ...o.sprite, pivotX: action.pivotX, pivotY: action.pivotY } };
        };
        const layers = s.layers.map(l => ({
          ...l,
          gameObjects: l.gameObjects.map(updateObj),
          elements: l.elements.map(updateObj)
        }));
        return { ...s, layers };
      });
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    // ── Scene Lighting ──
    case 'UPDATE_SCENE_LIGHTING': {
      const scenes = state.project.scenes.map(s =>
        s.id === state.selectedSceneId ? { ...s, lighting: action.lighting } : s
      );
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    // ── Camera ──
    case 'SET_CAMERA': {
      const scenes = state.project.scenes.map(s =>
        s.id === state.selectedSceneId ? { ...s, camera: action.camera } : s
      );
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    case 'UPDATE_CAMERA': {
      const scenes = state.project.scenes.map(s => {
        if (s.id !== state.selectedSceneId) return s;
        return { ...s, camera: { ...s.camera, ...action.properties } };
      });
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    // ── Settings ──
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        project: {
          ...state.project,
          settings: { ...state.project.settings, ...action.settings }
        },
        dirty: true
      };
    }

    // ── Assets ──
    case 'ADD_ASSET': {
      const category = action.category; // 'sprites' | 'audio'
      const assets = { ...state.project.assets };
      assets[category] = [...assets[category], action.asset];
      return {
        ...state,
        project: { ...state.project, assets },
        dirty: true
      };
    }

    // ── Scene scripts ──
    case 'UPDATE_SCENE_SCRIPT': {
      const scenes = state.project.scenes.map(s =>
        s.id === action.sceneId
          ? { ...s, script: { ...(s.script || {}), ...action.script } }
          : s
      );
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    case 'REMOVE_ASSET': {
      const cat = action.category;
      const assets = { ...state.project.assets };
      assets[cat] = assets[cat].filter(a => a.key !== action.key);
      return {
        ...state,
        project: { ...state.project, assets },
        dirty: true
      };
    }

    case 'RENAME_ASSET': {
      const { category, oldKey, newKey, newFilename } = action;
      const assets = { ...state.project.assets };
      assets[category] = assets[category].map(a =>
        a.key === oldKey ? { key: newKey, filename: newFilename } : a
      );
      // Update all sprite path references across scenes
      const oldPath = 'assets/' + (category === 'audio' ? 'audio/' : 'sprites/') + action.oldFilename;
      const newPath = 'assets/' + (category === 'audio' ? 'audio/' : 'sprites/') + newFilename;
      const scenes = state.project.scenes.map(scene => ({
        ...scene,
        layers: scene.layers.map(layer => ({
          ...layer,
          gameObjects: (layer.gameObjects || []).map(obj => {
            let changed = false;
            const updated = { ...obj };
            if (obj.sprite && obj.sprite.path === oldPath) {
              updated.sprite = { ...obj.sprite, path: newPath };
              changed = true;
            }
            if (obj.animations && obj.animations.length > 0) {
              updated.animations = obj.animations.map(a =>
                a.path === oldPath ? { ...a, path: newPath } : a
              );
              if (JSON.stringify(updated.animations) !== JSON.stringify(obj.animations)) changed = true;
            }
            return changed ? updated : obj;
          }),
          elements: (layer.elements || []).map(el => {
            if (el.sprite && el.sprite.path === oldPath) {
              return { ...el, sprite: { ...el.sprite, path: newPath } };
            }
            return el;
          })
        }))
      }));
      return {
        ...state,
        project: { ...state.project, assets, scenes },
        dirty: true
      };
    }

    // ── Isometric Map ──
    case 'UPDATE_ISOMETRIC_MAP': {
      const scenes = state.project.scenes.map(s =>
        s.id === state.selectedSceneId ? { ...s, isometricMap: action.isometricMap } : s
      );
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    case 'UPDATE_ISO_TILE': {
      const { col, row, property, value } = action;
      const scenes = state.project.scenes.map(s => {
        if (s.id !== state.selectedSceneId || !s.isometricMap) return s;
        const iso = { ...s.isometricMap };
        const arr = iso[property].map(r => [...r]);
        arr[row][col] = value;
        iso[property] = arr;
        return { ...s, isometricMap: iso };
      });
      return {
        ...state,
        project: { ...state.project, scenes },
        dirty: true
      };
    }

    // ── Custom script files ──
    case 'ADD_SCRIPT_FILE': {
      const scripts = [...(state.project.scripts || []), action.script];
      return {
        ...state,
        project: { ...state.project, scripts },
        dirty: true
      };
    }

    case 'REMOVE_SCRIPT_FILE': {
      const scripts = (state.project.scripts || []).filter(s => s.key !== action.key);
      return {
        ...state,
        project: { ...state.project, scripts },
        dirty: true
      };
    }

    case 'RENAME_SCRIPT_FILE': {
      const scripts = (state.project.scripts || []).map(s =>
        s.key === action.oldKey ? { key: action.newKey, filename: action.newKey + '.js' } : s
      );
      return {
        ...state,
        project: { ...state.project, scripts },
        dirty: true
      };
    }

    default:
      return state;
  }
}

export { createEmptyProject, projectReducer, initialState };

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  return (
    <ProjectContext.Provider value={state}>
      <ProjectDispatchContext.Provider value={dispatch}>
        {children}
      </ProjectDispatchContext.Provider>
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}

export function useProjectDispatch() {
  return useContext(ProjectDispatchContext);
}

export function getSelectedScene(state) {
  if (!state.project || !state.selectedSceneId) return null;
  return state.project.scenes.find(s => s.id === state.selectedSceneId) || null;
}

export function getSelectedLayer(state) {
  const scene = getSelectedScene(state);
  if (!scene || !state.selectedLayerId) return null;
  return scene.layers.find(l => l.id === state.selectedLayerId) || null;
}

export function getSelectedObject(state) {
  const scene = getSelectedScene(state);
  if (!scene || !state.selectedObjectId) return null;
  for (const layer of scene.layers) {
    const go = layer.gameObjects.find(o => o.id === state.selectedObjectId);
    if (go) return go;
    const el = layer.elements.find(o => o.id === state.selectedObjectId);
    if (el) return el;
  }
  return null;
}
