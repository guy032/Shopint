process.setMaxListeners(0);

const WAE = require("jsonld-parser").default;
const puppeteer = require("puppeteer");
const Url = require("url-parse");
// const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const { getAmazonProductByUrl } = require("./vendors/amazon");

function ConvertKeysToLowerCase(obj) {
  var output = {};
  for (i in obj) {
    if (Object.prototype.toString.apply(obj[i]) === "[object Object]") {
      output[i.toLowerCase()] = ConvertKeysToLowerCase(obj[i]);
    } else if (Object.prototype.toString.apply(obj[i]) === "[object Array]") {
      output[i.toLowerCase()] = [];
      output[i.toLowerCase()].push(ConvertKeysToLowerCase(obj[i][0]));
    } else {
      output[i.toLowerCase()] = obj[i];
    }
  }
  return output;
}

const urls = ["http://www.matara-g.com/items/2077521-HL-L2310D-Brother"];

const exclude_services = [
  "facebook.net",
  "facebook.com",
  "google-analytics.com",
  // "bootstrap",
  // "jquery.nicescroll.js",
  // "jstorage.js",
  // "jquery.cookie.js",
  // "jquery.mobile.custom.min.js",
  // "jquery.lazyload.min.js",
  // "jquery-ui.min.js",
  // "owl.carousel.min.js",
  // "lightGallery.js",
  // "lightslider.min.js",
  // "responsive.js",
];

const getProductSchema = (html) => {
  html = html
    .replace(/http:\/\/schema.org/gm, "https://schema.org")
    .replace(/https:\/\/schema.org\/product/gm, "https://schema.org/Product");
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
      // console.log(jsonLd);
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
    const ldHTML = document.querySelector(
      '[itemtype="https://schema.org/Product"]'
    ).outerHTML;
    const parsed = WAE().parse(ldHTML.replace(/\s*[\r\n]/gm, ""));
    const { microdata } = parsed;
    const { Product } = microdata;
    product = Product[0];
  }

  product = ConvertKeysToLowerCase(product);
  return product;
};

const getProduct = (url) =>
  new Promise(async (resolve) => {
    let product;
    url = new Url(url);
    const { host, href } = url;
    const hostArr = host.split(".");
    if (hostArr.includes("amazon")) {
      product = await getAmazonProductByUrl(url);
    } else {
      console.time('launch and newPage');
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      console.timeEnd('launch and newPage');
      await page.setRequestInterception(true);
      const resourceRequests = [];
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
          resourceRequests.push[request._url];
          console.log(`${request.resourceType()}: ${request._url}`);
        }
      });
      // remove all unnessecary web assets from requests
      await page.goto(href, { waitUntil: "networkidle0", timeout: 15000 });
      const html = await page.content();
      product = getProductSchema(html);
      await browser.close();
    }
    resolve(product);
  });

(async () => {
  console.time('scan');
  const promises = [];
  for (url of urls) promises.push(getProduct(url));
  const results = await Promise.all(promises);
  console.log(results);
  console.timeEnd('scan');
})();
