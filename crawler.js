const http = require('http');
var axios = require('axios');
var Crawler = require("js-crawler");
const WAE = require('jsonld-parser').default
const puppeteer = require('puppeteer');
const Url = require('url-parse');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const getHtml = async (url) => {
    return (await axios.get(url, {
        headers: {
            Referer: url,
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64; Storebot-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'
        }
    })).data;
}

function ConvertKeysToLowerCase(obj) {
    var output = {};
    for (i in obj) {
        if (Object.prototype.toString.apply(obj[i]) === '[object Object]') {
           output[i.toLowerCase()] = ConvertKeysToLowerCase(obj[i]);
        }else if(Object.prototype.toString.apply(obj[i]) === '[object Array]'){
            output[i.toLowerCase()]=[];
             output[i.toLowerCase()].push(ConvertKeysToLowerCase(obj[i][0]));
        } else {
            output[i.toLowerCase()] = obj[i];
        }
    }
    return output;
  };

const getProductSchema = (html) => {
    html = html.replace(/http:\/\/schema.org/gm, 'https://schema.org').replace(/https:\/\/schema.org\/product/gm, 'https://schema.org/Product');
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    let product;
    if (ldScripts.length > 0) {
      for (ldScript of ldScripts) {
        let { textContent } = ldScript;
        textContent = textContent.replace(/\s*[\r\n]/gm, '');
        const jsonLd = JSON.parse(ldScript.textContent.replace(/\s*[\r\n]/gm, ''));
        if (Array.isArray(jsonLd)) {
          product = jsonLd.find(item => item['@type'].indexOf('Product') !== -1);
        } else {
          const type = jsonLd['@type'];
          if (type) {
            if (jsonLd['@type'].indexOf('Product') !== -1) {
              product = jsonLd;
            }
          } else {
            const graph = jsonLd['@graph'];
            if (graph) product = graph.find(item => item['@type'].indexOf('Product') !== -1);
          }
        }
      }
    } else {
      const ldHTML = document.querySelector('[itemtype="https://schema.org/Product"]').outerHTML;
      const parsed = WAE().parse(ldHTML.replace(/\s*[\r\n]/gm, ''));
      const { microdata } = parsed;
      const { Product } = microdata;
      product = Product[0];
    }
    return ConvertKeysToLowerCase(product);
}

const getCrawledSchemas = async (rootUrl) => {
    return new Promise((res) => {
        const schemas = [];
        new Crawler().configure({
          depth: 10, 
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36', 
          shouldCrawl: (currUrl) => currUrl.includes(rootUrl)
        })
        .crawl(rootUrl, function(page) {
            // console.log(page);
            schemas.push(getProductSchema(page.content))
        }, function(response) {
            console.log("ERROR occurred:");
            console.log(response.status);
            console.log(response.url);
            console.log(response.referer);
        }, function onAllFinished(crawledUrls) {
            console.log('All crawling finished');
            console.log(crawledUrls.length);
            console.log(crawledUrls);
            res(schemas);
        });
    })
}

exports.scanUrl = async (url) => {
  return await getCrawledSchemas(url);
}

// (async () => {
//     const url = 'https://alluxur.com/';
//     console.time('scan');
//     console.log(await getCrawledSchemas(url));
//     console.timeEnd('scan');
//     console.log(await getHtml(url));
// })()

