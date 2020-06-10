////////////////////////////////////////////////////
/// Handle Regular text and Attachments function ///
////////////////////////////////////////////////////
const callSendAPI = require("./callSendAPI"),
i18n = require("i18n"),
session = require('express-session'),
passThread = require("./pass_thread"),
updateCheck = require("../database/updateCheck"),
update = require("../database/update_data"),
audio = require("../other/get_audio"),
myD = require("../other/image_to_text"),
myU = require("../other/translate_text"),
readImage = require("../other/read_image");

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
  let received_message = webhook_event.message;
  
  // Check if the user exists in the Database and get Data.
  check = await updateCheck(sender_psid, app, "handle messages");
  first_name = check[0];
  current_locale = check [1];
  general_state = check [2];
  console.log(general_state);
  documents = check [3];
  translation = check [4];
  i18n.setLocale(check[1]);
    
// Checks if the message contains text
if (received_message.text) {  
console.log(sender_psid + " Received message was text!!");
// Changing the text to lower case to check for keywords.
var text = received_message.text.trim().toLowerCase();
if  (text.includes("hi")) {
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
    action = null;
    state = await callSendAPI(sender_psid, response, action, app);
  }
  else if  (text.includes("app2")) {
    t = await passThread(sender_psid, 'second');
    // if (t.success)
    // response = { 
    //   "attachment":{
    //   "type":"template",
    //   "payload":{
    //     "template_type":"button",
    //     "text":"Arabic Translation!",
    //     "buttons":[
    //       {
    //         "type":"web_url",
    //         "url":`${process.env.URL}`,
    //         "title":"Log"
    //       }
    //     ]
    //   }}
    // }  
    // action = null;
    // state = await callSendAPI(sender_psid, response, action, app);
  } else if  (text.includes("app1")) {
    t = await passThread(sender_psid, 'first');    
    // response = { 
    //     "attachment":{
    //       "type":"template",
    //       "payload":{
    //         "template_type":"button",
    //         "text":"Arabic Translation!",
    //         "buttons":[
    //           {
    //             "type":"web_url",
    //             "url":`${process.env.URL}`,
    //             "title":"Log"
    //           }
    //         ]
    //     }
    //   }
    // } 
    // action = null;
    // state = await callSendAPI(sender_psid, response, action, 'first');
    } else {
      var text2 = received_message.text.trim().toLowerCase();
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
      action = null;
      state = await callSendAPI(sender_psid, response, action, app);  
    }
    } else if (received_message.attachments) {
      console.log(sender_psid + " Received message was an attacment!!");
      // Get the URL of the message attachment
      attachmentUrl = webhook_event.message.attachments[0].payload.url;
      // Read and write the Image from URL to a file with a link.
      console.log(documents.length);
      var request = await readImage(sender_psid, attachmentUrl, documents.length);
      console.log("Image Read, and wrote to a file Successfully!!");
      // Sleep until File is closed.
      await sleep(500);
      // Call the Function that will extract the text, and save it.
      test = await myD(sender_psid, documents.length);
      console.log("Extracted, and saved the File!");
      // Sleep until File is closed.
      await sleep(500);
      //Sending the file to the user.
      response = { "text":"Here is the text file!"};
      action = null;
      state = await callSendAPI(sender_psid, response, action, app);
      response = {
        "attachment":{
        "type":"file", 
        "payload":{
          "url":`${process.env.URL}/${sender_psid}/${documents.length}.txt`, 
          "is_reusable":true
        }
      }}
      action = null;
      state = await callSendAPI(sender_psid, response, action, app);
      t = await update([sender_psid,documents.length,test,"documents"]);
      po = await audio(`./files/${sender_psid}/${documents.length}.txt`,sender_psid,documents.length,'Kimberly');
      await sleep(500);
      // Sending the Audio file to the user.
      response = { "text":"Here is the audio file!"};
      action = null;
      state = await callSendAPI(sender_psid, response, action, app);
      response = {
        "attachment":{
        "type":"audio", 
        "payload":{
          "url":`${process.env.URL}/${sender_psid}/${documents.length}.mp3`, 
          "is_reusable":true
        }
      }}
    action = null;
    state = await callSendAPI(sender_psid, response, action, app);
    check = await updateCheck(sender_psid);
    documents = await check[3];
    //console.log(doc);
    state = await myU(sender_psid, documents);
    uu = await update([sender_psid, translation.length,state,"translatedDocs"]);
    
    await sleep(500);
    
    // Sending the Audio file to the user.
    response = { "text":"Here is the transaltion file!"};
    action = null;
    state = await callSendAPI(sender_psid, response, action, app);
    
    response = { 
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"button",
          "text":"Arabic Translation!",
          "buttons":[
            {
              "type":"web_url",
              "url":`${process.env.URL}/${sender_psid}/${documents.length - 1}_translation.txt`,
              "title":"The Translation"
            }
          ]
        }
      }
    }
    
    action = null;
    state = await callSendAPI(sender_psid, response, action, app);
    
    po = await audio(`./files/${sender_psid}/${documents.length - 1}_translation.txt`,sender_psid,documents.length,'Zeina');
    
    await sleep(500);
    // Sending the Audio file to the user.
    response = { "text":"Here is the translation audio file!"};
    action = null;
    state = await callSendAPI(sender_psid, response, action, app);
    response = {
      "attachment":{
      "type":"audio", 
      "payload":{
        "url":`${process.env.URL}/${sender_psid}/${documents.length - 1}_translation.mp3`, 
        "is_reusable":true
      }
    }}
    action = null;
    state = await callSendAPI(sender_psid, response, action, app);
    
    
    
    }   
    
    // Sleep Funtion to put the App to sleep before reading the image again
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
}

// response = { 
//   "attachment":{
//   "type":"template",
//   "payload":{
//   "template_type":"button",
//   "text":"Welcome  ",
//   "buttons":[
//       {
//             "type":"postback",
//             "payload":"TRANSLATE",
//             "title":"Image to Code"
//           },
//           {
//             "type":"postback",
//             "payload":"UPLOAD",
//             "title":"Upload a Webpage"
//           },
//           {
//             "type":"postback",
//             "payload":"LINK",
//             "title":"View My Link"
//           }
//         ]
//       }
//     }
//   }