const baseName = 'getIp';
const regions = ['eu-central-1', 'us-east-1'];
const util = require('util');
const numPerRegion = 3;

const fs = require('fs');
const fse = require('fs-extra');

const camelCased = (myString) => {
    return myString
        .split('-')
        .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
        .join('');
};

const createFunction = async (regionName, currId) => {
    const dirName = `${baseName}Re${camelCased(regionName)}Id${currId}`;
    await fs.promises.mkdir(dirName);
    await util.promisify(fse.copy)(`./${baseName}Template/`, `./${dirName}/`);
    await fs.readdir(`./${dirName}/`, (err, files) => {
        console.log(files);
    });
    await fs.promises.rmdir(`./${dirName}/`);
};

createFunction(regions[0], 1);
