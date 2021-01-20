const queue = require('queue');
const AWS = require("aws-sdk");
AWS.config.region = 'eu-central-1';
const Lambda = new AWS.Lambda();

const visitedURLs = [];

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

const insertQueue = href => {
  q.push(async (cb) => {
    const result = await scanUrl(href);
    // console.log(result);
    cb(null, result);
  });
}

async function scanUrl(url) {
  let { hrefs, product } = await invokeLambda({ functionName: 'getWebsiteData', payload: { url } });
  if (hrefs) {
    console.log(hrefs.length);
    console.log(product);
    for (const href of hrefs) {
      if (!visitedURLs.includes(href)) {
        visitedURLs.push(href);
        insertQueue(href);
      }
    }
  } else {
    // console.log('no hrefs');
  }
  return url;
}

const q = queue({ results: [] });

/* q.on('success', function (result, job) {
  console.log('job finished processing:', job.toString().replace(/\n/g, ''))
  console.log('The result is:', result)
}); */

function wait() {
  return new Promise((resolve, reject) => {
    q.start((err) => {
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

  q.push(async (cb) => {
    visitedURLs.push(url);
    const result = await scanUrl(url);
    cb(null, result);
  });

  return await wait();
};
