const { ServiceBusClient } = require("@azure/service-bus");
const commonService = require("./CommonService.js");

let _clientSend;
let _clientReceive;
let _sbSender;

let _msgSubscription;
let _msgBatch;

let _settingsJson;
let _mainWindow;

let _totalCounter;
let _totalSuccessCounter;
let _totalFailureCounter;
let _msgGenCounter;

let _cancellationRequestSend = false;
let _cancellationRequestReceive = false;

//start simulation based on the settings provided
async function startServiceBusSend(settingsJson, mainWindow) {

  _settingsJson = settingsJson;
  _mainWindow = mainWindow;

  //resetting counters and cancellation
  resetCountersAndCancellation();

  //get respective protocol
  printLogMessage("🚀 Starting simulation", "info");

  //create Service Bus device client
  printLogMessage("Trying to create client", "details");
  _clientSend = await createServiceBusClient(_settingsJson.connection.param1);

  //create service bus sender
  _sbSender = await createServiceBusSender(_clientSend, _settingsJson.connection.param2);

  //timer trigger
  while (true) {

    //messages array will be used on batched sent
    let messages = [];

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
      const message = { body: genMessage.body };

      //set header
      setPropertiesToObject(message.properties, genMessage.header);

      //set properties
      setPropertiesToObject(message, genMessage.properties);

      //log message 
      printLogMessage("📝 Message prepared", "info");

      //print message contents
      printMessageContents(message);

      if (_settingsJson.bulkSend == true)
        //adding messages to array
        messages.push(message);
      else {
        //crete Service Bus message batch
        _msgBatch = await _sbSender.createMessageBatch();
        //send event 
        await sendMessage(_sbSender, _msgBatch, message);
      }

      //check if total count reached, if its a fixed count simulation
      if ((_settingsJson.count > 0 && _totalCounter >= _settingsJson.count)
        || _cancellationRequestSend == true) {
        break;
      }
    }

    //send message batch if messages are available
    if (_settingsJson.bulkSend == true && messages.length > 0) {
      //crete Service Bus message batch
      _msgBatch = await _sbSender.createMessageBatch();
      //send message as batch
      await sendBatchMessages(_sbSender, _msgBatch, messages);
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

  //close service bus sender
  await closeServiceBusClient(_sbSender);
  //close client connection
  await closeServiceBusClient(_clientSend);
  printLogMessage("✅ Simulation completed", "info");

}

//stop Service Bus simulation
async function stopServiceBusSend(settingsJson, mainWindow) {
  _mainWindow = _mainWindow ?? mainWindow;
  _cancellationRequestSend = true;
  printLogMessage("🚫 Simulation stop requested", "info");
}

//print message content
function printMessageContents(message) {
  //print header
  if (message?.properties?.propertyList != null)
    printLogMessage("Message header" + "\r\n" + JSON.stringify(message.properties.propertyList, null, 2), "message");

  //print properties
  if (message?.properties != null)
    printLogMessage("Message properties" + "\r\n" + JSON.stringify(message.properties, null, 2), "message");

  //print message
  printLogMessage("Message body" + "\r\n" + message.body, "message");
}


//Connect to Service Bus using the device connection string and protocol
function createServiceBusClient(serviceBusConString) {
  return new Promise((resolve, reject) => {
    // create a Service Bus client using the connection string to the Service Bus namespace
    const sbClient = new ServiceBusClient(serviceBusConString);
    resolve(sbClient);
  })
}

//Connect to Service Bus using the device connection string and protocol
function createServiceBusSender(client, topicName) {
  return new Promise((resolve, reject) => {
    // create Sender used to create a sender for a queue.
    const sender = client.createSender(topicName);
    resolve(sender);
  })
}


//Connect to Service Bus using the device connection string and protocol
function createServiceBusReceiver(client, topicName, subscriptionName) {
  return new Promise((resolve, reject) => {
    // create receiver used to create a sender for a queue.
    let receiver;
    if (subscriptionName != null)
      receiver = client.createReceiver(topicName, subscriptionName);
    else
      receiver = client.createReceiver(topicName);

    resolve(receiver);
  })
}

//Connect to Service Bus and subscribe messages
async function subscribeServiceBusMessages(client) {

  //receive event
  _msgSubscription = client.subscribe(
    {
      processMessage: async (event) => {
        printLogMessage("📝 Message received", "info");
        printMessageContents(event);
        //update counters
        updateCounters(true);

      },
      processError: async (err) => {
        printLogMessage("🔴 Client connection failed", "info");
        printLogMessage(err, "details");
      },
    }
  );
}


//send message to Service Bus
async function sendMessage(client, batch, message) {
  return new Promise((resolve, reject) => {
    //prepare message
    batch.tryAddMessage(message);
    //send the message     
    client.sendMessages(batch).then((res) => {
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


//send batch message to Service Bus
function sendBatchMessages(client, batch, messages) {
  return new Promise((resolve, reject) => {

    messages.forEach(message => {
      batch.tryAddMessage(message);
    });

    //send the message     
    client.sendMessages(batch).then((res) => {
      printLogMessage("✔️ Telemetry message sent", "info");
      printLogMessage("Message Status : sent", "details");
      updateCounters(true, messages.length);
      resolve(res);
    }).catch((err) => {
      printLogMessage("❌ Error while sending message", "info");
      printLogMessage("Error : " + err.toString(), "details");
      updateCounters(false, messages.length);
      reject(err);
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
function resetCountersAndCancellation() {
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

//Close connection to Service Bus
function closeServiceBusClient(client) {
  return new Promise((resolve, reject) => {
    client.close().then((res) => {
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
  _mainWindow.webContents.send("LogUpdate", message, type);
  console.log(message);
}



//start subscription based on the settings provided
async function startServiceBusReceive(settingsJson, mainWindow) {

  _settingsJson = settingsJson;
  _mainWindow = mainWindow;

  //resetting counters
  resetCountersAndCancellation();

  //get respective protocol
  printLogMessage("↘️ Starting subscription", "info");

  //create Service Bus device client
  printLogMessage("Trying to create client", "details");
  _clientReceive = await createServiceBusClient(_settingsJson.connection.param1);

  //create service bus receiver
  _sbReceiver = await createServiceBusReceiver(_clientReceive, _settingsJson.connection.param2, _settingsJson.connection.param3);

  //subscribing messages
  await subscribeServiceBusMessages(_sbReceiver);

  //waiting for stop signal
  await waitForStopSignal();

  //close client connection
  await closeServiceBusClient(_sbReceiver);
  await closeServiceBusClient(_clientReceive);
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

//stop Service Bus subscription
async function stopServiceBusReceive(settingsJson, mainWindow) {

  _mainWindow = _mainWindow ?? mainWindow;
  _msgSubscription.close();
  _cancellationRequestReceive = true;
  printLogMessage("🚫 Subscription stop requested", "info");

}



//exporting functionalities
exports.startServiceBusSend = startServiceBusSend;
exports.stopServiceBusSend = stopServiceBusSend;
exports.startServiceBusReceive = startServiceBusReceive;
exports.stopServiceBusReceive = stopServiceBusReceive;