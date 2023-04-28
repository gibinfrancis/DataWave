const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const ioTHubService = require("./services/IoTHubService.js");
const eventHubService = require("./services/EventHubService.js");
const serviceBusService = require("./services/ServiceBusService.js");
const mqttService = require("./services/MqttService.js");
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
    minHeight: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,

    },
    icon: __dirname + "/assets/images/IoTSimulator.icns",
  });

  // and load the index.html of the app.
  mainWindow.loadFile("src/index.html");

  // Open the DevTools.
  //devTools: false
  //mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

  //--------------------------------------------------------------------------------------------------------
  //---------------------------------------IOT HUB----------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------

  //iot hub publisher start handle
  ipcMain.handle("start:publisher:iothub", async (event, settings) => ioTHubService.startPublisher(settings, mainWindow));

  //iot hub publisher stop handle
  ipcMain.handle("stop:publisher:iothub", async (event, settings) => ioTHubService.stopPublisher(settings, mainWindow));

  //iot hub subscriber start handle
  ipcMain.handle("start:subscriber:iothub", async (event, settings) => ioTHubService.startSubscriber(settings, mainWindow));

  //iot hub subscriber stop handle
  ipcMain.handle("stop:subscriber:iothub", async (event, settings) => ioTHubService.stopSubscriber(settings, mainWindow));

  //--------------------------------------------------------------------------------------------------------
  //---------------------------------------EVENT HUB--------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------

  //event hub publisher start handle
  ipcMain.handle("start:publisher:eventhub", async (event, settings) => eventHubService.startPublisher(settings, mainWindow));

  //event hub publisher stop handle
  ipcMain.handle("stop:publisher:eventhub", async (event, settings) => eventHubService.stopPublisher(settings, mainWindow));

  //event hub subscriber start handle
  ipcMain.handle("start:subscriber:eventhub", async (event, settings) => eventHubService.startSubscriber(settings, mainWindow));

  //event hub subscriber stop handle
  ipcMain.handle("stop:subscriber:eventhub", async (event, settings) => eventHubService.stopSubscriber(settings, mainWindow));

  //--------------------------------------------------------------------------------------------------------
  //---------------------------------------SERVICE BUS------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------

  //service bus publisher start handle
  ipcMain.handle("start:publisher:servicebus", async (event, settings) => serviceBusService.startPublisher(settings, mainWindow));

  //service bus publisher stop handle
  ipcMain.handle("stop:publisher:servicebus", async (event, settings) => serviceBusService.stopPublisher(settings, mainWindow));

  //service bus subscriber start handle
  ipcMain.handle("start:subscriber:servicebus", async (event, settings) => serviceBusService.startSubscriber(settings, mainWindow));

  //service bus subscriber stop handle
  ipcMain.handle("stop:subscriber:servicebus", async (event, settings) => serviceBusService.stopSubscriber(settings, mainWindow));

  //--------------------------------------------------------------------------------------------------------
  //---------------------------------------MQTT-------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------

  //mqtt publisher start handle
  ipcMain.handle("start:publisher:mqtt", async (event, settings) => mqttService.startPublisher(settings, mainWindow));

  //mqtt publisher stop handle
  ipcMain.handle("stop:publisher:mqtt", async (event, settings) => mqttService.stopPublisher(settings, mainWindow));

  //mqtt subscriber start handle
  ipcMain.handle("start:subscriber:mqtt", async (event, settings) => mqttService.startSubscriber(settings, mainWindow));

  //mqtt subscriber stop handle
  ipcMain.handle("stop:subscriber:mqtt", async (event, settings) => mqttService.stopSubscriber(settings, mainWindow));


  //--------------------------------------------------------------------------------------------------------
  //---------------------------------------KAFKA------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------

  // //kafka publisher start handle
  // ipcMain.handle("start:publisher:kafka", async (event, settings) => mqttService.startPublisher(settings, mainWindow));

  // //kafka publisher stop handle
  // ipcMain.handle("stop:publisher:kafka", async (event, settings) => mqttService.stopPublisher(settings, mainWindow));

  // //kafka subscriber start handle
  // ipcMain.handle("start:subscriber:kafka", async (event, settings) => mqttService.startSubscriber(settings, mainWindow));

  // //kafka subscriber stop handle
  // ipcMain.handle("stop:subscriber:kafka", async (event, settings) => mqttService.stopSubscriber(settings, mainWindow));


  //--------------------------------------------------------------------------------------------------------
  //---------------------------------------COMMON------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------

  //generate a message for preview
  ipcMain.handle("generate:message", async (event, settings) => commonService.generateMessage(settings, 0));

  //relaunch application window
  ipcMain.handle("relaunch:window", async () => relaunchApp());

  //save settings to json file
  ipcMain.handle("save:settings", async (event, settings) => saveSettingsToFile(settings));

  //load settings from json file
  ipcMain.handle("load:settings", async () => loadSettingsFromFile());

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


//relaunch the application window
function relaunchApp() {
  //register a relaunch and then call the quit.
  app.relaunch();
  app.quit();
}

//function to save the settings json file
async function saveSettingsToFile(settings) {

  //show file save dialog
  let result = await dialog.showSaveDialog(mainWindow, {
    properties: ["openFile", "openDirectory"],
    title: "Select the file path to save",
    defaultPath: path.join(os.homedir(), "Desktop/settings.json"),
    filters: [
      {
        name: "JSON Files",
        extensions: ["json"]
      },],
  });
  //if the user dint cancel the save window
  if (!result.canceled) {
    //write the settings to json
    let res = await writeToFile(result.filePath.toString(), JSON.stringify(settings));
    return res;
  }

  return null;
}

//function to load the settings json file
async function loadSettingsFromFile() {

  //show file open dialog
  let result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"]
  });

  //if the user dint cancel the load window
  if (!result.canceled) {
    let res = await readFromFile(result.filePaths[0].toString());
    return res;
  }
  return null;
}


//write content to file
function writeToFile(filePath, content) {
  return new Promise((resolve, _) => {
    fs.writeFile(filePath, content, function (err) {
      if (err) {
        console.log("Error while saving file" + err);
        resolve(false);
      }
      else {
        resolve(true);
      }
    });
  })
}


//read content from file
function readFromFile(filePath) {
  return new Promise((resolve, _) => {
    fs.readFile(filePath, "utf8", function (err, data) {
      if (err) {
        console.log("Error while reading file" + err);
        resolve(null);
      }
      else {
        resolve(data);
      }
    });
  })
}