const fs = require("fs");
var AWS = require('aws-sdk');
//const image2base64 = require('image-to-base64');
var https = require('https');
// var urlToImage = require('url-to-image');
var session = require('express-session');
var md5 = require('md5');
var CryptoJS = require("crypto-js");
const path = require("path");
const sendEmail = require("./mailer");
const rekognition = require("./Rekognition");
const textractScan = require("./textractDoc");
const passportScan = require("./readPassport");
const wireCode = require("./wireCode");
const getData = require("./get_data");
const putData = require("./put_data");
const exists = require("./check_data");
const express = require('express');
const bodyParser = require('body-parser');
const pdf = require('pdf-parse');
const app = express().use(bodyParser.json());
const PDFDocument = require('pdfkit');
AWS.config.update({region: 'us-east-1'});
var Request = require("request");
i18n = require("./i18n.js");
var rp = require('request-promise');

var users = [];


app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

/*
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
////          User Table keyed on USER_PSID. Data:        ////
////      First Name, Last Name, User States trackers     ////
//// Objects for personal data, Objects for files & Audio ////
//////////////////////////////////////////////////////////////
var ddb = new AWS.DynamoDB();
var params = {
  AttributeDefinitions: [
    {
      AttributeName: 'PSID',
      AttributeType: 'S'
    }
  ],
  KeySchema: [
    {
      AttributeName: 'PSID',
      KeyType: 'HASH'
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  },
  TableName: 'CLIENTS',
  StreamSpecification: {
    StreamEnabled: false
  }
};
// Call DynamoDB to create the table
ddb.createTable(params, function(err, data) {
  if (err) {
    console.log("Table Exists!");
  } else {
    console.log("Table Created!");
  }
});


// Webhook Endpoint For Facebook Messenger //
app.post('/webhook', (req, res) => {  
    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the body of the webhook event
        let webhook_event = entry.messaging[0];

        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        //console.log(sender_psid);
    
        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message && !webhook_event.message.quick_reply) {
          handleMessage(sender_psid, webhook_event);        
        } else if (webhook_event.postback || (webhook_event.message && webhook_event.message.quick_reply)) {
          handlePostback(sender_psid, webhook_event);
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


  // Asynchronously function to Rquest the user Info from Facebook.
  async function requestData(sender_psid) {
    var r;
try{
    var options = {
      uri: `https://graph.facebook.com/${sender_psid}?fields=first_name,last_name,profile_pic,locale`,
      qs: {
          access_token: process.env.PAGE_ACCESS_TOKEN // -> uri + '?access_token=xxxxx%20xxxxx'
      },
      headers: {
          'User-Agent': 'Request-Promise'
      },
      json: true // Automatically parses the JSON string in the response
  };
  r = await(rp(options));
  }
catch (e){
console.log(e);
}
 return r;  
}

  // Handles messaging_postbacks events
  async function handlePostback(sender_psid, webhook_event) {
  // Sending "Sender Action" while waiting for the requested data!
  response = null;
  action = "typing_on";
  callSendAPI(sender_psid, response, action);

  // Variables for the payload, response, user info ,and trackers.
  var response;
  let payload;
  let first_name;
  let current_locale;
  let general_state;


  if (webhook_event.postback){
    payload = webhook_event.postback.payload;
    } else {
      payload = webhook_event.message.quick_reply.payload;
    }


  // Check if the user is already in the database.
  // Both cases will end up by reading the data from DynamoDB.

  const check = await exists(sender_psid);

  // If exists, request the data and avoid writing new Data.
  // Incase the user deleted the conversation by mistake.

  if (check === true)
  {
    const data = await getData(sender_psid);
    first_name = data.Item.first_name.S;
    current_locale = data.Item.Locale.S;
    general_state = data.Item.general_state.S;

  // If this is the first visit, request personal Data from Facebook.
  // Then add the data to the DynamoDB and intialize user trackers.
  
  } else {
    const t = await requestData(sender_psid);
    console.log(t);
    const m = await putData(t);
    console.log(m);
    const data = await getData(sender_psid);
    first_name = data.Item.first_name.S;
    current_locale = data.Item.Locale.S;
    general_state = data.Item.general_state.S;
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
                "payload":"THREE"
              },{
                "content_type":"text",
                "title":i18n.__("menu.summary"),
                "payload":"YY"
              },{
                "content_type":"text",
                "title":i18n.__("menu.extractor"),
                "payload":"TWO"
              }
            ]
          }
          callSendAPI(sender_psid, response, action);
        // Calling the Main Menu (QUICK_REPLY) function.
      


    } else if (payload === 'MENU')
    {
      response = {
        "text": i18n.__("menu.welcome", {fName: first_name}), 
        "quick_replies":[
          {
            "type":"text",
            "title":i18n.__("menu.image_to_text"),
            "payload":"IM"
          },{
            "content_type":"text",
            "title":i18n.__("menu.text_to_audio"),
            "payload":"THREE"
          },{
            "content_type":"text",
            "title":i18n.__("menu.summary"),
            "payload":"YYY"
          },{
            "content_type":"text",
            "title":i18n.__("menu.extractor"),
            "payload":"TWO"
          }
        ]
      }
      action = null;
      callSendAPI(sender_psid, response, action);
    } else if (payload === 'IM')
    {
     response = {
      "text": i18n.__("menu.welcome", {fName: first_name}), 
      "quick_replies":[
        {
          "type":"text",
          "title":i18n.__("menu.image_to_text"),
          "payload":"IM"
        },{
          "content_type":"text",
          "title":i18n.__("menu.text_to_audio"),
          "payload":"THREE"
        },{
          "content_type":"text",
          "title":i18n.__("menu.summary"),
          "payload":"YYY"
        },{
          "content_type":"text",
          "title":i18n.__("menu.extractor"),
          "payload":"TWO"
        }
      ]
    }
      action = null;
      callSendAPI(sender_psid, response, action);
    }
  }



  function handleMessage(sender_psid, webhook_event) {
    let response;
    let received_message = webhook_event.message
    
    // Checks if the message contains text
    if (received_message.text) {    
      // Create the payload for a basic text message, which
      // will be added to the body of our request to the Send API
  var text = received_message.text.trim().toLowerCase();
   if  (text.includes("hi")) {
    response = { 
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"button",
          "text":"Welcome  ",
          "buttons":[
            {
              "type":"postback",
              "payload":"TRANSLATE",
              "title":"Image to Code"
            },
            {
              "type":"postback",
              "payload":"UPLOAD",
              "title":"Upload a Webpage"
            },
            {
              "type":"postback",
              "payload":"LINK",
              "title":"View My Link"
            }
          ]
        }
      }
    }
 }
  else if  (text.includes("imkljlkdfs")) {
    myD();
    response = {"text": `Hi there, please use the menu or say "Start Over".`}
  }
   else {
    var text2 = received_message.text.trim().toLowerCase();
    response = {"text": `Sorry, we cannot recognize "${text}" at this moment.`}
  }
  
  
  }else if (received_message.attachments) {
      // Get the URL of the message attachment
    //  let attachment_url = received_message.attachments[0].payload.url;
    // global.h
    /*
    att = webhook_event.message.attachments[0].payload.url;
   // console.log(att);
  // convertImage(att);
  filePath = 'sample.pdf';
file = fs.createWriteStream(filePath);
var request = https.get(att, async function(response) {
    response.pipe(file);
    file.on('close', function (err) {
      //  console.log('Stream has been destroyed and file has been closed');
    })
    console.log('1');
});
*/

// request = get(att, function(response) {
//     response.pipe(file);
//     });
// console.log(file);

  i18n.setLocale('ar_AR');
    response = {
     "text" : i18n.__("guidance")
            };
    // Send the response message

  }
  action = null;
  callSendAPI(sender_psid, response, action);
}
  
//   function convertImage(path){
//     image2base64(path) 
//     .then(
//         (response) => {
//             //console.log(response);
//             //console.log(response);
//         }
//     )
//     .catch(
//         (error) => {
//             console.log(error);
//         }
//     )
//   }


  async function myD() {
    var data = fs.readFileSync('5.jpg');
    const results = await textractScan(data);
    let path = 'ttt.txt';
    let s = "";
    let t = 0;
    for (i = 0 ; i < results.Blocks.length ; ++i) {
      if (results.Blocks[i].Text && results.Blocks[i].BlockType === 'WORD'){
       s += results.Blocks[i].Text + " ";
       ++t;
       if (t % 10 == 0){
        s += '\n';
       }
  }}
  console.log(s);
  fs.writeFile("final.txt", s, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
 
    console.log("Done!"); 
});
}

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


    //console.log(results);
};
  
  
  // Sends response messages via the Send API
  function callSendAPI(sender_psid, response, action) {
    // Construct the message body
    var request_body;
    if (!action){
      request_body = {
      "recipient": {
      "id": sender_psid
      },
      "messaging_type": "RESPONSE",
      "message": response
    }}
    else {
      request_body = {
      "recipient": {
      "id": sender_psid
      },
      "sender_action":"typing_on"
      }}

    
    // Send the HTTP request to the Messenger Platform
    Request({
      "uri": "https://graph.facebook.com/v6.0/me/messages",
      "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
      "method": "POST",
      "json": request_body
    }, (err, res, body) => {
      if (!err) {
        console.log('message sent!');

      } else {
        console.error("Unable to send message:" + err);
      }
    }); 
  }







app.listen(process.env.PORT || 3370, () => console.log('webhook is listening'));