const exists = require("./check_data"),
fs = require("fs"),
getData = require("./get_data"),
putData = require("./put_data"),
session = require('express-session'),
updateState = require("./update_state"),
requestData = require("../messenger/req_data");

///////////////////////////////////////////////////////////////////////
// Asynchronous Function to check if the user exists in the Database //
//     If the user exists it will return his personal information    //
//  If not, it will create a new entry fot the user in the database  //
///////////////////////////////////////////////////////////////////////
module.exports = async (sender_psid, app, current) => {
    var result = [];
    // Check if the user is already in the database.
    // Both cases will end up by reading the data from DynamoDB.
    // Covers the case if a TESTING-BOT starts with a message!!
    const check = await exists(sender_psid);
    // If exists, request the data and avoid writing new Data.
    // Incase the user deleted the conversation by mistake.
    if (check === true)
    {
      console.log(sender_psid + " is an old user (handleMessages)!!");
      //userLogin(sender_psid);
      const update = await updateState(sender_psid, app, current);
      const data = await getData(sender_psid);
      result [0] = data.Item.first_name.S;
      result [1] = data.Item.Locale.S;
      console.log(sender_psid + " Locale is set to " + result[1]);
      result [2] = data.Item.general_state.S;
      result [3] = data.Item.documents.L;
      result [4] = data.Item.translatedDocs.L;
    // If this is the first visit, request personal Data from Facebook.
    // Then add the data to the DynamoDB and intialize user trackers.  
    } else {
      console.log(sender_psid + " is a New user (handleMessages)!!");
      //userLogin(sender_psid);
      const userData = await requestData(sender_psid);
      const state = await putData(userData, app, current);
      const data = await getData(sender_psid);
      result[0] = data.Item.first_name.S;
      result[1] = data.Item.Locale.S;
      console.log(sender_psid + " Locale is set to " + result[1]);
      result [2] = data.Item.general_state.S;
      result [3] = data.Item.documents.L;
      result [4] = data.Item.translatedDocs.L;
      if (!fs.existsSync(`./files/${sender_psid}`)){
        fs.mkdirSync(`./files/${sender_psid}`);
      }
    }
    return result;
    function userLogin(sender_psid){
      session.loggedin = true;
      session.username = sender_psid;
      return session.loggedin;
    }
  }