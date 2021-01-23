const AWS = require('aws-sdk');

exports.invokeRemoteLambda = async ({ region, functionName, payload }) => {
    const Lambda = new AWS.Lambda({ region });
    const req = {
        FunctionName: functionName,
        Payload: JSON.stringify(payload),
        InvocationType: 'RequestResponse',
    };
    const response = await Lambda.invoke(req).promise();
    const { Payload } = response;
    return JSON.parse(Payload);
};
