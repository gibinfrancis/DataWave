const { EventHubProducerClient } = require("@azure/event-hubs");
const { EventHubConsumerClient, earliestEventPosition } = require("@azure/event-hubs");
const { ContainerClient } = require("@azure/storage-blob");
const { BlobCheckpointStore } = require("@azure/eventhubs-checkpointstore-blob");
const commonService = require("./CommonService.js");

let _clientSend;
let _clientReceive;

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
async function startEventHubSend(settingsJson, mainWindow) {

  _settingsJson = settingsJson;
  _mainWindow = mainWindow;

  //get respective protocol
  printLogMessage("🚀 Starting simulation", "info");

  //create Event hub device client
  printLogMessage("Trying to create client", "details");
  _clientSend = await createEventHubClient(_settingsJson.connection.param1);

  //resetting counters and cancellation
  resetCountersAndCancellation();

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
        //crete event hub message batch
        _msgBatch = await _clientSend.createBatch();
        //send event 
        await sendMessage(_clientSend, _msgBatch, message);
        _msgBatch
      }

      //check if total count reached, if its a fixed count simulation
      if ((_settingsJson.count > 0 && _totalCounter >= _settingsJson.count)
        || _cancellationRequestSend == true) {
        break;
      }
    }

    //send message batch if messages are available
    if (_settingsJson.bulkSend == true && messages.length > 0) {
      //crete event hub message batch
      _msgBatch = await _clientSend.createBatch();
      //send message as batch
      await sendBatchMessages(_clientSend, _msgBatch, messages);
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
  await closeToEventHubClient(_clientSend);
  printLogMessage("✅ Simulation completed", "info");

}

//stop Event hub simulation
async function stopEventHubSend(settingsJson, mainWindow) {
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

//Connect to Event Hub using the device connection string and protocol
function createEventHubClient(eventHubConString) {
  return new Promise((resolve, reject) => {
    //create client
    let client = new EventHubProducerClient(eventHubConString);
    resolve(client);
  })
}



//Connect to Event Hub using the device connection string and protocol
async function connectToEventHubToReceive(settingsJson) {

  // //Create a blob container client and a blob checkpoint store using the client.
  // const containerClient = new ContainerClient(
  //   settingsJson.connection.param3,
  //   settingsJson.connection.param4,
  // );

  // if (!(await containerClient.exists())) {
  //   await containerClient.create(); // This can be skipped if the container already exists
  //   printLogMessage("created container", "info");
  // }

  // const checkpointStore = new BlobCheckpointStore(containerClient);

  //create client
  let nameSpaceConnection = settingsJson.connection.param1.split(";EntityPath=")[0];
  let eventHubName = settingsJson.connection.param1.split(";EntityPath=")[1];
  let client = new EventHubConsumerClient(settingsJson.connection.param2,
    settingsJson.connection.param1);
  //const partitionIds = await client.getPartitionIds();
  //receive event
  //_msgSubscription = client.subscribe(new SubscriptionHandlers());
  _msgSubscription = client.subscribe(
    //partitionIds[0],
    {
      processEvents: async (events, context) => {


        if (events?.length == 0) {
          return;
        }

        for (const event of events) {
          printLogMessage("📝 Message received", "info");
          printMessageContents(event);
          //update counters
          updateCounters(true);
          await context.updateCheckpoint(event);
          //let res = await updateMessageCounters(event, context);
          printLogMessage("check point update", "info");

        }


      },
      processError: async (err, context) => {
        printLogMessage("🔴 Client connection failed", "info");
        printLogMessage(err, "details");
      },
    },
    { startPosition: earliestEventPosition }

  );

  return client;

}


//send message to Event Hub
async function sendMessage(client, batch, message) {
  return new Promise((resolve, reject) => {
    //prepare message
    batch.tryAdd(message);
    //send the message     
    client.sendBatch(batch).then((res) => {
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



//send message to Event Hub
async function updateMessageCounters(event, context) {
  return new Promise((resolve, reject) => {
    context.updateCheckpoint(event, event.sequenceNumber).then((res) => {
      printLogMessage("Telemetry checkpoint update", "info");
      resolve(true);
    }).catch((err) => {
      printLogMessage("❌ Error while sending message", "info");
      printLogMessage("Error : " + err.toString(), "details");
      reject(false);
    });
  });
}




//send batch message to Event Hub
function sendBatchMessages(client, batch, messages) {
  return new Promise((resolve, reject) => {

    messages.forEach(message => {
      batch.tryAdd(message);
    });

    //send the message     
    client.sendBatch(batch).then((res) => {
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

//Close connection to Event Hub
function closeToEventHubClient(client) {
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
async function startEventHubReceive(settingsJson, mainWindow) {

  _settingsJson = settingsJson;
  _mainWindow = mainWindow;

  //resetting counters
  resetCountersAndCancellation();

  //get respective protocol
  printLogMessage("↘️ Starting subscription", "info");

  //create Event hub device client
  printLogMessage("Trying to create client", "details");
  _clientReceive = await connectToEventHubToReceive(_settingsJson);

  //waiting for stop signal
  await waitForStopSignal();

  //close client connection
  await closeToEventHubClient(_clientReceive);
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
async function receivedMessageHandler(events, context) {

  if (events.length === 0) {
    return;
  }

  for (const event of events) {
    printLogMessage("📝 Message received", "info");
    printMessageContents(event);
    //update counters
    updateCounters(true);

  }

  // Update the checkpoint.
  //await context.updateCheckpoint(events[events.length - 1]);
}

//stop Event hub subscription
async function stopEventHubReceive(settingsJson, mainWindow) {

  _mainWindow = _mainWindow ?? mainWindow;
  _msgSubscription.close();
  _cancellationRequestReceive = true;
  printLogMessage("🚫 Subscription stop requested", "info");
}



//exporting functionalities
exports.startEventHubSend = startEventHubSend;
exports.stopEventHubSend = stopEventHubSend;
exports.startEventHubReceive = startEventHubReceive;
exports.stopEventHubReceive = stopEventHubReceive;