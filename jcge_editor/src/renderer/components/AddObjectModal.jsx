import React, { useState } from 'react';
import Modal from './Modal';
import { useProject, useProjectDispatch } from '../store/ProjectContext';

const OBJECT_TYPES = [
  { type: 'gameobject', label: 'GameObject', desc: 'Basic game object with sprite, position, velocity, and collision' },
  { type: 'element', label: 'Element', desc: 'Simple visual element (sprite on a layer)' },
  { type: 'uiLabel', label: 'UI Label', desc: 'Text label for UI layers' },
  { type: 'uiButton', label: 'UI Button', desc: 'Clickable button for UI layers' },
  { type: 'uiPanel', label: 'UI Panel', desc: 'Rectangular panel for UI layers' }
];

export default function AddObjectModal({ onClose }) {
  const state = useProject();
  const dispatch = useProjectDispatch();
  const [selectedType, setSelectedType] = useState('gameobject');
  const [name, setName] = useState('');

  const handleAdd = () => {
    const id = selectedType.replace('ui', '').toLowerCase() + '_' + Math.random().toString(16).slice(2);
    let object;

    switch (selectedType) {
      case 'gameobject':
        object = {
          id, type: 'gameobject',
          name: name || 'New GameObject',
          position: { X: 100, Y: 100 },
          velocity: { X: 0, Y: 0 },
          opacity: 1, showIt: true, isStatic: false, hasSimpleSprite: true,
          sprite: { type: 'sprite', width: 32, height: 32, path: null },
          animations: []
        };
        break;
      case 'element':
        object = {
          id, type: 'element',
          name: name || 'New Element',
          position: { X: 100, Y: 100 },
          opacity: 1, showIt: true,
          sprite: { type: 'sprite', width: 32, height: 32, path: null }
        };
        break;
      case 'uiLabel':
        object = {
          id, type: 'uiLabel',
          name: name || 'Label',
          position: { X: 50, Y: 50 },
          opacity: 1, showIt: true,
          text: 'Label Text', fontSize: 16
        };
        break;
      case 'uiButton':
        object = {
          id, type: 'uiButton',
          name: name || 'Button',
          position: { X: 50, Y: 50 },
          opacity: 1, showIt: true,
          label: 'Click Me',
          size: { width: 120, height: 40 },
          normalColor: '#333',
          fillColor: '#555',
          borderColor: '#888'
        };
        break;
      case 'uiPanel':
        object = {
          id, type: 'uiPanel',
          name: name || 'Panel',
          position: { X: 50, Y: 50 },
          opacity: 1, showIt: true,
          size: { width: 200, height: 150 },
          fillColor: 'rgba(0,0,0,0.5)',
          borderColor: '#888'
        };
        break;
    }

    const objectType = ['uiLabel', 'uiButton', 'uiPanel', 'element'].includes(selectedType) ? 'element' : 'gameobject';
    dispatch({ type: 'ADD_OBJECT', object, objectType });

    // Notify preview
    const iframe = document.querySelector('.game-preview-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'addObject',
        layerId: state.selectedLayerId,
        objectData: object
      }, '*');
    }

    onClose();
  };

  return (
    <Modal title="Add Object" onClose={onClose}>
      <div style={{ marginBottom: 12 }}>
        {OBJECT_TYPES.map(t => (
          <div
            key={t.type}
            className={'tree-item' + (selectedType === t.type ? ' selected' : '')}
            onClick={() => setSelectedType(t.type)}
          >
            <span style={{ fontWeight: 600 }}>{t.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{t.desc}</span>
          </div>
        ))}
      </div>
      <div className="prop-row">
        <span className="prop-label">Name</span>
        <div className="prop-value">
          <input className="input" placeholder="Optional name" value={name} onChange={e => setName(e.target.value)} />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-accent" onClick={handleAdd}>Add</button>
      </div>
    </Modal>
  );
}
