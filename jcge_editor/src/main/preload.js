const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Engine
  getEnginePath: () => ipcRenderer.invoke('get-engine-path'),
  copyEngine: (destDir) => ipcRenderer.invoke('copy-engine', destDir),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // File dialogs
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),

  // File system
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath),
  mkdir: (dirPath) => ipcRenderer.invoke('mkdir', dirPath),
  copyFile: (src, dest) => ipcRenderer.invoke('copy-file', src, dest),
  pathJoin: (...args) => ipcRenderer.invoke('path-join', ...args),
  pathBasename: (filePath) => ipcRenderer.invoke('path-basename', filePath),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),

  // Project
  saveProject: (filePath, data) => ipcRenderer.invoke('save-project', filePath, data),
  loadProject: (filePath) => ipcRenderer.invoke('load-project', filePath),

  // Export
  exportGame: (projectData, outputPath) =>
    ipcRenderer.invoke('export-game', projectData, outputPath),

  // Assets
  importAsset: (sourcePath, projectAssetsDir) =>
    ipcRenderer.invoke('import-asset', sourcePath, projectAssetsDir),
  deleteAsset: (filePath) => ipcRenderer.invoke('delete-asset', filePath),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close')
});
