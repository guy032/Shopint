const queue = require('queue');
const Url = require('url-parse');
const { invokeLambda } = require('./lambda');

exports.handler = async (event) => {
    const { url } = event;
    const { host: rootHost } = new Url(url);

    const visitedURLs = [];
    const products = [];
    const crawlQueue = queue();
    const searchQueue = queue();

    const insertQueue = (queue, call, href) => {
        queue.push(async (cb) => {
            cb(null, await call(href));
        });
    };

    const scanUrl = async (url) => {
        let { hrefs, product } = await invokeLambda({
            functionName: 'parseSingleUrlSource',
            payload: { url, parseHrefs: true, parseSchema: true },
        });
        if (product) {
            products.push({ url, ...product });
        }

        (hrefs || []).forEach((href) => {
            const { host: hrefHost } = new Url(href);
            if (rootHost === hrefHost && !visitedURLs.includes(href)) {
                visitedURLs.push(href);
                insertQueue(crawlQueue, scanUrl, href);
                insertQueue(searchQueue, searchProduct, href);
            }
        });
        return url;
    };

    async function searchProduct(product) {
        // let { searchResults } = await invokeLambda({ functionName: 'getSearchResults', payload: { product } });
        // console.log(searchResults);
    }

    const executeQueue = (queue) => {
        return new Promise((res, rej) => {
            queue.start((err) => (err ? rej(err) : res()));
        });
    };

    await scanUrl(url);
    await Promise.all([executeQueue(crawlQueue), executeQueue(searchQueue)]);
    console.log(`visitedURLs: ${visitedURLs.length}`);
    console.log(`products: ${products.length}`);
    // console.log(JSON.stringify(products));
    return products;
};
