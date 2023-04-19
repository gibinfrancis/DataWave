const Client = require("azure-iot-device").Client;
const Message = require("azure-iot-device").Message;
const commonService = require("./CommonService.js");

let _clientSend;
let _clientReceive;

let _settingsJson;
let _mainWindow;

let _totalCounter;
let _totalSuccessCounter;
let _totalFailureCounter;
let _msgGenCounter;

let _cancellationRequestSend = false;
let _cancellationRequestReceive = false;

//start sending based on the settings provided
async function startIoTHubSend(settingsJson, mainWindow) {

    _settingsJson = settingsJson;
    _mainWindow = mainWindow;

    console.log(_settingsJson);

    //get respective protocol
    printLogMessage("🚀 Starting simulation", "info");
    const protocol = getProtocol(_settingsJson.connection.param2);
    printLogMessage("Proceeding with protocol : " + protocol.name, "details");

    //create client
    printLogMessage("Trying to create client", "details");
    _clientSend = Client.fromConnectionString(_settingsJson.connection.param1, protocol);

    //connect to iot hub device client
    printLogMessage("Trying to connect to client", "details");
    await connectToIoTHub(_clientSend);

    //resetting counters and variables
    resetCountersAndVariables();

    //continuous  trigger
    while (true) {

        //messages array will be used on batched sent
        let messages = [];

        //loop for batch of messages
        for (let i = 0; i < _settingsJson.batch; i++, _msgGenCounter++) {

            // Create a message
            const genMessage = commonService.generateMessage(_settingsJson, _msgGenCounter);

            //in case of message preparation error
            if (genMessage?.error) {
                _cancellationRequestSend = true;
                printLogMessage("❌ Error while preparing message : " + genMessage.error, "info");
                break;
            }

            //prepare message
            const message = new Message(genMessage.body);

            //set header
            setPropertiesToObject(message.properties, genMessage.header);

            //set properties
            setPropertiesToObject(message, genMessage.properties);

            //log message 
            printLogMessage("📝 Message prepared", "info");

            //print header
            if (message?.properties?.propertyList != null)
                printLogMessage("Message header" + "\r\n" + JSON.stringify(message.properties.propertyList, null, 2), "message");

            //print properties
            if (message?.properties != null)
                printLogMessage("Message properties" + "\r\n" + JSON.stringify(message.properties, null, 2), "message");

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
                || _cancellationRequestSend == true) {
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
            || _cancellationRequestSend == true) {
            break;
        }

        //delay for sometime
        printLogMessage("🕒 Waiting for delay", "info");
        await commonService.delay(_settingsJson.delay);
        printLogMessage("Delay completed", "details");

        //check if cancellation requested during the delay time
        if (_cancellationRequestSend == true) {
            break;
        }
    }

    //close client connection
    await closeToIoTHubClient(_clientSend);
    printLogMessage("✅ Simulation completed", "info");

}

//stop iot hub message send
async function stopIoTHubSend(settingsJson, mainWindow) {

    _mainWindow = _mainWindow ?? mainWindow;
    _cancellationRequestSend = true;
    printLogMessage("🚫 Simulation stop requested", "info");
}


//Connect to IoT Hub using the device connection string and protocol
function connectToIoTHub(client) {
    return new Promise((resolve, reject) => {
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

//function to set properties to the respective object
function setPropertiesToObject(destObject, properties) {

    //validate
    if (destObject == null || properties == null)
        return;
    //get all keys in properties object
    var keys = Object.keys(properties);
    //lopping through the keys
    for (var i = 0; i < keys.length; i++) {
        //adding message properties 
        destObject.add(keys[i], properties[keys[i]]);
    }

}

//reset counters
function resetCountersAndVariables() {
    _totalCounter = 0;
    _totalSuccessCounter = 0;
    _totalFailureCounter = 0;
    _msgGenCounter = 0;
    _cancellationRequestSend = false;
    _cancellationRequestReceive = false;
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
function closeToIoTHubClient(client) {
    return new Promise((resolve, reject) => {
        //close the connection
        client.close(err => {
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
    protocol = protocol?.toLowerCase().trim()
    if (protocol == "mqttws")
        return require("azure-iot-device-mqtt").MqttWs;
    else if (protocol == "mqtt")
        return require("azure-iot-device-mqtt").Mqtt;
    else if (protocol == "amqpws")
        return require("azure-iot-device-amqp").AmqpWs;
    else if (protocol == "amqp")
        return require("azure-iot-device-amqp").Amqp;
    else
        return require("azure-iot-device-http").Http;

}

//prints log message on both consoles
function printLogMessage(message, type) {
    _mainWindow.webContents.send("LogUpdate", message, type);
    console.log(message);
}




//start subscription based on the settings provided
async function startIoTHubReceive(settingsJson, mainWindow) {

    _settingsJson = settingsJson;
    _mainWindow = mainWindow;

    //resetting counters and variables
    resetCountersAndVariables();

    //get respective protocol
    printLogMessage("↘️ Starting subscription", "info");
    const protocol = getProtocol(_settingsJson.connection.param2);

    //create client
    printLogMessage("Trying to create client", "details");
    _clientReceive = Client.fromConnectionString(_settingsJson.connection.param1, protocol);

    //receive event
    _clientReceive.on("message", receivedMessageHandler);

    //connect to iot hub device client
    printLogMessage("Trying to connect to client", "details");
    await connectToIoTHub(_clientReceive);

    //wait for stop signal
    await waitForStopSignal();

    //close client connection
    await closeToIoTHubClient(_clientReceive);
    printLogMessage("✅ Subscription completed", "info");

}

//waiting for a stop signal for a period of time
function waitForStopSignal() {
    return new Promise((resolve) => {
        const intervalId = setInterval(() => {
            if (_cancellationRequestReceive) {
                clearInterval(intervalId);
                resolve();
            }
        }, 1000);
    });
}

//receive message handler
function receivedMessageHandler(message) {
    printLogMessage("📝 Message received", "info");

    //print header
    if (message?.properties?.propertyList != null)
        printLogMessage("Message header" + "\r\n" + JSON.stringify(message.properties.propertyList, null, 2), "message");

    //print properties
    if (message?.properties != null)
        printLogMessage("Message properties" + "\r\n" + JSON.stringify(message.properties, null, 2), "message");

    //print message
    printLogMessage("Message body" + "\r\n" + message.data, "message");

    _clientReceive.complete(message);
}

//stop iot hub receive
async function stopIoTHubReceive(settingsJson, mainWindow) {

    _mainWindow = _mainWindow ?? mainWindow;
    _cancellationRequestReceive = true;
    printLogMessage("🚫 Subscription stop requested", "info");
}

//exporting functionalities
exports.startIoTHubSend = startIoTHubSend;
exports.stopIoTHubSend = stopIoTHubSend;
exports.startIoTHubReceive = startIoTHubReceive;
exports.stopIoTHubReceive = stopIoTHubReceive;