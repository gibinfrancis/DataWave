const Client = require("azure-iot-device").Client;
const Message = require("azure-iot-device").Message;
const getPreparedMessage = require('./CommonService.js');
var _client;
var _settingsJson;
var _mainWindow;
let _totalCounter;
let _totalSuccessCounter;
let _totalFailureCounter;
//let _statusLog = []
let _cancellationRequest = false;

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

    //resetting counters
    resetCounters();

    //timer trigger
    while (true) {

        for (let i = 0; i < _settingsJson.batch; i++) {

            // Create a message and send it to the IoT Hub every two seconds
            const data = getPreparedMessage(_settingsJson, _totalCounter);

            //prepare message
            const message = new Message(data)

            //set properties
            //message.properties.add("temperatureAlert", temperature > 28 ? "true" : "false");

            //send event 
            printLogMessage(message.getData(), "message");
            await sendMessage(_client, message.getData());
            console.log(_totalCounter);
            if (_cancellationRequest == true)
                break;
        }

        //check if total count reached, if its a fixed count simulation
        if ((_settingsJson.count > 0 && _totalCounter >= _settingsJson.count)
            || _cancellationRequest == true) {
            clearTimer();
            break;
        }

        //delay     
        await delay(_settingsJson.delay * 1000);
    }

    //close client connection
    await closeToIoTHubClient();
    printLogMessage("Simulation completed", "message");

}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//stop iot hub simulation
async function stopIoTHubSimulation(SettingsJson, MainWindow) {

    _mainWindow = _mainWindow ?? MainWindow;
    clearTimer();
    printLogMessage("Simulation stop requested", "message");
}

//clear timer
function clearTimer() {
    _cancellationRequest = true;
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
                printLogMessage(err, "details");
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
                updateCounters(false);
                reject(err);
            }
            else {
                printLogMessage("Telemetry message sent", "info");
                printLogMessage("Message Status" + res, "details");
                updateCounters(true);
                resolve(res);
            }
        });
    });
}

//reset counters
function resetCounters() {
    _totalCounter = 0;
    _totalSuccessCounter = 0;
    _totalFailureCounter = 0;
    _cancellationRequest = false;
}

//update counters
function updateCounters(success) {
    _totalCounter++;
    //_statusLog.push({ time: moment(), status: success });

    if (success)
        _totalSuccessCounter++;
    else
        _totalFailureCounter++;

    let counterObj = {
        success: _totalSuccessCounter,
        failure: _totalFailureCounter,
        total: _totalCounter
    };
    _mainWindow.webContents.send("CountUpdate", counterObj);

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

exports.startIoTHubSimulation = startIoTHubSimulation;
exports.stopIoTHubSimulation = stopIoTHubSimulation;