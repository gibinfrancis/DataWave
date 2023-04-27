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



//exposing api to pages
//this used as the bridge between main and the pages
contextBridge.exposeInMainWorld("api", {

  //--------------------------------------------------------------------------------------------------------
  //---------------------------------------SERVICES---------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------

  //start publisher
  startPublisher: (settings) => ipcRenderer.invoke("start:publisher:" + settings.service, settings),

  //stop publisher
  stopPublisher: (settings) => ipcRenderer.invoke("stop:publisher:" + settings.service, settings),

  //start subscriber
  startSubscriber: (settings) => ipcRenderer.invoke("start:subscriber:" + settings.service, settings),

  //stop subscriber
  stopSubscriber: (settings) => ipcRenderer.invoke("stop:subscriber:" + settings.service, settings),

  //get generated message
  getGeneratedMessage: (settings) => ipcRenderer.invoke("generate:message", settings),

  //relaunch the application window
  relaunch: () => ipcRenderer.invoke("relaunch:window"),

  //save settings json file 
  saveSettingsToFile: (settings) => ipcRenderer.invoke("save:settings", settings),

  //load settings from json file
  loadSettingsFromFile: () => ipcRenderer.invoke("load:settings"),

  //--------------------------------------------------------------------------------------------------------
  //---------------------------------------TRIGGERS---------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------

  //update log
  onLogUpdate: (message, type) => ipcRenderer.on("update:log", message, type),

  //update count
  onCounterUpdate: (counts) => ipcRenderer.on("update:counter", counts),

});



