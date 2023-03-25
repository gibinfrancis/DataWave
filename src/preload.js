const { contextBridge, ipcRenderer } = require("electron");


window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ["chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }


  // ipcRenderer.on('data-to-renderer', (event, data) => {
  //   // do something with the data
  //   console.log(data);
  //   // send data back to the main process
  // });
});

//exposing api to renderer pages
contextBridge.exposeInMainWorld("api", {

  //start iot hub simulation
  startIoTHubSimulation: (SettingsJson) => ipcRenderer.invoke("StartSimulation:IoTHub", SettingsJson),

  //stop iot hub simulation
  stopIoTHubSimulation: (SettingsJson) => ipcRenderer.invoke("StopSimulation:IoTHub", SettingsJson),

  //update log
  onLogUpdate: (message, type) => ipcRenderer.on('LogUpdate', message, type),

  //update count
  onCountUpdate: (countObj) => ipcRenderer.on('LogUpdate', countObj),

  //get generated message
  getGeneratedMessage: (SettingsJson) => ipcRenderer.invoke("GenerateMessage", SettingsJson),


});



