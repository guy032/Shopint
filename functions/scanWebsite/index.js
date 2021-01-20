const queue = require('queue');
const AWS = require('aws-sdk');

const { STAGE, InvokePort } = process.env;
console.log(STAGE);
const Lambda =
    STAGE === 'prod'
        ? new AWS.Lambda()
        : new AWS.Lambda({
              endpoint: `http://host.docker.internal:${InvokePort}`,
              sslEnabled: false,
          });

async function invokeLambda({ functionName, payload }) {
    const req = {
        FunctionName: functionName,
        Payload: JSON.stringify(payload),
        InvocationType: 'RequestResponse',
    };
    // console.log(JSON.stringify(payload));
    const response = await Lambda.invoke(req).promise();
    // console.log(JSON.stringify(response));
    const { Payload } = response;
    return JSON.parse(Payload);
}

exports.handler = async (event) => {
    const { url } = event;

    const crawlQueue = queue({ results: [] });
    const searchQueue = queue({ results: [] });
    const insertQueue = (queue, href) => {
        queue.push(async (cb) => {
            const result = await scanUrl(href);
            // console.log(result);
            cb(null, result);
        });
    };

    const scanUrl = async (url) => {
        let { hrefs, product } = await invokeLambda({ functionName: 'getWebsiteData', payload: { url } });
        if (product) {
            product.url = url;
            products.push(product);
            console.log(JSON.stringify(product));
        }
        if (hrefs) {
            console.log(`hrefs: ${hrefs.length}`);
            for (const href of hrefs) {
                if (!visitedURLs.includes(href)) {
                    visitedURLs.push(href);
                    insertQueue(crawlQueue, href);
                    insertQueue(searchQueue, href);
                }
            }
        } else {
            // console.log('no hrefs');
        }
        return url;
    };

    async function searchProduct(product) {
        let { searchResults } = await invokeLambda({ functionName: 'getSearchResults', payload: { product } });
        // if (hrefs) {
        //   console.log(hrefs.length);
        //   console.log(product);
        //   for (const href of hrefs) {
        //     if (!visitedURLs.includes(href)) {
        //       visitedURLs.push(href);
        //       insertQueue(href);
        //     }
        //   }
        // } else {
        //   // console.log('no hrefs');
        // }
        // return url;
    }

    const wait = () => {
        return new Promise((resolve, reject) => {
            crawlQueue.start((err) => {
                if (err) console.log(err);
                else {
                    console.log(`visitedURLs: ${visitedURLs.length}`);
                    console.log(`products: ${products.length}`);
                    resolve({
                        visitedURLs,
                        products,
                    });
                }
            });
        });
    };

    const visitedURLs = [];
    const products = [];

    crawlQueue.push(async (cb) => {
        visitedURLs.push(url);
        const result = await scanUrl(url);
        cb(null, result);
    });

    return await wait();
};
