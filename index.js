const fs = require("fs");
const request = require('request');
// const image2base64 = require('image-to-base64');
var https = require('https');
// var urlToImage = require('url-to-image');
const sendEmail = require("./mailer");
const textractScan = require("./textractDoc");
const passportScan = require("./readPassport");
const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json());


// Webhook Endpoint For Facebook Messenger //
app.post('/webhook', (req, res) => {  
    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the body of the webhook event
        let webhook_event = entry.messaging[0];
       // console.log(webhook_event);
      
      
        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);
        //callUserInfo(sender_psid);
    
        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
          handleMessage(sender_psid, webhook_event);        
        } else if (webhook_event.postback) {
          handlePostback(sender_psid, webhook_event.postback);
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

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "adsfhg"
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });

  function handleMessage(sender_psid, webhook_event) {
    let response;
    let received_message = webhook_event.message
    
    // Checks if the message contains text
    if (received_message.text) {    
      // Create the payload for a basic text message, which
      // will be added to the body of our request to the Send API
  var text = received_message.text.trim().toLowerCase();
   if  (text.includes("hi")) {
    var text2 = received_message.text.trim().toLowerCase();
    response = {"text": `Hi there, please use the menu or say "Start Over".`}
  }
   else {
    var text2 = received_message.text.trim().toLowerCase();
    response = {"text": `Sorry, we cannot recognize "${text}" at this moment.`}
  }
  
  
  }else if (received_message.attachments) {
      // Get the URL of the message attachment
    //  let attachment_url = received_message.attachments[0].payload.url;
    let att = webhook_event.message.attachments[0].payload.url;
   // console.log(att);
  // convertImage(att);

  filePath = './sample.jpg';
var file = fs.createWriteStream(filePath);
var request = https.get(att, function(response) {
    response.pipe(file);
    console.log('1');
});





// request = get(att, function(response) {
//     response.pipe(file);
//     });
// console.log(file);



    response = {"text": "Sorry, we don't handle attachment at this moment. Please say start over for the main menu."}
    } 
    
    // Send the response message
    callSendAPI(sender_psid, response);    
  }
  
  function convertImage(path){
    image2base64(path) 
    .then(
        (response) => {
            //console.log(response);
            //console.log(response);
        }
    )
    .catch(
        (error) => {
            console.log(error);
        }
    )
  }


  async function myF() {
    var data = fs.readFileSync('sample.jpg');
    //dae = convertImage('sample.jpg');
    console.log('data');
    console.log('data');
    console.log('data');
    console.log('data');
    //let pp = 'ttt.jpg';
    const results = await textractScan(data);
    console.log(results);
};
myF();



  // Handles messaging_postbacks events
  function handlePostback(sender_psid, received_postback) {
    let response;
    
    // Get the payload for the postback
    let payload = received_postback.payload;
  

    response = { "text": 'We sent something. Please check your email.' }
  
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  }
  
  
  // Sends response messages via the Send API
  function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
      "recipient": {
        "id": sender_psid
      },
      "message": response
    }
    // Send the HTTP request to the Messenger Platform
    request({
      "uri": "https://graph.facebook.com/v6.0/me/messages",
      "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
      "method": "POST",
      "json": request_body
    }, (err, res, body) => {
      if (!err) {
        console.log('message sent!')
      } else {
        console.error("Unable to send message:" + err);
      }
    }); 
  }




app.listen(process.env.PORT || 3370, () => console.log('webhook is listening'));