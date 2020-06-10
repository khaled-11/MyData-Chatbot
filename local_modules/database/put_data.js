const _ = require("lodash");
const AWS = require("aws-sdk");

var ddb = new AWS.DynamoDB();
module.exports = async (data, app, current) => {
    const params = {
        TableName: 'CLIENTS',
        Item: {
        'PSID' : {S: `${data.id}`},
        'Locale' : {S: `${data.locale}`},
        'first_name' : {S: `${data.first_name}`},
        'last_name' : {S: `${data.last_name}`},
        'email' : {S: ""},
        'general_state' : {S: `${app} ${current}`},
        'documents' : {L: [ {"S": "Extracted Docs"}]},
        'translatedDocs' : {L: [ {"S": "Translated Docs"}]},
        'image_count' : {N: `0`},
        'Textract_Limit' : {N: `20`},
        'Balance' : {N: `10`}
        }};
    const request = ddb.putItem(params);
    const result = await request.promise();
    return result;
};

          