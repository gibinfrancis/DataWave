//simulation settings
var settingsJson = {
  direction: "send", //send/receive
  service: "iothub", //iothub/eventhub/servicebus/mqtt
  messageBodyTemplate: "",
  messageHeaderTemplate: "",
  placeholders: [],
  connection: {},
  protocol: "http", //mqtt/amqp/mqttws/amqpws/http - htt now and will add more in future
  delay: 10,
  batch: 1,
  count: 0,
  bulkSend: false
};

//when the document is ready
$(function () {

  //direction button click binding
  $(".dir_btn").on("click", (e) => directionButtonClickHandler(e));

  //service button click binding
  $(".serv_btn").on("click", (e) => serviceButtonClickHandler(e));

  //placeholders refresh button click binding
  $("#placehold_gen_btn").on("click", () => placeholderGenButtonClickHandler());

  //start button click event
  $("#cntl_start_btn").on("click", startButtonClickHandler);

  //stop button click event
  $("#cntl_stop_btn").on("click", stopButtonClickHandler);

  //semd one button click event
  $("#cntl_sendone_btn").on("click", sendOneButtonClickHandler);

  //view generated message button
  $("#cntl_view_btn").on("click", viewButtonClickHandler);

  //tab button click event
  $(".tab-head").on("click", (e) => tabHeadButtonClickHandler(e));
});

//on log update trigger
window.api.onLogUpdate((_event, message, type) => {
  printLogMessage(message, type);
});


//on count update trigger
window.api.onCountUpdate((_event, countObj) => {
  $("#count_success_lbl").text(countObj.success);
  $("#count_fail_lbl").text(countObj.failure);
  $("#count_total_lbl").text(countObj.total);
});


//-----------------------------------------------------
//-----------------VIEW BUTTON------------------------
//-----------------------------------------------------
async function viewButtonClickHandler() {

  //prepare settings object
  prepareSettings();

  //invoke main service to get generated message
  const genMessage = await window.api.getGeneratedMessage(settingsJson);

  //print generated message as log
  printLogMessage(genMessage.message, "info");

}

//-----------------------------------------------------
//-----------------PLACEHOLDER GEN BUTTON--------------
//-----------------------------------------------------
function placeholderGenButtonClickHandler() {

  //get the template content
  const templateString = $("#msg_body_txt").val() + " " + $("#msg_header_txt").val();

  //get placeholder strings from the template
  const placeholders = templateString
    .match(/\{\{(.+?)\}\}/g)
    .map((placeholder) => placeholder.replace(/[{}]/g, ""));

  //iterate through all placeholders
  placeholders.forEach((placeholder) => {

    //assign default placeholder generation method
    const phType = "stringRandom";

    //check if the placeholder is already present
    if ($("#ph_" + placeholder).length) return;

    //create a new div element to placed with placeholder card template
    const childElement = document.createElement("div");

    //append the placeholder card with placeholder name
    childElement.innerHTML = phCardTemplate.replaceAll(
      "{{placeholderName}}",
      placeholder
    );
    //adding the child
    $("#placeholderWrap").append(childElement);

    //adding the change event to drop down
    $("#ph_opt_" + placeholder + "_sel").change(genOptionDropdownClickHandler);

    //prepare placeholder object for adding to list
    var phObj = {
      id: placeholder,
      type: phType,
    };

    //update params within placeholder
    updatePlaceholderGenParams(placeholder, phType);

    //adding the placeholder to config
    settingsJson.placeholders.push(phObj);
  });
}

//-----------------------------------------------------
//---PLACEHOLDER GEN OPTION DROPDOWN SELECT------------
//-----------------------------------------------------
function genOptionDropdownClickHandler() {

  //get the selected type
  var type = $("option:selected", this).val();

  //get the placeholder name
  const phName = $(this).data("name");

  //get the placeholder index from the settings json
  objIndex = settingsJson.placeholders.findIndex((obj) => obj.id == phName);

  //update the configuration
  settingsJson.placeholders[objIndex].type = type;

  //update params within placeholder
  updatePlaceholderGenParams(phName, type);
}


//-----------------------------------------------------
//-----------------TAB BUTTONS-------------------
//-----------------------------------------------------
function tabHeadButtonClickHandler(e) {

  //remove highlighted class from all buttons
  $(".tab-head").parent().removeClass("is-active");

  //add highlighted class to current button
  $("#" + e.target.id).parent().addClass("is-active");

  //display respective tab content
  $(".tab-content").hide();
  $("#" + e.target.id + "_content").show();

}



//-----------------------------------------------------
//-----------------DIRECTION BUTTONS-------------------
//-----------------------------------------------------
function directionButtonClickHandler(e) {

  //get the button text as the chosen direction
  settingsJson.direction = $(e.target)[0].innerText.toLowerCase();

  //remove highlighted class from all buttons
  $(".dir_btn").removeClass("is-link");

  //add highlighted class to current button
  $("#" + e.target.id).addClass("is-link");

  //update the connection settings params
  updateConSettingsGenParams(settingsJson.service, settingsJson.direction);

}

//-----------------------------------------------------
//-----------------SERVICES BUTTONS--------------------
//-----------------------------------------------------
function serviceButtonClickHandler(e) {

  //get the button text as the chosen direction and remove spaces in it
  settingsJson.service = $(e.target)[0]
    .innerText.toLowerCase()
    .replace(" ", "");

  //remove highlighted class from all buttons
  $(".serv_btn").removeClass("is-link");

  //add highlighted class to current button
  $("#" + e.target.id).addClass("is-link");

  //update the connection settings params
  updateConSettingsGenParams(settingsJson.service, settingsJson.direction);
}


//-----------------------------------------------------
//-----------------SEND ONE BUTTON------------------------
//-----------------------------------------------------
async function sendOneButtonClickHandler() {

  //prepare settings object
  prepareSettings();

  //configuring values for single message
  settingsJson.delay = 10;
  settingsJson.batch = 1;
  settingsJson.count = 1;

  //validate the settings provided
  let validationRes = validateSettings();

  if (validationRes == true)
    //invoke main service to start simulation
    await window.api.startIoTHubSimulation(settingsJson);
}

//-----------------------------------------------------
//-----------------START BUTTON------------------------
//-----------------------------------------------------
async function startButtonClickHandler() {

  //prepare settings object
  prepareSettings();

  //validate the settings provided
  let validationRes = validateSettings();

  //removing the attribute will show a flowing progress bar on screen
  $("#cntl_progress").removeAttr("value");

  if (validationRes == true)
    //invoke main service to start simulation
    await window.api.startIoTHubSimulation(settingsJson);

  //setting 0 will disable the continuous flow of progress bar
  $("#cntl_progress").attr("value", 0);
}


//-----------------------------------------------------
//-----------------STOP BUTTON-------------------------
//-----------------------------------------------------
async function stopButtonClickHandler() {
  //invoking stop simulation
  await window.api.stopIoTHubSimulation(settingsJson);
}

function printLogMessage(logMessage, type) {
  //check the message view enabled
  if (type == "message" && $("#log_msg_check").prop("checked") == false) return;
  //check the details view enabled
  else if (type == "details" && $("#log_detail_check").prop("checked") == false)
    return;
  //adding the message to log
  $("#logDisplay").append(
    //generatedString.replace(/\r\n|\r|\n/g, "") + "\r\n"
    Date.now() + " : " + logMessage + "\r\n"
  );
  //scroll the log section to bottom
  if ($("#log_scroll_check").prop("checked")) {
    $("#logDisplay").scrollTop($("#logDisplay")[0].scrollHeight);
  }
}




//-----------------------------------------------------------------
//------------------common services--------------------------------
//-----------------------------------------------------------------



//print message
function printMessage(message, type) {
  $("#log_msg_lbl").removeClass("has-text-info-dark");
  $("#log_msg_lbl").removeClass("has-text-danger-dark");

  if (type == "error") {
    $("#log_msg_lbl").addClass("has-text-danger-dark");
  }
  else if (type == "info") {
    $("#log_msg_lbl").addClass("has-text-info-dark");
  }
  else if (type == "clear") {
    $("#log_msg_lbl").text("");
    return;
  }
  $("#log_msg_lbl").text("ⓘ " + message);
}



//update placeholder generation params to settings
function updatePhGenParametersToSettings(placeholders) {

  //loop though the placeholders
  for (var i = 0; i < placeholders.length; i++) {
    placeholders[i].param1 = getValueInType($("#ph_" + placeholders[i].id + "_txt1").val(), "string", null);
    placeholders[i].param2 = getValueInType($("#ph_" + placeholders[i].id + "_txt2").val(), "string", null);
    placeholders[i].param3 = getValueInType($("#ph_" + placeholders[i].id + "_txt3").val(), "string", null);
  }
}


//update placeholder generation items parameters
function updatePlaceholderGenParams(phName, type) {

  //get the placeholder index from the settings json
  phGenObjIndex = phGenOptions.findIndex((obj) => obj.name == type);

  //check if both param1 and param 2 is not available, 
  //in that case, the parent wrap will be hidden
  phGenOptions[phGenObjIndex].param1 == null && phGenOptions[phGenObjIndex].param2 == null
    ? $("#ph_" + phName + "_txt1").parent().parent().hide()
    : $("#ph_" + phName + "_txt1").parent().parent().show();

  phGenOptions[phGenObjIndex].param3 == null
    ? $("#ph_" + phName + "_txt3").parent().parent().hide()
    : $("#ph_" + phName + "_txt3").parent().parent().show();

  $("#ph_" + phName + "_txt1").attr("placeholder", phGenOptions[phGenObjIndex].param1);
  $("#ph_" + phName + "_txt2").attr("placeholder", phGenOptions[phGenObjIndex].param2);
  $("#ph_" + phName + "_txt3").attr("placeholder", phGenOptions[phGenObjIndex].param3);
}


//update connection settings generation items parameters
function updateConSettingsGenParams(service, direction) {

  //get the placeholder index from the json
  objIndex = conSettingGenOptions.findIndex((obj) => obj.name == service && obj.direction == direction);

  //check if both param2 is avaiable or not, param 1 will always be availablee, 
  conSettingGenOptions[objIndex].param2 == null
    ? $("#con_string_lbl2").parent().parent().hide()
    : $("#con_string_lbl2").parent().parent().show();

  $("#con_string_txt1").attr("placeholder", conSettingGenOptions[objIndex].param1);
  $("#con_string_txt2").attr("placeholder", conSettingGenOptions[objIndex].param2);

}


//get the settings ready
function prepareSettings() {
  //updating connection settings
  settingsJson.connection = {
    connectionPram1: getValueInType($("#con_string_txt1").val(), "string", null),
    connectionPram2: getValueInType($("#con_string_txt2").val(), "string", null)
  };

  //updating message template 
  settingsJson.messageBodyTemplate = getValueInType($("#msg_body_txt").val(), "string", null);
  //updating header template
  settingsJson.messageHeaderTemplate = getValueInType($("#msg_header_txt").val(), "string", null);
  //updating delay settings
  settingsJson.delay = getValueInType($("#set_delay_txt").val(), "int", 10);
  //updating batch size settings
  settingsJson.batch = getValueInType($("#set_batch_txt").val(), "int", 1);
  //updating fixed count settings
  settingsJson.count = getValueInType($("#set_count_txt").val(), "int", 0);
  //bulk send option
  settingsJson.bulkSend = $("#set_bulk_check").prop("checked") == true;

  //update placeholder generation parameters to settings
  updatePhGenParametersToSettings(settingsJson.placeholders);

}


//validate the settings provided
function validateSettings() {

  if (settingsJson.messageBodyTemplate == null) {
    printMessage("Please provide valid message body", "error");
    return false;
  }
  else if (settingsJson.direction == "send" && settingsJson.connection.connectionPram1 == null) {
    printMessage("Please provide valid connection string", "error");
    return false;
  }
  else if (settingsJson.messageBodyTemplate.includes("{{") && settingsJson.placeholders.length == 0) {
    printMessage("Please generate placeholders", "error");
    return false;
  }
  printMessage("", "clear");
  return true;

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

//placeholder card template
const phCardTemplate = `
<div class="card mb-2" id="ph_{{placeholderName}}">
  <div class="card-content p-2">
    <div class="columns mb-0">
      <div class="column is-6">
        <div class="label is-small pt-2">{{placeholderName}}</div>
      </div>
      <div class="column is-6">
        <div class="select is-small is-fullwidth">
          <select id="ph_opt_{{placeholderName}}_sel" data-name="{{placeholderName}}">
            <!-- string -->
            <option value="stringRandom" selected>String-Random</option>
            <option value="stringRandomList">String-RandomList</option>
            <option value="stringSequenceList">String-SequenceList</option>
            <!-- int -->
            <option value="integerRandom">Integer-Random</option>
            <option value="integerRandomList">Integer-RandomList</option>
            <option value="integerSequenceList">Integer-SequenceList</option>
            <option value="integerStepBy">Integer-StepBy</option>
            <!-- double -->
            <option value="doubleRandom">Double-Random</option>
            <option value="doubleRandomList">Double-RandomList</option>
            <option value="doubleSequenceList">Double-SequenceList</option>
            <option value="doubleStepBy">Double-StepBy</option>
            <!-- bool -->
            <option value="booleanRandom">Boolean-Random</option>
            <option value="booleanSequenceList">Boolean-SequenceList</option>
            <!-- guid -->
            <option value="guid">Guid</option>
            <!-- time -->
            <option value="timeInUtc">Time-InUtc</option>
            <option value="timeInLocal">Time-InLocal</option>
            <option value="timeInEpoch">Time-InEpoch</option>
            <option value="timeInEpochMilli">Time-InEpochMilli</option>
          </select>
        </div>
      </div>
    </div>
    <div class="columns mb-0">
      <div class="column is-6">
        <input class="input is-small" id="ph_{{placeholderName}}_txt1" type="text" placeholder="Min" />
      </div>
      <div class="column is-6">
        <input class="input is-small" id="ph_{{placeholderName}}_txt2" type="text" placeholder="Max" />
      </div>
    </div>
    <div class="columns mb-0">
      <div class="column is-12">
        <input class="input is-small" id="ph_{{placeholderName}}_txt3" type="text" placeholder="List" />
      </div>
    </div>
  </div>          
  </div>
  `;

//connection settings generation options
var conSettingGenOptions = [
  {
    name: "iothub",
    direction: "send",
    param1: "Device connection string"
  },
  {
    name: "eventhub",
    direction: "send",
    param1: "Event hub connection string"
  },
  {
    name: "servicebus",
    direction: "send",
    param1: "Service bus connection string",
    param2: "Topic name"
  },
  {
    name: "mqtt",
    direction: "send",
    param1: "mqtt connection string"
  },
  {
    name: "iothub",
    direction: "receive",
    param1: "Device connection string"
  },
  {
    name: "eventhub",
    direction: "receive",
    param1: "Event hub connection string"
  },
  {
    name: "servicebus",
    direction: "receive",
    param1: "Service bus connection string",
    param2: "Topic name"
  },
  {
    name: "mqtt",
    direction: "receive",
    param1: "mqtt connection string"
  }
]

//place golder params generation options
var phGenOptions = [
  {
    name: "stringRandom",
    param1: "Min length",
    param2: "Max length",
  },
  {
    name: "stringRandomList",
    param3: "List - Comma separated string",
  },
  {
    name: "stringSequenceList",
    param3: "List - Comma separated string",
  },
  {
    name: "integerRandom",
    param1: "Minimum",
    param2: "Maximum",
  },
  {
    name: "integerRandomList",
    param3: "List - Comma separated integer",
  },
  {
    name: "integerSequenceList",
    param3: "List - Comma separated integer",
  },
  {
    name: "integerStepBy",
    param1: "Starts with",
    param2: "Increment by",
  },
  {
    name: "doubleRandom",
    param1: "Minimum",
    param2: "Maximum",
  },
  {
    name: "doubleRandomList",
    param3: "List - Comma separated integer",
  },
  {
    name: "doubleSequenceList",
    param3: "List - Comma separated integer",
  },
  {
    name: "doubleStepBy",
    param1: "Starts with",
    param2: "Increment by",
  },
  {
    name: "booleanRandom",
  },
  {
    name: "booleanSequenceList",
    param3: "List - Comma separated true or false",
  },
  {
    name: "guid",
  },
  {
    name: "timeInUtc",
    param3: "Date format",
  },
  {
    name: "timeInLocal",
    param3: "Date format",
  },
  {
    name: "timeInEpoch",
  },
  {
    name: "timeInEpochMilli",
  },
  //wil be considering EVAL in future only
  // {
  //   name: "advanced",
  //   param3: "Your EVAL statement",
  // },
];
