import React, { useState } from 'react';
import Modal from './Modal';
import { useProjectDispatch } from '../store/ProjectContext';

export default function NewProjectModal({ onClose }) {
  const dispatch = useProjectDispatch();
  const [name, setName] = useState('My Game');
  const [width, setWidth] = useState(960);
  const [height, setHeight] = useState(540);

  const handleCreate = async () => {
    try {
      // Ask user to select a folder for the project
      const result = await window.electronAPI.showOpenDialog({
        title: 'Select Project Folder',
        properties: ['openDirectory', 'createDirectory']
      });

      if (result.canceled || result.filePaths.length === 0) return;

      const projectDir = result.filePaths[0];
      const filePath = projectDir + '/' + name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.jcge';

      // Copy engine into project folder and create assets directories
      await window.electronAPI.copyEngine(projectDir + '/engine');
      await window.electronAPI.mkdir(projectDir + '/assets');
      await window.electronAPI.mkdir(projectDir + '/assets/sprites');
      await window.electronAPI.mkdir(projectDir + '/assets/audio');

      dispatch({
        type: 'NEW_PROJECT',
        name,
        width: parseInt(width) || 960,
        height: parseInt(height) || 540,
        filePath
      });

      // Save the initial project
      const project = {
        version: 1,
        name,
        filePath,
        settings: {
          canvasWidth: parseInt(width) || 960,
          canvasHeight: parseInt(height) || 540,
          backgroundColor: '#0a0a1a',
          displayFPS: false,
          jumpEngineIntro: true
        },
        scenes: [{
          id: 'scene_' + Math.random().toString(16).slice(2),
          name: 'MainScene',
          isDefault: true,
          camera: null,
          layers: [{
            id: 'layer_' + Math.random().toString(16).slice(2),
            name: 'ground',
            zOrder: 0,
            isUI: false,
            gameObjects: [],
            elements: []
          }]
        }],
        assets: { sprites: [], audio: [] }
      };

      await window.electronAPI.saveProject(filePath, JSON.stringify(project, null, 2));

      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  return (
    <Modal title="New Project" onClose={onClose}>
      <div className="prop-row">
        <span className="prop-label">Name</span>
        <div className="prop-value">
          <input className="input" value={name} onChange={e => setName(e.target.value)} />
        </div>
      </div>
      <div className="prop-row">
        <span className="prop-label">Width</span>
        <div className="prop-value">
          <input className="input input-sm" type="number" value={width} onChange={e => setWidth(e.target.value)} />
        </div>
      </div>
      <div className="prop-row">
        <span className="prop-label">Height</span>
        <div className="prop-value">
          <input className="input input-sm" type="number" value={height} onChange={e => setHeight(e.target.value)} />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-accent" onClick={handleCreate}>Create</button>
      </div>
    </Modal>
  );
}
