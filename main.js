'use strict';
// ============================================================
// RETRO GAFFER — Electron Main Process
// ============================================================
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// Security: disable remote content
app.on('web-contents-created', (_, wc) => {
  wc.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) e.preventDefault();
  });
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'RETRO GAFFER',
    backgroundColor: '#060b14',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Allow localStorage
      partition: 'persist:retrogaffer',
    },
    autoHideMenuBar: false,
  });

  mainWindow.loadFile('index.html');

  // Custom menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'Game',
      submenu: [
        {
          label: 'New Career',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.executeJavaScript('if(window.RG) RG.startNewGame();'),
        },
        {
          label: 'Save Slot 1',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.executeJavaScript('if(window.RG) RG.saveGame(1);'),
        },
        {
          label: 'Save Slot 2',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.executeJavaScript('if(window.RG) RG.saveGame(2);'),
        },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' },
        { label: 'Zoom In',           accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: 'Zoom Out',          accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Reset Zoom',        accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        {
          label: 'Developer Tools',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Retro Gaffer',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Retro Gaffer',
              message: 'RETRO GAFFER v1.0',
              detail: 'Football Management Revival\nPremier Manager Soul · Modern Craft · Serious Depth\n\nBuilt with Electron.',
            });
          },
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
