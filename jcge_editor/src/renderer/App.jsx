import React, { useEffect, useState, useRef } from 'react';
import { useProjectDispatch } from './store/ProjectContext';
import SceneHierarchy from './components/SceneHierarchy';
import GamePreview from './components/GamePreview';
import PreviewToolbar from './components/PreviewToolbar';
import PropertiesPanel from './components/PropertiesPanel';
import AssetManager from './components/AssetManager';
import ScriptEditor from './components/ScriptEditor';
import FileEditor from './components/FileEditor';
import ConsolePanel from './components/ConsolePanel';

export default function App() {
  const dispatch = useProjectDispatch();
  const [centerTab, setCenterTab] = useState('preview');
  const [scriptError, setScriptError] = useState(null);
  const [consoleEntries, setConsoleEntries] = useState([]);
  const [bottomTab, setBottomTab] = useState('assets');
  const entryIdRef = useRef(0);

  useEffect(() => {
    // Get engine path on startup
    if (window.electronAPI) {
      window.electronAPI.getEnginePath().then(path => {
        dispatch({ type: 'SET_ENGINE_PATH', path });
      });
    }
  }, [dispatch]);

  // Listen for script errors and console output from iframe
  useEffect(() => {
    function handleMessage(event) {
      const msg = event.data;
      if (!msg || !msg.type) return;
      if (msg.type === 'scriptError') {
        setScriptError(msg.error);
        setCenterTab('code');
        setConsoleEntries(prev => {
          const next = [...prev, {
            id: ++entryIdRef.current,
            level: 'error',
            args: [{ type: 'error', value: '[Script Error] ' + msg.error }],
            timestamp: Date.now()
          }];
          return next.length > 1000 ? next.slice(-1000) : next;
        });
      }
      if (msg.type === 'consoleLog') {
        setConsoleEntries(prev => {
          const next = [...prev, {
            id: ++entryIdRef.current,
            level: msg.level || 'log',
            args: msg.args || [],
            timestamp: msg.timestamp || Date.now()
          }];
          return next.length > 1000 ? next.slice(-1000) : next;
        });
      }
      if (msg.type === 'consoleClear') {
        setConsoleEntries([]);
      }
      if (msg.type === 'isoTileUpdated') {
        dispatch({
          type: 'UPDATE_ISO_TILE',
          col: msg.col,
          row: msg.row,
          property: msg.property,
          value: msg.value
        });
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
        <div className="bottom-panel-tabs">
          <button
            className={'btn btn-sm' + (bottomTab === 'assets' ? ' btn-accent' : '')}
            onClick={() => setBottomTab('assets')}
          >
            Assets
          </button>
          <button
            className={'btn btn-sm' + (bottomTab === 'console' ? ' btn-accent' : '')}
            onClick={() => setBottomTab('console')}
          >
            Console
            {consoleEntries.some(e => e.level === 'error') && <span className="script-error-dot" />}
          </button>
        </div>
        <div className="bottom-panel-content">
          {bottomTab === 'assets' ? (
            <AssetManager />
          ) : (
            <ConsolePanel entries={consoleEntries} onClear={() => setConsoleEntries([])} />
          )}
        </div>
      </div>
    </div>
  );
}
