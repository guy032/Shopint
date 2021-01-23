const { invokeRemoteLambda } = require('./lambda');
const baseName = 'getHtml';
const regions = [
    'ap-northeast-1',
    'ap-northeast-2',
    'ap-south-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ca-central-1',
    'eu-central-1',
    'eu-north-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'sa-east-1',
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
];
const numPerRegion = 2;

const camelCased = (myString) => {
    return myString
        .split('-')
        .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
        .join('');
};

const getHtmlFromRandomIp = async (url) => {
    const randomRegion = regions[Math.floor(Math.random() * regions.length)];
    const randomIndex = Math.floor(Math.random() * numPerRegion) + 1;
    return await invokeRemoteLambda({
        region: randomRegion,
        functionName: `${baseName}Re${camelCased(randomRegion)}Id${randomIndex}`,
        payload: {
            url,
        },
    });
};

exports.handler = async (event) => {
    return await getHtmlFromRandomIp(event.url);
};
