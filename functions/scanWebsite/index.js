const queue = require('queue');
const AWS = require("aws-sdk");
AWS.config.region = 'eu-central-1';
const Lambda = new AWS.Lambda();

const visitedURLs = [];

const crawlQueue = queue({ results: [] });
const searchQueue = queue({ results: [] });
const insertQueue = (queue, href) => {
  queue.push(async (cb) => {
    const result = await scanUrl(href);
    // console.log(result);
    cb(null, result);
  });
}

async function invokeLambda({ functionName, payload }) {
  const req = {
    FunctionName: functionName,
    Payload: JSON.stringify(payload),
    InvocationType: "RequestResponse",
  };
  // console.log(JSON.stringify(payload));
  const response = await Lambda.invoke(req).promise();
  // console.log(JSON.stringify(response));
  const { Payload } = response;
  return JSON.parse(Payload);
}

async function scanUrl(url) {
  let { hrefs, product } = await invokeLambda({ functionName: 'getWebsiteData', payload: { url } });
  if (hrefs) {
    console.log(hrefs.length);
    console.log(product);
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
}

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

/* q.on('success', function (result, job) {
  console.log('job finished processing:', job.toString().replace(/\n/g, ''))
  console.log('The result is:', result)
}); */

function wait() {
  return new Promise((resolve, reject) => {
    crawlQueue.start((err) => {
      console.log(`visitedURLs: ${visitedURLs.length}`);
      if (err) console.log(err);
      else {
        // console.log(JSON.stringify(visitedURLs));
        resolve(visitedURLs);
      }
    });
  });
}

exports.handler = async (event) => {
  const { url } = event;

  crawlQueue.push(async (cb) => {
    visitedURLs.push(url);
    const result = await scanUrl(url);
    cb(null, result);
  });

  return await wait();
};
