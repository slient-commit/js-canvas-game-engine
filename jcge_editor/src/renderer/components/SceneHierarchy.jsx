import React, { useState, useRef, useEffect } from 'react';
import { useProject, useProjectDispatch, getSelectedScene } from '../store/ProjectContext';
import AddObjectModal from './AddObjectModal';

function InlineNameInput({ placeholder, onSubmit, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit(value.trim());
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="tree-item" style={{ padding: '2px 8px 2px 12px' }}>
      <input
        ref={inputRef}
        className="input"
        style={{ width: '100%', fontSize: 12 }}
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
      />
    </div>
  );
}

export default function SceneHierarchy() {
  const state = useProject();
  const [showAddObject, setShowAddObject] = useState(false);
  const dispatch = useProjectDispatch();
  const [expandedScenes, setExpandedScenes] = useState({});
  const [expandedLayers, setExpandedLayers] = useState({});
  const [addingScene, setAddingScene] = useState(false);
  const [addingLayer, setAddingLayer] = useState(null); // null | 'layer' | 'ui'

  if (!state.project) {
    return (
      <div className="left-panel-content">
        <div className="panel-header">Scene Hierarchy</div>
        <div className="empty-state">No project open</div>
      </div>
    );
  }

  const toggleScene = (id) => {
    setExpandedScenes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLayer = (id) => {
    setExpandedLayers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <div className="panel-header">
        <span>Scene Hierarchy</span>
        <button className="btn btn-sm" onClick={() => setAddingScene(true)}>+ Scene</button>
      </div>

      {state.project.scenes.map(scene => (
        <div key={scene.id}>
          <div
            className={'tree-item' + (state.selectedSceneId === scene.id && state.selectedObjectType === 'scene' ? ' selected' : '')}
            onClick={() => dispatch({ type: 'SELECT_SCENE', id: scene.id })}
          >
            <span className="icon" onClick={(e) => { e.stopPropagation(); toggleScene(scene.id); }}>
              {expandedScenes[scene.id] !== false ? '\u25BE' : '\u25B8'}
            </span>
            <span>{scene.name}</span>
            {scene.isDefault && <span style={{ fontSize: 9, color: 'var(--accent)', marginLeft: 4 }}>default</span>}
          </div>

          {expandedScenes[scene.id] !== false && state.selectedSceneId === scene.id && (
            <div style={{ paddingLeft: 16 }}>
              {scene.layers.map(layer => (
                <div key={layer.id}>
                  <div
                    className={'tree-item' + (state.selectedLayerId === layer.id && state.selectedObjectType === 'layer' ? ' selected' : '')}
                    onClick={() => dispatch({ type: 'SELECT_LAYER', id: layer.id })}
                  >
                    <span className="icon" onClick={(e) => { e.stopPropagation(); toggleLayer(layer.id); }}>
                      {expandedLayers[layer.id] !== false ? '\u25BE' : '\u25B8'}
                    </span>
                    <span>{layer.name} {layer.isUI ? '(UI)' : ''}</span>
                  </div>

                  {expandedLayers[layer.id] !== false && (
                    <div style={{ paddingLeft: 16 }}>
                      {layer.gameObjects.map(obj => (
                        <div
                          key={obj.id}
                          className={'tree-item' + (state.selectedObjectId === obj.id ? ' selected' : '')}
                          onClick={() => dispatch({ type: 'SELECT_OBJECT', id: obj.id, objectType: 'gameobject' })}
                        >
                          <span className="icon">{'\u25A0'}</span>
                          <span>{obj.name || 'GameObject'}</span>
                        </div>
                      ))}
                      {layer.elements.map(el => (
                        <div
                          key={el.id}
                          className={'tree-item' + (state.selectedObjectId === el.id ? ' selected' : '')}
                          onClick={() => dispatch({ type: 'SELECT_OBJECT', id: el.id, objectType: el.type || 'element' })}
                        >
                          <span className="icon">{'\u25C6'}</span>
                          <span>{el.name || el.type || 'Element'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {addingLayer ? (
                <InlineNameInput
                  placeholder={addingLayer === 'ui' ? 'UI Layer name...' : 'Layer name...'}
                  onSubmit={(name) => {
                    dispatch({ type: 'ADD_LAYER', name, isUI: addingLayer === 'ui' });
                    setAddingLayer(null);
                  }}
                  onCancel={() => setAddingLayer(null)}
                />
              ) : (
                <div className="tree-item" style={{ color: 'var(--text-muted)' }}>
                  <span className="icon">+</span>
                  <span onClick={() => setAddingLayer('layer')} style={{ cursor: 'pointer' }}>Layer</span>
                  <span style={{ margin: '0 4px', color: 'var(--border)' }}>|</span>
                  <span onClick={() => setAddingLayer('ui')} style={{ cursor: 'pointer' }}>UI Layer</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {addingScene && (
        <InlineNameInput
          placeholder="Scene name..."
          onSubmit={(name) => {
            dispatch({ type: 'ADD_SCENE', name });
            setAddingScene(false);
          }}
          onCancel={() => setAddingScene(false)}
        />
      )}

      {state.selectedLayerId && (
        <div style={{ padding: '8px 12px' }}>
          <button className="btn btn-sm" onClick={() => setShowAddObject(true)}>+ Add Object</button>
        </div>
      )}

      {showAddObject && <AddObjectModal onClose={() => setShowAddObject(false)} />}
    </div>
  );
}
