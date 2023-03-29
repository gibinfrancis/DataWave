const { app, BrowserWindow, ipcMain, ipcRenderer } = require("electron");
const ioTHubService = require('./Services/IoTHubService.js');
const commonService = require('./Services/CommonService.js');
const path = require("path");
var mainWindow;

// Create the browser window.
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1200,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      //contextIsolation: false,
    },
    icon: __dirname + "/assets/images/IoTSimulator.icns",
  });

  //on the event of starting simulation
  // ipcMain.on("startSimulation", (event, config, message) => {
  //   //accept the event and cascade it back to respective service
  //   //mainWindow.webContents.send(config.service + "Simulation", config, message);
  //   startIoTHubMessageSimulation();
  // });

  // // ipcMain.on('counter-value', (_event, value) => {
  // //   console.log(value) // will print value to Node console
  // // })

  // and load the index.html of the app.
  mainWindow.loadFile("src/index.html");

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  //iot hub simulation start handle
  ipcMain.handle('StartSimulation:IoTHub', async (event, settingsJson) => ioTHubService.startIoTHubSimulation(settingsJson, mainWindow));

  //iot hub simulation start handle
  ipcMain.handle('StopSimulation:IoTHub', async (event, settingsJson) => ioTHubService.stopIoTHubSimulation(settingsJson, mainWindow));

  //generate a message
  ipcMain.handle('GenerateMessage', async (event, settingsJson) => commonService.getPreparedMessageAndHeader(settingsJson, 0));

  createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
