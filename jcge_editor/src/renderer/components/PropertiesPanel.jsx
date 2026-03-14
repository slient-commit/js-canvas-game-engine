import React from 'react';
import { useProject, useProjectDispatch, getSelectedScene, getSelectedLayer, getSelectedObject } from '../store/ProjectContext';
import { getAssetUrl } from './AssetManager';

export default function PropertiesPanel() {
  const state = useProject();
  const dispatch = useProjectDispatch();

  if (!state.project) {
    return (
      <div>
        <div className="panel-header">Properties</div>
        <div className="empty-state">No project open</div>
      </div>
    );
  }

  const scene = getSelectedScene(state);
  const selectedObj = getSelectedObject(state);
  const selectedLayer = getSelectedLayer(state);

  const updateProp = (key, value) => {
    if (state.selectedObjectId) {
      dispatch({ type: 'UPDATE_OBJECT', id: state.selectedObjectId, properties: { [key]: value } });
      // Notify preview
      const iframe = document.querySelector('.game-preview-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'updateObject',
          objectId: state.selectedObjectId,
          properties: { [key]: value }
        }, '*');
      }
    }
  };

  const updatePosition = (axis, value) => {
    if (!selectedObj) return;
    const pos = { ...selectedObj.position, [axis]: parseFloat(value) || 0 };
    updateProp('position', pos);
  };

  const updateVelocity = (axis, value) => {
    if (!selectedObj) return;
    const vel = { ...(selectedObj.velocity || { X: 0, Y: 0 }), [axis]: parseFloat(value) || 0 };
    updateProp('velocity', vel);
  };

  // Scene properties
  if (state.selectedObjectType === 'scene' && scene) {
    return (
      <div>
        <div className="panel-header">Scene Properties</div>
        <div className="section">
          <div className="prop-row">
            <span className="prop-label">Name</span>
            <div className="prop-value">
              <input
                className="input"
                value={scene.name}
                onChange={e => dispatch({ type: 'RENAME_SCENE', id: scene.id, name: e.target.value })}
              />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Default</span>
            <div className="prop-value">
              <input type="checkbox" checked={scene.isDefault} onChange={() => dispatch({ type: 'SET_DEFAULT_SCENE', id: scene.id })} />
            </div>
          </div>
        </div>
        <div className="section">
          <div className="section-title">Camera</div>
          {scene.camera ? (
            <>
              <div className="prop-row">
                <span className="prop-label">Type</span>
                <div className="prop-value">
                  <select
                    className="input"
                    value={scene.camera.type || 'fixed'}
                    onChange={e => dispatch({ type: 'UPDATE_CAMERA', properties: { type: e.target.value } })}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="world">World</option>
                  </select>
                </div>
              </div>
              <div className="prop-row">
                <span className="prop-label">Screen W</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number"
                    value={scene.camera.screenWidth || 0}
                    onChange={e => dispatch({ type: 'UPDATE_CAMERA', properties: { screenWidth: parseInt(e.target.value) || 0 } })}
                  />
                </div>
              </div>
              <div className="prop-row">
                <span className="prop-label">Screen H</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number"
                    value={scene.camera.screenHeight || 0}
                    onChange={e => dispatch({ type: 'UPDATE_CAMERA', properties: { screenHeight: parseInt(e.target.value) || 0 } })}
                  />
                </div>
              </div>
              <div className="prop-row">
                <span className="prop-label">Speed</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number"
                    value={scene.camera.speed || 0}
                    onChange={e => dispatch({ type: 'UPDATE_CAMERA', properties: { speed: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
              </div>
              <button className="btn btn-sm btn-danger" style={{ margin: '4px 12px' }}
                onClick={() => dispatch({ type: 'SET_CAMERA', camera: null })}>
                Remove Camera
              </button>
            </>
          ) : (
            <button className="btn btn-sm" style={{ margin: '4px 12px' }}
              onClick={() => dispatch({
                type: 'SET_CAMERA',
                camera: {
                  type: 'fixed',
                  screenWidth: state.project.settings.canvasWidth,
                  screenHeight: state.project.settings.canvasHeight,
                  levelWidth: state.project.settings.canvasWidth,
                  levelHeight: state.project.settings.canvasHeight,
                  speed: 10,
                  addOffset: false,
                  position: { X: 0, Y: 0 }
                }
              })}>
              Add Camera
            </button>
          )}
        </div>
      </div>
    );
  }

  // Layer properties
  if (state.selectedObjectType === 'layer' && selectedLayer) {
    return (
      <div>
        <div className="panel-header">Layer Properties</div>
        <div className="section">
          <div className="prop-row">
            <span className="prop-label">Name</span>
            <div className="prop-value">{selectedLayer.name}</div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Z-Order</span>
            <div className="prop-value">{selectedLayer.zOrder}</div>
          </div>
          <div className="prop-row">
            <span className="prop-label">UI Layer</span>
            <div className="prop-value">
              <input type="checkbox" checked={selectedLayer.isUI} onChange={() => dispatch({ type: 'TOGGLE_LAYER_UI', id: selectedLayer.id })} />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Objects</span>
            <div className="prop-value">{selectedLayer.gameObjects.length + selectedLayer.elements.length}</div>
          </div>
          <button className="btn btn-sm btn-danger" style={{ margin: '4px 12px' }}
            onClick={() => dispatch({ type: 'REMOVE_LAYER', id: selectedLayer.id })}>
            Delete Layer
          </button>
        </div>
      </div>
    );
  }

  // Object properties (gameobject or element)
  if (selectedObj) {
    return (
      <div>
        <div className="panel-header">
          {state.selectedObjectType === 'gameobject' ? 'GameObject' : 'Element'} Properties
        </div>
        <div className="section">
          <div className="prop-row">
            <span className="prop-label">Name</span>
            <div className="prop-value">
              <input className="input" value={selectedObj.name || ''}
                onChange={e => updateProp('name', e.target.value)} />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">ID</span>
            <div className="prop-value" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{selectedObj.id}</div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Position</div>
          <div className="prop-row">
            <span className="prop-label">X</span>
            <div className="prop-value">
              <input className="input input-sm" type="number"
                value={selectedObj.position?.X || 0}
                onChange={e => updatePosition('X', e.target.value)} />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Y</span>
            <div className="prop-value">
              <input className="input input-sm" type="number"
                value={selectedObj.position?.Y || 0}
                onChange={e => updatePosition('Y', e.target.value)} />
            </div>
          </div>
        </div>

        {state.selectedObjectType === 'gameobject' && (
          <div className="section">
            <div className="section-title">Velocity</div>
            <div className="prop-row">
              <span className="prop-label">X</span>
              <div className="prop-value">
                <input className="input input-sm" type="number"
                  value={selectedObj.velocity?.X || 0}
                  onChange={e => updateVelocity('X', e.target.value)} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Y</span>
              <div className="prop-value">
                <input className="input input-sm" type="number"
                  value={selectedObj.velocity?.Y || 0}
                  onChange={e => updateVelocity('Y', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-title">Display</div>
          <div className="prop-row">
            <span className="prop-label">Opacity</span>
            <div className="prop-value">
              <input className="input input-sm" type="number" step="0.1" min="0" max="1"
                value={selectedObj.opacity ?? 1}
                onChange={e => updateProp('opacity', parseFloat(e.target.value) || 1)} />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Visible</span>
            <div className="prop-value">
              <input type="checkbox" checked={selectedObj.showIt !== false}
                onChange={e => updateProp('showIt', e.target.checked)} />
            </div>
          </div>
          {state.selectedObjectType === 'gameobject' && (
            <div className="prop-row">
              <span className="prop-label">Static</span>
              <div className="prop-value">
                <input type="checkbox" checked={selectedObj.isStatic || false}
                  onChange={e => updateProp('isStatic', e.target.checked)} />
              </div>
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-title">Sprite</div>
          <div className="prop-row">
            <span className="prop-label">Asset</span>
            <div className="prop-value">
              <select
                className="input"
                value={selectedObj.sprite?.path || ''}
                onChange={e => {
                  const val = e.target.value;
                  if (!val) {
                    updateProp('sprite', null);
                  } else {
                    const asset = (state.project.assets.sprites || []).find(a => 'assets/sprites/' + a.filename === val);
                    const img = new Image();
                    img.onload = () => {
                      updateProp('sprite', {
                        type: 'sprite',
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        path: val
                      });
                    };
                    img.onerror = () => {
                      updateProp('sprite', {
                        type: 'sprite',
                        width: 32,
                        height: 32,
                        path: val
                      });
                    };
                    img.src = getAssetUrl(state, 'sprites', asset ? asset.filename : val);
                  }
                }}
              >
                <option value="">-- None --</option>
                {(state.project.assets.sprites || []).map(asset => (
                  <option key={asset.key} value={'assets/sprites/' + asset.filename}>
                    {asset.filename}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedObj.sprite && (
            <>
              {selectedObj.sprite.path && (
                <div style={{ padding: '4px 12px', textAlign: 'center' }}>
                  <img
                    src={getAssetUrl(state, 'sprites', selectedObj.sprite.path.replace('assets/sprites/', ''))}
                    alt="sprite preview"
                    style={{ maxWidth: '100%', maxHeight: 80, imageRendering: 'pixelated', border: '1px solid var(--border)', borderRadius: 4, background: '#000' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="prop-row">
                <span className="prop-label">Width</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number"
                    value={selectedObj.sprite.width || 32}
                    onChange={e => updateProp('sprite', { ...selectedObj.sprite, width: parseInt(e.target.value) || 32 })} />
                </div>
              </div>
              <div className="prop-row">
                <span className="prop-label">Height</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number"
                    value={selectedObj.sprite.height || 32}
                    onChange={e => updateProp('sprite', { ...selectedObj.sprite, height: parseInt(e.target.value) || 32 })} />
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '8px 12px' }}>
          <button className="btn btn-sm btn-danger"
            onClick={() => dispatch({ type: 'REMOVE_OBJECT', id: selectedObj.id })}>
            Delete Object
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="panel-header">Properties</div>
      <div className="empty-state">Select an object to edit</div>
    </div>
  );
}
