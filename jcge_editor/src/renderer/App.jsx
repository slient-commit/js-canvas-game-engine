import React, { useEffect, useState } from 'react';
import { useProjectDispatch } from './store/ProjectContext';
import SceneHierarchy from './components/SceneHierarchy';
import GamePreview from './components/GamePreview';
import PreviewToolbar from './components/PreviewToolbar';
import PropertiesPanel from './components/PropertiesPanel';
import AssetManager from './components/AssetManager';
import ScriptEditor from './components/ScriptEditor';
import FileEditor from './components/FileEditor';

export default function App() {
  const dispatch = useProjectDispatch();
  const [centerTab, setCenterTab] = useState('preview');
  const [scriptError, setScriptError] = useState(null);

  useEffect(() => {
    // Get engine path on startup
    if (window.electronAPI) {
      window.electronAPI.getEnginePath().then(path => {
        dispatch({ type: 'SET_ENGINE_PATH', path });
      });
    }
  }, [dispatch]);

  // Listen for script errors from iframe
  useEffect(() => {
    function handleMessage(event) {
      const msg = event.data;
      if (!msg || !msg.type) return;
      if (msg.type === 'scriptError') {
        setScriptError(msg.error);
        setCenterTab('code'); // auto-switch to code tab on error
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="editor-layout">
      <div className="toolbar-area">
        <PreviewToolbar />
      </div>
      <div className="left-panel">
        <SceneHierarchy />
      </div>
      <div className="center-panel">
        <div className="center-panel-tabs">
          <button
            className={'btn btn-sm' + (centerTab === 'preview' ? ' btn-accent' : '')}
            onClick={() => setCenterTab('preview')}
          >
            Preview
          </button>
          <button
            className={'btn btn-sm' + (centerTab === 'code' ? ' btn-accent' : '')}
            onClick={() => { setCenterTab('code'); setScriptError(null); }}
          >
            Code
            {scriptError && <span className="script-error-dot" />}
          </button>
          <button
            className={'btn btn-sm' + (centerTab === 'files' ? ' btn-accent' : '')}
            onClick={() => setCenterTab('files')}
          >
            Files
          </button>
        </div>
        <div className="center-panel-content">
          {centerTab === 'preview' ? (
            <GamePreview />
          ) : centerTab === 'code' ? (
            <ScriptEditor scriptError={scriptError} />
          ) : (
            <FileEditor />
          )}
        </div>
      </div>
      <div className="right-panel">
        <PropertiesPanel />
      </div>
      <div className="bottom-panel">
        <div className="bottom-panel-content">
          <AssetManager />
        </div>
      </div>
    </div>
  );
}
