let $ = require('jquery')
const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow


require('electron-reload')(__dirname)

app.on('ready', () => {

  // Create the browser window.
  let window = new BrowserWindow({
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    },
  })

  window.setMenu(null)

  window.loadFile('./src/index.html')

  window.webContents.openDevTools()

  window.on('closed', () => { win = null })

})