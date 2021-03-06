const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
 module.exports = async (sender_psid, app, current) => {
    const params = {
        TableName: 'CLIENTS',
        Key: {
        "PSID" : sender_psid,
        },
        UpdateExpression: `set general_state = :ss`,
        ExpressionAttributeValues:{
            ":ss":`${app} ${current}`
        },
    };
     const request = docClient.update(params);
         const result = await request.promise();
         return result;
  };