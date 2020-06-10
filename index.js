// Importing Dependencies //
const express = require('express'),
bodyParser = require('body-parser'),
session = require('express-session'),
path = require("path"),
i18n = require("./i18n.js"),
// Importing Local Modules //
firstMessages = require("./local_modules/messenger/first_handle_messages"),
firstPostbacks = require("./local_modules/messenger/first_handle_postbacks"),
secondMessages = require("./local_modules/messenger/second_handle_messages"),
secondPostpacks = require("./local_modules/messenger/second_handle_postbacks"),
createTable = require("./local_modules/database/create_table");

// Calling Create Table to create a DynamoDB Table.
// If exists, nothing will be done.
createTable();

// Creating App Object and using BodyParser.
app = express();
app.use(bodyParser.json());

// Setting Views folder and using EJS engine for rendering
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "files")));
app.set("view engine", "ejs");

// Using Exppress Session for User Authentication.
// User will be logged in with the sender_psid.
// This will help implementing access protection for the files.
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

// Sending the main index Page //  
app.get('/', function(request, response) {
	response.render("index");
});



 


/////////////////////////////////////////////////////////////
/// Webhook Endpoint For the First Facebook Messenger App ///
/////////////////////////////////////////////////////////////
app.post('/webhook', (req, res) => {  
  let body = req.body;
  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
    let webhook_event;
    // Gets the body of the webhook event
    if(entry.messaging){
      webhook_event = entry.messaging[0];         
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      // Check if the event is a Message or Postback or Quick Replies.
      // Pass the event to handlePostBack function if Quick Reply or Postback.
      // Otherwise, pass the event to handleMessage function.
      if (sender_psid != process.env.PAGE_ID && webhook_event.message && !webhook_event.message.quick_reply) {
        console.log('The First App is Active for user ' + sender_psid);
        firstMessages(sender_psid, webhook_event,app);  
      } else if (sender_psid != process.env.PAGE_ID && (webhook_event.postback || (webhook_event.message && webhook_event.message.quick_reply))) {
        console.log('The First App is Active for user ' + sender_psid);
        firstPostbacks(sender_psid, webhook_event,app);
      }
    } else {
      webhook_event = entry.standby[0]; 
      let sender_psid = webhook_event.sender.id;
      if (webhook_event.message){
        if (sender_psid != process.env.PAGE_ID){
        console.log("The First App is Listening for user " + sender_psid);
        }
      }}
    });
  // Returns a '200 OK' response to all requests
  res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];      
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {   
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);  
    } else {
    // Responds with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);      
    }
  }
});

//////////////////////////////////////////////////////////////
/// Webhook Endpoint For the Second Facebook Messenger App ///
//////////////////////////////////////////////////////////////
app.post('/webhook2', (req, res) => {  
  let body = req.body;
  // // Checks this is an event from a page subscription
  if (body.object === 'page') {
    body.entry.forEach(function(entry) {
    let webhook_event;
    // Gets the body of the webhook event
    if(entry.messaging){
      webhook_event = entry.messaging[0]; 
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      // Check if the event is a Message or Postback or Quick Replies.
      // Pass the event to handlePostBack function if Quick Reply or Postback.
      // Otherwise, pass the event to handleMessage function.
      if (webhook_event.message && !webhook_event.message.quick_reply && sender_psid != process.env.PAGE_ID) {
        console.log('The Second App is Active for user ' + sender_psid);
        secondMessages(sender_psid, webhook_event);        
      } else if (sender_psid != process.env.PAGE_ID && (webhook_event.postback || (webhook_event.message && webhook_event.message.quick_reply))) {
        console.log('The Second App is Active for user ' + sender_psid);
        secondPostpacks(sender_psid, webhook_event);
      }
    } else {
      webhook_event = entry.standby[0]; 
      let sender_psid = webhook_event.sender.id;
      if (webhook_event.message){
        if (sender_psid != process.env.PAGE_ID){
      console.log("The Second App is Listening for USER " + sender_psid);
        }
      }
    }
  });
  // Returns a '200 OK' response to all requests
  res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Adds support for GET requests to our webhook
app.get('/webhook2', (req, res) => {    
// Parse the query params
let mode = req.query['hub.mode'];
let token = req.query['hub.verify_token'];
let challenge = req.query['hub.challenge'];
// Checks if a token and mode is in the query string of the request
if (mode && token) {
  // Checks the mode and token sent is correct
  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {   
    // Responds with the challenge token from the request
    console.log('WEBHOOK-2_VERIFIED');
    res.status(200).send(challenge);  
  } else {
  // Responds with '403 Forbidden' if verify tokens do not match
  res.sendStatus(403);      
  }
}
});

// listen for webhook events //
app.listen(process.env.PORT || 3370, () => console.log('webhook is listening'));



// /////////////////////////////////////////////////////////////
// //   Asynchronous function to send responses to the user   //
// //      It will keep the order of the replies if many.     //
// /////////////////////////////////////////////////////////////
// async function callSendAPI(sender_psid, response, action, app) {
// // Construct the message body
// var request_body;
// var state;
// var token;
// // Check if the request body is an action or a response.
// if (!action){
//   request_body = {
//   "recipient": {
//   "id": sender_psid
//   },
//   "message": response
// }}
// else {
//   request_body = {
//   "recipient": {
//   "id": sender_psid
//   },
//   "sender_action":"typing_on"
// }}
// if (app === "second") {
//   console.log("Reply " + app);
//   token = process.env.PAGE_ACCESS_TOKEN2;
// } else {
//   console.log("Reply " + app);
//   token = process.env.PAGE_ACCESS_TOKEN;
// }
// // Try the request after setting up the request_body.
// try{
//   var options = {
//     method: 'POST',
//     uri: `https://graph.facebook.com/v2.6/me/messages?access_token=${token}`,
//     body: request_body,
//     json: true
//   };
// state = await rp(options);
// if (state.message_id){
//   console.log(state.recipient_id + " Replied!!");
// } else {
//   console.log(state.recipient_id + " Sender Actions Sent!!");
// }
// }
// catch (e){
//   //console.log(e);
// }
//  return state;
// }

// ///////////////////////////////////////////////////////////////////////
// // Asynchronous Function to check if the user exists in the Database //
// //     If the user exists it will return his personal information    //
// //  If not, it will create a new entry fot the user in the database  //
// ///////////////////////////////////////////////////////////////////////
// async function updateCheck(sender_psid){
//   var result = [];
//   // Check if the user is already in the database.
//   // Both cases will end up by reading the data from DynamoDB.
//   // Covers the case if a TESTING-BOT starts with a message!!
//   const check = await exists(sender_psid);
//   // If exists, request the data and avoid writing new Data.
//   // Incase the user deleted the conversation by mistake.
//   if (check === true)
//   {
//     console.log(sender_psid + " is an old user (handleMessages)!!");
//     const data = await getData(sender_psid);
//     result [0] = data.Item.first_name.S;
//     result [1] = data.Item.Locale.S;
//     console.log(sender_psid + " Locale is set to " + result[1]);
//     result [2] = data.Item.general_state.S;
//     result [3] = data.Item.documents.L;
//     result [4] = data.Item.translatedDocs.L;
//     if (!fs.existsSync(`./files/${sender_psid}`)){
//       fs.mkdirSync(`./files/${sender_psid}`);
//     }
//   // If this is the first visit, request personal Data from Facebook.
//   // Then add the data to the DynamoDB and intialize user trackers.  
//   } else {
//     console.log(sender_psid + " is a New user (handleMessages)!!");
//     const t = await requestData(sender_psid);
//     const m = await putData(t);
//     const data = await getData(sender_psid);
//     result[0] = data.Item.first_name.S;
//     result[1] = data.Item.Locale.S;
//     console.log(sender_psid + " Locale is set to " + result[1]);
//     result [2] = data.Item.general_state.S;
//     result [3] = data.Item.documents.L;
//     result [4] = data.Item.translatedDocs.L;
//     if (!fs.existsSync(`./files/${sender_psid}`)){
//       fs.mkdirSync(`./files/${sender_psid}`);
//     }
//   }
//   return result;
// }

// /////////////////////////////////////////////////
// /// Handles Postback & Quick_Replies function ///
// /////////////////////////////////////////////////
// async function handlePostback(sender_psid, webhook_event) { 
// // Variables for the payload, response, user info ,and trackers.
// var response;
// let payload;
// let first_name;
// let current_locale;
// let general_state;   
// let documents;
// let translation;
// // Check if Normal Postback or Quick_Replies Postback. 
// // Both cases will have an appropiate payload.
// if (webhook_event.postback){
//   payload = webhook_event.postback.payload;
//   console.log(sender_psid + " Postback Received!!");
// } else {
//   payload = webhook_event.message.quick_reply.payload;
//   console.log(sender_psid + " Quick_Reply Postback Received!!");
// }

// // Sending "Sender Action" while waiting for the requested data!
// response = null;
// action = "typing_on";
// state = await callSendAPI(sender_psid, response, action);

// check = await updateCheck(sender_psid);
// first_name = check[0];
// current_locale = check [1];
// general_state = check [2];
// documents = check [3];
// translation = check [4];
// //if (check[1] != )
// i18n.setLocale(check[1]);

// ///////////////////////////////////////////////////
// ///                Starting Step                ///
// ///   If this is the first entry for the user.  ///
// ///////////////////////////////////////////////////
// if (payload === 'GET_STARTED') {

// action = null;
// response = {
// "text": i18n.__("menu.welcome", {fName: first_name}), 
// "quick_replies":[
//   {
//     "content_type":"text",
//     "title":i18n.__("menu.image_to_text"),
//     "payload":"IM"
//   },{
//     "content_type":"text",
//     "title":i18n.__("menu.text_to_audio"),
//     "payload":"MENU"
//   },{
//     "content_type":"text",
//     "title":i18n.__("menu.summary"),
//     "payload":"MENU"
//   },{
//     "content_type":"text",
//     "title":i18n.__("menu.extractor"),
//     "payload":"MENU"
//   }]
// }
// // Calling the Main Menu (QUICK_REPLY) function.  
// } else if (payload === 'MENU'){
//   response = {
//     "text": i18n.__("menu.welcome", {fName: first_name}), 
//     "quick_replies":[
//       {
//         "content_type":"text",
//         "title":i18n.__("menu.image_to_text"),
//         "payload":"IM"
//       },{
//         "content_type":"text",
//         "title":i18n.__("menu.text_to_audio"),
//         "payload":"MENU"
//       },{
//         "content_type":"text",
//         "title":i18n.__("menu.summary"),
//         "payload":"MENU"
//       },{
//         "content_type":"text",
//         "title":i18n.__("menu.extractor"),
//         "payload":"MENU"
//       }]}
// } else if (payload === 'IM'){
//   response = {"text": `I am your Smart Image Reader. I can Extract text from images or screenshots. I can also provide a summary and save the generated data for the future!`}
//       action = null;
//       state = await callSendAPI(sender_psid, response, action);
//       response = {"text": `Unfortunatelly, we can read Only English text in Images. To start, please send an Image!!`}
//   }
//   action = null;
//   state = await callSendAPI(sender_psid, response, action);
// }



// ////////////////////////////////////////////////////
// /// Handle Regular text and Attachments function ///
// ////////////////////////////////////////////////////
// async function handleMessage(sender_psid, webhook_event, app) {
// console.log(sender_psid + " Messege Received!!");
// // Variables for the payload, response, user info ,and trackers.
// let received_message = webhook_event.message;
// let response;
// let first_name;
// let current_locale;
// let general_state;
// let documents;
// let translation;

// // Sending "Sender Action" while waiting for the requested data!
// response = null;
// action = "typing_on";
// state = await callSendAPI(sender_psid, response, action, app);


// console.log(sender_psid);
// check = await updateCheck(sender_psid);
// first_name = check[0];
// current_locale = check [1];
// general_state = check [2];
// documents = check [3];
// translation = check [4];
// i18n.setLocale(check[1]);

// // Checks if the message contains text
// if (received_message.text) {  
// console.log(sender_psid + " Received message was text!!");
// // Create the payload for a basic text message, which
// // will be added to the body of our request to the Send API
// var text = received_message.text.trim().toLowerCase();
// if  (text.includes("hi")) {
//   // response = { 
//   //   "attachment":{
//   //   "type":"template",
//   //   "payload":{
//   //   "template_type":"button",
//   //   "text":"Welcome  ",
//   //   "buttons":[
//   //       {
//   //             "type":"postback",
//   //             "payload":"TRANSLATE",
//   //             "title":"Image to Code"
//   //           },
//   //           {
//   //             "type":"postback",
//   //             "payload":"UPLOAD",
//   //             "title":"Upload a Webpage"
//   //           },
//   //           {
//   //             "type":"postback",
//   //             "payload":"LINK",
//   //             "title":"View My Link"
//   //           }
//   //         ]
//   //       }
//   //     }
//   //   }
// response = {
//   "text": i18n.__("menu.welcome", {fName: first_name}), 
//   "quick_replies":[
//     {
//       "content_type":"text",
//       "title":i18n.__("menu.image_to_text"),
//       "payload":"IM"
//     },{
//       "content_type":"text",
//       "title":i18n.__("menu.text_to_audio"),
//       "payload":"MENU"
//     },{
//       "content_type":"text",
//       "title":i18n.__("menu.summary"),
//       "payload":"MENU"
//     },{
//       "content_type":"text",
//       "title":i18n.__("menu.extractor"),
//       "payload":"MENU"
//     }]
//   }
// action = null;
// state = await callSendAPI(sender_psid, response, action, app);
// }
// else if  (text.includes("app2")) {
//   t = await passThread(sender_psid, 'second');
//   response = { 
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
//       }
//     }
//   }
  
//   action = null;
//   state = await callSendAPI(sender_psid, response, action, 'second');
// }else if  (text.includes("app1")) {
//   t = await passThread(sender_psid, 'first');

//   response = { 
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
//       }
//     }
//   }
  
//   action = null;
//   state = await callSendAPI(sender_psid, response, action, 'first');
// }
//  else {
//   var text2 = received_message.text.trim().toLowerCase();
//   response = {
//     "text": i18n.__("menu.welcome", {fName: first_name}), 
//     "quick_replies":[
//       {
//         "content_type":"text",
//         "title":i18n.__("menu.image_to_text"),
//         "payload":"IM"
//       },{
//         "content_type":"text",
//         "title":i18n.__("menu.text_to_audio"),
//         "payload":"MENU"
//       },{
//         "content_type":"text",
//         "title":i18n.__("menu.summary"),
//         "payload":"MENU"
//       },{
//         "content_type":"text",
//         "title":i18n.__("menu.extractor"),
//         "payload":"MENU"
//       }]
//     }
//   action = null;
//   state = await callSendAPI(sender_psid, response, action);  
// }
// } else if (received_message.attachments) {
//   console.log(sender_psid + " Received message was an attacment!!");
//   // Get the URL of the message attachment
//   attachmentUrl = webhook_event.message.attachments[0].payload.url;
//   // Read and write the Image from URL to a file with a link.
//   console.log(documents.length);
//   var request = await readImage(sender_psid, attachmentUrl, documents.length);
//   console.log("Image Read, and wrote to a file Successfully!!");
//   // Sleep until File is closed.
//   await sleep(1500);
//   // Call the Function that will extract the text, and save it.
//   test = await myD(sender_psid, documents.length);
//   console.log("Extracted, and saved the File!");
//   // Sleep until File is closed.
//   await sleep(500);
//   //Sending the file to the user.
//   response = { "text":"Here is the text file!"};
//   action = null;
//   state = await callSendAPI(sender_psid, response, action);
//   response = {
//     "attachment":{
//     "type":"file", 
//     "payload":{
//       "url":`${process.env.URL}/${sender_psid}/${documents.length}.txt`, 
//       "is_reusable":true
//     }
//   }}
//   action = null;
//   state = await callSendAPI(sender_psid, response, action);
//   t = await update([sender_psid,documents.length,test,"documents"]);
//   po = await audio(`./files/${sender_psid}/${documents.length}.txt`,sender_psid,documents.length,'Kimberly');
//   await sleep(500);
//   // Sending the Audio file to the user.
//   response = { "text":"Here is the audio file!"};
//   action = null;
//   state = await callSendAPI(sender_psid, response, action);
//   response = {
//     "attachment":{
//     "type":"audio", 
//     "payload":{
//       "url":`${process.env.URL}/${sender_psid}/${documents.length}.mp3`, 
//       "is_reusable":true
//     }
//   }}
// action = null;
// state = await callSendAPI(sender_psid, response, action);
// check = await updateCheck(sender_psid);
// documents = await check[3];
// //console.log(doc);
// state = await myU(sender_psid, documents);
// uu = await update([sender_psid, translation.length,state,"translatedDocs"]);

// await sleep(500);

// // Sending the Audio file to the user.
// response = { "text":"Here is the transaltion file!"};
// action = null;
// state = await callSendAPI(sender_psid, response, action);

// response = { 
//   "attachment":{
//     "type":"template",
//     "payload":{
//       "template_type":"button",
//       "text":"Arabic Translation!",
//       "buttons":[
//         {
//           "type":"web_url",
//           "url":`${process.env.URL}/${sender_psid}/${documents.length - 1}_translation.txt`,
//           "title":"The Translation"
//         }
//       ]
//     }
//   }
// }

// action = null;
// state = await callSendAPI(sender_psid, response, action);

// po = await audio(`./files/${sender_psid}/${documents.length - 1}_translation.txt`,sender_psid,documents.length,'Zeina');

// await sleep(500);
// // Sending the Audio file to the user.
// response = { "text":"Here is the translation audio file!"};
// action = null;
// state = await callSendAPI(sender_psid, response, action);
// response = {
//   "attachment":{
//   "type":"audio", 
//   "payload":{
//     "url":`${process.env.URL}/${sender_psid}/${translation.length}_translation.mp3`, 
//     "is_reusable":true
//   }
// }}
// action = null;
// state = await callSendAPI(sender_psid, response, action);



// }


// }
  

//   ////////////////////////////////
// // Function to read the Image from the link
// //////////////////////////////
// async function readImage(sender_psid, attachmentUrl, documents_length){
// var results;
// try{
//   var options = {
//     uri: attachmentUrl,
//     headers: {
//         'User-Agent': 'Request-Promise'
//     },
//     jpg: true
// };
// filePath = `./files/${sender_psid}/${documents_length}.jpg`;
// results = await (rp(options).pipe(fs.createWriteStream(filePath)));
// }
// catch (e){
// console.log(e);
// }
//  return results;  
// }

// // Sleep Funtion to put the App to sleep before reading the image again
// function sleep(ms) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//   });
// }



// // Text Async function
// async function myD(sender_psid, documents_length) {
//   var data = fs.readFileSync(`./files/${sender_psid}/${documents_length}.jpg`);
//   var results;
//   try {
//     results = await textractScan(data);
//   } catch (e) {
//     throw e;
//   } 
//   let s = "";
//   let t = 0;
//   if (results){
//   for (i = 0 ; i < results.Blocks.length ; ++i) {
//     if (results.Blocks[i].Text && results.Blocks[i].BlockType === 'WORD'){
//      s += results.Blocks[i].Text + " ";
//      ++t;
//      if (t % 10 == 0){
//       s += '\n';
//      }
// }}}
// fs.writeFile(`./files/${sender_psid}/${documents_length}.txt`, s, function (err) {
//   if (err) {
//         console.log("An error occured while writing JSON Object to File.");
//         return console.log(err);
//     }
//     console.log("TXT file has been saved."); 
//   });
//   return s;
// }

// // Translate Async fynction;
// async function myU(sender_psid, documents)
// {
//   var result;
//   try {
//     var options = {
//       uri: `https://microsoft-azure-translation-v1.p.rapidapi.com/translate`,
//       qs: {
//         "from": "en",
//         "to": "ar",
//         "text": documents[documents.length-1].S
//       },
//       headers: {
//         "x-rapidapi-host": "microsoft-azure-translation-v1.p.rapidapi.com",
//         "x-rapidapi-key": "1390cea5damshd570a5f82509daep1cb503jsncbc3c74853d5",
//         "accept": "application/json",
//         "useQueryString": true
//       },
//       json: true
//   };  
//   result = await(rp(options));
//   s = "";
//   if (result){
//   for (i = 69 ; i < result.length - 10 ; ++i){
//     s += result[i];
//   }
// }

// fs.writeFile(`./files/${sender_psid}/${documents.length - 1}_translation.txt`, s, 'utf8',function (err) {
//     if (err) {
//           console.log("An error occured while writing JSON Object to File.");
//           return console.log(err);
//       }
//       console.log("TXT file is Online."); 
//     });
//     await sleep(500);
//     fs.open(`./files/${sender_psid}/${documents.length - 1}_translation.txt`, function(error, fd) {
//       if (error) {
//            console.error("open error:  " + error.message);
//       } else {
//            fs.close(fd, function(error) {
//       if (error) {
//            console.error("close error:  " + error.message);
//       } else {
//            console.log("File was closed!");
//                        }
//       });
//     }
//  });
//   }
//   catch (e) {
//     console.log(e);
//   }
// return result;
// }


/*

async function myR() {
  var data = fs.readFileSync('9.jpg');
  const results = await rekognition(data);
  console.log(results.length);
  for (i = 0 ; i < results.length ; ++i) {
  console.log(results[i].DetectedText);
  }


  fs.writeFile("reko.txt", results.DetectedText, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
 
    console.log("HTML file has been saved."); 
});


};
    
async function myP() {
    var data = fs.readFileSync('ttt.jpg');
    const results = await passportScan(data);
    console.log(results);
};

async function myC() {
    var data = fs.readFileSync('sample.jpg');
    results = await wireCode(data);
    console.log(results.generated_webpage_html);
    console.log(results.generated_webpage_css);
    



    
//     var r = JSON.stringify(results);
// console.log(r);


fs.writeFile("output.html", results.generated_webpage_html, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
 
    console.log("HTML file has been saved."); 
});

fs.writeFile("autocodeai-form.css", results.generated_webpage_css, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
    console.log("HTML file has been saved."); 
});
};

////////////////////////////////////////////////////////////
///// Summary + Polly + Reading PDF from User
///////////////////////////////////////////////////////////
let dataBuffer = fs.readFileSync('./sample.pdf');
pdf(dataBuffer).then(fsunction(data) {
  let A = data;
  console.log(A);
  fs.writeFile('./views/sample.ejs', A, (err) => {
    if (err) throw err;
});});


var req = unirest("GET", "https://meaningcloud-summarization-v1.p.rapidapi.com/summarization-1.0");
app.get('/views', function(request, response) {
	response.render("sample");
});
req.query({
  "url": "http://76e0dcd8.ngrok.io/views",
  	"sentences": "10"
});
req.headers({
	"x-rapidapi-host": "meaningcloud-summarization-v1.p.rapidapi.com",
	"x-rapidapi-key": "1390cea5damshd570a5f82509daep1cb503jsncbc3c74853d5",
	"accept": "text/json",
	"useQueryString": true
});

req.end(function (res) {
  if (res.error) throw new Error(res.error);
  console.log(res.body);
  fs.writeFile("./sample.txt", res.body.summary, function(err) {
    if (err) {
        return console.log(err)
    }
    console.log("The file was saved!")
})});

var polly = new AWS.Polly();
var data = fs.readFileSync('sample.txt', 'utf8');
// Create an Polly client
const Polly = new AWS.Polly({
  signatureVersion: 'v4',
  region: 'us-east-1'
})
let params = {
  'Text': data,
  'OutputFormat': 'mp3',
  'VoiceId': 'Kimberly'
}
Polly.synthesizeSpeech(params, (err, data) => {
  if (err) {
      console.log(err.code)
  } else if (data) {
      if (data.AudioStream instanceof Buffer) {
          fs.writeFile("./speech.mp3", data.AudioStream, function(err) {
              if (err) {
                  return console.log(err)
              }
              console.log("The file was saved!")
  })}}})

*/


/*

// Start
var ddb = new AWS.DynamoDB();
var polly = new AWS.Polly();

// Create an Polly client
const Polly = new AWS.Polly({
  signatureVersion: 'v4',
  region: 'us-east-1'
})

let params2 = {
  'Text': 'Hi, my name is @anaptfox.',
  'OutputFormat': 'mp3',
  'VoiceId': 'Kimberly'
}

Polly.synthesizeSpeech(params2, (err, data) => {
  if (err) {
      console.log(err.code)
  } else if (data) {
      if (data.AudioStream instanceof Buffer) {
          fs.writeFile("./speech.mp3", data.AudioStream, function(err) {
              if (err) {
                  return console.log(err)
              }
              console.log("The file was saved!")
          })
      }
  }
})



*/
//////////////////////////////////////////////////////////////
// ////          User Table keyed on USER_PSID. Data:        ////
// ////      First Name, Last Name, User State trackers      ////
// ////     Objects for personal data, Objects for files     ////
// //////////////////////////////////////////////////////////////
// var ddb = new AWS.DynamoDB();
// var params = {
//   AttributeDefinitions: [
//     {
//       AttributeName: 'PSID',
//       AttributeType: 'S'
//     }
//   ],
//   KeySchema: [
//     {
//       AttributeName: 'PSID',
//       KeyType: 'HASH'
//     }
//   ],
//   ProvisionedThroughput: {
//     ReadCapacityUnits: 1,
//     WriteCapacityUnits: 1
//   },
//   TableName: 'CLIENTS',
//   StreamSpecification: {
//     StreamEnabled: false
//   }
// };
// // Call DynamoDB to create the table if doesn't exist.
// ddb.createTable(params, function(err, data) {
//   if (err) {
//     console.log("Table Exists!");
//   } else {
//     console.log("Table Created!");
//   }
// });
// 

