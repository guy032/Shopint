const queue = require('queue');
const { invokeLambda } = require('./lambda');

exports.handler = async (event) => {
    const { url } = event;

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
            functionName: 'parseSingleUrl',
            payload: { url, parseHrefs: true, parseSchema: true },
        });
        
        console.log(`${url}: ${hrefs ? hrefs.length : hrefs}`);

        if (product) {
            products.push({ url, ...product });
        }

        (hrefs || []).forEach((href) => {
            if (!visitedURLs.includes(href)) {
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
    return products;
};
