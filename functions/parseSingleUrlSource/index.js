const Url = require('url-parse');
const axios = require('axios');
const { JSDOM } = require('jsdom');

const { getAmazonProductByUrl } = require('./vendors/amazon');
const { getProductSchema } = require('./schema');
const {
    prefixes: excludedPrefixes,
    extensions: excludedExtensions,
} = require('./excluded.json');

exports.handler = async (event) => {
    // parse args
    const { url, parseHrefs, parseSchema } = event;
    console.log('url: ', url);
    const { host: rootHost, origin: rootOrigin } = new Url(url);

    /* const { drive } = osu;
    const driveInfo = await drive.info();
    console.log(JSON.stringify(driveInfo));
    const files = fs.readdirSync('/tmp');
    console.log(JSON.stringify(files)); */

    const getHtml = async (url) => {
        return (await axios.get(url, {
            headers: {
                Referer: url,
                userAgent: 'Mozilla/5.0 (X11; Linux x86_64; Storebot-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'
            }
        })).data;
    }

    const html = await getHtml(url);

    /**
     * if parseHrefs is true
     * Get all hrefs in page
     * Exclude irrelevant extension or prefixes
     * Remove duplicates
     */
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;
    const hrefs = parseHrefs && [
        ...new Set(
            ([...document.querySelectorAll('a')])
                .filter((link) => {
                    const { href } = link;
                    const { host } = new Url(href);
                    return (
                        href != '' &&
                        rootHost.indexOf(host) !== -1 &&
                        !excludedExtensions.map((ext) => href.split('?')[0].endsWith(`.${ext}`)).includes(true) &&
                        !excludedPrefixes.map((prefix) => href.startsWith(prefix)).includes(true)
                    );
                })
                .map((link) => {
                    const { href } = link;
                    const { pathname } = new Url(href);
                    return `${rootOrigin}${pathname}`;
                })
        ),
    ];
    if (hrefs) console.log(`hrefs: ${hrefs.length}`);

    /**
     *  if parseSchema is true
     */
    const product =
        parseSchema && rootHost.split('.').includes('amazon')
            ? await getAmazonProductByUrl(url)
            : getProductSchema(html);
    if (product) console.log(product);

    return {
        hrefs,
        product,
    };
};
