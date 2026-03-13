import React, { useEffect } from 'react';
import { useProjectDispatch } from './store/ProjectContext';
import SceneHierarchy from './components/SceneHierarchy';
import GamePreview from './components/GamePreview';
import PreviewToolbar from './components/PreviewToolbar';
import PropertiesPanel from './components/PropertiesPanel';
import AssetManager from './components/AssetManager';

export default function App() {
  const dispatch = useProjectDispatch();

  useEffect(() => {
    // Get engine path on startup
    if (window.electronAPI) {
      window.electronAPI.getEnginePath().then(path => {
        dispatch({ type: 'SET_ENGINE_PATH', path });
      });
    }
  }, [dispatch]);

  return (
    <div className="editor-layout">
      <div className="toolbar-area">
        <PreviewToolbar />
      </div>
      <div className="left-panel">
        <SceneHierarchy />
      </div>
      <div className="center-panel">
        <GamePreview />
      </div>
      <div className="right-panel">
        <PropertiesPanel />
      </div>
      <div className="bottom-panel">
        <AssetManager />
      </div>
    </div>
  );
}
