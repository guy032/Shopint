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
const creationOffset = 0;
const util = require('util');

const exec = util.promisify(require('child_process').exec);
const executeCommand = async (cmd, context) => {
    const { stdout, stderr } = await exec(cmd, context);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
};

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
                    content
                        .replace(/start-region-end/g, regionName)
                        .replace(/start-index-end/g, currId)
                        .replace(/start-upperregion-end/g, camelCased(regionName))
                );
            }
        }
    });

    await executeCommand(`cd ${dirName}`);
    console.log(process.cwd());
    await executeCommand(`yarn package`, {
        cwd: `${process.cwd()}/${dirName}/`,
    });
    await executeCommand(`yarn deploy`, {
        cwd: `${process.cwd()}/${dirName}/`,
    });
    await executeCommand(`cd ..`);
    await executeCommand(`echo %cd%`);
    await fs.promises.rmdir(`./${dirName}/`, { recursive: true });
};

async function createRegionsLambdas() {
    for (const region of regions) {
        for (let i = creationOffset; i < numPerRegion; i++) {
            await createFunction(region, i + 1);
        }
    }
}

createRegionsLambdas();
