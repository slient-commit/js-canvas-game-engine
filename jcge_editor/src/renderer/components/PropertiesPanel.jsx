import React, { useState } from 'react';
import { useProject, useProjectDispatch, getSelectedScene, getSelectedLayer, getSelectedObject } from '../store/ProjectContext';
import { getAssetUrl } from './AssetManager';
import ConfirmDialog from './ConfirmDialog';

function getAllObjectsInScene(scene) {
  if (!scene) return [];
  const objects = [];
  for (const layer of scene.layers) {
    objects.push(...layer.gameObjects, ...layer.elements);
  }
  return objects;
}

function findObjectInScene(scene, id) {
  if (!scene) return null;
  for (const layer of scene.layers) {
    const go = layer.gameObjects.find(o => o.id === id);
    if (go) return go;
    const el = layer.elements.find(o => o.id === id);
    if (el) return el;
  }
  return null;
}

export default function PropertiesPanel() {
  const state = useProject();
  const dispatch = useProjectDispatch();
  const [newRegionName, setNewRegionName] = React.useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingRegionName, setEditingRegionName] = useState(null);
  const [editingRegionValue, setEditingRegionValue] = useState('');
  const [isoTool, setIsoTool] = useState('tile');
  const [isoTileType, setIsoTileType] = useState(0);
  const [isoHeightDelta, setIsoHeightDelta] = useState(1);

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
    updateProps({ [key]: value });
  };

  const updateProps = (properties) => {
    if (state.selectedObjectId) {
      dispatch({ type: 'UPDATE_OBJECT', id: state.selectedObjectId, properties });
      const iframe = document.querySelector('.game-preview-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'updateObject',
          objectId: state.selectedObjectId,
          properties
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
    const updateLighting = (props) => {
      const newLighting = { ...(scene.lighting || {}), ...props };
      dispatch({ type: 'UPDATE_SCENE_LIGHTING', lighting: newLighting });
      const iframe = document.querySelector('.game-preview-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'updateSceneLighting',
          lighting: newLighting
        }, '*');
      }
    };

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
          <div className="prop-row">
            <span className="prop-label">Background</span>
            <div className="prop-value" style={{ display: 'flex', gap: 4 }}>
              <input type="color" style={{ width: 28, height: 22, padding: 0, border: 'none', cursor: 'pointer' }}
                value={scene.backgroundColor || '#0a0a1a'}
                onChange={e => {
                  dispatch({ type: 'UPDATE_SCENE_BGCOLOR', color: e.target.value });
                  const iframe = document.querySelector('.game-preview-iframe');
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({ type: 'updateSceneBgColor', color: e.target.value }, '*');
                  }
                }} />
              <input className="input input-sm" type="text"
                style={{ flex: 1, padding: '1px 4px', fontSize: 11 }}
                value={scene.backgroundColor || '#0a0a1a'}
                onChange={e => {
                  dispatch({ type: 'UPDATE_SCENE_BGCOLOR', color: e.target.value });
                  const iframe = document.querySelector('.game-preview-iframe');
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({ type: 'updateSceneBgColor', color: e.target.value }, '*');
                  }
                }} />
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
        <div className="section">
          <div className="section-title">Lighting</div>
          <div className="prop-row">
            <span className="prop-label">Enabled</span>
            <div className="prop-value">
              <input type="checkbox" checked={scene.lighting?.enabled || false}
                onChange={e => updateLighting({ enabled: e.target.checked })} />
            </div>
          </div>
          {scene.lighting?.enabled && (
            <>
              <div className="prop-row">
                <span className="prop-label">Darkness</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number" step="0.05" min="0" max="1"
                    value={scene.lighting?.ambientAlpha !== undefined ? scene.lighting.ambientAlpha : 0.85}
                    onChange={e => updateLighting({ ambientAlpha: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="prop-row">
                <span className="prop-label">Ambient</span>
                <div className="prop-value" style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <input type="color"
                    style={{ width: 28, height: 22, padding: 0, border: '1px solid var(--border)', borderRadius: 3, cursor: 'pointer' }}
                    value={scene.lighting?.ambientColor || '#000000'}
                    onChange={e => updateLighting({ ambientColor: e.target.value })} />
                  <input className="input input-sm" type="text"
                    style={{ flex: 1, padding: '1px 4px', fontSize: 11 }}
                    value={scene.lighting?.ambientColor || '#000000'}
                    onChange={e => updateLighting({ ambientColor: e.target.value })} />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="section">
          <div className="section-title">Shadows</div>
          <div className="prop-row">
            <span className="prop-label">Enabled</span>
            <div className="prop-value">
              <input type="checkbox" checked={scene.lighting?.shadowEnabled || false}
                onChange={e => updateLighting({ shadowEnabled: e.target.checked })} />
            </div>
          </div>
          {scene.lighting?.shadowEnabled && (
            <>
              <div className="prop-row">
                <span className="prop-label">Sun Angle</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number" min="0" max="360"
                    value={scene.lighting?.lightAngle !== undefined ? scene.lighting.lightAngle : 225}
                    onChange={e => updateLighting({ lightAngle: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="prop-row">
                <span className="prop-label">Length</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number" min="0"
                    value={scene.lighting?.shadowLength !== undefined ? scene.lighting.shadowLength : 40}
                    onChange={e => updateLighting({ shadowLength: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="prop-row">
                <span className="prop-label">Opacity</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number" step="0.05" min="0" max="1"
                    value={scene.lighting?.shadowOpacity !== undefined ? scene.lighting.shadowOpacity : 0.4}
                    onChange={e => updateLighting({ shadowOpacity: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="prop-row">
                <span className="prop-label">Blur</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number" min="0" max="20"
                    value={scene.lighting?.shadowBlur !== undefined ? scene.lighting.shadowBlur : 4}
                    onChange={e => updateLighting({ shadowBlur: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </>
          )}
        </div>
        {renderIsometricSection(scene, state, dispatch, isoTool, setIsoTool, isoTileType, setIsoTileType, isoHeightDelta, setIsoHeightDelta)}
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
    const objType = selectedObj.type || (state.selectedObjectType === 'gameobject' ? 'gameobject' : 'element');
    const TYPE_LABELS = {
      gameobject: 'GameObject', element: 'Element',
      uiText: 'Text', uiLabel: 'Label', uiButton: 'Button', uiPanel: 'Panel',
      rectangle: 'Rectangle', circle: 'Circle',
      goRectangle: 'Rectangle GO', goCircle: 'Circle GO', goTriangle: 'Triangle GO',
      light: 'Light', shadowCaster: 'Shadow Caster'
    };
    const hasSpriteSection = !['uiText', 'uiLabel', 'uiButton', 'uiPanel', 'rectangle', 'circle', 'goRectangle', 'goCircle', 'goTriangle', 'light', 'shadowCaster'].includes(objType);

    const colorInput = (label, value, onChange) => (
      <div className="prop-row">
        <span className="prop-label">{label}</span>
        <div className="prop-value" style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <input type="color"
            style={{ width: 28, height: 22, padding: 0, border: '1px solid var(--border)', borderRadius: 3, cursor: 'pointer' }}
            value={value || '#ffffff'}
            onChange={e => onChange(e.target.value)}
          />
          <input className="input input-sm" type="text"
            style={{ flex: 1, padding: '1px 4px', fontSize: 11 }}
            value={value || ''}
            onChange={e => onChange(e.target.value || null)}
          />
        </div>
      </div>
    );

    return (
      <div>
        <div className="panel-header">
          {TYPE_LABELS[objType] || 'Element'} Properties
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

        {state.selectedObjectType === 'gameobject' && objType !== 'light' && objType !== 'shadowCaster' && (
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
          {state.selectedObjectType === 'gameobject' && objType !== 'light' && objType !== 'shadowCaster' && (
            <div className="prop-row">
              <span className="prop-label">Static</span>
              <div className="prop-value">
                <input type="checkbox" checked={selectedObj.isStatic || false}
                  onChange={e => updateProp('isStatic', e.target.checked)} />
              </div>
            </div>
          )}
        </div>

        {/* ── Attachment ── */}
        <div className="section">
          <div className="section-title">Attachment</div>
          <div className="prop-row">
            <span className="prop-label">Parent</span>
            <div className="prop-value">
              <select className="input" value={selectedObj.parentId || ''}
                onChange={e => {
                  const parentId = e.target.value || null;
                  let offset = null;
                  if (parentId) {
                    const parent = findObjectInScene(scene, parentId);
                    if (parent) {
                      offset = {
                        X: Math.round(selectedObj.position.X - parent.position.X),
                        Y: Math.round(selectedObj.position.Y - parent.position.Y)
                      };
                    } else {
                      offset = { X: 0, Y: 0 };
                    }
                  }
                  updateProp('parentId', parentId);
                  updateProp('attachOffset', offset);
                }}>
                <option value="">None</option>
                {getAllObjectsInScene(scene)
                  .filter(o => o.id !== state.selectedObjectId)
                  .map(o => <option key={o.id} value={o.id}>{o.name || o.id}</option>)}
              </select>
            </div>
          </div>
          {selectedObj.parentId && (
            <>
              <div className="prop-row">
                <span className="prop-label">Offset X</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number"
                    value={selectedObj.attachOffset?.X || 0}
                    onChange={e => updateProp('attachOffset', {
                      X: parseFloat(e.target.value) || 0,
                      Y: selectedObj.attachOffset?.Y || 0
                    })} />
                </div>
              </div>
              <div className="prop-row">
                <span className="prop-label">Offset Y</span>
                <div className="prop-value">
                  <input className="input input-sm" type="number"
                    value={selectedObj.attachOffset?.Y || 0}
                    onChange={e => updateProp('attachOffset', {
                      X: selectedObj.attachOffset?.X || 0,
                      Y: parseFloat(e.target.value) || 0
                    })} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Text (uiText) properties ── */}
        {objType === 'uiText' && (
          <div className="section">
            <div className="section-title">Text</div>
            <div className="prop-row">
              <span className="prop-label">Text</span>
              <div className="prop-value">
                <textarea className="input" rows={3} style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  value={selectedObj.text || ''}
                  onChange={e => updateProp('text', e.target.value)} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Font Size</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="6" max="200"
                  value={selectedObj.fontSize || 20}
                  onChange={e => updateProp('fontSize', parseInt(e.target.value) || 20)} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Font</span>
              <div className="prop-value">
                <select className="input" value={selectedObj.fontFamily || 'sans-serif'}
                  onChange={e => updateProp('fontFamily', e.target.value)}>
                  <option value="sans-serif">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="Arial">Arial</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Style</span>
              <div className="prop-value">
                <select className="input" value={selectedObj.fontStyle || 'normal'}
                  onChange={e => updateProp('fontStyle', e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="italic">Italic</option>
                </select>
              </div>
            </div>
            {colorInput('Color', selectedObj.color, v => updateProp('color', v))}
          </div>
        )}

        {/* ── UILabel properties ── */}
        {objType === 'uiLabel' && (
          <div className="section">
            <div className="section-title">Label</div>
            <div className="prop-row">
              <span className="prop-label">Text</span>
              <div className="prop-value">
                <input className="input" value={selectedObj.text || ''}
                  onChange={e => updateProp('text', e.target.value)} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Font Size</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="6" max="200"
                  value={selectedObj.fontSize || 14}
                  onChange={e => updateProp('fontSize', parseInt(e.target.value) || 14)} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Font</span>
              <div className="prop-value">
                <select className="input" value={selectedObj.fontFamily || 'monospace'}
                  onChange={e => updateProp('fontFamily', e.target.value)}>
                  <option value="monospace">Monospace</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans-serif</option>
                  <option value="Arial">Arial</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Style</span>
              <div className="prop-value">
                <select className="input" value={selectedObj.fontStyle || 'normal'}
                  onChange={e => updateProp('fontStyle', e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="italic">Italic</option>
                </select>
              </div>
            </div>
            {colorInput('Color', selectedObj.color, v => updateProp('color', v))}
          </div>
        )}

        {/* ── UIButton properties ── */}
        {objType === 'uiButton' && (
          <div className="section">
            <div className="section-title">Button</div>
            <div className="prop-row">
              <span className="prop-label">Label</span>
              <div className="prop-value">
                <input className="input" value={selectedObj.label || ''}
                  onChange={e => updateProp('label', e.target.value)} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Width</span>
              <div className="prop-value">
                <input className="input input-sm" type="number"
                  value={selectedObj.size?.width || 120}
                  onChange={e => updateProp('size', { ...selectedObj.size, width: parseInt(e.target.value) || 120 })} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Height</span>
              <div className="prop-value">
                <input className="input input-sm" type="number"
                  value={selectedObj.size?.height || 40}
                  onChange={e => updateProp('size', { ...selectedObj.size, height: parseInt(e.target.value) || 40 })} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Font Size</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="6" max="200"
                  value={selectedObj.fontSize || 14}
                  onChange={e => updateProp('fontSize', parseInt(e.target.value) || 14)} />
              </div>
            </div>
            {colorInput('Font Color', selectedObj.fontColor, v => updateProp('fontColor', v))}
            {colorInput('Normal', selectedObj.normalColor, v => updateProp('normalColor', v))}
            {colorInput('Hover', selectedObj.hoverColor, v => updateProp('hoverColor', v))}
            {colorInput('Pressed', selectedObj.pressedColor, v => updateProp('pressedColor', v))}
          </div>
        )}

        {/* ── UIPanel / Rectangle properties ── */}
        {(objType === 'uiPanel' || objType === 'rectangle') && (
          <div className="section">
            <div className="section-title">{objType === 'rectangle' ? 'Rectangle' : 'Panel'}</div>
            <div className="prop-row">
              <span className="prop-label">Width</span>
              <div className="prop-value">
                <input className="input input-sm" type="number"
                  value={selectedObj.size?.width || 100}
                  onChange={e => updateProp('size', { ...selectedObj.size, width: parseInt(e.target.value) || 100 })} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Height</span>
              <div className="prop-value">
                <input className="input input-sm" type="number"
                  value={selectedObj.size?.height || 60}
                  onChange={e => updateProp('size', { ...selectedObj.size, height: parseInt(e.target.value) || 60 })} />
              </div>
            </div>
            {colorInput('Fill Color', selectedObj.fillColor, v => updateProp('fillColor', v))}
            {colorInput('Border', selectedObj.borderColor, v => updateProp('borderColor', v))}
            <div className="prop-row">
              <span className="prop-label">Border W</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="0" max="20"
                  value={selectedObj.borderWidth || 1}
                  onChange={e => updateProp('borderWidth', parseInt(e.target.value) || 1)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Circle properties ── */}
        {objType === 'circle' && (
          <div className="section">
            <div className="section-title">Circle</div>
            <div className="prop-row">
              <span className="prop-label">Radius</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="1"
                  value={selectedObj.radius || 20}
                  onChange={e => updateProp('radius', parseInt(e.target.value) || 20)} />
              </div>
            </div>
            {colorInput('Fill Color', selectedObj.fillColor, v => updateProp('fillColor', v))}
            {colorInput('Border', selectedObj.borderColor, v => updateProp('borderColor', v))}
            <div className="prop-row">
              <span className="prop-label">Border W</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="0" max="20"
                  value={selectedObj.borderWidth || 1}
                  onChange={e => updateProp('borderWidth', parseInt(e.target.value) || 1)} />
              </div>
            </div>
          </div>
        )}

        {/* ── GO Rectangle / Triangle properties ── */}
        {(objType === 'goRectangle' || objType === 'goTriangle') && (
          <div className="section">
            <div className="section-title">{objType === 'goRectangle' ? 'Rectangle' : 'Triangle'}</div>
            <div className="prop-row">
              <span className="prop-label">Width</span>
              <div className="prop-value">
                <input className="input input-sm" type="number"
                  value={selectedObj.size?.width || 60}
                  onChange={e => updateProp('size', { ...selectedObj.size, width: parseInt(e.target.value) || 60 })} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Height</span>
              <div className="prop-value">
                <input className="input input-sm" type="number"
                  value={selectedObj.size?.height || 60}
                  onChange={e => updateProp('size', { ...selectedObj.size, height: parseInt(e.target.value) || 60 })} />
              </div>
            </div>
            {colorInput('Fill Color', selectedObj.fillColor, v => updateProp('fillColor', v))}
            {colorInput('Border', selectedObj.borderColor, v => updateProp('borderColor', v))}
            <div className="prop-row">
              <span className="prop-label">Border W</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="0" max="20"
                  value={selectedObj.borderWidth || 1}
                  onChange={e => updateProp('borderWidth', parseInt(e.target.value) || 1)} />
              </div>
            </div>
          </div>
        )}

        {/* ── GO Circle properties ── */}
        {objType === 'goCircle' && (
          <div className="section">
            <div className="section-title">Circle</div>
            <div className="prop-row">
              <span className="prop-label">Radius</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="1"
                  value={selectedObj.radius || 30}
                  onChange={e => updateProp('radius', parseInt(e.target.value) || 30)} />
              </div>
            </div>
            {colorInput('Fill Color', selectedObj.fillColor, v => updateProp('fillColor', v))}
            {colorInput('Border', selectedObj.borderColor, v => updateProp('borderColor', v))}
            <div className="prop-row">
              <span className="prop-label">Border W</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="0" max="20"
                  value={selectedObj.borderWidth || 1}
                  onChange={e => updateProp('borderWidth', parseInt(e.target.value) || 1)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Light properties ── */}
        {objType === 'light' && (
          <div className="section">
            <div className="section-title">Light</div>
            {colorInput('Color', selectedObj.color, v => updateProp('color', v))}
            <div className="prop-row">
              <span className="prop-label">Radius</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="1"
                  value={selectedObj.radius || 150}
                  onChange={e => updateProp('radius', parseInt(e.target.value) || 150)} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Intensity</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" step="0.1" min="0" max="1"
                  value={selectedObj.intensity !== undefined ? selectedObj.intensity : 1}
                  onChange={e => updateProp('intensity', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Flicker</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" step="0.05" min="0" max="1"
                  value={selectedObj.flicker || 0}
                  onChange={e => updateProp('flicker', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Shadow Caster properties ── */}
        {objType === 'shadowCaster' && (
          <div className="section">
            <div className="section-title">Shadow Caster</div>
            <div className="prop-row">
              <span className="prop-label">Width</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="1"
                  value={selectedObj.size?.width || 32}
                  onChange={e => updateProp('size', { ...selectedObj.size, width: parseInt(e.target.value) || 32 })} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Height</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" min="1"
                  value={selectedObj.size?.height || 32}
                  onChange={e => updateProp('size', { ...selectedObj.size, height: parseInt(e.target.value) || 32 })} />
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Type</span>
              <div className="prop-value">
                <select className="input" value={selectedObj.shadowType || 'rectangle'}
                  onChange={e => updateProp('shadowType', e.target.value)}>
                  <option value="rectangle">Rectangle</option>
                  <option value="ellipse">Ellipse</option>
                </select>
              </div>
            </div>
            <div className="prop-row">
              <span className="prop-label">Height Scale</span>
              <div className="prop-value">
                <input className="input input-sm" type="number" step="0.1" min="0.1"
                  value={selectedObj.heightScale !== undefined ? selectedObj.heightScale : 1}
                  onChange={e => updateProp('heightScale', parseFloat(e.target.value) || 1)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Sprite section (only for gameobject and element types) ── */}
        {hasSpriteSection && (
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
                    updateProps({
                      hasSimpleSprite: true,
                      sprite: {
                        type: 'spriteatlas',
                        path: selectedObj.sprite?.path || null,
                        width: selectedObj.sprite?.width || 32,
                        height: selectedObj.sprite?.height || 32,
                        regions: selectedObj.sprite?.regions || {},
                        currentRegion: selectedObj.sprite?.currentRegion || null
                      }
                    });
                  } else if (newType === 'spritesheet') {
                    updateProps({
                      hasSimpleSprite: false,
                      sprite: {
                        type: 'spritesheet',
                        path: selectedObj.sprite?.path || null,
                        width: selectedObj.sprite?.width || 32,
                        height: selectedObj.sprite?.height || 32,
                        name: selectedObj.sprite?.name || 'anim',
                        frameSpeed: selectedObj.sprite?.frameSpeed || 6,
                        startFrame: selectedObj.sprite?.startFrame || 0,
                        endFrame: selectedObj.sprite?.endFrame || 0
                      }
                    });
                  } else {
                    updateProps({
                      hasSimpleSprite: true,
                      sprite: {
                        type: 'sprite',
                        path: selectedObj.sprite?.path || null,
                        width: selectedObj.sprite?.width || 32,
                        height: selectedObj.sprite?.height || 32
                      }
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
                  <div className="prop-row">
                    <span className="prop-label">Pivot X</span>
                    <div className="prop-value">
                      <input className="input input-sm" type="number"
                        value={selectedObj.sprite.pivotX !== undefined ? selectedObj.sprite.pivotX : Math.round((selectedObj.sprite.width || 32) / 2)}
                        onChange={e => updateProp('sprite', { ...selectedObj.sprite, pivotX: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="prop-row">
                    <span className="prop-label">Pivot Y</span>
                    <div className="prop-value">
                      <input className="input input-sm" type="number"
                        value={selectedObj.sprite.pivotY !== undefined ? selectedObj.sprite.pivotY : Math.round((selectedObj.sprite.height || 32) / 2)}
                        onChange={e => updateProp('sprite', { ...selectedObj.sprite, pivotY: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                </>
              )}
              {selectedObj.sprite.type === 'spritesheet' && (
                <>
                  <div style={{ padding: '4px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Animations</span>
                      <button className="btn btn-sm" style={{ padding: '1px 5px', fontSize: 10 }}
                        onClick={() => {
                          const anims = [...(selectedObj.animations || [])];
                          const newName = 'anim_' + (anims.length + 1);
                          anims.push({
                            type: 'spritesheet',
                            name: newName,
                            width: selectedObj.sprite.width || 32,
                            height: selectedObj.sprite.height || 32,
                            path: selectedObj.sprite.path || null,
                            frameSpeed: 6,
                            startFrame: 0,
                            endFrame: 0,
                            once: false
                          });
                          updateProp('animations', anims);
                        }}
                      >+</button>
                    </div>
                    {(!selectedObj.animations || selectedObj.animations.length === 0) && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '4px 0' }}>
                        No animations. Click + to add one.
                      </div>
                    )}
                    {(selectedObj.animations || []).map((anim, idx) => {
                      const isCurrent = selectedObj.sprite.name === anim.name;
                      return (
                        <div key={idx} style={{
                          background: isCurrent ? 'var(--bg-active)' : 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 4, padding: '4px 6px', marginBottom: 3, fontSize: 11
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                            <strong
                              style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-primary)', cursor: 'pointer' }}
                              title="Click to set as current animation"
                              onClick={() => {
                                updateProps({
                                  sprite: { ...anim },
                                  hasSimpleSprite: false
                                });
                              }}
                            >{anim.name || 'unnamed'}</strong>
                            <button style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}
                              onClick={() => {
                                const anims = (selectedObj.animations || []).filter((_, i) => i !== idx);
                                updateProp('animations', anims);
                              }}
                            >&times;</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 40 }}>Name</span>
                              <input className="input input-sm" style={{ width: '100%', padding: '1px 4px' }}
                                value={anim.name || ''}
                                onChange={e => {
                                  const anims = [...(selectedObj.animations || [])];
                                  const oldName = anims[idx].name;
                                  anims[idx] = { ...anims[idx], name: e.target.value };
                                  const updates = { animations: anims };
                                  if (selectedObj.sprite.name === oldName) {
                                    updates.sprite = { ...selectedObj.sprite, name: e.target.value };
                                  }
                                  updateProps(updates);
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 30 }}>Spd</span>
                              <input className="input input-sm" type="number" style={{ width: '100%', padding: '1px 4px' }}
                                value={anim.frameSpeed || 6}
                                onChange={e => {
                                  const anims = [...(selectedObj.animations || [])];
                                  anims[idx] = { ...anims[idx], frameSpeed: parseInt(e.target.value) || 6 };
                                  const updates = { animations: anims };
                                  if (isCurrent) updates.sprite = { ...selectedObj.sprite, frameSpeed: anims[idx].frameSpeed };
                                  updateProps(updates);
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 30 }}>Once</span>
                              <input type="checkbox" checked={!!anim.once}
                                onChange={e => {
                                  const anims = [...(selectedObj.animations || [])];
                                  anims[idx] = { ...anims[idx], once: e.target.checked };
                                  const updates = { animations: anims };
                                  if (isCurrent) updates.sprite = { ...selectedObj.sprite, once: anims[idx].once };
                                  updateProps(updates);
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 30 }}>From</span>
                              <input className="input input-sm" type="number" style={{ width: '100%', padding: '1px 4px' }}
                                value={anim.startFrame || 0}
                                onChange={e => {
                                  const anims = [...(selectedObj.animations || [])];
                                  anims[idx] = { ...anims[idx], startFrame: parseInt(e.target.value) || 0 };
                                  const updates = { animations: anims };
                                  if (isCurrent) updates.sprite = { ...selectedObj.sprite, startFrame: anims[idx].startFrame };
                                  updateProps(updates);
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 30 }}>To</span>
                              <input className="input input-sm" type="number" style={{ width: '100%', padding: '1px 4px' }}
                                value={anim.endFrame || 0}
                                onChange={e => {
                                  const anims = [...(selectedObj.animations || [])];
                                  anims[idx] = { ...anims[idx], endFrame: parseInt(e.target.value) || 0 };
                                  const updates = { animations: anims };
                                  if (isCurrent) updates.sprite = { ...selectedObj.sprite, endFrame: anims[idx].endFrame };
                                  updateProps(updates);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                            regions[newRegionName.trim()] = { x: 0, y: 0, width: 32, height: 32, pivotX: 16, pivotY: 16 };
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
                          regions[newRegionName.trim()] = { x: 0, y: 0, width: 32, height: 32, pivotX: 16, pivotY: 16 };
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
                          {editingRegionName === name ? (
                            <input
                              className="input input-sm"
                              style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--accent)', padding: '0 3px', width: '100%' }}
                              autoFocus
                              value={editingRegionValue}
                              onChange={e => setEditingRegionValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && editingRegionValue.trim() && editingRegionValue.trim() !== name) {
                                  const regions = { ...(selectedObj.sprite.regions || {}) };
                                  const newName = editingRegionValue.trim();
                                  if (regions[newName]) return; // prevent duplicates
                                  const entries = Object.entries(regions);
                                  const newRegions = {};
                                  for (const [k, v] of entries) {
                                    newRegions[k === name ? newName : k] = v;
                                  }
                                  const cur = selectedObj.sprite.currentRegion === name ? newName : selectedObj.sprite.currentRegion;
                                  updateProp('sprite', { ...selectedObj.sprite, regions: newRegions, currentRegion: cur });
                                  setEditingRegionName(null);
                                } else if (e.key === 'Enter') {
                                  setEditingRegionName(null);
                                } else if (e.key === 'Escape') {
                                  setEditingRegionName(null);
                                }
                              }}
                              onBlur={() => {
                                if (editingRegionValue.trim() && editingRegionValue.trim() !== name) {
                                  const regions = { ...(selectedObj.sprite.regions || {}) };
                                  const newName = editingRegionValue.trim();
                                  if (!regions[newName]) {
                                    const entries = Object.entries(regions);
                                    const newRegions = {};
                                    for (const [k, v] of entries) {
                                      newRegions[k === name ? newName : k] = v;
                                    }
                                    const cur = selectedObj.sprite.currentRegion === name ? newName : selectedObj.sprite.currentRegion;
                                    updateProp('sprite', { ...selectedObj.sprite, regions: newRegions, currentRegion: cur });
                                  }
                                }
                                setEditingRegionName(null);
                              }}
                            />
                          ) : (
                            <strong
                              style={{ color: 'var(--accent)', cursor: 'pointer' }}
                              onDoubleClick={() => { setEditingRegionName(name); setEditingRegionValue(name); }}
                            >{name}</strong>
                          )}
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginTop: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 30 }}>pX</span>
                            <input className="input input-sm" type="number" style={{ width: '100%', padding: '1px 4px' }}
                              value={r.pivotX !== undefined ? r.pivotX : Math.round((r.width || 32) / 2)}
                              onChange={e => {
                                const regions = { ...(selectedObj.sprite.regions || {}) };
                                regions[name] = { ...regions[name], pivotX: parseInt(e.target.value) || 0 };
                                updateProp('sprite', { ...selectedObj.sprite, regions });
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 30 }}>pY</span>
                            <input className="input input-sm" type="number" style={{ width: '100%', padding: '1px 4px' }}
                              value={r.pivotY !== undefined ? r.pivotY : Math.round((r.height || 32) / 2)}
                              onChange={e => {
                                const regions = { ...(selectedObj.sprite.regions || {}) };
                                regions[name] = { ...regions[name], pivotY: parseInt(e.target.value) || 0 };
                                updateProp('sprite', { ...selectedObj.sprite, regions });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
        )}

        <div style={{ padding: '8px 12px' }}>
          <button className="btn btn-sm btn-danger"
            onClick={() => setShowDeleteConfirm(true)}>
            Delete Object
          </button>
        </div>

        {showDeleteConfirm && (
          <ConfirmDialog
            title="Delete Object"
            message={`Are you sure you want to delete "${selectedObj.name || selectedObj.id}"?`}
            onConfirm={() => {
              dispatch({ type: 'REMOVE_OBJECT', id: selectedObj.id });
              setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
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

function sendToPreviewIframe(msg) {
  const iframe = document.querySelector('.game-preview-iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(msg, '*');
  }
}

function makeIsoArrays(cols, rows, oldIso) {
  const tiles = [], heightMap = [], collisionMap = [];
  for (let r = 0; r < rows; r++) {
    tiles[r] = [];
    heightMap[r] = [];
    collisionMap[r] = [];
    for (let c = 0; c < cols; c++) {
      tiles[r][c] = (oldIso && oldIso.tiles && oldIso.tiles[r] && oldIso.tiles[r][c] !== undefined) ? oldIso.tiles[r][c] : 0;
      heightMap[r][c] = (oldIso && oldIso.heightMap && oldIso.heightMap[r] && oldIso.heightMap[r][c] !== undefined) ? oldIso.heightMap[r][c] : 0;
      collisionMap[r][c] = (oldIso && oldIso.collisionMap && oldIso.collisionMap[r] && oldIso.collisionMap[r][c] !== undefined) ? oldIso.collisionMap[r][c] : 0;
    }
  }
  return { tiles, heightMap, collisionMap };
}

function renderIsometricSection(scene, state, dispatch, isoTool, setIsoTool, isoTileType, setIsoTileType, isoHeightDelta, setIsoHeightDelta) {
  const iso = scene.isometricMap || {};

  const updateIso = (newIso) => {
    dispatch({ type: 'UPDATE_ISOMETRIC_MAP', isometricMap: newIso });
    sendToPreviewIframe({ type: 'updateIsometricMap', isoData: newIso });
  };

  const sendIsoTool = (mode, tileType, heightDelta) => {
    sendToPreviewIframe({
      type: 'setIsoTool',
      mode: mode,
      tileType: tileType,
      heightDelta: heightDelta
    });
  };

  const TILE_TYPES = [
    { value: 0, label: 'Grass', color: '#4c994c' },
    { value: 1, label: 'Dirt', color: '#99703d' },
    { value: 2, label: 'Stone', color: '#8c8c9b' },
    { value: 3, label: 'Water', color: '#3366b2' }
  ];

  return (
    <div className="section">
      <div className="section-title">Isometric Map</div>
      <div className="prop-row">
        <span className="prop-label">Enabled</span>
        <div className="prop-value">
          <input type="checkbox" checked={iso.enabled || false}
            onChange={e => {
              if (e.target.checked) {
                const cols = iso.cols || 10;
                const rows = iso.rows || 10;
                const arrays = makeIsoArrays(cols, rows, iso);
                const newIso = {
                  enabled: true,
                  cols, rows,
                  tileWidth: iso.tileWidth || 64,
                  tileHeight: iso.tileHeight || 32,
                  heightStep: iso.heightStep || 16,
                  offsetX: iso.offsetX !== undefined ? iso.offsetX : Math.floor(state.project.settings.canvasWidth / 2),
                  offsetY: iso.offsetY !== undefined ? iso.offsetY : 50,
                  ...arrays
                };
                updateIso(newIso);
                sendIsoTool(isoTool, isoTileType, isoHeightDelta);
              } else {
                updateIso({ ...iso, enabled: false });
                sendIsoTool(null, 0, 1);
              }
            }} />
        </div>
      </div>
      {iso.enabled && (
        <>
          <div className="prop-row">
            <span className="prop-label">Cols</span>
            <div className="prop-value">
              <input className="input input-sm" type="number" min="2" max="50"
                value={iso.cols || 10}
                onChange={e => {
                  const cols = parseInt(e.target.value) || 10;
                  const arrays = makeIsoArrays(cols, iso.rows || 10, iso);
                  updateIso({ ...iso, cols, ...arrays });
                }} />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Rows</span>
            <div className="prop-value">
              <input className="input input-sm" type="number" min="2" max="50"
                value={iso.rows || 10}
                onChange={e => {
                  const rows = parseInt(e.target.value) || 10;
                  const arrays = makeIsoArrays(iso.cols || 10, rows, iso);
                  updateIso({ ...iso, rows, ...arrays });
                }} />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Tile W</span>
            <div className="prop-value">
              <input className="input input-sm" type="number" min="16" max="256"
                value={iso.tileWidth || 64}
                onChange={e => updateIso({ ...iso, tileWidth: parseInt(e.target.value) || 64 })} />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Tile H</span>
            <div className="prop-value">
              <input className="input input-sm" type="number" min="8" max="128"
                value={iso.tileHeight || 32}
                onChange={e => updateIso({ ...iso, tileHeight: parseInt(e.target.value) || 32 })} />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Height Step</span>
            <div className="prop-value">
              <input className="input input-sm" type="number" min="1" max="64"
                value={iso.heightStep || 16}
                onChange={e => updateIso({ ...iso, heightStep: parseInt(e.target.value) || 16 })} />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Offset X</span>
            <div className="prop-value">
              <input className="input input-sm" type="number"
                value={iso.offsetX !== undefined ? iso.offsetX : 0}
                onChange={e => updateIso({ ...iso, offsetX: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="prop-row">
            <span className="prop-label">Offset Y</span>
            <div className="prop-value">
              <input className="input input-sm" type="number"
                value={iso.offsetY !== undefined ? iso.offsetY : 0}
                onChange={e => updateIso({ ...iso, offsetY: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0', paddingTop: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 12px', marginBottom: 4 }}>
              Tile Tools
            </div>
            <div className="prop-row">
              <span className="prop-label">Mode</span>
              <div className="prop-value">
                <select className="input" value={isoTool}
                  onChange={e => {
                    const mode = e.target.value;
                    setIsoTool(mode);
                    sendIsoTool(mode, isoTileType, isoHeightDelta);
                  }}>
                  <option value="tile">Tile Paint</option>
                  <option value="height">Height</option>
                  <option value="collision">Collision</option>
                </select>
              </div>
            </div>
            {isoTool === 'tile' && (
              <div className="prop-row">
                <span className="prop-label">Tile</span>
                <div className="prop-value" style={{ display: 'flex', gap: 3 }}>
                  {TILE_TYPES.map(t => (
                    <div key={t.value}
                      title={t.label}
                      onClick={() => {
                        setIsoTileType(t.value);
                        sendIsoTool('tile', t.value, isoHeightDelta);
                      }}
                      style={{
                        width: 22, height: 22, borderRadius: 3,
                        background: t.color, cursor: 'pointer',
                        border: isoTileType === t.value ? '2px solid var(--accent)' : '1px solid var(--border)'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {isoTool === 'height' && (
              <div className="prop-row">
                <span className="prop-label">Action</span>
                <div className="prop-value" style={{ display: 'flex', gap: 3 }}>
                  <button
                    className={'btn btn-sm' + (isoHeightDelta === 1 ? ' btn-accent' : '')}
                    style={{ padding: '1px 8px', fontSize: 12 }}
                    onClick={() => {
                      setIsoHeightDelta(1);
                      sendIsoTool('height', isoTileType, 1);
                    }}>Raise</button>
                  <button
                    className={'btn btn-sm' + (isoHeightDelta === -1 ? ' btn-accent' : '')}
                    style={{ padding: '1px 8px', fontSize: 12 }}
                    onClick={() => {
                      setIsoHeightDelta(-1);
                      sendIsoTool('height', isoTileType, -1);
                    }}>Lower</button>
                </div>
              </div>
            )}
            {isoTool === 'collision' && (
              <div style={{ padding: '2px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
                Click tiles to toggle walkable/blocked
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
