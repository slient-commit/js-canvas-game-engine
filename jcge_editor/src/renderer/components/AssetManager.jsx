import React, { useState, useRef } from 'react';
import { useProject, useProjectDispatch } from '../store/ProjectContext';

export default function AssetManager() {
  const state = useProject();
  const dispatch = useProjectDispatch();
  const [playingKey, setPlayingKey] = useState(null);
  const audioRef = useRef(null);
  const [editingAsset, setEditingAsset] = useState(null); // { key, category }
  const [editName, setEditName] = useState('');
  const editInputRef = useRef(null);

  if (!state.project) {
    return (
      <div>
        <div className="panel-header">Assets</div>
        <div className="empty-state" style={{ height: 'auto', padding: '12px' }}>No project open</div>
      </div>
    );
  }

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        title: 'Import Asset',
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] },
          { name: 'Audio', extensions: ['mp3', 'wav', 'ogg'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      });

      if (result.canceled || result.filePaths.length === 0) return;

      for (const filePath of result.filePaths) {
        const filename = await window.electronAPI.pathBasename(filePath);
        const ext = filename.split('.').pop().toLowerCase();
        const key = filename.replace(/\.[^.]+$/, '');

        const projectDir = state.project.filePath
          ? state.project.filePath.replace(/[/\\][^/\\]+$/, '')
          : null;

        if (!projectDir) {
          await window.electronAPI.showMessageBox({
            type: 'warning', title: 'Save First',
            message: 'Please save the project first before importing assets.'
          });
          return;
        }

        const isAudio = ['mp3', 'wav', 'ogg'].includes(ext);
        const category = isAudio ? 'audio' : 'sprites';
        const assetsSubDir = isAudio ? 'assets/audio' : 'assets/sprites';
        const destDir = projectDir + '/' + assetsSubDir;

        await window.electronAPI.mkdir(destDir);
        await window.electronAPI.importAsset(filePath, destDir);

        dispatch({
          type: 'ADD_ASSET',
          category,
          asset: { key, filename }
        });
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  const handlePlayAudio = async (asset) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingKey === asset.key) {
      setPlayingKey(null);
      return;
    }

    try {
      const projectDir = state.project.filePath.replace(/[/\\][^/\\]+$/, '');
      const audioPath = await window.electronAPI.pathJoin(projectDir, 'assets', 'audio', asset.filename);
      const base64 = await window.electronAPI.readFileBase64(audioPath);
      const ext = asset.filename.split('.').pop().toLowerCase();
      const mime = ext === 'mp3' ? 'audio/mpeg' : ext === 'ogg' ? 'audio/ogg' : 'audio/wav';
      const audio = new Audio('data:' + mime + ';base64,' + base64);
      audio.volume = 0.8;
      audio.onended = () => {
        setPlayingKey(null);
        audioRef.current = null;
      };
      audio.play();
      audioRef.current = audio;
      setPlayingKey(asset.key);
    } catch (err) {
      console.error('Audio play failed:', err);
      setPlayingKey(null);
    }
  };

  const startRename = (asset, category) => {
    const nameWithoutExt = asset.filename.replace(/\.[^.]+$/, '');
    setEditingAsset({ key: asset.key, category });
    setEditName(nameWithoutExt);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 0);
  };

  const commitRename = async () => {
    if (!editingAsset) return;
    const { key, category } = editingAsset;
    const assets = category === 'audio' ? (state.project.assets.audio || []) : (state.project.assets.sprites || []);
    const asset = assets.find(a => a.key === key);
    if (!asset) { setEditingAsset(null); return; }

    const ext = asset.filename.split('.').pop();
    const trimmed = editName.trim();
    if (!trimmed || trimmed === asset.filename.replace(/\.[^.]+$/, '')) {
      setEditingAsset(null);
      return;
    }

    // Validate: alphanumeric, underscore, hyphen, dot only
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(trimmed)) {
      await window.electronAPI.showMessageBox({
        type: 'warning', title: 'Invalid Name',
        message: 'Asset name can only contain letters, numbers, underscores, hyphens, and dots.'
      });
      return;
    }

    const newFilename = trimmed + '.' + ext;
    const newKey = trimmed;

    // Check for duplicate name
    if (assets.some(a => a.key !== key && a.filename === newFilename)) {
      await window.electronAPI.showMessageBox({
        type: 'warning', title: 'Duplicate Name',
        message: 'An asset with that name already exists.'
      });
      return;
    }

    try {
      // Rename file on disk
      const projectDir = state.project.filePath.replace(/[/\\][^/\\]+$/, '');
      const subDir = category === 'audio' ? 'audio' : 'sprites';
      const oldPath = await window.electronAPI.pathJoin(projectDir, 'assets', subDir, asset.filename);
      await window.electronAPI.renameAsset(oldPath, newFilename);

      // Update project state and all references
      dispatch({
        type: 'RENAME_ASSET',
        category,
        oldKey: key,
        oldFilename: asset.filename,
        newKey,
        newFilename
      });
    } catch (err) {
      console.error('Rename failed:', err);
      await window.electronAPI.showMessageBox({
        type: 'error', title: 'Rename Failed',
        message: err.message || 'Failed to rename asset.'
      });
    }

    setEditingAsset(null);
  };

  const cancelRename = () => {
    setEditingAsset(null);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  const allSprites = state.project.assets.sprites || [];
  const allAudio = state.project.assets.audio || [];

  return (
    <div>
      <div className="panel-header">
        <span>Assets ({allSprites.length + allAudio.length})</span>
        <button className="btn btn-sm" onClick={handleImport}>+ Import</button>
      </div>
      <div className="asset-grid">
        {allSprites.map(asset => (
          <div key={asset.key} className="asset-card" title={asset.filename}>
            <img
              src={getAssetUrl(state, 'sprites', asset.filename)}
              alt={asset.key}
              onError={e => { e.target.style.display = 'none'; }}
            />
            {editingAsset && editingAsset.key === asset.key ? (
              <input
                ref={editInputRef}
                className="asset-rename-input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleRenameKeyDown}
              />
            ) : (
              <div
                className="asset-name"
                onDoubleClick={() => startRename(asset, 'sprites')}
                title="Double-click to rename"
              >{asset.filename}</div>
            )}
          </div>
        ))}
        {allAudio.map(asset => (
          <div
            key={asset.key}
            className={'asset-card' + (playingKey === asset.key ? ' audio-playing' : '')}
            title={asset.filename}
          >
            <div
              onClick={() => handlePlayAudio(asset)}
              style={{
                width: 48, height: 48, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: playingKey === asset.key ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 20
              }}
            >
              {playingKey === asset.key ? '\u25A0' : '\u25B6'} {'\u266B'}
            </div>
            {editingAsset && editingAsset.key === asset.key ? (
              <input
                ref={editInputRef}
                className="asset-rename-input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleRenameKeyDown}
              />
            ) : (
              <div
                className="asset-name"
                onDoubleClick={() => startRename(asset, 'audio')}
                title="Double-click to rename"
              >{asset.filename}</div>
            )}
          </div>
        ))}
        {allSprites.length === 0 && allAudio.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px' }}>
            No assets imported yet. Click Import to add sprites or audio.
          </div>
        )}
      </div>
    </div>
  );
}

export function getAssetUrl(state, category, filename) {
  if (!state.project || !state.project.filePath) return '';
  const projectDir = state.project.filePath.replace(/[/\\][^/\\]+$/, '');
  return 'jcge://local/' + projectDir.replace(/\\/g, '/') + '/assets/' + category + '/' + filename;
}
