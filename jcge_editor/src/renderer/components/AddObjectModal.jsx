import React, { useState } from 'react';
import Modal from './Modal';
import { useProject, useProjectDispatch } from '../store/ProjectContext';

const CATEGORIES = [
  { key: 'gameobject', label: 'Game Object' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'ui', label: 'UI / Shapes' }
];

const TYPES_BY_CATEGORY = {
  gameobject: [
    { type: 'gameobject', label: 'GameObject', desc: 'Sprite with position, velocity, and collision' },
    { type: 'element', label: 'Element', desc: 'Simple visual element (sprite only)' },
    { type: 'goRectangle', label: 'Rectangle', desc: 'Rectangle game object with velocity and collision' },
    { type: 'goCircle', label: 'Circle', desc: 'Circle game object with velocity and collision' },
    { type: 'goTriangle', label: 'Triangle', desc: 'Triangle game object with velocity and collision' }
  ],
  lighting: [
    { type: 'light', label: 'Light', desc: 'Point light source with color, radius, and flicker' },
    { type: 'shadowCaster', label: 'Shadow Caster', desc: 'Object that casts a directional shadow' }
  ],
  ui: [
    { type: 'uiText', label: 'Text', desc: 'Editable text element' },
    { type: 'uiLabel', label: 'Label', desc: 'Text label' },
    { type: 'uiButton', label: 'Button', desc: 'Clickable button with label' },
    { type: 'uiPanel', label: 'Panel', desc: 'Rectangular background panel' },
    { type: 'rectangle', label: 'Rectangle', desc: 'Colored rectangle shape' },
    { type: 'circle', label: 'Circle', desc: 'Colored circle shape' }
  ]
};

export default function AddObjectModal({ onClose }) {
  const state = useProject();
  const dispatch = useProjectDispatch();
  const [category, setCategory] = useState('gameobject');
  const [selectedType, setSelectedType] = useState('gameobject');
  const [name, setName] = useState('');

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSelectedType(TYPES_BY_CATEGORY[cat][0].type);
  };

  const currentTypes = TYPES_BY_CATEGORY[category] || [];
  const currentTypeInfo = currentTypes.find(t => t.type === selectedType);

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
      case 'rectangle':
        object = {
          id, type: 'rectangle',
          name: name || 'Rectangle',
          position: { X: 100, Y: 100 },
          opacity: 1, showIt: true,
          size: { width: 100, height: 60 },
          fillColor: '#e74c3c',
          borderColor: null,
          borderWidth: 1
        };
        break;
      case 'circle':
        object = {
          id, type: 'circle',
          name: name || 'Circle',
          position: { X: 150, Y: 150 },
          opacity: 1, showIt: true,
          radius: 30,
          fillColor: '#3498db',
          borderColor: null,
          borderWidth: 1
        };
        break;
      case 'goRectangle':
        object = {
          id, type: 'goRectangle',
          name: name || 'Rectangle',
          position: { X: 100, Y: 100 },
          velocity: { X: 0, Y: 0 },
          opacity: 1, showIt: true, isStatic: false,
          size: { width: 80, height: 50 },
          fillColor: '#e74c3c',
          borderColor: null,
          borderWidth: 1
        };
        break;
      case 'goCircle':
        object = {
          id, type: 'goCircle',
          name: name || 'Circle',
          position: { X: 150, Y: 150 },
          velocity: { X: 0, Y: 0 },
          opacity: 1, showIt: true, isStatic: false,
          radius: 30,
          fillColor: '#3498db',
          borderColor: null,
          borderWidth: 1
        };
        break;
      case 'goTriangle':
        object = {
          id, type: 'goTriangle',
          name: name || 'Triangle',
          position: { X: 100, Y: 100 },
          velocity: { X: 0, Y: 0 },
          opacity: 1, showIt: true, isStatic: false,
          size: { width: 60, height: 60 },
          fillColor: '#2ecc71',
          borderColor: null,
          borderWidth: 1
        };
        break;
      case 'uiText':
        object = {
          id, type: 'uiText',
          name: name || 'Text',
          position: { X: 50, Y: 50 },
          opacity: 1, showIt: true,
          text: 'Hello World', fontSize: 20,
          fontFamily: 'sans-serif', fontStyle: 'normal', color: 'white'
        };
        break;
      case 'uiLabel':
        object = {
          id, type: 'uiLabel',
          name: name || 'Label',
          position: { X: 50, Y: 50 },
          opacity: 1, showIt: true,
          text: 'Label Text', fontSize: 16,
          fontFamily: 'monospace', fontStyle: 'normal', color: 'white'
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
      case 'light':
        object = {
          id, type: 'light',
          name: name || 'Light',
          position: { X: 200, Y: 200 },
          opacity: 1, showIt: true,
          color: '#ffffff',
          radius: 150,
          intensity: 1.0,
          flicker: 0
        };
        break;
      case 'shadowCaster':
        object = {
          id, type: 'shadowCaster',
          name: name || 'Shadow Caster',
          position: { X: 100, Y: 100 },
          opacity: 1, showIt: true,
          size: { width: 32, height: 32 },
          shadowType: 'rectangle',
          heightScale: 1.0
        };
        break;
    }

    const objectType = ['uiText', 'uiLabel', 'uiButton', 'uiPanel', 'element', 'rectangle', 'circle'].includes(selectedType) ? 'element' : 'gameobject';
    // Light and shadowCaster are stored as gameObjects
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
      <div className="prop-row">
        <span className="prop-label">Category</span>
        <div className="prop-value">
          <select className="input" value={category} onChange={e => handleCategoryChange(e.target.value)}>
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="prop-row">
        <span className="prop-label">Type</span>
        <div className="prop-value">
          <select className="input" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            {currentTypes.map(t => (
              <option key={t.type} value={t.type}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      {currentTypeInfo && (
        <div style={{ padding: '2px 12px 8px', fontSize: 11, color: 'var(--text-muted)' }}>
          {currentTypeInfo.desc}
        </div>
      )}
      <div className="prop-row">
        <span className="prop-label">Name</span>
        <div className="prop-value">
          <input className="input" placeholder="Optional name" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-accent" onClick={handleAdd}>Add</button>
      </div>
    </Modal>
  );
}
