const fs = require('fs');
const Url = require('url-parse');
const osu = require('node-os-utils');

const { puppeteer, executablePath } = require('chrome-aws-lambda');
const { getAmazonProductByUrl } = require('./vendors/amazon');
const { getProductSchema } = require('./schema');
const {
    services: excludedServices,
    types: excludedTypes,
    prefixes: excludedPrefixes,
    extensions: excludedExtensions,
} = require('./excluded.json');

exports.handler = async (event) => {
    // parse args
    const { url, parseHrefs, parseSchema } = event;
    console.log('url: ', url);
    const { host: originHost } = new Url(url);

    const { drive } = osu;
    const driveInfo = await drive.info();
    console.log(JSON.stringify(driveInfo));
    const files = fs.readdirSync('/tmp');
    console.log(JSON.stringify(files));

    // open browser and page
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: await executablePath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--single-process',
            '--disk-cache-dir=/temp/browser-cache-disk',
        ],
    });
    const page = (await browser.pages())[0];

    // filter irrelevant requests (images, fonts, etc.)
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (
            excludedTypes.indexOf(request.resourceType()) !== -1 ||
            excludedServices.some((v) => request._url.includes(v))
        ) {
            request.abort();
        } else {
            request.continue();
        }
    });

    // go to page url
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    /**
     * if parseHrefs is true
     * Get all hrefs in page
     * Exclude irrelevant extension or prefixes
     * Remove duplicates
     */
    const hrefs = parseHrefs && [
        ...new Set(
            (await page.$$eval('a', (as) => as.map((a) => a.href)))
                .filter((href) => {
                    const { host } = new Url(href);
                    return (
                        href != '' &&
                        originHost.indexOf(host) !== -1 &&
                        !excludedExtensions.map((ext) => href.split('?')[0].endsWith(`.${ext}`)).includes(true) &&
                        !excludedPrefixes.map((prefix) => href.startsWith(prefix)).includes(true)
                    );
                })
                .map((href) => {
                    const { pathname } = new Url(href);
                    return `${originHost}${pathname}`;
                })
        ),
    ];
    if (hrefs) console.log(`hrefs: ${hrefs.length}`);

    /**
     *  if parseSchema is true
     */
    const product =
        parseSchema && originHost.split('.').includes('amazon')
            ? await getAmazonProductByUrl(url)
            : getProductSchema(await page.content());
    if (product) console.log(product);

    // close browser, clean user data
    const dirArgName = '--user-data-dir=';
    const chromeTmpDataDirArg = browser.process().spawnargs.find((arg) => arg.startsWith(dirArgName));
    const chromeTmpDataDir = chromeTmpDataDirArg ? chromeTmpDataDirArg.split(dirArgName)[1] : null;
    await browser.close();
    if (chromeTmpDataDir !== null) {
        fs.rmdirSync(chromeTmpDataDir, { recursive: true });
    }

    return {
        hrefs,
        product,
    };
};
