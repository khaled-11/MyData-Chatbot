//////////////////////////////////////////////////////////////
////          User Table keyed on USER_PSID. Data:        ////
////      First Name, Last Name, User State trackers      ////
////     Objects for personal data, Objects for files     ////
//////////////////////////////////////////////////////////////
const AWS = require("aws-sdk");
// Update the AWS Region.
AWS.config.update({region: 'us-east-1'});

module.exports = async => {
var ddb = new AWS.DynamoDB();
var params = {
  AttributeDefinitions: [
    {
      AttributeName: 'PSID',
      AttributeType: 'S'
    }
  ],
  KeySchema: [
    {
      AttributeName: 'PSID',
      KeyType: 'HASH'
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  },
  TableName: 'CLIENTS',
  StreamSpecification: {
    StreamEnabled: false
  }
};
// Call DynamoDB to create the table if doesn't exist.
ddb.createTable(params, function(err, data) {
  if (err) {
    console.log("Table Exists!");
  } else {
    console.log("Table Created!");
  }
});
}