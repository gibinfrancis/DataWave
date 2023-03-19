//const AddClass = require("../src/Services/commonService");
//import { AddClass, RemoveClass } from "./Services/commonService";

//variables
var SettingsJson = {
  direction: "sent", //sent/receive
  service: "iothub", //iothub/eventhub/servicebus/mqtt
};

//direction send button
//click event
document.querySelector("#dir_Send_btn").addEventListener("click", () => {
  SettingsJson.direction = "sent";
  RemoveClass("#dir_Receive_btn", "is-link");
  AddClass("#dir_Send_btn", "is-link");
});

//direction receive button
//click event
document.querySelector("#dir_Receive_btn").addEventListener("click", () => {
  SettingsJson.direction = "receive";
  RemoveClass("#dir_Send_btn", "is-link");
  AddClass("#dir_Receive_btn", "is-link");
});

//service iothub button
//click event
document.querySelector("#serv_iothub_btn").addEventListener("click", () => {
  SettingsJson.service = "iothub";
  RemoveClass(".serv_btn", "is-link");
  AddClass("#serv_iothub_btn", "is-link");
});

//service eventhub button
//click event
document.querySelector("#serv_eventhub_btn").addEventListener("click", () => {
  SettingsJson.service = "eventhub";
  RemoveClass(".serv_btn", "is-link");
  AddClass("#serv_eventhub_btn", "is-link");
});

//service servicebus button
//click event
document.querySelector("#serv_servicebus_btn").addEventListener("click", () => {
  SettingsJson.service = "servicebus";
  RemoveClass(".serv_btn", "is-link");
  AddClass("#serv_servicebus_btn", "is-link");
});

//service mqtt button
//click event
document.querySelector("#serv_mqtt_btn").addEventListener("click", () => {
  SettingsJson.service = "mqtt";
  RemoveClass(".serv_btn", "is-link");
  AddClass("#serv_mqtt_btn", "is-link");
});

function replaceMe(template, data) {
  const pattern = /{\s*(\w+?)\s*}/g; // {property}
  return template.replace(pattern, (_, token) => data[token] || "");
}

const html = `
    <div>
      <h4>{title}</h4>
      <p>My name is {name}</p>
      <img src="{url}" />
    </div>
  `;

const data = {
  title: "My Profile",
  name: "John Smith",
  url: "http://images/john.jpeg",
};

replaceMe(html, data);

//common services

function AddClass(item, className) {
  if (item.startsWith("#")) {
    var myElement = document.querySelector(item);
    myElement.classList.add(className);
  } else if (item.startsWith(".")) {
    const elements = document.querySelectorAll(item);
    elements.forEach((element) => {
      element.classList.add(className);
    });
  }
}

//Remove class from element
function RemoveClass(item, className) {
  if (item.startsWith("#")) {
    var myElement = document.querySelector(item);
    myElement.classList.remove(className);
  } else if (item.startsWith(".")) {
    const elements = document.querySelectorAll(item);
    elements.forEach((element) => {
      element.classList.remove(className);
    });
  }
}
