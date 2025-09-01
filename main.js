const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  // Создаем окно браузера
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'icon.png'), // опционально
    title: 'Dota 2 Titan MMR Tracker'
  });

  // Загружаем index.html
  mainWindow.loadFile('index.html');

  // Открываем DevTools в development режиме
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Обработка закрытия окна
  mainWindow.on('closed', function () {
    app.quit();
  });
}

// Инициализация Electron
app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});