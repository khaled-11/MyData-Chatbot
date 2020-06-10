////////////////////////////////////////////////////
//   Asynchronous Module to Pass Thread Control   //
////////////////////////////////////////////////////
const rp = require('request-promise'),
callSendAPI = require("./callSendAPI");

module.exports = async (sender_psid, app) => {
let appID;
var token;
if (app === "first"){
appID = process.env.APP_ID_1;
token = process.env.PAGE_ACCESS_TOKEN2;
  } else {
    appID = process.env.APP_ID_2;
    token = process.env.PAGE_ACCESS_TOKEN;
  }
// Construct the message body
var request_body;
var state;
// Create a request Body.
request_body = {
  "recipient": {
  "id": sender_psid
  },
  "target_app_id":appID
}
 
  // Try the request after setting up the request_body.
  try{
    var options = {
      method: 'POST',
      uri: `https://graph.facebook.com/v2.6/me/pass_thread_control?access_token=${token}`,
      body: request_body,
      json: true
    };
  state = await rp(options);
  console.log("PassThread to the " + app + " APP was" , state);
  }
  catch (e){
    response = { "text":"You are on the same App!!"};
    action = null;
    state = await callSendAPI(sender_psid, response, action, app);
  }
   return state;
}