const fs = require('fs');
const Url = require('url-parse');
const { JSDOM } = require('jsdom');
const { puppeteer, executablePath } = require('chrome-aws-lambda');
const { getAmazonProductByUrl } = require('./vendors/amazon');
const WAE = require('jsonld-parser').default;

const excludeServices = ['facebook.net', 'facebook.com', 'google-analytics.com'];
const excludedTypes = ['image', 'stylesheet', 'font'];
const excludedPrefixes = ['#', 'javascript'];
const excludedExtensions = ['pdf', 'jpg', 'jpeg', 'webp', 'png', 'woff', 'ttf', 'css'];

const ConvertKeysToLowerCase = (obj) => {
    var key,
        keys = Object.keys(obj);
    var n = keys.length;
    var newobj = {};
    while (n--) {
        key = keys[n];
        newobj[key.toLowerCase()] = obj[key];
    }
    return newobj;
};

const getProductSchema = (html) => {
    html = html
        .replace(/http:\/\/schema.org/gm, 'https://schema.org')
        .replace(/https:\/\/schema.org\/product/gm, 'https://schema.org/Product')
        .replace(/http:\/\/data-vocabulary.org\/Product/gm, 'https://schema.org/Product');
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    let product;
    if (ldScripts.length > 0) {
        for (ldScript of ldScripts) {
            let { textContent } = ldScript;
            textContent = textContent.replace(/\s*[\r\n]/gm, '');
            const jsonLd = JSON.parse(ldScript.textContent.replace(/\s*[\r\n]/gm, ''));
            if (Array.isArray(jsonLd)) {
                product = jsonLd.find((item) => item['@type'].indexOf('Product') !== -1);
            } else {
                const type = jsonLd['@type'];
                if (type) {
                    if (jsonLd['@type'].indexOf('Product') !== -1) {
                        product = jsonLd;
                    }
                } else {
                    const graph = jsonLd['@graph'];
                    if (graph) product = graph.find((item) => item['@type'].indexOf('Product') !== -1);
                }
            }
        }
    } else {
        const ldHTMLSelector = document.querySelector('[itemtype="https://schema.org/Product"]');
        if (ldHTMLSelector) {
            const { outerHTML } = ldHTMLSelector;
            const parsed = WAE().parse(outerHTML.replace(/\s*[\r\n]/gm, ''));
            const { microdata } = parsed;
            const { Product } = microdata;
            product = Product[0];
        }
    }

    if (product) {
        product = ConvertKeysToLowerCase(product);
    }
    return product;
};

exports.handler = async (event) => {
    // parse args
    const { url, parseHrefs, parseSchema } = event;
    console.log('url: ', url);
    const { host: originHost } = new Url(url);

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
            excludeServices.some((v) => request._url.includes(v))
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
                    const { origin, pathname } = new Url(href);
                    return `${origin}${pathname}`;
                })
        ),
    ];

    /**
     *  if parseSchema is true
     */
    const product =
        parseSchema && originHost.split('.').includes('amazon')
            ? await getAmazonProductByUrl(url)
            : getProductSchema(await page.content());
    console.log(product);

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
