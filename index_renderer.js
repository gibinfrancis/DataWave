//simulation settings
var settingsJson = {
  direction: "send", //send/receive
  service: "iothub", //iothub/eventhub/servicebus/mqtt/kafka
  messageBodyTemplate: null,
  messageHeaderTemplate: null,
  messagePropertiesTemplate: null,
  placeholders: [],
  connection: {},
  delay: 10,
  batch: 1,
  count: 0,
  bulkSend: false
};

//simulation flag
var simulationInProgress = false;

//-----------------------------------------------------
//-----------------DOCUMENT READY----------------------
//-----------------------------------------------------

//when the document is ready
$(function () {

  //direction radio change handler
  $("input[type=radio][name=dirOption]").on("change", directionRadioChangeHandler);

  //service radio change handler
  $("input[type=radio][name=servOption]").on("change", serviceRadioChangeHandler);

  //placeholders generate button click binding
  $("#placeholder_gen_btn").on("click", placeholderGenButtonClickHandler);

  //start button click event
  $("#cntl_start_btn").on("click", startButtonClickHandler);

  //stop button click event
  $("#cntl_stop_btn").on("click", stopButtonClickHandler);

  //preview generated message button
  $("#cntl_preview_btn").on("click", previewButtonClickHandler);

  //tab button click event
  $(".tab-head").on("click", (e) => tabHeadButtonClickHandler(e));

  //notification close click event
  $("#close_notif_btn").on("click", closeNotificationButtonClickHandler);

  //clear log button click event
  $("#cntl_clear_btn").on("click", clearLogButtonClickHandler);

  //hide unhide button click event
  $("#cntl_hide_btn").on("click", hideButtonClickHandler);

  //relaunch button click event
  $("#cntl_reset_btn").on("click", relaunchButtonClickHandler);

  //file load button
  $("#cntl_load_btn").on("click", fileLoadButtonClickHandler);

  //file save button
  $("#cntl_save_btn").on("click", fileSaveButtonClickHandler);

  //updating connection setting on initial load
  //updateConSettingsGenParams(settingsJson.service, settingsJson.direction);
});


//-----------------------------------------------------
//-----------------ON LOG UPDATE-----------------------
//-----------------------------------------------------

//on log update trigger
window.api.onLogUpdate((_event, message, type) => {
  printLogMessage(message, type);
});


//-----------------------------------------------------
//-----------------ON COUNTER UPDATE-------------------
//-----------------------------------------------------

//on count update trigger
window.api.onCountUpdate((_event, countObj) => {
  $("#count_success_lbl").text(countObj.success);
  $("#count_fail_lbl").text(countObj.failure);
  $("#count_total_lbl").text(countObj.total);
});

//-----------------------------------------------------
//-----------------HIDE BUTTON-------------------------
//-----------------------------------------------------

async function hideButtonClickHandler() {
  //check the active mode using the image path 
  if ($("#cntl_hide_img").attr("src").endsWith("unhide_icon.png")) {
    $("#cntl_hide_img").attr("src", "../assets/images/hide_icon.png");
    $("#templateSection").removeClass("hidden");
  }
  else {
    $("#cntl_hide_img").attr("src", "../assets/images/unhide_icon.png");
    $("#templateSection").addClass("hidden");
  }
}

//-----------------------------------------------------
//-----------------RELAUNCH BUTTON---------------------
//-----------------------------------------------------
async function relaunchButtonClickHandler() {
  await window.api.relaunch();
}

//-----------------------------------------------------
//-----------------FILE LOAD BUTTON--------------------
//-----------------------------------------------------
async function fileLoadButtonClickHandler() {

  //invoke file load service and ge the file content
  let fileContentStr = await window.api.LoadSimulationFile();

  //validate the response
  if (fileContentStr == null)
    return;

  //try to parse the received content from the service
  try {
    settingsJson = JSON.parse(fileContentStr);
  }
  catch (err) {
    printMessage("Unable to load the file due to parsing error", "error");
    return;
  }

  //update the settings Json to UI
  updateSettingsJsonToUi();

  //completed message
  printMessage("File loaded successfully", "info");

}

//update the settings json to UI components
function updateSettingsJsonToUi() {

  //direction
  $("#" + settingsJson.direction + "-option").prop("checked", true);

  //service
  $("#" + settingsJson.service + "-option").prop("checked", true);

  //updating ui based on the service and direction
  updateConSettingsGenParams(settingsJson.service, settingsJson.direction);

  //connection parameters
  $("#con_string_txt1").val(settingsJson.connection.param1);
  $("#con_string_txt2").val(settingsJson.connection.param2);
  $("#con_string_txt3").val(settingsJson.connection.param3);
  $("#con_string_txt4").val(settingsJson.connection.param4);
  $("#con_string_txt5").val(settingsJson.connection.param5);

  //simulation settings
  $("#set_batch_txt").val(settingsJson.batch);
  $("#set_delay_txt").val(settingsJson.delay);
  $("#set_count_txt").val(settingsJson.count);
  $("#set_bulk_check").prop("checked", settingsJson.bulkSend);


  //message templates
  $("#msg_body_txt").val(settingsJson.messageBodyTemplate);
  $("#msg_header_txt").val(settingsJson.messageHeaderTemplate);
  $("#msg_prop_txt").val(settingsJson.messagePropertiesTemplate);

}

//-----------------------------------------------------
//-----------------FILE SAVE BUTTON--------------------
//-----------------------------------------------------
async function fileSaveButtonClickHandler() {

  //prepare settings object
  prepareSettings();

  //invoke file save service
  let res = await window.api.SaveSimulationFile(settingsJson);

  //show message based on result
  if (res) {
    printMessage("File saved successfully", "info");
  }
  else {
    printMessage("unable to save the file", "error");
  }
}


//-----------------------------------------------------
//-----------------CLEAR LOG BUTTON-----------
//-----------------------------------------------------
async function clearLogButtonClickHandler() {
  $("#logDisplay").text("");
}


//-----------------------------------------------------
//-----------------NOTIFICATION CLOSE BUTTON-----------
//-----------------------------------------------------
async function closeNotificationButtonClickHandler() {
  $("#log_msg_lbl").parent().addClass("hidden");
}

//-----------------------------------------------------
//-----------------VIEW BUTTON-------------------------
//-----------------------------------------------------
//preview the generated message before sending
async function previewButtonClickHandler() {

  //prepare settings object
  prepareSettings();

  //validate the settings provided
  let validationRes = validateSettings("generate");

  if (validationRes == false)
    return;

  //invoke service to get generated message
  const genMessage = await window.api.getGeneratedMessage(settingsJson);

  //print generated header message as log
  if (genMessage.header != null)
    printLogMessage(JSON.stringify(genMessage.header), "info");

  //print generated message as log
  printLogMessage(genMessage.message, "info");

}

//-----------------------------------------------------
//-----------------PLACEHOLDER GEN BUTTON--------------
//-----------------------------------------------------

function placeholderGenButtonClickHandler() {

  //prepare settings object
  prepareSettings();

  //validate the settings provided
  let validationRes = validateSettings("placeholderGenerate");

  //validate 
  if (validationRes == false)
    return;

  //get the template content
  const templateString = settingsJson.messageBodyTemplate
    + " " + settingsJson.messageHeaderTemplate
    + " " + settingsJson.messagePropertiesTemplate;

  //get placeholder strings from the template
  const placeholders = templateString?.match(/\{\{(.+?)\}\}/g)?.map((placeholder) => placeholder.replace(/[{}]/g, ""));

  //iterate through all placeholders
  placeholders.forEach((placeholder) => {

    //assign default placeholder generation method
    const phType = "stringRandom";

    //check if the placeholder is already present
    if ($("#ph_" + placeholder).length) return;

    //create a new div element to placed with placeholder card template
    const childElement = document.createElement("div");

    //append the placeholder card with placeholder name
    childElement.innerHTML = phCardTemplate.replaceAll("{{placeholderName}}", placeholder);

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
//-----------------DIRECTION RADIO BUTTONS-------------
//-----------------------------------------------------
function directionRadioChangeHandler() {

  //get the button text as the chosen direction
  settingsJson.direction = $("input[type=radio][name=dirOption]:checked").val();

  //update the connection settings params
  updateConSettingsGenParams(settingsJson.service, settingsJson.direction);

}

//-----------------------------------------------------
//-----------------SERVICES BUTTONS--------------------
//-----------------------------------------------------
function serviceRadioChangeHandler() {


  //get the button text as the chosen direction and remove spaces in it
  settingsJson.service = $("input[type=radio][name=servOption]:checked").val();

  //update the connection settings params
  updateConSettingsGenParams(settingsJson.service, settingsJson.direction);
}


//-----------------------------------------------------
//-----------------START BUTTON------------------------
//-----------------------------------------------------
async function startButtonClickHandler() {

  //check already existing simulation
  if (simulationInProgress == true)
    return

  //prepare settings object
  prepareSettings();

  //validate the settings provided
  let validationRes = validateSettings(settingsJson.direction);

  //check the validation is fine
  if (validationRes == false)
    return;

  //removing the attribute will show a flowing progress bar on screen
  $("#cntl_progress").removeAttr("value");

  //in progress flag
  simulationInProgress = true;

  //invoke main service to start simulation
  if (settingsJson.direction == "send" && settingsJson.service == "iothub")
    await window.api.startIoTHubSend(settingsJson);
  else if (settingsJson.direction == "receive" && settingsJson.service == "iothub")
    await window.api.startIoTHubReceive(settingsJson);
  else if (settingsJson.direction == "send" && settingsJson.service == "eventhub")
    await window.api.startEventHubSend(settingsJson);
  else if (settingsJson.direction == "receive" && settingsJson.service == "eventhub")
    await window.api.startEventHubReceive(settingsJson);
  else if (settingsJson.direction == "send" && settingsJson.service == "servicebus")
    await window.api.startServiceBusSend(settingsJson);
  else if (settingsJson.direction == "receive" && settingsJson.service == "servicebus")
    await window.api.startServiceBusReceive(settingsJson);
  else if (settingsJson.direction == "send" && settingsJson.service == "mqtt")
    await window.api.startMqttSend(settingsJson);
  else if (settingsJson.direction == "receive" && settingsJson.service == "mqtt")
    await window.api.startMqttReceive(settingsJson);
  else if (settingsJson.direction == "send" && settingsJson.service == "kafka")
    await window.api.startKafkaSend(settingsJson);
  else if (settingsJson.direction == "receive" && settingsJson.service == "kafka")
    await window.api.startKafkaReceive(settingsJson);


  //setting 0 will disable the continuous flow of progress bar
  $("#cntl_progress").attr("value", 0);

  //in progress flag
  simulationInProgress = false;
}


//-----------------------------------------------------
//-----------------STOP BUTTON-------------------------
//-----------------------------------------------------
async function stopButtonClickHandler() {

  //invoke main service to start simulation
  if (settingsJson.direction == "send" && settingsJson.service == "iothub")
    await window.api.stopIoTHubSend(settingsJson);
  else if (settingsJson.direction == "receive" && settingsJson.service == "iothub")
    await window.api.stopIoTHubReceive(settingsJson);
  else if (settingsJson.direction == "send" && settingsJson.service == "eventhub")
    await window.api.stopEventHubSend(settingsJson);
  else if (settingsJson.direction == "receive" && settingsJson.service == "eventhub")
    await window.api.stopEventHubReceive(settingsJson);
  else if (settingsJson.direction == "send" && settingsJson.service == "servicebus")
    await window.api.stopServiceBusSend(settingsJson);
  else if (settingsJson.direction == "receive" && settingsJson.service == "servicebus")
    await window.api.stopServiceBusReceive(settingsJson);
  else if (settingsJson.direction == "send" && settingsJson.service == "mqtt")
    await window.api.stopMqttSend(settingsJson);
  else if (settingsJson.direction == "receive" && settingsJson.service == "mqtt")
    await window.api.stopMqttReceive(settingsJson);
  else if (settingsJson.direction == "send" && settingsJson.service == "kafka")
    await window.api.stopKafkaSend(settingsJson);
  else if (settingsJson.direction == "receive" && settingsJson.service == "kafka")
    await window.api.stopKafkaReceive(settingsJson);

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

  $("#log_msg_lbl").parent().removeClass("is-danger is-link");
  if (type == "error") {
    $("#log_msg_lbl").parent().addClass("is-danger");
  }
  else if (type == "info") {
    $("#log_msg_lbl").parent().addClass("is-link");
  }
  else if (type == "clear") {
    //$("#log_msg_lbl").text("");
    $("#log_msg_lbl").text("&nbsp;");
    $("#log_msg_lbl").parent().addClass("hidden");
    return;
  }
  $("#log_msg_lbl").text(message);
  $("#log_msg_lbl").parent().removeClass("hidden");
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

  //check if both param3 is not available, 
  phGenOptions[phGenObjIndex].param3 == null
    ? $("#ph_" + phName + "_txt3").parent().parent().hide()
    : $("#ph_" + phName + "_txt3").parent().parent().show();

  //update parameter placeholder text
  $("#ph_" + phName + "_txt1").attr("placeholder", phGenOptions[phGenObjIndex].param1);
  $("#ph_" + phName + "_txt2").attr("placeholder", phGenOptions[phGenObjIndex].param2);
  $("#ph_" + phName + "_txt3").attr("placeholder", phGenOptions[phGenObjIndex].param3);
}


//update connection settings generation items parameters
function updateConSettingsGenParams(service, direction) {

  //get the placeholder index from the json
  objIndex = conSettingGenOptions.findIndex((obj) => obj.name == service && obj.direction == direction);

  //check if both param2 is available or not, param 1 will always be available, 
  conSettingGenOptions[objIndex].param2 == null
    ? $("#con_string_lbl2").parent().hide()
    : $("#con_string_lbl2").parent().show();

  conSettingGenOptions[objIndex].param3 == null
    ? $("#con_string_lbl3").parent().hide()
    : $("#con_string_lbl3").parent().show();

  conSettingGenOptions[objIndex].param4 == null
    ? $("#con_string_lbl4").parent().hide()
    : $("#con_string_lbl4").parent().show();

  conSettingGenOptions[objIndex].param5 == null
    ? $("#con_string_lbl5").parent().hide()
    : $("#con_string_lbl5").parent().show();

  $("#con_string_txt1").attr("placeholder", conSettingGenOptions[objIndex].param1Place);
  $("#con_string_txt2").attr("placeholder", conSettingGenOptions[objIndex].param2Place);
  $("#con_string_txt3").attr("placeholder", conSettingGenOptions[objIndex].param3Place);
  $("#con_string_txt4").attr("placeholder", conSettingGenOptions[objIndex].param4Place);
  $("#con_string_txt5").attr("placeholder", conSettingGenOptions[objIndex].param5Place);

  $("#con_string_lbl1").text(conSettingGenOptions[objIndex].param1);
  $("#con_string_lbl2").text(conSettingGenOptions[objIndex].param2);
  $("#con_string_lbl3").text(conSettingGenOptions[objIndex].param3);
  $("#con_string_lbl4").text(conSettingGenOptions[objIndex].param4);
  $("#con_string_lbl5").text(conSettingGenOptions[objIndex].param5);

}


//get the settings ready
function prepareSettings() {
  //updating connection settings
  settingsJson.connection = {
    param1: getValueInType($("#con_string_txt1").val(), "string", null),
    param2: getValueInType($("#con_string_txt2").val(), "string", null),
    param3: getValueInType($("#con_string_txt3").val(), "string", null),
    param4: getValueInType($("#con_string_txt4").val(), "string", null),
    param5: getValueInType($("#con_string_txt5").val(), "string", null)
  };

  //updating message template 
  settingsJson.messageBodyTemplate = getValueInType($("#msg_body_txt").val(), "string", null);
  //updating header template
  settingsJson.messageHeaderTemplate = getValueInType($("#msg_header_txt").val(), "string", null);
  //updating properties template
  settingsJson.messagePropertiesTemplate = getValueInType($("#msg_prop_txt").val(), "string", null);
  //updating delay settings
  settingsJson.delay = getValueInType($("#set_delay_txt").val(), "int", 10);
  //updating batch size settings
  settingsJson.batch = getValueInType($("#set_batch_txt").val(), "int", 1);
  //updating fixed count settings
  settingsJson.count = getValueInType($("#set_count_txt").val(), "int", 0);
  //bulk send option
  settingsJson.bulkSend = $("#set_bulk_check").prop("checked") == true;
  //update placeholder generation parameters to settings
  //loop though the placeholders
  for (var i = 0; i < settingsJson.placeholders.length; i++) {
    settingsJson.placeholders[i].param1 = getValueInType($("#ph_" + settingsJson.placeholders[i].id + "_txt1").val(), "string", null);
    settingsJson.placeholders[i].param2 = getValueInType($("#ph_" + settingsJson.placeholders[i].id + "_txt2").val(), "string", null);
    settingsJson.placeholders[i].param3 = getValueInType($("#ph_" + settingsJson.placeholders[i].id + "_txt3").val(), "string", null);
  }

}


//validate the settings provided
function validateSettings(methodName) {

  if ((methodName == "send" || methodName == "generate")
    && settingsJson.messageBodyTemplate == null) {
    printMessage("Please provide valid message body", "error");
    return false;
  }
  else if ((methodName == "send" || methodName == "generate")
    && settingsJson.messageBodyTemplate.includes("{{")
    && settingsJson.placeholders.length == 0) {
    printMessage("Please generate placeholders", "error");
    return false;
  }
  else if ((methodName == "send" || methodName == "receive")
    && settingsJson.connection.param1 == null) {
    printMessage("Please provide valid connection string", "error");
    return false;
  }
  if ((methodName == "placeholderGenerate")
    && settingsJson.messageBodyTemplate == null
    && settingsJson.messageHeaderTemplate == null
    && settingsJson.messagePropertiesTemplate == null) {
    printMessage("Please provide valid message body", "error");
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
        <div class="label pt-2">{{placeholderName}}</div>
      </div>
      <div class="column is-6">
        <div class="select is-fullwidth">
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
        <input class="input" id="ph_{{placeholderName}}_txt1" type="text" placeholder="Min" />
      </div>
      <div class="column is-6">
        <input class="input" id="ph_{{placeholderName}}_txt2" type="text" placeholder="Max" />
      </div>
    </div>
    <div class="columns mb-0">
      <div class="column is-12">
        <input class="input" id="ph_{{placeholderName}}_txt3" type="text" placeholder="List" />
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
    param1: "Device connection string *",
    param1Place: "Device connection string",
    param2: "Connection protocol",
    param2Place: "mqtt/amqp/mqttws/amqpws/http",
  },
  {
    name: "eventhub",
    direction: "send",
    param1: "Event hub connection string *",
    param1Place: "Event hub connection string",
  },
  {
    name: "servicebus",
    direction: "send",
    param1: "Service bus connection string *",
    param1Place: "Service bus connection string",
    param2: "Topic/Queue name *",
    param2Place: "Service bus topic/queue name",
  },
  {
    name: "mqtt",
    direction: "send",
    param1: "mqtt connection string"
  },
  {
    name: "iothub",
    direction: "receive",
    param1: "Device connection string *",
    param1Place: "Device connection string",
    param2: "Connection protocol",
    param2Place: "mqtt/amqp/mqttws/amqpws/http",
  },
  {
    name: "eventhub",
    direction: "receive",
    param1: "Event hub connection string *",
    param1Place: "Event hub connection string",
    param2: "Consumer group name",
    param2Place: "Consumer group name",
    param3: "Storage account connection string",
    param3Place: "Storage account connection string",
    param4: "Storage account container name",
    param4Place: "Storage account container name"
  },
  {
    name: "servicebus",
    direction: "receive",
    param1: "Service bus connection string *",
    param1Place: "Service bus connection string",
    param2: "Topic/Queue name *",
    param2Place: "Service bus topic/queue name",
    param3: "Topic Subscription name",
    param3Place: "Service bus topic subscription name",
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
