const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async sender_psid => {
    const params = {
        TableName: 'CLIENTS',
        Key: {
          'PSID': {S: sender_psid}
        },
        ProjectionExpression: 'first_name',
      };
  
    const request = ddb.getItem(params);
        const data = await request.promise();
            if(data.Item)
            exists = true;
            else
            exists = false;
            return exists;
          };