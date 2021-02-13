const AWS = require('aws-sdk');
AWS.config.correctClockSkew = true;
const { STAGE, InvokePort } = process.env;
const Lambda = new AWS.Lambda(
    STAGE !== 'prod'
        ? {
              endpoint: `http://host.docker.internal:${InvokePort}`,
              sslEnabled: false,
          }
        : undefined
);

exports.invokeLambda = async ({ functionName, payload }) => {
    const req = {
        FunctionName: functionName,
        Payload: JSON.stringify(payload),
        InvocationType: 'RequestResponse',
    };
    const response = await Lambda.invoke(req).promise();
    const { Payload } = response;
    return JSON.parse(Payload);
};
