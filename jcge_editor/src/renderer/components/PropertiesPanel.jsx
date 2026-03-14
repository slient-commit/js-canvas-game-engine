import React from 'react';
import { useProject, useProjectDispatch, getSelectedScene, getSelectedLayer, getSelectedObject } from '../store/ProjectContext';
import { getAssetUrl } from './AssetManager';

export default function PropertiesPanel() {
  const state = useProject();
  const dispatch = useProjectDispatch();
  const [newRegionName, setNewRegionName] = React.useState('');

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
            <span className="prop-label">Type</span>
            <div className="prop-value">
              <select
                className="input"
                value={selectedObj.sprite?.type || 'sprite'}
                onChange={e => {
                  const newType = e.target.value;
                  if (newType === 'spriteatlas') {
                    updateProp('sprite', {
                      type: 'spriteatlas',
                      path: selectedObj.sprite?.path || null,
                      width: selectedObj.sprite?.width || 32,
                      height: selectedObj.sprite?.height || 32,
                      regions: selectedObj.sprite?.regions || {},
                      currentRegion: selectedObj.sprite?.currentRegion || null
                    });
                  } else if (newType === 'spritesheet') {
                    updateProp('sprite', {
                      type: 'spritesheet',
                      path: selectedObj.sprite?.path || null,
                      width: selectedObj.sprite?.width || 32,
                      height: selectedObj.sprite?.height || 32,
                      name: selectedObj.sprite?.name || 'anim',
                      frameSpeed: selectedObj.sprite?.frameSpeed || 6,
                      startFrame: selectedObj.sprite?.startFrame || 0,
                      endFrame: selectedObj.sprite?.endFrame || 0
                    });
                  } else {
                    updateProp('sprite', {
                      type: 'sprite',
                      path: selectedObj.sprite?.path || null,
                      width: selectedObj.sprite?.width || 32,
                      height: selectedObj.sprite?.height || 32
                    });
                  }
                }}
              >
                <option value="sprite">Sprite</option>
                <option value="spritesheet">SpriteSheet</option>
                <option value="spriteatlas">SpriteAtlas</option>
              </select>
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Asset</span>
            <div className="prop-value">
              <select
                className="input"
                value={selectedObj.sprite?.path || ''}
                onChange={e => {
                  const val = e.target.value;
                  if (!val) {
                    updateProp('sprite', { ...selectedObj.sprite, path: null });
                  } else {
                    const asset = (state.project.assets.sprites || []).find(a => 'assets/sprites/' + a.filename === val);
                    const img = new Image();
                    img.onload = () => {
                      updateProp('sprite', {
                        ...selectedObj.sprite,
                        width: selectedObj.sprite?.type === 'spriteatlas' ? (selectedObj.sprite.width || 32) : img.naturalWidth,
                        height: selectedObj.sprite?.type === 'spriteatlas' ? (selectedObj.sprite.height || 32) : img.naturalHeight,
                        path: val
                      });
                    };
                    img.onerror = () => {
                      updateProp('sprite', { ...selectedObj.sprite, path: val });
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
                <span className="prop-label">Chroma Key</span>
                <div className="prop-value" style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <input type="color"
                    style={{ width: 28, height: 22, padding: 0, border: '1px solid var(--border)', borderRadius: 3, cursor: 'pointer' }}
                    value={selectedObj.sprite.chromaKey || '#00ff00'}
                    onChange={e => updateProp('sprite', { ...selectedObj.sprite, chromaKey: e.target.value })}
                  />
                  <input className="input input-sm" type="text" placeholder="#00FF00"
                    style={{ flex: 1, padding: '1px 4px', fontSize: 11 }}
                    value={selectedObj.sprite.chromaKey || ''}
                    onChange={e => updateProp('sprite', { ...selectedObj.sprite, chromaKey: e.target.value || null })}
                  />
                  {selectedObj.sprite.chromaKey && (
                    <button className="btn btn-sm" style={{ padding: '1px 5px', fontSize: 10 }}
                      onClick={() => updateProp('sprite', { ...selectedObj.sprite, chromaKey: null, chromaKeyTolerance: 30 })}
                    >&times;</button>
                  )}
                </div>
              </div>
              {selectedObj.sprite.chromaKey && (
                <div className="prop-row">
                  <span className="prop-label">Tolerance</span>
                  <div className="prop-value">
                    <input className="input input-sm" type="number" min="0" max="255"
                      value={selectedObj.sprite.chromaKeyTolerance !== undefined ? selectedObj.sprite.chromaKeyTolerance : 30}
                      onChange={e => updateProp('sprite', { ...selectedObj.sprite, chromaKeyTolerance: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}
              {selectedObj.sprite.type !== 'spriteatlas' && (
                <>
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
              {selectedObj.sprite.type === 'spritesheet' && (
                <>
                  <div className="prop-row">
                    <span className="prop-label">Name</span>
                    <div className="prop-value">
                      <input className="input input-sm"
                        value={selectedObj.sprite.name || 'anim'}
                        onChange={e => updateProp('sprite', { ...selectedObj.sprite, name: e.target.value })} />
                    </div>
                  </div>
                  <div className="prop-row">
                    <span className="prop-label">Frame Speed</span>
                    <div className="prop-value">
                      <input className="input input-sm" type="number"
                        value={selectedObj.sprite.frameSpeed || 6}
                        onChange={e => updateProp('sprite', { ...selectedObj.sprite, frameSpeed: parseInt(e.target.value) || 6 })} />
                    </div>
                  </div>
                  <div className="prop-row">
                    <span className="prop-label">Start Frame</span>
                    <div className="prop-value">
                      <input className="input input-sm" type="number"
                        value={selectedObj.sprite.startFrame || 0}
                        onChange={e => updateProp('sprite', { ...selectedObj.sprite, startFrame: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="prop-row">
                    <span className="prop-label">End Frame</span>
                    <div className="prop-value">
                      <input className="input input-sm" type="number"
                        value={selectedObj.sprite.endFrame || 0}
                        onChange={e => updateProp('sprite', { ...selectedObj.sprite, endFrame: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                </>
              )}
              {selectedObj.sprite.type === 'spriteatlas' && (
                <>
                  <div className="prop-row">
                    <span className="prop-label">Region</span>
                    <div className="prop-value">
                      {Object.keys(selectedObj.sprite.regions || {}).length > 0 ? (
                        <select className="input"
                          value={selectedObj.sprite.currentRegion || ''}
                          onChange={e => updateProp('sprite', { ...selectedObj.sprite, currentRegion: e.target.value })}
                        >
                          {Object.keys(selectedObj.sprite.regions).map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No regions defined</span>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '4px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Regions
                    </div>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                      <input className="input input-sm" type="text" placeholder="Region name"
                        style={{ flex: 1, padding: '1px 4px', fontSize: 11 }}
                        value={newRegionName}
                        onChange={e => setNewRegionName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newRegionName.trim()) {
                            const regions = { ...(selectedObj.sprite.regions || {}) };
                            regions[newRegionName.trim()] = { x: 0, y: 0, width: 32, height: 32 };
                            const cur = selectedObj.sprite.currentRegion || newRegionName.trim();
                            updateProp('sprite', { ...selectedObj.sprite, regions, currentRegion: cur });
                            setNewRegionName('');
                          }
                        }}
                      />
                      <button className="btn btn-sm" style={{ padding: '1px 5px', fontSize: 10 }}
                        onClick={() => {
                          if (!newRegionName.trim()) return;
                          const regions = { ...(selectedObj.sprite.regions || {}) };
                          regions[newRegionName.trim()] = { x: 0, y: 0, width: 32, height: 32 };
                          const cur = selectedObj.sprite.currentRegion || newRegionName.trim();
                          updateProp('sprite', { ...selectedObj.sprite, regions, currentRegion: cur });
                          setNewRegionName('');
                        }}
                      >+</button>
                    </div>
                    {Object.entries(selectedObj.sprite.regions || {}).map(([name, r]) => (
                      <div key={name} style={{
                        background: name === selectedObj.sprite.currentRegion ? 'var(--bg-active)' : 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 4, padding: '4px 6px', marginBottom: 3, fontSize: 11
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <strong style={{ color: 'var(--accent)' }}>{name}</strong>
                          <button style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}
                            onClick={() => {
                              const regions = { ...(selectedObj.sprite.regions || {}) };
                              delete regions[name];
                              const cur = selectedObj.sprite.currentRegion === name
                                ? (Object.keys(regions)[0] || null)
                                : selectedObj.sprite.currentRegion;
                              updateProp('sprite', { ...selectedObj.sprite, regions, currentRegion: cur });
                            }}
                          >&times;</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                          {['x', 'y', 'width', 'height'].map(prop => (
                            <div key={prop} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 12 }}>{prop[0].toUpperCase()}</span>
                              <input className="input input-sm" type="number" style={{ width: '100%', padding: '1px 4px' }}
                                value={r[prop]}
                                onChange={e => {
                                  const regions = { ...(selectedObj.sprite.regions || {}) };
                                  regions[name] = { ...regions[name], [prop]: parseInt(e.target.value) || 0 };
                                  const spr = { ...selectedObj.sprite, regions };
                                  if (name === selectedObj.sprite.currentRegion) {
                                    spr.width = regions[name].width;
                                    spr.height = regions[name].height;
                                  }
                                  updateProp('sprite', spr);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
