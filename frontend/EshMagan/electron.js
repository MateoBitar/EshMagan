// electron.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

function createWindow() {
  console.log('Creating window...');
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'EshMagan',
  });

  console.log('Loading URL...');
  win.loadURL('http://localhost:3000');
  win.webContents.openDevTools();

  win.on('closed', () => console.log('Window closed'));
}

app.on('ready', () => {
  console.log('App ready');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
