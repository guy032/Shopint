const Url = require("url-parse");
const chromeLambda = require("chrome-aws-lambda");
const { puppeteer, executablePath } = chromeLambda;

const exclude_services = [
  "facebook.net",
  "facebook.com",
  "google-analytics.com",
];

exports.handler = async (event) => {
  const { url } = event;
  console.log(url);

  const { host } = new Url(url);
  const originHost = host;

  const browser = await puppeteer.launch({
    executablePath: await executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--single-process"],
  });
  const pages = await browser.pages();
  const page = pages[0];
  await page.setRequestInterception(true);
  page.on("error", (err) => console.log("error happen at the page: ", err));
  page.on("pageerror", (pageerr) =>
    console.log("pageerror occurred: ", pageerr)
  );
  page.on("request", (request) => {
    if (["image", "stylesheet", "font"].indexOf(request.resourceType()) !== -1)
      request.abort();
    else if (exclude_services.some((v) => request._url.includes(v)))
      request.abort();
    else request.continue();
  });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
  let hrefs = await page.$$eval("a", (as) => as.map((a) => a.href));
  hrefs = hrefs.filter((href) => {
    const { host } = new Url(href);
    return href != "" &&
    originHost.indexOf(host) !== -1 &&
    !href.endsWith(".pdf") &&
    !href.endsWith(".jpg") &&
    !href.endsWith(".jpeg") &&
    !href.endsWith(".png")
  });
  console.log(hrefs.length);
  await browser.close();
  return {
    hrefs
  };
};
