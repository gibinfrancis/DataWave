const { v4: guidV4 } = require("uuid");
var moment = require("moment");

//generate message body, properties and header prepared using its placeholder and template
function generateMessage(settingsJson, iteration) {

  // Create a message and send it to the IoT Hub every two seconds
  const genValues = generateTextForPlaceholders(settingsJson.placeholders, iteration);

  //replace the template with generated placeholder data
  const genMessage = replaceTemplateWithPlaceholder(settingsJson.messageBodyTemplate, genValues);

  //replace the header template with generated placeholder data
  const genHeader = replaceTemplateWithPlaceholder(settingsJson.messageHeaderTemplate, genValues);

  //replace the properties template with generated placeholder data
  const genProperties = replaceTemplateWithPlaceholder(settingsJson.messagePropertiesTemplate, genValues);

  let message = {};
  message.body = genMessage;
  try {
    //parsing header
    if (genHeader != null)
      message.header = JSON.parse(genHeader);
  }
  catch (ex) {
    //catch parse error
    message.error = ex.message;
    return message;
  }
  try {
    //parsing properties
    if (genProperties != null)
      message.properties = JSON.parse(genProperties);
  }
  catch (ex) {
    //catch parse error
    message.error = ex.message;
    return message;
  }
  return message;
}


//function to replace template with parameter data
function replaceTemplateWithPlaceholder(template, data) {
  //creates the pattern for placeholder identification
  const pattern = /{{\s*(\w+?)\s*}}/g; // {{property}}
  //replace the template with data
  return template?.replace(pattern, (_, token) => data[token] || "");
}

//function to generate text content for placeholders based on its option
function generateTextForPlaceholders(placeholders, iterationNumber) {

  const now = new Date();
  var data = {};

  //looping through placeholders
  placeholders.forEach((placeholder) => {
    //initializing null as default
    data[placeholder.id] = null;
    switch (placeholder.type) {
      //on default random string
      case "stringRandom": {
        let randomLength = generateRandomNumber(getValueInType(placeholder.param1, "int"), getValueInType(placeholder.param2, "int"));
        data[placeholder.id] = generateRandomString(randomLength);
        break;
      }
      //random string from a list
      case "stringRandomList": {
        allowedValuesArray = placeholder.param3?.split(",");
        if (allowedValuesArray) {
          let randomIndex = generateRandomNumber(0, allowedValuesArray.length);
          data[placeholder.id] = allowedValuesArray[randomIndex];
        }
        break;
      }
      //sequence string from a list
      case "stringSequenceList": {
        allowedValuesArray = placeholder.param3?.split(",");
        if (allowedValuesArray)
          data[placeholder.id] = allowedValuesArray[iterationNumber % allowedValuesArray.length];
        break;
      }
      //random integer
      case "integerRandom": {
        data[placeholder.id] = generateRandomNumber(getValueInType(placeholder.param1, "int"), getValueInType(placeholder.param2, "int"));
        break;
      }
      //random integer from a list
      case "integerRandomList": {
        allowedValuesArray = placeholder.param3?.split(",").map(Number);
        if (allowedValuesArray) {
          let randomIndex = generateRandomNumber(0, allowedValuesArray.length);
          data[placeholder.id] = allowedValuesArray[randomIndex];
        }
        break;
      }
      //sequence integer from a list
      case "integerSequenceList": {
        allowedValuesArray = placeholder.param3?.split(",").map(Number);
        if (allowedValuesArray)
          data[placeholder.id] = allowedValuesArray[iterationNumber % allowedValuesArray.length];
        break;
      }
      //integer increment by
      case "integerStepBy": {
        data[placeholder.id] = getValueInType(placeholder.param1, "int", 1) + (getValueInType(placeholder.param2, "int", 1) * iterationNumber);
        break;
      }
      //random floating number
      case "doubleRandom": {
        data[placeholder.id] = generateRandomDouble(getValueInType(placeholder.param1, "float"), getValueInType(placeholder.param2, "float"));
        break;
      }
      //random floating from a list
      case "doubleRandomList": {
        allowedValuesArray = placeholder.param3?.split(",").map(Number);
        if (allowedValuesArray) {
          let randomIndex = generateRandomNumber(0, allowedValuesArray.length);
          data[placeholder.id] = allowedValuesArray[randomIndex];
        }
        break;
      }
      //sequence floating number from a list
      case "doubleSequenceList": {
        allowedValuesArray = placeholder.param3?.split(",").map(Number);
        if (allowedValuesArray)
          data[placeholder.id] = allowedValuesArray[iterationNumber % allowedValuesArray.length];
        break;
      }
      //floating number increment by
      case "doubleStepBy": {
        data[placeholder.id] = getValueInType(placeholder.param1, "float", 1.00) + (getValueInType(placeholder.param2, "float", .10) * iterationNumber);
        break;
      }
      //boolean random
      case "booleanRandom": {
        data[placeholder.id] = (Math.random() < 0.5) ? "true" : "false";
        break;
      }
      //sequence boolean from list
      case "booleanSequenceList": {
        allowedValuesArray = placeholder.param3?.split(",").map(Boolean);
        if (allowedValuesArray)
          data[placeholder.id] = "" + allowedValuesArray[iterationNumber % allowedValuesArray.length] + "";
        break;
      }
      //guid 
      case "guid": {
        data[placeholder.id] = guidV4();
        break;
      }
      //time in UTC
      case "timeInUtc": {
        let format = getValueInType(placeholder.param3, "string");
        if (format != null)
          data[placeholder.id] = moment.utc().format(format);
        else
          data[placeholder.id] = moment.utc().toISOString();
        break;
      }
      //time in local time
      case "timeInLocal": {
        let format = getValueInType(placeholder.param3, "string");
        if (format != null)
          data[placeholder.id] = moment().format(format);
        else
          data[placeholder.id] = moment().toISOString(true);
        break;
      }
      //time in epoch
      case "timeInEpoch": {
        data[placeholder.id] = moment().unix();
        break;
      }
      //time in epoch milliseconds
      case "timeInEpochMilli": {
        data[placeholder.id] = moment().valueOf();
        break;
      }
      //if advanced, the user can provide javascript statement and the same will get evaluated and used
      case "advanced": {
        data[placeholder.id] = eval(getValueInType(placeholder.param3, "string"));
        break;
      }
      //default - string random
      default: {
        data[placeholder.id] = generateRandomString(5);
        break;
      }
    }
  });

  return data;

}

//generate random string based on th length
function generateRandomString(length) {

  length = length ?? 5;
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

//get value from the parameter string
function getValueInType(value, type, defaultValue = null) {
  if (type == "int") {
    return value != null && value.trim() != "" ? parseInt(value) : defaultValue
  }
  else if (type == "float") {
    return value != null && value.trim() != "" ? parseFloat(value) : defaultValue
  }
  else {
    return value != null && value.trim() != "" ? value.trim() : defaultValue
  }
}

//generate random integer
function generateRandomNumber(min, max) {

  min = min ?? 5;
  max = max ?? 10;
  // find diff
  let difference = max - min;

  // generate random number 
  let rand = Math.random();

  // multiply with difference 
  rand = Math.floor(rand * difference);

  // add with min value 
  rand = rand + min;
  return rand;
}

//generate random double
function generateRandomDouble(min, max) {

  min = min ?? 5.5;
  max = max ?? 10.5;

  return Math.random() * (max - min) + min;
}

//delay function to wait for some time
function delay(sec) {
  if (sec == 0)
    sec = .2;
  return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

exports.generateMessage = generateMessage;
exports.delay = delay;