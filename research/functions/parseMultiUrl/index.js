const fs = require('fs');
const Url = require('url-parse');
const osu = require('node-os-utils');
const Promise = require('bluebird');

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
    const { urls, parseHrefs, parseSchema, concurrency, timeout } = event;

    // Monitor free CPU and Memory
    const { cpu, mem } = osu;
    setInterval(async () => {
        const cpuFree = await cpu.free();
        const { freeMemPercentage } = await mem.info();
        console.log({
            cpu: cpuFree,
            memory: freeMemPercentage,
        });
    }, 1000);

    console.log('open browser');

    // open browser
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: await executablePath,
        // dumpio: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--single-process',
            // '--disk-cache-dir=/temp/browser-cache-disk',
        ],
    });

    const getPageData = (url) => new Promise(async (resolve) => {
        const { host: originHost } = new Url(url);
    
        const page = await browser.newPage();
    
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

        let hrefs, product;
    
        // go to page url
        try {
            await page.goto(url, { waitUntil: 'networkidle0', timeout });
            /**
             * if parseHrefs is true
             * Get all hrefs in page
             * Exclude irrelevant extension or prefixes
             * Remove duplicates
             */
            hrefs = parseHrefs && [
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
                            const { origin, pathname } = new Url(href);
                            return `${origin}${pathname}`;
                        })
                ),
            ];
            if (hrefs) console.log(`hrefs: ${hrefs.length}`);
        
            /**
             *  if parseSchema is true
             */
            product =
                parseSchema && originHost.split('.').includes('amazon')
                    ? await getAmazonProductByUrl(url)
                    : getProductSchema(await page.content());
            if (product) {
                product.url = url;
                console.log(product);
            }
        } catch (e) {
            console.log(e);
        }
        
        await page.close();
        console.log('closed page');
        resolve({ hrefs, product });
        
    });

    const results = await Promise.map(urls, url => {
        console.log('url: ', url);
        return getPageData(url);
    }, { concurrency });
    console.log(JSON.stringify(results));

    // close browser, clean user data
    const dirArgName = '--user-data-dir=';
    const chromeTmpDataDirArg = browser.process().spawnargs.find((arg) => arg.startsWith(dirArgName));
    const chromeTmpDataDir = chromeTmpDataDirArg ? chromeTmpDataDirArg.split(dirArgName)[1] : null;
    await browser.close();
    if (chromeTmpDataDir !== null) {
        console.log(`remove: ${chromeTmpDataDir}`);
        fs.rmdirSync(chromeTmpDataDir, { recursive: true });
    }

    return results;
};
