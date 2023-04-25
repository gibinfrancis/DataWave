const { contextBridge, ipcRenderer } = require("electron");


window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ["chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }

});

//exposing api to renderer pages
contextBridge.exposeInMainWorld("api", {

  //start iot hub Send
  startIoTHubSend: (settingsJson) => ipcRenderer.invoke("StartSend:IoTHub", settingsJson),

  //stop iot hub Send
  stopIoTHubSend: (settingsJson) => ipcRenderer.invoke("StopSend:IoTHub", settingsJson),

  //start iot hub Receive
  startIoTHubReceive: (settingsJson) => ipcRenderer.invoke("StartReceive:IoTHub", settingsJson),

  //stop iot hub Receive
  stopIoTHubReceive: (settingsJson) => ipcRenderer.invoke("StopReceive:IoTHub", settingsJson),

  //start Event hub Send
  startEventHubSend: (settingsJson) => ipcRenderer.invoke("StartSend:EventHub", settingsJson),

  //stop Event hub Send
  stopEventHubSend: (settingsJson) => ipcRenderer.invoke("StopSend:EventHub", settingsJson),

  //start Event hub Receive
  startEventHubReceive: (settingsJson) => ipcRenderer.invoke("StartReceive:EventHub", settingsJson),

  //stop Event hub Receive
  stopEventHubReceive: (settingsJson) => ipcRenderer.invoke("StopReceive:EventHub", settingsJson),

  //start Service Bus Send
  startServiceBusSend: (settingsJson) => ipcRenderer.invoke("StartSend:ServiceBus", settingsJson),

  //stop Service Bus Send
  stopServiceBusSend: (settingsJson) => ipcRenderer.invoke("StopSend:ServiceBus", settingsJson),

  //start Service Bus Receive
  startServiceBusReceive: (settingsJson) => ipcRenderer.invoke("StartReceive:ServiceBus", settingsJson),

  //stop Service Bus Receive
  stopServiceBusReceive: (settingsJson) => ipcRenderer.invoke("StopReceive:ServiceBus", settingsJson),

  //get generated message
  getGeneratedMessage: (settingsJson) => ipcRenderer.invoke("GenerateMessage", settingsJson),

  //relaunch
  relaunch: () => ipcRenderer.invoke("Relaunch"),

  //Save Simulation File
  SaveSimulationFile: (settingsJson) => ipcRenderer.invoke("SaveSimulationFile", settingsJson),

  //Load Simulation File
  LoadSimulationFile: () => ipcRenderer.invoke("LoadSimulationFile"),

  //update log
  onLogUpdate: (message, type) => ipcRenderer.on("LogUpdate", message, type),

  //update count
  onCountUpdate: (countObj) => ipcRenderer.on("CountUpdate", countObj),



});



