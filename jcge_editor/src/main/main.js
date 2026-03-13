const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { registerFileHandlers } = require('./ipc/fileHandlers');
const { registerExportHandlers } = require('./ipc/exportHandlers');

let mainWindow = null;

// Register custom protocol before app is ready
// This allows the preview iframe to load engine files from the project folder
protocol.registerSchemesAsPrivileged([{
  scheme: 'jcge',
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    corsEnabled: true,
    stream: true
  }
}]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: false
    },
    title: 'JCGE Editor',
    backgroundColor: '#1e1e2e'
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV !== 'production' && !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register jcge:// protocol handler for serving project files
  protocol.handle('jcge', (request) => {
    try {
      const url = new URL(request.url);
      // hostname is 'local' (used to preserve drive letter on Windows)
      let filePath = decodeURIComponent(url.pathname);
      // On Windows, pathname starts with / before drive letter (e.g. /C:/path)
      if (process.platform === 'win32' && filePath.startsWith('/')) {
        filePath = filePath.slice(1);
      }
      // Skip empty or directory requests
      if (!filePath || filePath.endsWith('/')) {
        return new Response('Not found', { status: 404 });
      }
      if (!fs.existsSync(filePath)) {
        console.warn('[jcge://] File not found:', filePath);
        return new Response('Not found', { status: 404 });
      }
      return net.fetch(pathToFileURL(filePath).href);
    } catch (err) {
      console.error('[jcge://] Error handling request:', request.url, err);
      return new Response('Internal error', { status: 500 });
    }
  });

  createWindow();

  // Register IPC handlers
  registerIpcHandlers();
  registerFileHandlers();
  registerExportHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function registerIpcHandlers() {
  // Get the source engine path (for copying into new projects)
  ipcMain.handle('get-engine-path', () => {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'engine');
    }
    return path.join(__dirname, '../../../src/engine');
  });

  // Copy engine folder into a project directory
  ipcMain.handle('copy-engine', (event, destDir) => {
    let srcEngine;
    if (app.isPackaged) {
      srcEngine = path.join(process.resourcesPath, 'engine');
    } else {
      srcEngine = path.join(__dirname, '../../../src/engine');
    }
    copyDirRecursive(srcEngine, destDir);
    return true;
  });

  // Get app path
  ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
  });

  // Window controls
  ipcMain.handle('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    if (mainWindow) mainWindow.close();
  });
}
