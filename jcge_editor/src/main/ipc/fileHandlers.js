const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function registerFileHandlers() {
  // ── Dialogs ──
  ipcMain.handle('show-open-dialog', async (event, options) => {
    return await dialog.showOpenDialog(options);
  });

  ipcMain.handle('show-save-dialog', async (event, options) => {
    return await dialog.showSaveDialog(options);
  });

  ipcMain.handle('show-message-box', async (event, options) => {
    return await dialog.showMessageBox(options);
  });

  // ── File system ──
  ipcMain.handle('read-file', async (event, filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
  });

  ipcMain.handle('write-file', async (event, filePath, data) => {
    fs.writeFileSync(filePath, data, 'utf-8');
    return true;
  });

  ipcMain.handle('read-dir', async (event, dirPath) => {
    return fs.readdirSync(dirPath, { withFileTypes: true }).map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory()
    }));
  });

  ipcMain.handle('mkdir', async (event, dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  });

  ipcMain.handle('copy-file', async (event, src, dest) => {
    fs.copyFileSync(src, dest);
    return true;
  });

  ipcMain.handle('path-join', async (event, ...args) => {
    return path.join(...args);
  });

  ipcMain.handle('path-basename', async (event, filePath) => {
    return path.basename(filePath);
  });

  ipcMain.handle('file-exists', async (event, filePath) => {
    return fs.existsSync(filePath);
  });

  // ── Project save/load ──
  ipcMain.handle('save-project', async (event, filePath, data) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, data, 'utf-8');
    return true;
  });

  ipcMain.handle('load-project', async (event, filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
  });

  // ── Asset management ──
  ipcMain.handle('import-asset', async (event, sourcePath, destDir) => {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const filename = path.basename(sourcePath);
    const destPath = path.join(destDir, filename);
    fs.copyFileSync(sourcePath, destPath);
    return { filename, path: destPath };
  });

  ipcMain.handle('read-file-base64', async (event, filePath) => {
    const buf = fs.readFileSync(filePath);
    return buf.toString('base64');
  });

  ipcMain.handle('delete-asset', async (event, filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  });
}

module.exports = { registerFileHandlers };
