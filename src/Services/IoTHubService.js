//const { ipcMain } = require("electron");
const Client = require("azure-iot-device").Client;
const Message = require("azure-iot-device").Message;
const { getPreparedMessage } = require('./commonService.js');
var _client;
var _settingsJson;
var _mainWindow;
//var _ipcRenderer;

//start simulation based on the settings provided
async function startIoTHubSimulation(SettingsJson, MainWindow) {

    _settingsJson = SettingsJson;
    _mainWindow = MainWindow;

    //get respective protocol
    printLogMessage("Starting simulation", "details");
    const Protocol = getProtocol(_settingsJson.protocol);

    //create iot hub device client
    printLogMessage("Trying to create client", "details");
    _client = await connectToIoTHub(_settingsJson.connection.connectionPram1, Protocol);

    // Create a message and send it to the IoT Hub every two seconds
    const data = getPreparedMessage(_settingsJson);

    //prepare message
    const message = new Message(data)

    //set properties
    //message.properties.add("temperatureAlert", temperature > 28 ? "true" : "false");

    //send event 
    printLogMessage(message.getData(), "message");
    await sendMessage(_client, message.getData());

    //close client connection
    await closeToIoTHubClient();
    printLogMessage("Simulation completed", "message");

}


//Connect to IoT Hub using the device connection string and protocol
function connectToIoTHub(deviceConString, protocol) {
    return new Promise((resolve, reject) => {
        //create client
        let client = Client.fromConnectionString(deviceConString, protocol);
        //opens connection
        client.open(err => {
            if (err) {
                printLogMessage("Client connection failed", "info");
                printLogMessage(err, "details")
                reject(err);
            }
            else {
                printLogMessage("Client connected", "info");
                resolve(client);
            }

        });
    })
}

//send message to IoT Hub
function sendMessage(client, content) {
    return new Promise((resolve, reject) => {
        //prepare message
        let message = new Message(content);
        //send the message
        client.sendEvent(message, (err, res) => {
            if (err) {
                printLogMessage("Error while sending message", "info");
                printLogMessage(err, "details")
                reject(err);
            }
            else {
                printLogMessage("Telemetry message sent", "info");
                printLogMessage("Message Status" + res, "details");
                resolve(res);
            }
        });
    });
}



//Close connection to IoT Hub
function closeToIoTHubClient() {
    return new Promise((resolve, reject) => {
        //close the connection
        _client.close(err => {
            if (err) {
                printLogMessage("Error while closing connection", "info");
                printLogMessage(err, "details")
                reject(err);
            }
            else {
                printLogMessage("Connection closed successfully", "info");
                resolve(true);
            }

        });
    })
}

//get the respective protocol object
function getProtocol(protocol) {
    if (protocol == "mqttws")
        return require("azure-iot-device-mqtt").MqttWs;
    else if (protocol == "http")
        return require("azure-iot-device-http").Http;
    else
        return require("azure-iot-device-mqtt").Mqtt;

}

//prints log message on both consoles
function printLogMessage(message, type) {
    _mainWindow.webContents.send("LogUpdate", message, type);
    console.log(message);
}

module.exports = startIoTHubSimulation;