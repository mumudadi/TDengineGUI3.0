const { app, BrowserWindow } = require('electron')
const isDevelopment = !app.isPackaged;
if (isDevelopment) {
  try {
    require('electron-reloader')(module);
  } catch (err) {
  }
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 880,
    webPreferences: {
      nodeIntegration: true,
      // 官网似乎说是默认false，但是这里必须设置contextIsolation
      contextIsolation: false
    }
  })

  win.loadFile('./renderer/index.html')
}

app.whenReady().then(createWindow)



