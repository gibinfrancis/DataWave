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

  //get generated message
  getGeneratedMessage: (settingsJson) => ipcRenderer.invoke("GenerateMessage", settingsJson),

  //update log
  onLogUpdate: (message, type) => ipcRenderer.on("LogUpdate", message, type),

  //update count
  onCountUpdate: (countObj) => ipcRenderer.on("CountUpdate", countObj),



});



