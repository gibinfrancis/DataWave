//variables
var SettingsJson = {
  direction: "send", //send/receive
  service: "iothub", //iothub/eventhub/servicebus/mqtt
  messageBodyTemplate: "",
  messageHeaderTemplate: "",
  placeholders: [],
  connection: {},
  protocol: "http", //mqtt/amqp/mqttws/amqpws/http - htt now and will add more in future
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
  $("#cntl_stop_btn").on("click", () => stopButtonClickHandler);
});

//on log update trigger
window.api.onLogUpdate((_event, message, type) => {
  printLogMessage(message, type);
});

//-----------------------------------------------------
//-----------------PLACEHOLDER GEN BUTTON--------------
//-----------------------------------------------------
function placeholderGenButtonClickHandler() {
  //get the template content
  const templateString = $("#msg_body_txt").val();
  //get placeholder strings from the template
  const placeholders = templateString
    .match(/\{\{(.+?)\}\}/g)
    .map((placeholder) => placeholder.replace(/[{}]/g, ""));

  //iterate through all placeholders
  placeholders.forEach((placeholder) => {
    const phType = "stringRandom";
    //check if the placeholder is already present
    if ($("#ph_" + placeholder).length) return;
    //create a new div element to placed with placeholder card template
    const childElement = document.createElement("div");
    //prepare placeholder object for adding to list
    var phObj = {
      id: placeholder,
      type: phType,
    };
    //append the placeholder card with placeholder name
    childElement.innerHTML = phCardTemplate.replaceAll(
      "{{placeholderName}}",
      placeholder
    );
    //adding the child
    $("#placeholderWrap").append(childElement);

    //adding the change event to drop down
    $("#ph_opt_" + placeholder + "_sel").change(genOptionDropdownClickHandler);

    //update params within placeholder
    updatePlaceholderGenParams(placeholder, phType);

    //adding the placeholder to config
    SettingsJson.placeholders.push(phObj);
  });
}

//-----------------------------------------------------
//---PLACEHOLDER GEN OPTION DROPDOWN SELECT------------
//-----------------------------------------------------
function genOptionDropdownClickHandler() {
  var type = $("option:selected", this).val();
  //get the placeholder name
  const phName = $(this).data("name");
  //get the placeholder index from the settings json
  objIndex = SettingsJson.placeholders.findIndex((obj) => obj.id == phName);
  //update the configuration
  SettingsJson.placeholders[objIndex].type = type;
  //update params within placeholder
  updatePlaceholderGenParams(phName, type);

  console.log(SettingsJson.placeholders);
}

//update placeholder generation items parameters
function updatePlaceholderGenParams(phName, type) {
  //get the placeholder index from the settings json
  phGenObjIndex = phGenOptions.findIndex((obj) => obj.name == type);

  phGenOptions[phGenObjIndex].param1 == null &&
  phGenOptions[phGenObjIndex].param2 == null
    ? $("#ph_" + phName + "_txt1")
        .parent()
        .parent()
        .hide()
    : $("#ph_" + phName + "_txt1")
        .parent()
        .parent()
        .show();

  phGenOptions[phGenObjIndex].param3 == null
    ? $("#ph_" + phName + "_txt3")
        .parent()
        .parent()
        .hide()
    : $("#ph_" + phName + "_txt3")
        .parent()
        .parent()
        .show();
}

//-----------------------------------------------------
//-----------------DIRECTION BUTTONS-------------------
//-----------------------------------------------------
function directionButtonClickHandler(e) {
  //get the button text as the chosen direction
  SettingsJson.direction = $(e.target)[0].innerText.toLowerCase();

  //remove highlighted class from all buttons
  $(".dir_btn").removeClass("is-link");

  //add highlighted class to current button
  $("#" + e.target.id).addClass("is-link");
}

//-----------------------------------------------------
//-----------------SERVICES BUTTONS--------------------
//-----------------------------------------------------
function serviceButtonClickHandler(e) {
  //get the button text as the chosen direction and remove spaces in it
  SettingsJson.service = $(e.target)[0]
    .innerText.toLowerCase()
    .replace(" ", "");

  //remove highlighted class from all buttons
  $(".serv_btn").removeClass("is-link");

  //add highlighted class to current button
  $("#" + e.target.id).addClass("is-link");
}

//-----------------------------------------------------
//-----------------START BUTTON------------------------
//-----------------------------------------------------
async function startButtonClickHandler() {
  //updating connection settings
  SettingsJson.connection = {
    connectionPram1: $("#con_string_txt1").val(),
    connectionPram2: $("#con_string_txt2").val(),
  };

  //updating template settings
  SettingsJson.messageBodyTemplate = $("#msg_body_txt").val();
  //update placeholder generation parameters to settings
  updatePhGenParametersToSettings(SettingsJson.placeholders);

  console.log(SettingsJson.placeholders);

  //invoke main service to start simulation
  //await window.api.startIoTHubSimulation(SettingsJson);
}

function updatePhGenParametersToSettings(placeholders) {
  for (var i = 0; i < placeholders.length; i++) {
    placeholders[i].param1 =
      $("#ph_" + placeholders[i].id + "_txt1").val().trim() == "" ? null : $("#ph_" + placeholders[i].id + "_txt1").val().trim();
    placeholders[i].param2 =
    $("#ph_" + placeholders[i].id + "_txt2").val().trim() == "" ? null : $("#ph_" + placeholders[i].id + "_txt2").val().trim();
    placeholders[i].param3 =
    $("#ph_" + placeholders[i].id + "_txt3").val().trim() == "" ? null : $("#ph_" + placeholders[i].id + "_txt3").val().trim();
  }
}

//-----------------------------------------------------
//-----------------STOP BUTTON-------------------------
//-----------------------------------------------------
function stopButtonClickHandler() {}

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

const html = `
    <div>
      <h4>{title}</h4>
      <p>My name is {name}</p>
      <img src="{url}" />
    </div>
  `;

const data = {
  title: "My Profile",
  name: "John Smith",
  url: "http://images/john.jpeg",
};

//-----------------------------------------------------------------
//------------------common services--------------------------------
//-----------------------------------------------------------------

const phCardTemplate = `
<div class="card mb-2" id="ph_{{placeholderName}}">
  <div class="card-content p-2">
    <div class="columns mb-0">
      <div class="column is-6">
        <div class="label is-small pt-2">{{placeholderName}}</div>
      </div>
      <div class="column is-6">
        <div class="select is-small">
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
            <!-- Advanced -->
            <option value="advanced">Advanced</option>
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
  {
    name: "advanced",
    param3: "Your EVAL statement",
  },
];
