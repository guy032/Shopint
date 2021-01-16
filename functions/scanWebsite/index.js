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
  return Payload;
}

exports.handler = async (event) => {
  const { url } = event;
  console.log(url);
  const response = await invokeLambda({ functionName: 'shopintScanWebsite', url });
  console.log(`response: ${response}`);
  return visitedURLs;
};
