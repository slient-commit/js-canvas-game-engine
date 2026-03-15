const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

// Track the current project directory for path validation
let currentProjectDir = null;

/**
 * Validate that a file path is within an allowed directory.
 * Prevents path traversal attacks.
 */
function isPathSafe(filePath, allowedDir) {
  if (!filePath || !allowedDir) return false;
  const resolved = path.resolve(filePath);
  const resolvedDir = path.resolve(allowedDir);
  return resolved.startsWith(resolvedDir + path.sep) || resolved === resolvedDir;
}

/**
 * Validate a filename doesn't contain path traversal
 */
function isSafeFilename(filename) {
  if (!filename) return false;
  return !/[/\\]/.test(filename) && filename !== '..' && filename !== '.';
}

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
    // Allow reading .jcge files anywhere (for Open dialog) and project files
    const resolved = path.resolve(filePath);
    if (resolved.endsWith('.jcge')) {
      return fs.readFileSync(resolved, 'utf-8');
    }
    if (!currentProjectDir || !isPathSafe(resolved, currentProjectDir)) {
      throw new Error('Access denied: path outside project directory');
    }
    return fs.readFileSync(resolved, 'utf-8');
  });

  ipcMain.handle('write-file', async (event, filePath, data) => {
    const resolved = path.resolve(filePath);
    if (!currentProjectDir || !isPathSafe(resolved, currentProjectDir)) {
      throw new Error('Access denied: path outside project directory');
    }
    fs.writeFileSync(resolved, data, 'utf-8');
    return true;
  });

  ipcMain.handle('read-dir', async (event, dirPath) => {
    const resolved = path.resolve(dirPath);
    if (!currentProjectDir || !isPathSafe(resolved, currentProjectDir)) {
      throw new Error('Access denied: path outside project directory');
    }
    return fs.readdirSync(resolved, { withFileTypes: true }).map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory()
    }));
  });

  ipcMain.handle('mkdir', async (event, dirPath) => {
    const resolved = path.resolve(dirPath);
    if (!currentProjectDir || !isPathSafe(resolved, currentProjectDir)) {
      throw new Error('Access denied: path outside project directory');
    }
    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
    }
    return true;
  });

  ipcMain.handle('copy-file', async (event, src, dest) => {
    const resolvedDest = path.resolve(dest);
    if (!currentProjectDir || !isPathSafe(resolvedDest, currentProjectDir)) {
      throw new Error('Access denied: destination outside project directory');
    }
    fs.copyFileSync(path.resolve(src), resolvedDest);
    return true;
  });

  ipcMain.handle('path-join', async (event, ...args) => {
    return path.join(...args);
  });

  ipcMain.handle('path-basename', async (event, filePath) => {
    return path.basename(filePath);
  });

  ipcMain.handle('file-exists', async (event, filePath) => {
    const resolved = path.resolve(filePath);
    // Allow checking .jcge files anywhere, otherwise restrict to project
    if (resolved.endsWith('.jcge')) {
      return fs.existsSync(resolved);
    }
    if (!currentProjectDir || !isPathSafe(resolved, currentProjectDir)) {
      return false;
    }
    return fs.existsSync(resolved);
  });

  // ── Project save/load ──
  ipcMain.handle('save-project', async (event, filePath, data) => {
    const resolved = path.resolve(filePath);
    // Allow saving .jcge files and update project dir
    if (!resolved.endsWith('.jcge')) {
      throw new Error('Can only save .jcge project files');
    }
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolved, data, 'utf-8');
    // Update tracked project directory
    currentProjectDir = dir;
    return true;
  });

  ipcMain.handle('load-project', async (event, filePath) => {
    const resolved = path.resolve(filePath);
    if (!resolved.endsWith('.jcge')) {
      throw new Error('Can only load .jcge project files');
    }
    // Update tracked project directory on load
    currentProjectDir = path.dirname(resolved);
    return fs.readFileSync(resolved, 'utf-8');
  });

  // ── Asset management ──
  ipcMain.handle('import-asset', async (event, sourcePath, destDir) => {
    const resolvedDest = path.resolve(destDir);
    if (!currentProjectDir || !isPathSafe(resolvedDest, currentProjectDir)) {
      throw new Error('Access denied: destination outside project directory');
    }
    if (!fs.existsSync(resolvedDest)) {
      fs.mkdirSync(resolvedDest, { recursive: true });
    }
    const filename = path.basename(sourcePath);
    if (!isSafeFilename(filename)) {
      throw new Error('Invalid filename');
    }
    const destPath = path.join(resolvedDest, filename);
    fs.copyFileSync(path.resolve(sourcePath), destPath);
    return { filename, path: destPath };
  });

  ipcMain.handle('read-file-base64', async (event, filePath) => {
    const resolved = path.resolve(filePath);
    if (!currentProjectDir || !isPathSafe(resolved, currentProjectDir)) {
      throw new Error('Access denied: path outside project directory');
    }
    const buf = fs.readFileSync(resolved);
    return buf.toString('base64');
  });

  ipcMain.handle('rename-asset', async (event, oldPath, newFilename) => {
    if (!isSafeFilename(newFilename)) {
      throw new Error('Invalid filename');
    }
    const resolvedOld = path.resolve(oldPath);
    if (!currentProjectDir || !isPathSafe(resolvedOld, currentProjectDir)) {
      throw new Error('Access denied: path outside project directory');
    }
    const assetsDir = path.join(currentProjectDir, 'assets');
    if (!isPathSafe(resolvedOld, assetsDir)) {
      throw new Error('Access denied: can only rename files in assets/ directory');
    }
    const dir = path.dirname(resolvedOld);
    const newPath = path.join(dir, newFilename);
    if (fs.existsSync(newPath)) {
      throw new Error('A file with that name already exists');
    }
    if (!fs.existsSync(resolvedOld)) {
      throw new Error('Source file not found');
    }
    fs.renameSync(resolvedOld, newPath);
    return true;
  });

  ipcMain.handle('delete-asset', async (event, filePath) => {
    const resolved = path.resolve(filePath);
    if (!currentProjectDir || !isPathSafe(resolved, currentProjectDir)) {
      throw new Error('Access denied: path outside project directory');
    }
    // Extra safety: only allow deleting from assets/ subdirectory
    const assetsDir = path.join(currentProjectDir, 'assets');
    if (!isPathSafe(resolved, assetsDir)) {
      throw new Error('Access denied: can only delete files in assets/ directory');
    }
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
    return true;
  });

  // ── Set project directory (called when creating new project) ──
  ipcMain.handle('set-project-dir', async (event, dirPath) => {
    currentProjectDir = path.resolve(dirPath);
    return true;
  });
}

module.exports = { registerFileHandlers, isPathSafe, isSafeFilename };
