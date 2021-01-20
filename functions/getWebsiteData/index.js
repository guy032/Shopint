const fs = require("fs");
const Url = require("url-parse");
const chromeLambda = require("chrome-aws-lambda");
const { puppeteer, executablePath } = chromeLambda;
const WAE = require("jsonld-parser").default;
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

process.setMaxListeners(0);

const originalConsoleError = console.error;
console.error = (msg) => {
  if(msg.startsWith(msg, 'Error: Could not parse CSS stylesheet')) return;
  originalConsoleError(msg);
};

const { getAmazonProductByUrl } = require("./vendors/amazon");

const ConvertKeysToLowerCase = (obj) => {
  var key, keys = Object.keys(obj);
  var n = keys.length;
  var newobj={}
  while (n--) {
    key = keys[n];
    newobj[key.toLowerCase()] = obj[key];
  }
  return newobj;
}

const exclude_services = [
  "facebook.net",
  "facebook.com",
  "google-analytics.com",
];

const getProductSchema = (html) => {
  html = html
    .replace(/http:\/\/schema.org/gm, "https://schema.org")
    .replace(/https:\/\/schema.org\/product/gm, "https://schema.org/Product")
    .replace(/http:\/\/data-vocabulary.org\/Product/gm, "https://schema.org/Product");
  const dom = new JSDOM(html);
  const { window } = dom;
  const { document } = window;
  const ldScripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  );
  let product;
  if (ldScripts.length > 0) {
    for (ldScript of ldScripts) {
      let { textContent } = ldScript;
      textContent = textContent.replace(/\s*[\r\n]/gm, "");
      const jsonLd = JSON.parse(
        ldScript.textContent.replace(/\s*[\r\n]/gm, "")
      );
      if (Array.isArray(jsonLd)) {
        product = jsonLd.find(
          (item) => item["@type"].indexOf("Product") !== -1
        );
      } else {
        const type = jsonLd["@type"];
        if (type) {
          if (jsonLd["@type"].indexOf("Product") !== -1) {
            product = jsonLd;
          }
        } else {
          const graph = jsonLd["@graph"];
          if (graph)
            product = graph.find(
              (item) => item["@type"].indexOf("Product") !== -1
            );
        }
      }
    }
  } else {
    const ldHTMLSelector = document.querySelector('[itemtype="https://schema.org/Product"]');
    if (ldHTMLSelector) {
      const { outerHTML } = ldHTMLSelector;
      const parsed = WAE().parse(outerHTML.replace(/\s*[\r\n]/gm, ""));
      const { microdata } = parsed;
      const { Product } = microdata;
      product = Product[0];
    }
  }

  if (product) product = ConvertKeysToLowerCase(product);
  console.log(product);
  return product;
};

exports.handler = async (event) => {
  const { url } = event;
  console.log(url);

  const { host } = new Url(url);
  const originHost = host;

  const browser = await puppeteer.launch({
    executablePath: await executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--single-process",
      "--disk-cache-dir=/temp/browser-cache-disk",
    ],
  });

  let chromeTmpDataDir = null;

  let chromeSpawnArgs = browser.process().spawnargs;
  for (let i = 0; i < chromeSpawnArgs.length; i++) {
    if (chromeSpawnArgs[i].indexOf("--user-data-dir=") === 0) {
      chromeTmpDataDir = chromeSpawnArgs[i].replace("--user-data-dir=", "");
    }
  }

  let product;

  const pages = await browser.pages();
  const page = pages[0];
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (["image", "stylesheet", "font"].indexOf(request.resourceType()) !== -1)
      request.abort();
    else if (exclude_services.some((v) => request._url.includes(v)))
      request.abort();
    else request.continue();
  });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
  let hrefs = await page.$$eval("a", (as) => as.map((a) => a.href));
  hrefs = hrefs.filter((href) => {
    const { host } = new Url(href);
    return (
      href != "" &&
      originHost.indexOf(host) !== -1 &&
      !href.endsWith(".pdf") &&
      !href.endsWith(".jpg") &&
      !href.endsWith(".jpeg") &&
      !href.endsWith(".webp") &&
      !href.endsWith(".png") &&
      !href.startsWith("javascript") &&
      !href.startsWith("#")
    );
  });
  for (let i = 0; i < hrefs.length; i++) {
    const href = hrefs[i];
    const { origin, pathname } = new Url(href);
    hrefs[i] = `${origin}${pathname}`;
  }
  hrefs = hrefs.filter((item, pos) => hrefs.indexOf(item) == pos);
  console.log(hrefs.length);

  const hostArr = originHost.split(".");
  if (hostArr.includes("amazon")) {
    product = await getAmazonProductByUrl(url);
  } else {
    const html = await page.content();
    product = getProductSchema(html);
  }

  console.log(product);

  await browser.close();

  if (chromeTmpDataDir !== null) fs.rmdirSync(chromeTmpDataDir, { recursive: true });

  return {
    hrefs,
    product,
  };
};
