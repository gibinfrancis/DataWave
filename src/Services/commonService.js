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
      case "stringrandom": {
        data[placeholder.id] = generateRandomString(5);
      }
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





exports.generateTextForPlaceholders = generateTextForPlaceholders;
exports.replaceTemplateWithPlaceholder = replaceTemplateWithPlaceholder;