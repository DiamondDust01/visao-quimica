const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

app.setName('Visão Química');
// Agrupa a janela na barra de tarefas com o mesmo ID do app.
if (process.platform === 'win32') app.setAppUserModelId('com.exemplo.quimicaquest');

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 360,
    minHeight: 640,
    title: 'Visão Química',
    icon: path.join(__dirname, '..', 'dist', 'icon.png'),
    backgroundColor: '#03100f',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
