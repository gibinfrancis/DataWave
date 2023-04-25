const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const ioTHubService = require("./services/IoTHubService.js");
const eventHubService = require("./services/EventHubService.js");
const serviceBusService = require("./services/ServiceBusService.js");
const commonService = require("./services/CommonService.js");
const path = require("path");
const os = require("os");
const fs = require("fs");
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

  //re launch
  ipcMain.handle("Relaunch", async () => relaunchApp());

  //save simulation json file
  ipcMain.handle("SaveSimulationFile", async (event, settingsJson) => saveSimulationFile(settingsJson));

  //load simulation json file
  ipcMain.handle("LoadSimulationFile", async () => loadSimulationFile());

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

//relaunch the application
function relaunchApp() {
  app.relaunch();
  app.quit();
}

//function to save the settings json file
async function saveSimulationFile(settingsJson) {

  //show file save dialog
  let result = await dialog.showSaveDialog(mainWindow, {
    properties: ['openFile', 'openDirectory'],
    title: 'Select the file path to save',
    defaultPath: path.join(os.homedir(), "Desktop/simulation.json"),
    filters: [
      {
        name: 'JSON Files',
        extensions: ['json']
      },],
  });

  if (!result.canceled) {
    console.log(result.filePath.toString());
    let res = await writeToFile(result.filePath.toString(), JSON.stringify(settingsJson));
    return res;
  }
}

//function to load the settings json file
async function loadSimulationFile() {

  let result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile']
  });

  if (!result.canceled) {
    let res = await readFromFile(result.filePaths[0].toString());
    return res;
  }
  return null;
}



//write content to file
function writeToFile(filePath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, function (err) {
      if (err) {
        console.log('Error while saving file' + err);
        resolve(false);
      }
      else {
        console.log('File saved');
        resolve(true);
      }
    });
  })
}


//read content from file
function readFromFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", function (err, data) {
      if (err) {
        console.log('Error while reading file' + err);
        resolve(null);
      }
      else {
        console.log('File loaded');
        resolve(data);
      }
    });
  })
}