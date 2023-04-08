const { EventHubProducerClient } = require("@azure/event-hubs");
const { EventHubConsumerClient, earliestEventPosition } = require("@azure/event-hubs");
const { ContainerClient } = require("@azure/storage-blob");
const { BlobCheckpointStore } = require("@azure/eventhubs-checkpointstore-blob");
const commonService = require("./CommonService.js");

var _clientSend;
var _clientReceive;
var _messageSubscription;
var _msgBatch;

var _settingsJson;
var _mainWindow;
let _totalCounter;
let _msgGenCounter;
let _totalSuccessCounter;
let _totalFailureCounter;
let _cancellationRequest = false;
let _subscriptionCancellationRequest = false;

//start simulation based on the settings provided
async function startEventHubSimulation(settingsJson, mainWindow) {

  _settingsJson = settingsJson;
  _mainWindow = mainWindow;

  //get respective protocol
  printLogMessage("🚀 Starting simulation", "info");

  //create Event hub device client
  printLogMessage("Trying to create client", "details");
  _clientSend = await createEventHubClient(_settingsJson.connection.connectionPram1);

  //crete event hub message batch
  _msgBatch = await _clientSend.createBatch(); // createEventHubBatch(_clientSend);

  //resetting counters and cancellation
  resetCountersAndCancellation();

  //timer trigger
  while (true) {

    //messages array will be used on batched sent
    let messages = [];

    for (let i = 0; i < _settingsJson.batch; i++, _msgGenCounter++) {

      // Create a message and send it to the Event Hub every two seconds
      const data = commonService.getPreparedMessageAndHeader(_settingsJson, _msgGenCounter);

      //in case of message preparation error
      if (data?.error) {
        _cancellationRequest = true;
        printLogMessage("❌ Error while parsing header : " + data.error, "info");
        break;
      }

      //prepare message
      const message = { body: data.message };

      //set properties
      // if (data.header != null)
      //   setHeaderPropertiesToMessage(message, data.header);

      //log message 
      printLogMessage("📝 Message prepared", "info");
      // if (message?.properties?.propertyList != null)
      //   printLogMessage("Message header" + "\r\n" + JSON.stringify(message.properties.propertyList, null, 2), "message");
      printLogMessage("Message body" + "\r\n" + message.body, "message");

      if (_settingsJson.bulkSend == true)
        //adding messages to array
        messages.push(message);
      else {
        //send event 
        await sendMessage(_clientSend, _msgBatch, message);
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
      await sendBatchMessages(_clientSend, _msgBatch, messages);
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
  await closeToEventHubClient(_clientSend);
  printLogMessage("✅ Simulation completed", "info");

}

//stop Event hub simulation
async function stopEventHubSimulation(settingsJson, mainWindow) {
  _mainWindow = _mainWindow ?? mainWindow;
  _cancellationRequest = true;
  printLogMessage("🚫 Simulation stop requested", "info");
}


//Connect to Event Hub using the device connection string and protocol
function createEventHubClient(eventhubConString) {
  return new Promise((resolve, reject) => {
    //create client
    let client = new EventHubProducerClient(eventhubConString);
    resolve(client);
  })
}


//Connect to Event Hub using the device connection string and protocol
function createEventHubBatch(client) {
  return new Promise((resolve, reject) => {
    //creates batch
    client.createBatch(err => {
      if (err) {
        printLogMessage("🔴 Client connection failed", "info");
        printLogMessage(err, "details");
        reject(err);
      }
      else {
        printLogMessage("🟢 Client connected", "info");
        resolve(batch);
      }
    });
  })
}




//Connect to Event Hub using the device connection string and protocol
function connectToEventHubWithSubscription(settingsJson) {
  return new Promise((resolve, reject) => {

    // Create a blob container client and a blob checkpoint store using the client.
    const containerClient = new ContainerClient(
      settingsJson.connection.connectionPram4,
      settingsJson.connection.connectionPram5,
    );
    const checkpointStore = new BlobCheckpointStore(containerClient);

    //create client
    let client = new EventHubConsumerClient(settingsJson.connection.connectionPram3,
      settingsJson.connection.connectionPram1,
      settingsJson.connection.connectionPram2, checkpointStore);;

    //receive event
    _messageSubscription = client.subscribe(
      {
        processEvents: async (events, context) => receivedMessageHandler(events, context),
        processError: async (err, context) => {
          printLogMessage("🔴 Client connection failed", "info");
          printLogMessage(err, "details");
        },
      },
      { startPosition: earliestEventPosition }
    );

    // //opens connection
    // client.open(err => {
    //   if (err) {
    //     printLogMessage("🔴 Client connection failed", "info");
    //     printLogMessage(err, "details");
    //     reject(err);
    //   }
    //   else {
    //     printLogMessage("🟢 Client connected", "info");
    //     resolve(client);
    //   }

  });
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

//Close connection to Event Hub
function closeToEventHubClient(client) {
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



//prints log message on both consoles
function printLogMessage(message, type) {
  _mainWindow.webContents.send("LogUpdate", message, type);
  console.log(message);
}



//start subscription based on the settings provided
async function startEventHubSubscription(settingsJson, mainWindow) {

  _settingsJson = settingsJson;
  _mainWindow = mainWindow;
  _subscriptionCancellationRequest = false;

  //get respective protocol
  printLogMessage("↘️ Starting subscription", "info");

  //create Event hub device client
  printLogMessage("Trying to create client", "details");
  _clientReceive = await connectToEventHubWithSubscription(_settingsJson);

  //promise here
  await waitForStopSignal();

  //close client connection
  await closeToEventHubClient(_clientReceive);
  printLogMessage("✅ Subscription completed", "info");

}

//waiting for a stop signal for a period of time
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

//receive message handler
async function receivedMessageHandler(events, context) {

  if (events.length === 0) {
    return;
  }

  for (const event of events) {
    printLogMessage("📝 Message received", "info");
    printLogMessage("Message body" + "\r\n" + event.body, "message");
    console.log(event);
  }
  // Update the checkpoint.
  await context.updateCheckpoint(events[events.length - 1]);
}

//stop Event hub subscription
async function stopEventHubSubscription(settingsJson, mainWindow) {

  _mainWindow = _mainWindow ?? mainWindow;
  _messageSubscription.close();
  _subscriptionCancellationRequest = true;
  printLogMessage("🚫 Subscription stop requested", "info");
}

//exporting functionalities
exports.startEventHubSimulation = startEventHubSimulation;
exports.stopEventHubSimulation = stopEventHubSimulation;
exports.startEventHubSubscription = startEventHubSubscription;
exports.stopEventHubSubscription = stopEventHubSubscription;
























































// const connectionString = "EVENT HUBS NAMESPACE CONNECTION STRING";
// const eventHubName = "EVENT HUB NAME";

// async function main() {
//   // Create a producer client to send messages to the event hub.
//   const producer = new EventHubProducerClient(connectionString, eventHubName);

//   // Prepare a batch of three events.
//   producer.
//   const batch = await producer.createBatch();
//   batch.tryAdd({ body: "First event" });
//   batch.tryAdd({ body: "Second event" });
//   batch.tryAdd({ body: "Third event" });

//   // Send the batch to the event hub.
//   await producer.sendBatch(batch);

//   // Close the producer client.
//   await producer.close();

//   console.log("A batch of three events have been sent to the event hub");
// }

// main().catch((err) => {
//   console.log("Error occurred: ", err);
// });

// const {
//   EventHubConsumerClient,
//   earliestEventPosition,
// } = require("@azure/event-hubs");
// const { ContainerClient } = require("@azure/storage-blob");
// const {
//   BlobCheckpointStore,
// } = require("@azure/eventhubs-checkpointstore-blob");

// const connectionString = "EVENT HUBS NAMESPACE CONNECTION STRING";
// const eventHubName = "EVENT HUB NAME";
// const consumerGroup = "$Default"; // name of the default consumer group
// const storageConnectionString = "STORAGE CONNECTION STRING";
// const containerName = "STORAGE CONTAINER NAME";

// async function main() {
//   // Create a blob container client and a blob checkpoint store using the client.
//   const containerClient = new ContainerClient(
//     storageConnectionString,
//     containerName
//   );
//   const checkpointStore = new BlobCheckpointStore(containerClient);

//   // Create a consumer client for the event hub by specifying the checkpoint store.
//   const consumerClient = new EventHubConsumerClient(
//     consumerGroup,
//     connectionString,
//     eventHubName,
//     checkpointStore
//   );

//   // Subscribe to the events, and specify handlers for processing the events and errors.
//   const subscription = consumerClient.subscribe(
//     {
//       processEvents: async (events, context) => {
//         if (events.length === 0) {
//           console.log(
//             `No events received within wait time. Waiting for next interval`
//           );
//           return;
//         }

//         for (const event of events) {
//           console.log(
//             `Received event: "${event.body}" from partition: "${context.partitionId}" and consumer group: "${context.consumerGroup}"`
//           );
//         }
//         // Update the checkpoint.
//         await context.updateCheckpoint(events[events.length - 1]);
//       },

//       processError: async (err, context) => {
//         console.log(`Error : ${err}`);
//       },
//     },
//     { startPosition: earliestEventPosition }
//   );

//   // After 30 seconds, stop processing.
//   await new Promise((resolve) => {
//     setTimeout(async () => {
//       await subscription.close();
//       await consumerClient.close();
//       resolve();
//     }, 30000);
//   });
// }

// main().catch((err) => {
//   console.log("Error occurred: ", err);
// });
