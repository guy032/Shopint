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
    await fs.readdir(`./${dirName}/`, async (err, files) => {
        for (const file of files) {
            if (file !== 'node_modules') {
                // assuming only files, TODO - handle cases of folders
                const filePath = `./${dirName}/${file}`;
                const content = await fs.promises.readFile(filePath, 'utf-8');
                await fs.promises.writeFile(
                    filePath,
                    content.replace(/start-region-end/g, regionName).replace(/start-index-end/g, currId)
                );
            }
        }
    });
    // await fs.promises.rmdir(`./${dirName}/`, { recursive: true });
};

createFunction(regions[1], 3);
