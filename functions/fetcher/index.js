const { invokeRemoteLambda } = require('./lambda');
const baseName = 'getIp';
const regions = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'ap-northeast-1',
    'ap-northeast-2',
    'eu-central-1',
];
const numPerRegion = 5;

const camelCased = (myString) => {
    return myString
        .split('-')
        .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
        .join('');
};

exports.handler = async (event) => {
    const randomRegion = Math.floor(Math.random() * regions.length);
    const randomIndex = Math.floor(Math.random() * numPerRegion) + 1;
    console.log(
        await invokeRemoteLambda({
            region: regionName,
            functionName: `${baseName}Re${camelCased(randomRegion)}Id${randomIndex}`,
            payload: {},
        })
    );
};
