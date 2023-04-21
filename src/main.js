const { app, BrowserWindow, ipcMain, ipcRenderer } = require("electron");
const ioTHubService = require("./services/IoTHubService.js");
const eventHubService = require("./services/EventHubService.js");
const serviceBusService = require("./services/ServiceBusService.js");
const commonService = require("./services/CommonService.js");
const path = require("path");
var mainWindow;

// Create the browser window.
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1200,
    minWidth: 1200,
    minHeight: 700,
    autoHideMenuBar: true,
    //titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      //contextIsolation: false,
    },
    icon: __dirname + "/assets/images/IoTSimulator.icns",
  });

  // and load the index.html of the app.
  mainWindow.loadFile("src/index.html");

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  //iot hub Send start handle
  ipcMain.handle("StartSend:IoTHub", async (event, settingsJson) => ioTHubService.startIoTHubSend(settingsJson, mainWindow));

  //iot hub Send stop handle
  ipcMain.handle("StopSend:IoTHub", async (event, settingsJson) => ioTHubService.stopIoTHubSend(settingsJson, mainWindow));

  //iot hub Receive start handle
  ipcMain.handle("StartReceive:IoTHub", async (event, settingsJson) => ioTHubService.startIoTHubReceive(settingsJson, mainWindow));

  //iot hub Receive stop handle
  ipcMain.handle("StopReceive:IoTHub", async (event, settingsJson) => ioTHubService.stopIoTHubReceive(settingsJson, mainWindow));

  //Event hub Send start handle
  ipcMain.handle("StartSend:EventHub", async (event, settingsJson) => eventHubService.startEventHubSend(settingsJson, mainWindow));

  //Event hub Send stop handle
  ipcMain.handle("StopSend:EventHub", async (event, settingsJson) => eventHubService.stopEventHubSend(settingsJson, mainWindow));

  //Event hub Receive start handle
  ipcMain.handle("StartReceive:EventHub", async (event, settingsJson) => eventHubService.startEventHubReceive(settingsJson, mainWindow));

  //Event hub Receive stop handle
  ipcMain.handle("StopReceive:EventHub", async (event, settingsJson) => eventHubService.stopEventHubReceive(settingsJson, mainWindow));

  //Service bus Send start handle
  ipcMain.handle("StartSend:ServiceBus", async (event, settingsJson) => serviceBusService.startServiceBusSend(settingsJson, mainWindow));

  //Service bus Send stop handle
  ipcMain.handle("StopSend:ServiceBus", async (event, settingsJson) => serviceBusService.stopServiceBusSend(settingsJson, mainWindow));

  //Service bus Receive start handle
  ipcMain.handle("StartReceive:ServiceBus", async (event, settingsJson) => serviceBusService.startServiceBusReceive(settingsJson, mainWindow));

  //Service bus Receive stop handle
  ipcMain.handle("StopReceive:ServiceBus", async (event, settingsJson) => serviceBusService.stopServiceBusReceive(settingsJson, mainWindow));


  //generate a message
  ipcMain.handle("GenerateMessage", async (event, settingsJson) => commonService.getPreparedMessageAndHeader(settingsJson, 0));

  createWindow();

  app.on("activate", () => {
    // On macOS it"s common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it"s common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
