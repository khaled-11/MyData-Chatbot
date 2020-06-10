/////////////////////////////////////////////////
/// Handles Postback & Quick_Replies function ///
/////////////////////////////////////////////////
const callSendAPI = require("./callSendAPI"),
i18n = require("i18n"),
session = require('express-session'),
updateCheck = require("../database/updateCheck");

module.exports = async (sender_psid, webhook_event) => {
let app = "second";
// Sending "Sender Action" while waiting for the requested data!
response = null;
action = "mark_seen";
state = await callSendAPI(sender_psid, response, action, app);   
  
// Sending "Sender Action" while waiting for the requested data!
response = null;
action = "typing_on";
state = await callSendAPI(sender_psid, response, action, app);
console.log(sender_psid + " Messege Received to the " + app + " App!!");
  
// Check if the user exists in the Database and get Data.
check = await updateCheck(sender_psid, app, "handle postback");
first_name = check[0];
current_locale = check [1];
general_state = check [2];
console.log(general_state);
documents = check [3];
translation = check [4];
i18n.setLocale(check[1]);

// Check if Normal Postback or Quick_Replies Postback. 
// Both cases will have an appropiate payload.
if (webhook_event.postback){
  payload = webhook_event.postback.payload;
  console.log(sender_psid + " Postback Received!!");
} else {
  payload = webhook_event.message.quick_reply.payload;
  console.log(sender_psid + " Quick_Reply Postback Received!!");
}

///////////////////////////////////////////////////
///                Starting Step                ///
///   If this is the first entry for the user.  ///
///////////////////////////////////////////////////
if (payload === 'GET_STARTED') {

action = null;
response = {
"text": i18n.__("menu.welcome", {fName: first_name}), 
"quick_replies":[
  {
    "content_type":"text",
    "title":i18n.__("menu.image_to_text"),
    "payload":"IM"
  },{
    "content_type":"text",
    "title":i18n.__("menu.text_to_audio"),
    "payload":"MENU"
  },{
    "content_type":"text",
    "title":i18n.__("menu.summary"),
    "payload":"MENU"
  },{
    "content_type":"text",
    "title":i18n.__("menu.extractor"),
    "payload":"MENU"
  }]
}
// Calling the Main Menu (QUICK_REPLY) function.  
} else if (payload === 'MENU'){
  response = {
    "text": i18n.__("menu.welcome", {fName: first_name}), 
    "quick_replies":[
      {
        "content_type":"text",
        "title":i18n.__("menu.image_to_text"),
        "payload":"IM"
      },{
        "content_type":"text",
        "title":i18n.__("menu.text_to_audio"),
        "payload":"MENU"
      },{
        "content_type":"text",
        "title":i18n.__("menu.summary"),
        "payload":"MENU"
      },{
        "content_type":"text",
        "title":i18n.__("menu.extractor"),
        "payload":"MENU"
      }]}
} else if (payload === 'IM'){
  response = {"text": `I am your Smart Image Reader. I can Extract text from images or screenshots. I can also provide a summary and save the generated data for the future!`}
      action = null;
      state = await callSendAPI(sender_psid, response, action, app);
      response = {"text": `Unfortunatelly, we can read Only English text in Images. To start, please send an Image!!`}
  }
  action = null;
  state = await callSendAPI(sender_psid, response, action, app);

  // Sleep Funtion to put the App to sleep before reading the image again
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

}