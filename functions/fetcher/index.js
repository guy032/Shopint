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

const getRandomIp = async () => {
    const randomRegion = regions[Math.floor(Math.random() * regions.length)];
    const randomIndex = Math.floor(Math.random() * numPerRegion) + 1;
    return await invokeRemoteLambda({
        region: randomRegion,
        functionName: `${baseName}Re${camelCased(randomRegion)}Id${randomIndex}`,
        payload: {},
    });
};

exports.handler = async (event) => {
    const promises = [];
    for (let i = 0; i < 100; i++) {
        promises.push(getRandomIp());
    }
    const ips = await Promise.all(promises);
    console.log(ips.length);
    console.log([...new Set(ips)].length);
};
