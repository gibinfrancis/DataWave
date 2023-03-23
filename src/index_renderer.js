//variables
var SettingsJson = {
  direction: "send", //send/receive
  service: "iothub", //iothub/eventhub/servicebus/mqtt
  messageBodyTemplate: "",
  messageHeaderTemplate: "",
  placeholders: [],
  connection: {},
  protocol: "mqtt", //mqtt/amqp/mqttws/amqpws/http
};

//when the document is ready
$(function () {

  //direction button click binding
  $(".dir_btn").on("click", (e) => directionButtonClickHandler(e));

  //service button click binding
  $(".serv_btn").on("click", (e) => serviceButtonClickHandler(e));

  //placeholders refresh button
  //click event
  $("#placehold_gen_btn").on("click", () => {
    //get the template content
    const templateString = $("#msg_body_txt").val();
    //get placeholder strings from the template
    const placeholders = templateString
      .match(/\{\{(.+?)\}\}/g)
      .map((placeholder) => placeholder.replace(/[{}]/g, ""));

    //iterate through all placeholders
    placeholders.forEach((placeholder) => {
      //check if the parameter is already present
      if ($("#param_" + placeholder).length) return;
      //create a new div element to placed with param card template
      const childElement = document.createElement("div");
      //prepare param object for adding to list
      var paramObj = {
        id: placeholder,
        type: "stringrandom",
      };
      //append the param card with parameter name
      childElement.innerHTML = paramCardTemplate.replaceAll(
        "{{ParamName}}",
        placeholder
      );
      //adding the child
      $("#paramWrap").append(childElement);
      //adding the change event to drop down
      $("#param_opt_" + placeholder + "_sel").change(function () {
        var type = $("option:selected", this)
          .text()
          .replaceAll("-", "")
          .toLowerCase();
        //get the parameter name
        const paramName = $(this).data("paramname");
        //get the parameter index from the settings json
        objIndex = SettingsJson.placeholders.findIndex(
          (obj) => obj.id == paramName
        );
        //update the configuration
        SettingsJson.placeholders[objIndex].type = type;
      });

      //adding the parameter to config
      SettingsJson.placeholders.push(paramObj);
    });
  });

  //start button click event
  $("#cntl_start_btn").on("click", startButtonClickHandler);

  //stop button click event
  $("#cntl_stop_btn").on("click", () => stopButtonClickHandler);
});

//on log update trigger
window.api.onLogUpdate((_event, message, type) => {
  printLogMessage(message, type)
});


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

  //window.electronAPI.startSimulation(SettingsJson, generatedMessageBody);
  await window.api.startIoTHubSimulation(SettingsJson);

}


//-----------------------------------------------------
//-----------------STOP BUTTON-------------------------
//-----------------------------------------------------
function stopButtonClickHandler() {

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

const paramCardTemplate = `
<div class="card mb-2 id="param_{{ParamName}}" ">
  <div class="card-content p-2">
    <div class="columns mb-0">
      <div class="column is-6">
        <div class="label is-small pt-2">{{ParamName}}</div>
      </div>
      <div class="column is-6">
        <div class="select is-small">
          <select id="param_opt_{{ParamName}}_sel" data-paramname="{{ParamName}}">
            <!-- string -->
            <option value="StringRandom" selected>String-Random</option>
            <option value="StringRandomList">String-RandomList</option>
            <option value="StringRandomList">String-SequenceList</option>
            <!-- int -->
            <option value="IntegerRandom">Integer-Random</option>
            <option value="IntegerRandomList">Integer-RandomList
            </option>
            <option value="IntegerRandomList">Integer-SequenceList</option>
            <option value="IntegerStepBy">Integer-StepBy</option>
            <!-- double -->
            <option value="DoubleRandom">Double-Random</option>
            <option value="DoubleRandomList">Double-RandomList</option>
            <option value="DoubleRandomList">Double-SequenceList</option>
            <option value="DoubleStepBy">Double-StepBy</option>
            <!-- bool -->
            <option value="BooleanStepBy">Boolean-Random</option>
            <option value="BooleanRandomList">Boolean-SequenceList</option>
            <!-- guid -->
            <option value="Guid">Guid</option>
            <!-- time -->
            <option value="TimeInUtc">Time-InUtc</option>
            <option value="TimeInUtc">Time-InUtc</option>
            <option value="TimeInEpoch">Time-InEpoch</option>
            <option value="TimeInEpochMilli">Time-InEpochMilli</option>
            <!-- Advanced -->
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>
    </div>
    <div class="columns mb-0">
      <div class="column is-6">
        <input class="input is-small" id="param_{{ParamName}}_txt1" type="text" placeholder="Min" />
      </div>
      <div class="column is-6">
        <input class="input is-small" id="param_{{ParamName}}_txt2" type="text" placeholder="Max" />
      </div>
    </div>
    <div class="columns">
      <div class="column is-12">
        <input class="input is-small" id="param_{{ParamName}}_txt3" type="text" placeholder="List" />
      </div>
    </div>
  </div>          
  </div>
  `;
