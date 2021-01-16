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

class BrowserManager {
  constructor(){
    this.instances = [];
  }
  async createInstance(){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const instance = {browser, page, isFree: false};
    this.instances.push(instance);
    return instance;
  }
  async getFreeInstance(){
    for (const instance of this.instances){
      if (instance.isFree){
        instance.isFree = false;
        return instance;
      }
    }
    // if here, no free instance
    return this.createInstance();
  }
  freeInstance(instance){
    instance.isFree = true;
  }
  async clearInstances(){
    const promises = [];
    for (const instance of this.instances){
      promises.push(instance.browser.close())
    }
    await Promise.all(promises);
  }
}

const getProduct = (url, browserManager) => new Promise(async (resolve) => {
  let product;
  url = new Url(url);
  const { host, href } = url;
  const hostArr = host.split('.');
  if (hostArr.includes('amazon')) {
    product = await getAmazonProductByUrl(url);
  } else {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(href, {waitUntil: 'networkidle0', timeout: 15000});
    const html = await page.content();
    product = getProductSchema(html);
    await browser.close();
  }
  resolve(product);
});

(async () => {
  console.time('scan');
  const promises = [];
  const browserManager = new BrowserManager();
  for (url of urls) promises.push(getProduct(url, browserManager));
  const results = await Promise.all(promises);
  console.log(results);
  console.timeEnd('scan');
})();
