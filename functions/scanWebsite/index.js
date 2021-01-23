const queue = require('queue');
const Url = require('url-parse');
const { invokeLambda } = require('./lambda');
const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();

exports.handler = async (event) => {
    const { url } = event;
    const { host: rootHost } = new Url(url);
    let docHost = rootHost.startsWith('www.') ? rootHost.substr(4) : rootHost;

    const websiteDoc = firestore.doc(`websites/${docHost}`);

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
        try {
            let { title, meta, hrefs, product, errorMessage } = await invokeLambda({
                functionName: 'parseSingleUrlSource',
                payload: { url, parseHTML: true, parseHrefs: true, parseSchema: true },
            });
            let { pathname } = new Url(url);

            if (pathname.length !== 0) {
                pathname = pathname.replace(/\//gm, '%2f');
                const pathVal = {};
                if (errorMessage) {
                    console.log(`${pathname}: ${errorMessage}`);
                    pathVal.errorMessage = errorMessage;
                } else {
                    if (product) {
                        products.push({ url, ...product });
                        const productRef = websiteDoc.collection('products').doc(pathname);
                        // add time to doc
                        await productRef.set({ url, ...product }, { merge: true });
                        pathVal.product = productRef;
                    }
                    if (title) pathVal.title = title;
                    if (meta) pathVal.meta = meta;
                    // add time to doc
                    (hrefs || []).forEach((href) => {
                        const { host: hrefHost } = new Url(href);
                        if (rootHost === hrefHost && !visitedURLs.includes(href)) {
                            visitedURLs.push(href);
                            insertQueue(crawlQueue, scanUrl, href);
                            insertQueue(searchQueue, searchProduct, href);
                        }
                    });
                }
                websiteDoc.collection('paths').doc(pathname).set(pathVal, { merge: true });
            }
        } catch (e) {
            console.log(e);
        }
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
    // add time to website doc

    console.log(`visitedURLs: ${visitedURLs.length}`);
    console.log(`products: ${products.length}`);
    // console.log(JSON.stringify(products));
    return products;
};
