const Client = require("azure-iot-device").Client;
const Message = require("azure-iot-device").Message;
const commonService = require('./CommonService.js');

var _clientSend;
var _clientReceive;
var _settingsJson;
var _mainWindow;
let _totalCounter;
let _msgGenCounter;
let _totalSuccessCounter;
let _totalFailureCounter;
let _cancellationRequest = false;
let _subscriptionCancellationRequest = false;

//start simulation based on the settings provided
async function startIoTHubSimulation(settingsJson, mainWindow) {

    _settingsJson = settingsJson;
    _mainWindow = mainWindow;

    //get respective protocol
    printLogMessage("🚀 Starting simulation", "info");
    const Protocol = getProtocol(_settingsJson.protocol);

    //create iot hub device client
    printLogMessage("Trying to create client", "details");
    _clientSend = await connectToIoTHub(_settingsJson.connection.connectionPram1, Protocol);

    //resetting counters and cancellation
    resetCountersAndCancellation();

    //timer trigger
    while (true) {

        //messages array will be used on batched sent
        let messages = [];

        for (let i = 0; i < _settingsJson.batch; i++, _msgGenCounter++) {

            // Create a message and send it to the IoT Hub every two seconds
            const data = commonService.getPreparedMessageAndHeader(_settingsJson, _msgGenCounter);

            //in case of message preparation error
            if (data?.error) {
                _cancellationRequest = true;
                printLogMessage("❌ Error while parsing header : " + data.error, "info");
                break;
            }

            //prepare message
            const message = new Message(data.message);

            //set properties
            if (data.header != null)
                setHeaderPropertiesToMessage(message, data.header);

            //log message 
            printLogMessage("📝 Message prepared", "info");
            if (message?.properties?.propertyList != null)
                printLogMessage("Message header" + "\r\n" + JSON.stringify(message.properties.propertyList, null, 2), "message");
            printLogMessage("Message body" + "\r\n" + message.getData(), "message");

            if (_settingsJson.bulkSend == true)
                //adding messages to array
                messages.push(message);
            else {
                //send event 
                await sendMessage(_clientSend, message);
            }

            //check if total count reached, if its a fixed count simulation
            if ((_settingsJson.count > 0 && _totalCounter >= _settingsJson.count)
                || _cancellationRequest == true) {
                break;
            }
        }


        //send message batch if messages are available
        if (_settingsJson.bulkSend == true && messages.length > 0) {
            //send message as batch
            await sendBatchMessages(_clientSend, messages);
        }
        //check if total count reached, if its a fixed count simulation
        if ((_settingsJson.count > 0 && _totalCounter >= _settingsJson.count)
            || _cancellationRequest == true) {
            break;
        }

        //delay for sometime
        printLogMessage("🕒 Waiting for delay", "info");
        await commonService.delay(_settingsJson.delay * 1000);
        printLogMessage("Delay completed", "details");

        //check if cancellation requested during the delay time
        if (_cancellationRequest == true) {
            break;
        }
    }

    //close client connection
    await closeToIoTHubClient();
    printLogMessage("✅ Simulation completed", "info");

}

//stop iot hub simulation
async function stopIoTHubSimulation(settingsJson, mainWindow) {

    _mainWindow = _mainWindow ?? mainWindow;
    _cancellationRequest = true;
    printLogMessage("🚫 Simulation stop requested", "info");
}


//Connect to IoT Hub using the device connection string and protocol
function connectToIoTHub(deviceConString, protocol) {
    return new Promise((resolve, reject) => {
        //create client
        let client = Client.fromConnectionString(deviceConString, protocol);
        //opens connection
        client.open(err => {
            if (err) {
                printLogMessage("🔴 Client connection failed", "info");
                printLogMessage(err, "details");
                reject(err);
            }
            else {
                printLogMessage("🟢 Client connected", "info");
                resolve(client);
            }

        });
    })
}



//Connect to IoT Hub using the device connection string and protocol
function connectToIoTHubWithSubscription(deviceConString, protocol) {
    return new Promise((resolve, reject) => {
        //create client
        let client = Client.fromConnectionString(deviceConString, protocol);

        //receive event
        client.on("message", receivedMessageHandler);

        //opens connection
        client.open(err => {
            if (err) {
                printLogMessage("🔴 Client connection failed", "info");
                printLogMessage(err, "details");
                reject(err);
            }
            else {
                printLogMessage("🟢 Client connected", "info");
                resolve(client);
            }

        });
    })
}

//send message to IoT Hub
function sendMessage(client, message) {
    return new Promise((resolve, reject) => {
        //prepare message
        //let message = new Message(content);
        //send the message     
        client.sendEvent(message, (err, res) => {
            if (err) {
                printLogMessage("❌ Error while sending message", "info");
                printLogMessage("Error : " + err.toString(), "details")
                updateCounters(false);
                reject(err);
            }
            else {
                printLogMessage("✔️ Telemetry message sent", "info");
                printLogMessage("Message Status : " + res.constructor.name, "details");
                updateCounters(true);
                resolve(res);
            }
        });
    });
}


//send batch message to IoT Hub
function sendBatchMessages(client, messages) {
    return new Promise((resolve, reject) => {
        //send the message     
        client.sendEventBatch(messages, (err, res) => {
            if (err) {
                printLogMessage("❌ Error while sending message", "info");
                printLogMessage("Error : " + err.toString(), "details")
                updateCounters(false, messages.length);
                reject(err);
            }
            else {
                printLogMessage("✔️ Telemetry message batch sent", "info");
                printLogMessage("Batch message Status : " + res.constructor.name, "details");
                updateCounters(true, messages.length);
                resolve(res);
            }
        });
    });
}

//function to set header properties to the message
function setHeaderPropertiesToMessage(message, header) {

    //validate
    if (message == null && header == null)
        return;
    //get akk keys in header object
    var keys = Object.keys(header);
    //lopping through the keys
    for (var i = 0; i < keys.length; i++) {
        //adding message properties 
        message.properties.add(keys[i], header[keys[i]]);
    }

}

//reset counters
function resetCountersAndCancellation() {
    _totalCounter = 0;
    _totalSuccessCounter = 0;
    _totalFailureCounter = 0;
    _msgGenCounter = 0;
    _cancellationRequest = false;
}

//update counters
function updateCounters(success, count = 1) {
    _totalCounter = _totalCounter + count;
    //_statusLog.push({ time: moment(), status: success });

    if (success)
        _totalSuccessCounter = _totalSuccessCounter + count;
    else
        _totalFailureCounter = _totalFailureCounter + count;

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
        _clientSend.close(err => {
            if (err) {
                printLogMessage("🔴 Error while closing connection", "info");
                printLogMessage(err, "details")
                reject(err);
            }
            else {
                printLogMessage("🔴 Connection closed successfully", "info");
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




//start subscription based on the settings provided
async function startIoTHubSubscription(settingsJson, mainWindow) {

    _settingsJson = settingsJson;
    _mainWindow = mainWindow;
    _subscriptionCancellationRequest = false;

    //get respective protocol
    printLogMessage("↘️ Starting subscription", "info");
    const Protocol = getProtocol(_settingsJson.protocol);

    //create iot hub device client
    printLogMessage("Trying to create client", "details");
    _clientReceive = await connectToIoTHubWithSubscription(_settingsJson.connection.connectionPram1, Protocol);

    //promise here
    await waitForStopSignal();

    //close client connection
    await closeToIoTHubClient();
    printLogMessage("✅ Subscription completed", "info");

}


function waitForStopSignal() {
    return new Promise((resolve) => {
        const intervalId = setInterval(() => {
            if (_subscriptionCancellationRequest) {
                clearInterval(intervalId);
                resolve();
            }
        }, 1000);
    });
}

function receivedMessageHandler(msg) {
    printLogMessage("📝 Message received", "info");
    printLogMessage("Message body" + "\r\n" + msg.data, "message");
    console.log(msg);
    client.complete(msg, printResultFor('completed'));
}

//stop iot hub subscription
async function stopIoTHubSubscription(settingsJson, mainWindow) {

    _mainWindow = _mainWindow ?? mainWindow;
    _subscriptionCancellationRequest = true;
    printLogMessage("🚫 Subscription stop requested", "info");
}

//exporting functionalities
exports.startIoTHubSimulation = startIoTHubSimulation;
exports.stopIoTHubSimulation = stopIoTHubSimulation;
exports.startIoTHubSubscription = startIoTHubSubscription;
exports.stopIoTHubSubscription = stopIoTHubSubscription;