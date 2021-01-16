const chromeLambda = require("chrome-aws-lambda");
const { puppeteer, executablePath } = chromeLambda;
console.log(executablePath);

const exclude_services = [
  "facebook.net",
  "facebook.com",
  "google-analytics.com",
];

exports.handler = async event => {
  const chromiumPath = await executablePath;
  console.log(chromiumPath);
  const { url } = event;
  console.log(url);
  const browser = await puppeteer.launch({
    executablePath: chromiumPath,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('error', err => console.log('error happen at the page: ', err));
  page.on('pageerror', pageerr => console.log('pageerror occurred: ', pageerr));
  page.on("request", (request) => {
    if (["image", "stylesheet", "font"].indexOf(request.resourceType()) !== -1) {
      request.abort();
      // console.log(`${request.resourceType()}: aborted`);
    } else if (exclude_services.some(v => request._url.includes(v))) {
      request.abort();
      // console.log(`${request._url}: aborted`);
    } else {
      request.continue();
      console.log(`${request.resourceType()}: ${request._url}`);
    }
  });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
  const hrefs = await page.$$eval('a', as => as.map(a => a.href));
  console.log(hrefs);
  return hrefs;
};
