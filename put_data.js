const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
 module.exports = async data => {
    const params = {
        TableName: 'CLIENTS',
        Item: {
        'PSID' : {S: `${data.id}`},
        'Locale' : {S: `${data.locale}`},
        'first_name' : {S: `${data.first_name}`},
        'last_name' : {S: `${data.last_name}`},
        'audio_state' : {S: `Neutral`},
        'document_state' : {S: `Neutral`},
        'general_state' : {S: `Main App`},
        'document_count' : {N: `0`},
        'audio_count' : {N: `0`},
        'forms_count' : {N: `0`},
        'Gender' : {S: `Neutral`}
        }};
  
     const request = ddb.putItem(params);
         const result = await request.promise();
         return result;
  };

          