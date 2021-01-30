const Url = require('url-parse');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const { JSDOM } = require('jsdom');
const { invokeRemoteLambda } = require('./lambda');

const { getAmazonProductByUrl } = require('./vendors/amazon');
const { getProductSchema } = require('./schema');
const { prefixes: excludedPrefixes, extensions: excludedExtensions, meta: excludedMeta } = require('./excluded.json');

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
        const delay = retryCount * 1000;
        console.log(`delay: ${delay}`);
        return delay;
    },
});

exports.handler = async (event) => {
    // parse args
    const { url, parseHTML, parseHrefs, parseSchema } = event;
    console.log('url: ', url);
    const { host: rootHost, origin: rootOrigin } = new Url(url);

    const getHtml = async (url) => {
        // TODO - use axios or remote lambda by configuration or by env properties

        // return (
        //     await axios.get(url, {
        //         headers: {
        //             Referer: url,
        //             userAgent:
        //                 'Mozilla/5.0 (X11; Linux x86_64; Storebot-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
        //         },
        //     })
        // ).data;
        return await invokeRemoteLambda({
            functionName: 'getHtmlHidden',
            payload: {
                url,
            },
        });
    };

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
            [...document.querySelectorAll('a')]
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
                    const { pathname, query } = new Url(href);
                    return `${rootOrigin}${pathname}${query}`;
                })
        ),
    ];

    let title, meta;
    if (parseHTML) {
        title = document.title;
        meta = {};
        [...document.querySelectorAll('meta')].map((metaTag) => {
            const { name, content } = metaTag;
            if (name.length !== 0 && !excludedMeta.includes(name)) meta[name] = content;
        });
    }

    // parse title? parse meta tags? parse other schemas?

    /**
     *  if parseSchema is true
     */
    const product =
        parseSchema && rootHost.split('.').includes('amazon')
            ? await getAmazonProductByUrl(url)
            : getProductSchema(rootOrigin, html);
    if (product) console.log(product);

    return {
        title,
        meta,
        hrefs,
        product,
    };
};
