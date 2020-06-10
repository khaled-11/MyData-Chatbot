/////////////////////////////////////////////////////////////
//   Asynchronous function to send responses to the user   //
//      It will keep the order of the replies if many.     //
/////////////////////////////////////////////////////////////
const rp = require('request-promise');
require('dotenv').config();

module.exports = async (sender_psid, response, action, app) => {
// Construct the message body
var request_body;
var state;
var token;
// Check if the reply is from the First or the Second App.
if (app === "second") {
    token = process.env.PAGE_ACCESS_TOKEN2;
    persona_id = process.env.SECOND_PERSONA;
} else {
  token = process.env.PAGE_ACCESS_TOKEN;
  persona_id = process.env.FIRST_PERSONA;
}
// Check if the request body is an action or a response.
if (!action){
    request_body = {
    "recipient": {
    "id": sender_psid
    },
    "message": response,
    "persona_id":persona_id
}}
else {
  request_body = {
  "recipient": {
  "id": sender_psid
  },
  "sender_action":action,
  "persona_id":persona_id
}
}
// Try the request after setting up the request_body.
try{
    var options = {
    method: 'POST',
    uri: `https://graph.facebook.com/me/messages?access_token=${token}`,
    body: request_body,
    json: true
    };
    state = await rp(options);
    //console.log(state);
    if (state.message_id){
        console.log(state.recipient_id + " Replied from the " + app + " App!!");
    } else {
        console.log(state.recipient_id + " Sender Actions Sent from the " + app + " App!!");
    }}
    catch (e){
       // console.log(e);
    }
    return state;
}