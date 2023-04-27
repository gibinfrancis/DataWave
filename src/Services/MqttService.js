const mqtt = require("async-mqtt");
const commonService = require("./CommonService.js");

let _clientSend;
let _clientReceive;

let _msgSubscription;

let _settings;
let _mainWindow;

let _totalCounter;
let _totalSuccessCounter;
let _totalFailureCounter;
let _msgGenCounter;

let _cancellationRequestSend = false;
let _cancellationRequestReceive = false;

//start simulation based on the settings provided
async function startMqttSend(settings, mainWindow) {

  _settings = settings;
  _mainWindow = mainWindow;

  //resetting counters and cancellation
  resetCountersAndVariables();

  //get respective protocol
  printLogMessage("🚀 Starting simulation", "info");

  //create mqtt device client
  printLogMessage("Trying to create client", "details");
  _clientSend = await createMqttClient(_settings.connection);
  printLogMessage("Created client", "details");

  if (_settings.bulkSend == true)
    printLogMessage("bulk send option not available", "info");

  //timer trigger
  while (true) {

    //messages array will be used on batched sent
    let messages = [];

    for (let i = 0; i < _settings.batch; i++, _msgGenCounter++) {

      // Create a message
      const genMessage = commonService.generateMessage(_settings, _msgGenCounter);

      //in case of message preparation error
      if (genMessage?.error) {
        _cancellationRequestSend = true;
        printLogMessage("❌ Error while preparing message : " + genMessage.error, "info");
        break;
      }

      //prepare message
      const message = { body: genMessage.body };

      //set header
      setPropertiesToObject(message.properties, genMessage.header);

      //set properties
      setPropertiesToObject(message, genMessage.properties);

      //log message 
      printLogMessage("📝 Message prepared", "info");

      //print message contents
      printMessageContents(message);

      //send event 
      await sendMessage(_clientSend, _settings.connection.param4, message);

      //check if total count reached, if its a fixed count simulation
      if ((_settings.count > 0 && _totalCounter >= _settings.count)
        || _cancellationRequestSend == true) {
        break;
      }
    }

    //send message batch if messages are available
    if (_settings.bulkSend == true && messages.length > 0) {
      //send message as batch will not work for mqtt
      //await sendBatchMessages(_sbSender, _msgBatch, messages);
    }
    //check if total count reached, if its a fixed count simulation
    if ((_settings.count > 0 && _totalCounter >= _settings.count)
      || _cancellationRequestSend == true) {
      break;
    }

    //delay for sometime
    printLogMessage("🕒 Waiting for delay", "info");
    await commonService.delay(_settings.delay);
    printLogMessage("Delay completed", "details");

    //check if cancellation requested during the delay time
    if (_cancellationRequestSend == true) {
      break;
    }
  }

  //close client connection
  await closeMqttClient(_clientSend);
  printLogMessage("✅ Simulation completed", "info");

}

//stop mqtt simulation
async function stopMqttSend(settings, mainWindow) {
  _mainWindow = _mainWindow ?? mainWindow;
  _cancellationRequestSend = true;
  printLogMessage("🚫 Simulation stop requested", "info");
}

//start subscription based on the settings provided
async function startMqttReceive(settings, mainWindow) {

  _settings = settings;
  _mainWindow = mainWindow;

  //resetting counters
  resetCountersAndVariables();

  //get respective protocol
  printLogMessage("↘️ Starting subscription", "info");

  //create mqtt device client
  printLogMessage("Trying to create client", "details");
  _clientSend = await createMqttClient(_settings.connection);

  //subscribing messages
  await subscribeMqttMessages(_sbReceiver);

  //waiting for stop signal
  await waitForStopSignal();

  //close client connection
  await closeMqttClient(_clientReceive);
  printLogMessage("✅ Subscription completed", "info");

}

//stop mqtt subscription
async function stopMqttReceive(settings, mainWindow) {

  _mainWindow = _mainWindow ?? mainWindow;
  _msgSubscription.close();
  _cancellationRequestReceive = true;
  printLogMessage("🚫 Subscription stop requested", "info");

}


//print message content
function printMessageContents(message) {
  //print message
  printLogMessage("Message body" + "\r\n" + JSON.stringify(message, null, 2), "message");
}


//Connect to mqtt using the device connection string and protocol
function createMqttClient(connection) {
  return new Promise((resolve, reject) => {
    // create a mqtt client using the connection string to the mqtt namespace
    let mqttOptions;
    if (connection.param2 != null && connection.param3 != null)
      mqttOptions = {
        username: connection.param2,
        password: connection.param3
      }
    const client = mqtt.connectAsync(connection.param1, mqttOptions);
    resolve(client);
  })
}


// //Connect to mqtt using the device connection string and protocol
// function createMqttClient(client) {
//   return new Promise((resolve, reject) => {
//     // create a mqtt client using the connection string to the mqtt namespace
//     const client = mqtt.connect(connection.param1, mqttOptions);
//     resolve(client);
//   })
// }

// //Connect to mqtt using the device connection string and protocol
// function createMqttSender(client, topicName) {
//   return new Promise((resolve, reject) => {
//     // create Sender used to create a sender for a queue.
//     const sender = client.createSender(topicName);
//     resolve(sender);
//   })
// }


// //Connect to mqtt using the device connection string and protocol
// function createMqttReceiver(client, topicName, subscriptionName) {
//   return new Promise((resolve, reject) => {
//     // create receiver used to create a sender for a queue.
//     let receiver;
//     if (subscriptionName != null)
//       receiver = client.createReceiver(topicName, subscriptionName);
//     else
//       receiver = client.createReceiver(topicName);

//     resolve(receiver);
//   })
// }

//Connect to mqtt and subscribe messages
async function subscribeMqttMessages(client, topicName) {
  //receive event
  client.on("message", function (topic, message) {
    printLogMessage("📝 Message received", "info");
    printMessageContents(message);
    //update counters
    updateCounters(true);
  });

  client.subscribe(topicName, function (err) {
    if (err) {
      printLogMessage("🔴 Client connection failed", "info");
      printLogMessage(err, "details");
    }
  });

}


//send message to mqtt
async function sendMessage(client, topic, message) {
  return new Promise((resolve, reject) => {
    //send the message     
    client.publish(topic, message).then((res) => {
      printLogMessage("✔️ Telemetry message sent", "info");
      printLogMessage("Message Status : sent", "details");
      updateCounters(true);
      resolve(res);
    }).catch((err) => {
      printLogMessage("❌ Error while sending message", "info");
      printLogMessage("Error : " + err.toString(), "details");
      updateCounters(false);
      reject(err);
    });
  });
}

// //this will not be used as bulk send is not available
// //send batch message to mqtt
// function sendBatchMessages(client, batch, messages) {
//   return new Promise((resolve, reject) => {

//     messages.forEach(message => {
//       batch.tryAddMessage(message);
//     });

//     //send the message     
//     client.sendMessages(batch).then((res) => {
//       printLogMessage("✔️ Telemetry message sent", "info");
//       printLogMessage("Message Status : sent", "details");
//       updateCounters(true, messages.length);
//       resolve(res);
//     }).catch((err) => {
//       printLogMessage("❌ Error while sending message", "info");
//       printLogMessage("Error : " + err.toString(), "details");
//       updateCounters(false, messages.length);
//       reject(err);
//     });
//   });
// }

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
    destObject[keys[i]] = properties[keys[i]];
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
  _mainWindow.webContents.send("update:counter", counterObj);

}

//Close connection to mqtt
function closeMqttClient(client) {
  return new Promise((resolve, reject) => {
    client.end().then((res) => {
      printLogMessage("🔴 Connection closed successfully", "info");
      resolve(true);
    }).catch((err) => {
      printLogMessage("🔴 Error while closing connection", "info");
      printLogMessage(err, "details")
      reject(err);
    });
  })
}

//prints log message on both consoles
function printLogMessage(message, type) {
  _mainWindow.webContents.send("update:log", message, type);
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


//exporting functionalities
exports.startMqttSend = startMqttSend;
exports.stopMqttSend = stopMqttSend;
exports.startMqttReceive = startMqttReceive;
exports.stopMqttReceive = stopMqttReceive;







// const mqtt = require("mqtt");
// const client = mqtt.connect("mqtt://test.mosquitto.org" , ;

// client.on("connect", function () {
//   client.subscribe("presence", function (err) {
//     if (!err) {
//       client.publish("presence", "Hello mqtt");
//     }
//   });
// });

// client.on("message", function (topic, message) {
//   // message is Buffer
//   console.log(message.toString());
//   client.end();
// });
