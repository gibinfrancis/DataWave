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

  //start iot hub simulation
  startIoTHubSimulation: (settingsJson) => ipcRenderer.invoke("StartSimulation:IoTHub", settingsJson),

  //stop iot hub simulation
  stopIoTHubSimulation: (settingsJson) => ipcRenderer.invoke("StopSimulation:IoTHub", settingsJson),

  //start iot hub subscription
  startIoTHubSubscription: (settingsJson) => ipcRenderer.invoke("StartSubscription:IoTHub", settingsJson),

  //stop iot hub subscription
  stopIoTHubSubscription: (settingsJson) => ipcRenderer.invoke("StopSubscription:IoTHub", settingsJson),

  //start Event hub simulation
  startEventHubSimulation: (settingsJson) => ipcRenderer.invoke("StartSimulation:EventHub", settingsJson),

  //stop Event hub simulation
  stopEventHubSimulation: (settingsJson) => ipcRenderer.invoke("StopSimulation:EventHub", settingsJson),

  //start Event hub subscription
  startEventHubSubscription: (settingsJson) => ipcRenderer.invoke("StartSubscription:EventHub", settingsJson),

  //stop Event hub subscription
  stopEventHubSubscription: (settingsJson) => ipcRenderer.invoke("StopSubscription:EventHub", settingsJson),

  //get generated message
  getGeneratedMessage: (settingsJson) => ipcRenderer.invoke("GenerateMessage", settingsJson),

  //update log
  onLogUpdate: (message, type) => ipcRenderer.on("LogUpdate", message, type),

  //update count
  onCountUpdate: (countObj) => ipcRenderer.on("CountUpdate", countObj),



});



