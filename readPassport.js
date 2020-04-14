const _ = require("lodash");
const aws = require("aws-sdk");
const config = require("./config");

aws.config.update({

  region: config.awsRegion
});

const sagemakerruntime = new aws.SageMakerRuntime();

module.exports = async buffer => {
  const params = {
    Body: buffer,
    EndpointName: 'eng-pass',
    ContentType: 'application/x-image'
  };

  const request = sagemakerruntime.invokeEndpoint(params);
      const data = await request.promise();
          // in case no blocks are found return undefined

          let result = data['Body'];
          let newResult = result.toString('utf8');
         
          return newResult;
        };