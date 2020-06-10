const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async sender_psid => {
    const params = {
        TableName: 'CLIENTS',
        Key: {
          'PSID': {S: sender_psid}
        },
        ProjectionExpression: 'first_name, Locale, general_state, image_count, Textract_Limit, Balance, documents, translatedDocs'
      };
  
    const request = ddb.getItem(params);
        const data = await request.promise();
        
            // in case no blocks are found return undefined
            return data;
          };

          