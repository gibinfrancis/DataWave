const Kafka = require("kafkajs");
const commonService = require("./CommonService.js");

let _clientSend;
let _clientReceive;

let _settings;
let _mainWindow;

let _totalCounter;
let _totalSuccessCounter;
let _totalFailureCounter;
let _msgGenCounter;

let _cancellationRequestSend = false;
let _cancellationRequestReceive = false;

//start simulation based on the settings provided
async function startPublisher(settings, mainWindow) {

  _settings = settings;
  _mainWindow = mainWindow;

  //resetting counters and cancellation
  resetCountersAndVariables();

  //get respective protocol
  printLogMessage("🚀 Starting simulation", "info");

  //create kafka device client
  printLogMessage("Trying to create client", "details");
  _clientSend = await createKafkaClient(_settings.connection);

  if (_clientReceive == null) {
    return;
  }

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
      const message = genMessage.body;

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
  await closeKafkaClient(_clientSend);
  printLogMessage("✅ Simulation completed", "info");

}

//stop kafka simulation
async function stopPublisher(settings, mainWindow) {
  _mainWindow = _mainWindow ?? mainWindow;
  await _clientSend.end();
  _cancellationRequestSend = true;
  printLogMessage("🚫 Simulation stop requested", "info");
}

//start subscription based on the settings provided
async function startSubscriber(settings, mainWindow) {

  _settings = settings;
  _mainWindow = mainWindow;

  //resetting counters
  resetCountersAndVariables();

  //get respective protocol
  printLogMessage("↘️ Starting subscription", "info");

  //create kafka device client
  printLogMessage("Trying to create client", "details");
  _clientReceive = await createKafkaClient(_settings.connection);

  if (_clientReceive == null) {
    return;
  }

  //subscribing messages
  await subscribeKafkaMessages(_clientReceive, _settings.connection.param4);

  //waiting for stop signal
  await waitForStopSignal();

  //close client connection
  await closeKafkaClient(_clientReceive);
  printLogMessage("✅ Subscription completed", "info");

}

//stop kafka subscription
async function stopSubscriber(settings, mainWindow) {

  _mainWindow = _mainWindow ?? mainWindow;
  await _clientReceive.end();
  _cancellationRequestReceive = true;
  printLogMessage("🚫 Subscription stop requested", "info");

}


//print message content
function printMessageContents(message) {
  //print message body
  if (typeof message === "object") {
    printLogMessage("Message body" + "\r\n" + JSON.stringify(message), "message");
  }
  else {
    printLogMessage("Message body" + "\r\n" + message, "message");
  }
}


//Connect to kafka using the device connection string and protocol
function createKafkaClient(connection) {
  return new Promise((resolve, reject) => {
    // create a kafka client using the connection string to the kafka namespace
    let kafkaOptions;
    if (connection.param2 != null && connection.param3 != null) {
      kafkaOptions = {
        clientId: 'IoT Simulator app',
        brokers: [connection.param1],
        ssl: true,
        sasl: {
          mechanism: 'plain', // scram-sha-256 or scram-sha-512
          username: connection.param2,
          password: connection.param3
        },
      }
    }
    else {
      kafkaOptions = {
        clientId: 'IoT Simulator app',
        brokers: [connection.param1]
      }
    }
    try {
      const kafka = new Kafka(kafkaOptions);
      const client = kafka.producer();
      resolve(client);
    }
    catch (err) {
      printLogMessage("❌ Error while connecting", "info");
      printLogMessage(err, "details");
      resolve(null);
    }
  })
}


//Connect to kafka and subscribe messages
async function subscribeKafkaMessages(client, topicName) {
  //receive event
  return new Promise((resolve, reject) => {
    client.on("message", function (topicName, message) {
      printLogMessage("📝 Message received", "info");
      printMessageContents(message?.toString());
      //update counters
      updateCounters(true);
    });

    client.subscribe(topicName, function (err) {
      printLogMessage("🔴 Client connection failed", "info");
      printLogMessage(err, "details");
    });
    resolve(true);
  });
}


//send message to kafka
async function sendMessage(client, topic, message) {
  return new Promise((resolve, reject) => {
    //send the message     
    client.publish(topic, JSON.stringify(message)).then((res) => {
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

//Close connection to kafka
function closeKafkaClient(client) {
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
exports.startPublisher = startPublisher;
exports.stopPublisher = stopPublisher;
exports.startSubscriber = startSubscriber;
exports.stopSubscriber = stopSubscriber;