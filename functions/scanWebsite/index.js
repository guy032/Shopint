const queue = require('queue');
const AWS = require("aws-sdk");
const Lambda = new AWS.Lambda();

const visitedURLs = [];

async function invokeLambda({ functionName, payload }) {
  const req = {
    FunctionName: functionName,
    Payload: JSON.stringify(payload),
    InvocationType: "RequestResponse",
  };
  const response = await Lambda.invoke(req).promise();
  const { Payload } = response;
  return JSON.parse(Payload);
}

async function scanUrl(url) {
  const { hrefs } = await invokeLambda({ functionName: 'shopintGetWebsiteData', payload: { url } });
  for (href of hrefs) {
    if (!visitedURLs.includes(href)) {
      visitedURLs.push(url);
      q.push(async (cb) => {
        const result = await scanUrl(href);
        cb(null, result);
      });
    }
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
      if (err) console.log(err);
      else resolve(q.results);
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
