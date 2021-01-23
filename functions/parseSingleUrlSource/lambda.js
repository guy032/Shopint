const AWS = require('aws-sdk');

exports.invokeRemoteLambda = async ({ functionName, payload }) => {
    const Lambda = new AWS.Lambda();
    const req = {
        FunctionName: functionName,
        Payload: JSON.stringify(payload),
        InvocationType: 'RequestResponse',
    };
    const response = await Lambda.invoke(req).promise();
    const { Payload } = response;
    return JSON.parse(Payload);
};
