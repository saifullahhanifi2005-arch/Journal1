/**
 * Electron Main Process — The Fools Hunting Room Desktop Application
 *
 * Capabilities:
 *   - Dual Mode Operation:
 *       1. Online Cloud Mode: Connects to your live global web app (`https://your-app.onrender.com` or `ONLINE_URL`)
 *       2. Hybrid Local Mode: Spawns the local full-stack Express engine on port 3001 (`../backend/app.js`)
 *   - Native OS Menu & Shortcuts (Reload, Fullscreen, DevTools, Mode Switcher)
 *   - Native File Exporting (`dialog.showSaveDialog`) for Excel/CSV reports
 */

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow;
let localServerProcess = null;

// Configuration: Set this to your live Render/Cloud URL once deployed online!
// Example: const DEFAULT_ONLINE_URL = 'https://the-fools-hunting-room.onrender.com';
const DEFAULT_ONLINE_URL = https:the-fools-hunting-room.onrender.com;
const LOCAL_SERVER_PORT = process.env.PORT || 3001;
const LOCAL_URL = `http://localhost:${LOCAL_SERVER_PORT}`;

function startLocalServer() {
  return new Promise((resolve) => {
    // Check if port 3001 is already active
    http.get(`${LOCAL_URL}/api/health`, (res) => {
      if (res.statusCode === 200) {
        console.log('ℹ️ Local backend server already active on port', LOCAL_SERVER_PORT);
        return resolve(true);
      }
    }).on('error', () => {
      // Not running, let's start it right inside Electron or via child process
      try {
        const backendPath = path.join(__dirname, '../backend/app.js');
        if (fs.existsSync(backendPath)) {
          console.log('🚀 Starting local full-stack server from:', backendPath);
          // Import dynamic ESM backend inside Node/Electron
          import('file://' + backendPath.replace(/\\/g, '/'))
            .then(() => {
              console.log('✅ Local full-stack Express server started inside Electron.');
              setTimeout(() => resolve(true), 500);
            })
            .catch((err) => {
              console.error('⚠️ Could not start local backend inside process:', err.message);
              resolve(false);
            });
        } else {
          resolve(false);
        }
      } catch (e) {
        resolve(false);
      }
    });
  });
}

async function createWindow() {
  // Start local server if no explicit online URL is forced
  if (!DEFAULT_ONLINE_URL) {
    await startLocalServer();
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'The Fools Hunting Room — Trading Journal Desktop',
    icon: path.join(__dirname, '../frontend/public/images/app-icon.png'),
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // Decide what URL or file to load
  const targetUrl = DEFAULT_ONLINE_URL || LOCAL_URL;

  // Try loading the target web server
  http.get(targetUrl, (res) => {
    if (res.statusCode === 200 || res.statusCode === 304) {
      console.log('🌐 Loading web application from:', targetUrl);
      mainWindow.loadURL(targetUrl);
    } else {
      loadLocalFallbackHtml();
    }
  }).on('error', () => {
    loadLocalFallbackHtml();
  });

  function loadLocalFallbackHtml() {
    console.log('ℹ️ Web server not responding directly — loading local build HTML fallback.');
    const indexPath = path.join(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      const legacyIndex = path.join(__dirname, '../BJournal-main/dist/index.html');
      if (fs.existsSync(legacyIndex)) {
        mainWindow.loadFile(legacyIndex);
      } else {
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
          <div style="font-family: system-ui; padding: 40px; background: #0f172a; color: #f8fafc; height: 100vh;">
            <h1 style="color: #fbbf24;">⚔️ The Fools Hunting Room Desktop</h1>
            <p>Application build not found. Please run <code>npm run build</code> inside the <b>frontend/</b> folder first.</p>
          </div>
        `));
      }
    }
  }

  // Setup Application Menu
  const template = [
    {
      label: 'Fools Hunting Room',
      submenu: [
        { label: 'Switch to Online Cloud URL...', click: () => promptAndSwitchUrl() },
        { label: 'Switch to Local Hybrid Engine', click: () => mainWindow.loadURL(LOCAL_URL) },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Platform Documentation & GitHub',
          click: () => shell.openExternal('https://github.com/saifullahhanifi2005-arch/Journal1'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function promptAndSwitchUrl() {
  // Simple reload to online or local
  if (DEFAULT_ONLINE_URL) {
    mainWindow.loadURL(DEFAULT_ONLINE_URL);
  } else {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Online Cloud URL',
      message: 'To connect this desktop app permanently to your live Render.com web application, set the ONLINE_URL environment variable or update DEFAULT_ONLINE_URL inside desktop/main.js!',
    });
  }
}

// ─── IPC Handlers ──────────────────────────────────

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('export-file', async (_event, { filename, data, encoding = 'base64' }) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename || 'export.xlsx',
  });
  if (!filePath) return { success: false, cancelled: true };

  try {
    const buf = encoding === 'base64' ? Buffer.from(data, 'base64') : Buffer.from(data, 'utf8');
    fs.writeFileSync(filePath, buf);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.on('open-external', (_event, url) => {
  if (url && typeof url === 'string') {
    shell.openExternal(url);
  }
});

ipcMain.handle('check-server-health', () => {
  return new Promise((resolve) => {
    http.get(`${LOCAL_URL}/api/health`, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve({ status: 'offline' }); }
      });
    }).on('error', () => resolve({ status: 'offline' }));
  });
});

// ─── App Lifecycle ─────────────────────────────────

app.whenReady().then(() => {
  createWindow();

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
