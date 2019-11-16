/******************************************************************************
  OpenUIX Typescript Core: Browser Test
******************************************************************************/

// Import the necessary electron elements [Use: npm i -g electron@latest]
const { app, BrowserWindow } = require('electron')

// Disable the security warnings for now
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

// Creates the window
function createWindow() {

  // Create the browser window.
  let win = new BrowserWindow({
    show: false, autoHideMenuBar: true,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: false, 
      webSecurity: false, 
      allowRunningInsecureContent: true, 
    }
  });
  // Load the index.html file
  win.loadFile('test.html');

  // Show the window when its ready
  win.once('ready-to-show', () => { 
    win.webContents.openDevTools();
    win.maximize(); win.show() });
}

// Create the window as soon as possible
app.on('ready', createWindow)