const { invokeRemoteLambda } = require('./lambda');

exports.handler = async (event) => {
    console.log(
        await invokeRemoteLambda({
            region: 'eu-central-1',
            functionName: 'getIp',
            payload: {},
        })
    );
    console.log(
        await invokeRemoteLambda({
            region: 'eu-central-1',
            functionName: 'getIp2',
            payload: {},
        })
    );
    console.log(
        await invokeRemoteLambda({
            region: 'us-east-1',
            functionName: 'getIp3',
            payload: {},
        })
    );
};
