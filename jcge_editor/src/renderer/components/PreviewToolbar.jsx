import React, { useState } from 'react';
import { useProject, useProjectDispatch } from '../store/ProjectContext';
import NewProjectModal from './NewProjectModal';

export default function PreviewToolbar() {
  const state = useProject();
  const dispatch = useProjectDispatch();
  const [showNewProject, setShowNewProject] = useState(false);

  const sendToPreview = (type, data = {}) => {
    const iframe = document.querySelector('.game-preview-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type, ...data }, '*');
    }
  };

  const handlePlay = () => {
    dispatch({ type: 'SET_PREVIEW_MODE', mode: 'play' });
    sendToPreview('play');
  };

  const handlePause = () => {
    dispatch({ type: 'SET_PREVIEW_MODE', mode: 'edit' });
    sendToPreview('pause');
  };

  const handleStep = () => {
    sendToPreview('step');
  };

  const handleReset = () => {
    dispatch({ type: 'SET_PREVIEW_MODE', mode: 'edit' });
    sendToPreview('reset');
  };

  const handleNewProject = () => {
    setShowNewProject(true);
  };

  const handleSave = async () => {
    if (!state.project) return;
    try {
      if (state.project.filePath) {
        await window.electronAPI.saveProject(state.project.filePath, JSON.stringify(state.project, null, 2));
        dispatch({ type: 'MARK_SAVED' });
      } else {
        const result = await window.electronAPI.showSaveDialog({
          title: 'Save Project',
          defaultPath: state.project.name + '.jcge',
          filters: [{ name: 'JCGE Project', extensions: ['jcge'] }]
        });
        if (!result.canceled && result.filePath) {
          await window.electronAPI.saveProject(result.filePath, JSON.stringify(state.project, null, 2));
          dispatch({ type: 'SET_PROJECT_PATH', filePath: result.filePath });
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleOpen = async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        title: 'Open Project',
        filters: [{ name: 'JCGE Project', extensions: ['jcge'] }],
        properties: ['openFile']
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const data = await window.electronAPI.loadProject(result.filePaths[0]);
        const project = JSON.parse(data);
        project.filePath = result.filePaths[0];
        dispatch({ type: 'LOAD_PROJECT', project });
      }
    } catch (err) {
      console.error('Open failed:', err);
    }
  };

  const handleExport = async () => {
    if (!state.project) return;
    try {
      const result = await window.electronAPI.showOpenDialog({
        title: 'Select Export Folder',
        properties: ['openDirectory', 'createDirectory']
      });
      if (!result.canceled && result.filePaths.length > 0) {
        await window.electronAPI.exportGame(
          state.project,
          result.filePaths[0]
        );
        await window.electronAPI.showMessageBox({
          type: 'info',
          title: 'Export Complete',
          message: 'Game exported successfully!'
        });
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <>
      <span className="toolbar-title">JCGE Editor</span>

      <button className="btn btn-sm" onClick={handleNewProject}>New</button>
      <button className="btn btn-sm" onClick={handleOpen}>Open</button>
      <button className="btn btn-sm" onClick={handleSave} disabled={!state.project}>Save</button>

      <div className="toolbar-separator" />

      <button className="btn btn-sm btn-accent" onClick={handlePlay} disabled={!state.project}>
        Play
      </button>
      <button className="btn btn-sm" onClick={handlePause} disabled={!state.project}>
        Pause
      </button>
      <button className="btn btn-sm" onClick={handleStep} disabled={!state.project}>
        Step
      </button>
      <button className="btn btn-sm" onClick={handleReset} disabled={!state.project}>
        Reset
      </button>

      <div className="toolbar-separator" />

      <button className="btn btn-sm" onClick={handleExport} disabled={!state.project}>
        Export
      </button>

      <div className="toolbar-drag-region" />

      <div className="toolbar-status">
        {state.project ? (state.dirty ? 'Unsaved changes' : state.project.name) : 'No project'}
        {state.previewMode === 'play' ? ' [PLAYING]' : ''}
      </div>

      <div className="window-controls">
        <button className="window-btn" onClick={() => window.electronAPI.windowMinimize()} title="Minimize">
          &#x2013;
        </button>
        <button className="window-btn" onClick={() => window.electronAPI.windowMaximize()} title="Maximize">
          &#x25A1;
        </button>
        <button className="window-btn window-btn-close" onClick={() => window.electronAPI.windowClose()} title="Close">
          &#x2715;
        </button>
      </div>

      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} />
      )}
    </>
  );
}
