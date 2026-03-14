import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProject, useProjectDispatch } from '../store/ProjectContext';

export default function FileEditor() {
  const state = useProject();
  const dispatch = useProjectDispatch();
  const [selectedKey, setSelectedKey] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const saveTimerRef = useRef(null);
  const textareaRef = useRef(null);
  const newInputRef = useRef(null);

  const project = state.project;
  const scripts = project ? (project.scripts || []) : [];

  // Get the scripts directory path
  const getScriptsDir = useCallback(async () => {
    if (!project || !project.filePath) return null;
    const dir = project.filePath.replace(/[/\\][^/\\]+$/, '');
    return await window.electronAPI.pathJoin(dir, 'scripts');
  }, [project]);

  const getFilePath = useCallback(async (filename) => {
    const scriptsDir = await getScriptsDir();
    if (!scriptsDir) return null;
    return await window.electronAPI.pathJoin(scriptsDir, filename);
  }, [getScriptsDir]);

  // Load file content when selection changes
  useEffect(() => {
    if (!selectedKey) { setContent(''); return; }
    const file = scripts.find(s => s.key === selectedKey);
    if (!file) { setContent(''); return; }

    setLoading(true);
    (async () => {
      try {
        const filePath = await getFilePath(file.filename);
        if (filePath && await window.electronAPI.fileExists(filePath)) {
          const data = await window.electronAPI.readFile(filePath);
          setContent(data);
        } else {
          setContent('');
        }
      } catch (err) {
        console.error('Failed to load script file:', err);
        setContent('');
      }
      setLoading(false);
    })();
  }, [selectedKey, scripts, getFilePath]);

  // Focus new file input when shown
  useEffect(() => {
    if (showNewInput && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [showNewInput]);

  // Debounced save to disk
  const saveToFile = useCallback(async (text) => {
    const file = scripts.find(s => s.key === selectedKey);
    if (!file) return;
    try {
      const filePath = await getFilePath(file.filename);
      if (filePath) {
        await window.electronAPI.writeFile(filePath, text);
      }
    } catch (err) {
      console.error('Failed to save script file:', err);
    }
  }, [selectedKey, scripts, getFilePath]);

  const handleChange = (e) => {
    const text = e.target.value;
    setContent(text);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveToFile(text), 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newVal);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveToFile(newVal), 500);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  const handleNewFileSubmit = async () => {
    const name = newFileName.trim();
    if (!name) { setShowNewInput(false); return; }

    if (!project || !project.filePath) {
      await window.electronAPI.showMessageBox({
        type: 'warning', title: 'Save First',
        message: 'Save the project before creating script files.'
      });
      setShowNewInput(false);
      setNewFileName('');
      return;
    }

    const key = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = key + '.js';

    if (scripts.some(s => s.key === key)) {
      await window.electronAPI.showMessageBox({
        type: 'warning', title: 'Duplicate',
        message: 'A script file with that name already exists.'
      });
      return;
    }

    try {
      const scriptsDir = await getScriptsDir();
      const dirExists = await window.electronAPI.fileExists(scriptsDir);
      if (!dirExists) {
        await window.electronAPI.mkdir(scriptsDir);
      }
      const filePath = await window.electronAPI.pathJoin(scriptsDir, filename);
      await window.electronAPI.writeFile(filePath, '// ' + key + '.js\n');
      dispatch({ type: 'ADD_SCRIPT_FILE', script: { key, filename } });
      setSelectedKey(key);
    } catch (err) {
      console.error('Failed to create script file:', err);
    }

    setShowNewInput(false);
    setNewFileName('');
  };

  const handleNewFileKeyDown = (e) => {
    if (e.key === 'Enter') handleNewFileSubmit();
    if (e.key === 'Escape') { setShowNewInput(false); setNewFileName(''); }
  };

  const handleDelete = async (key) => {
    const file = scripts.find(s => s.key === key);
    if (!file) return;

    const result = await window.electronAPI.showMessageBox({
      type: 'question',
      title: 'Delete File',
      message: 'Delete "' + file.filename + '"?',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0
    });
    if (result.response !== 1) return;

    try {
      const filePath = await getFilePath(file.filename);
      if (filePath) {
        await window.electronAPI.deleteAsset(filePath);
      }
    } catch (err) {
      // File may not exist, that's ok
    }

    dispatch({ type: 'REMOVE_SCRIPT_FILE', key });
    if (selectedKey === key) {
      setSelectedKey(null);
      setContent('');
    }
  };

  if (!project) {
    return <div className="empty-state" style={{ padding: 12 }}>No project loaded</div>;
  }

  return (
    <div className="file-editor">
      <div className="file-list">
        <div className="file-list-header">
          <span>Script Files</span>
          <button
            className="btn btn-sm"
            onClick={() => setShowNewInput(true)}
            title="New script file"
          >+</button>
        </div>
        {showNewInput && (
          <div style={{ padding: '4px 8px' }}>
            <input
              ref={newInputRef}
              className="input input-sm"
              style={{ width: '100%' }}
              placeholder="filename"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleNewFileKeyDown}
              onBlur={handleNewFileSubmit}
            />
          </div>
        )}
        {scripts.length === 0 && !showNewInput && (
          <div style={{ color: 'var(--text-muted)', fontSize: 11, padding: '8px 10px' }}>
            No script files yet
          </div>
        )}
        {scripts.map(s => (
          <div
            key={s.key}
            className={'file-list-item' + (selectedKey === s.key ? ' active' : '')}
            onClick={() => setSelectedKey(s.key)}
          >
            <span className="file-list-icon">JS</span>
            <span className="file-list-name">{s.filename}</span>
            <button
              className="file-list-delete"
              onClick={(e) => { e.stopPropagation(); handleDelete(s.key); }}
              title="Delete file"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <div className="file-editor-area">
        {selectedKey ? (
          loading ? (
            <div className="empty-state">Loading...</div>
          ) : (
            <textarea
              ref={textareaRef}
              className="script-textarea"
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="// Write your JavaScript code here..."
              spellCheck={false}
            />
          )
        ) : (
          <div className="empty-state">
            {scripts.length > 0
              ? 'Select a file to edit'
              : 'Click + to create a new script file'}
          </div>
        )}
      </div>
    </div>
  );
}
