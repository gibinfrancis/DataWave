//function to replace template with parameter data
function replaceTemplateWithPlaceholder(template, data) {
  //creates the pattern for placeholder identification
  const pattern = /{{\s*(\w+?)\s*}}/g; // {{property}}
  //replace the template with data
  return template.replace(pattern, (_, token) => data[token] || "");
}

//function to generate text content for placeholders based on its option
function generateTextForPlaceholders(placeholders) {

  var data = {};

  //looping through placeholders
  placeholders.forEach((placeholder) => {
    switch (placeholder.type) {
      //on default random string
      case "stringRandom": {
        let randomLength = generateRandomNumber(placeholder.param1, placeholder.param2);
        data[placeholder.id] = generateRandomString(randomLength);
      }
      case "stringRandomList": {}
      case "stringSequenceList": {}
      case "integerRandom": {}
      case "integerRandomList": {}
      case "integerSequenceList": {}
      case "integerStepBy": {}
      case "doubleRandom": {}
      case "doubleRandomList": {}
      case "doubleSequenceList": {}
      case "doubleStepBy": {}
      case "booleanRandom": {}
      case "booleanSequenceList": {}
      case "guid": {}
      case "timeInUtc": {}
      case "timeInLocal": {}
      case "timeInEpoch": {}
      case "timeInEpochMilli": {}
      default: {
        data[placeholder.id] = generateRandomString(5);
      }
    }
  });

  return data;

}

//generate random string based on th length
function generateRandomString(length) {
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


//generate random integer
function generateRandomNumber(min = 5, max = 10) {

  // find diff
  let difference = max - min;

  // generate random number 
  let rand = Math.random();

  // multiply with difference 
  rand = Math.floor( rand * difference);

  // add with min value 
  rand = rand + min;

  return rand;
}




exports.generateTextForPlaceholders = generateTextForPlaceholders;
exports.replaceTemplateWithPlaceholder = replaceTemplateWithPlaceholder;