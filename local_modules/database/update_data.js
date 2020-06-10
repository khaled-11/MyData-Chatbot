const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
 module.exports = async data => {
    const params = {
        TableName: 'CLIENTS',
        Key: {
        "PSID" : data[0],
        },
        UpdateExpression: `set ${data[3]}[${data[1]}] = :ss`,
        ExpressionAttributeValues:{
            ":ss":`[${data[2]}]`
        },
    };
     const request = docClient.update(params);
         const result = await request.promise();
         return result;
  };