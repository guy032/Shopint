// WooCommerce - http://mbrouka.ma
// Shopify - https://bearandpartner.com https://alluxur.com
// Wish - https://home.wish.com
// Ebay - https://www.ebay.com
// WIX - https://www.kaekoo.com
// AMAZON - https://www.amazon.ca
// Konimbo - http://www.matara-g.com
// eshop - https://www.toner-supply.co.il
// Other:
// https://www.cicig.co
// https://www.zipy.co.il
// https://articulo.mercadolibre.com.mx

process.setMaxListeners(0);

const WAE = require('jsonld-parser').default
const puppeteer = require('puppeteer');
const Url = require('url-parse');
const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const { getAmazonProductByUrl } = require('./vendors/amazon');

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

const urls = [
  "http://mbrouka.ma/?product=nordic-modern-abstract-geometric-fox-crafts-desktop-ornaments-creative-for-office-home-decorations",
  "https://bearandpartner.com/products/nordic-modern-abstract-geometric-fox-crafts-desktop-ornaments-creative-for-office-home-decorations-animal-resin-crafts",
  "https://home.wish.com/product/modern-minimalist-geometric-resin-fox-animal-home-decoration-decorative-crafts-5db3018916025b0eb61e8bd7?hide_login_modal=true&share=web",
  "https://www.cicig.co/product/if7xter",
  "https://www.zipy.co.il/p/%D7%90%D7%9C%D7%99%D7%90%D7%A7%D7%A1%D7%A4%D7%A8%D7%A1/nordic-modern-abstract-geometric-fox-crafts-desktop-ornaments-creative-for-office-home-decorations-animal-resin-crafts/4000456883534/",
  "https://articulo.mercadolibre.com.mx/MLM-855119757-regalos-coleccionables-del-arbol-de-navidad-del-hogar-de-s-_JM",
  "https://www.aliexpress.com/item/33004270684.html?spm=a2g0o.productlist.0.0.5fa86d94xaiJIU&algo_pvid=6d6400bf-6de8-42ef-ad46-ec9076ad7c61&algo_expid=6d6400bf-6de8-42ef-ad46-ec9076ad7c61-0&btsid=0b0a555416105565137134031e3497&ws_ab_test=searchweb0_0,searchweb201602_,searchweb201603_",
  "https://www.ebay.com/itm/Resin-Fox-Statue-Nordic-Modern-Abstract-Figurine-Office-Home-Animal-Ornament/373405583884?_trkparms=aid%3D1110006%26algo%3DHOMESPLICE.SIM%26ao%3D1%26asc%3D20200818143132%26meid%3D2289976ddc9748c699e2bce39fa445ba%26pid%3D101198%26rk%3D1%26rkt%3D12%26mehot%3Dnone%26sd%3D254660575517%26itm%3D373405583884%26pmt%3D1%26noa%3D0%26pg%3D2047675%26algv%3DSimplAMLv5PairwiseWebWithDarwoV3BBEV2b%26brand%3DUnbranded&_trksid=p2047675.c101198.m1985",
  "https://www.kaekoo.com/product-page/houndstooth",
  "http://www.snapit.co.il/product/%d7%9e%d7%93%d7%a4%d7%a1%d7%aa-%e2%80%8f%d7%94%d7%96%d7%a8%d7%a7%d7%aa-%d7%93%d7%99%d7%95-epson-ecotank-l3156-%d7%90%d7%a4%d7%a1%d7%95%d7%9f/",
  "https://www.amazon.ca/Sculptures-Abstract-Geometric-Ornaments-Decorations/dp/B08HWZMSJY",
  "http://www.matara-g.com/items/2077521-HL-L2310D-Brother",
  "https://www.toner-supply.co.il/product/%D7%9E%D7%93%D7%A4%D7%A1%D7%AA-%E2%80%8F%D7%9C%D7%99%D7%99%D7%96%D7%A8-hp-laser-107w-4zb78a",
];

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
      // console.log(jsonLd);
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

  product = ConvertKeysToLowerCase(product);
  return product;
}

const getProduct = (url) => new Promise(async (resolve) => {
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
  const promises = [];
  for (url of urls) promises.push(getProduct(url));
  const results = await Promise.all(promises);
  console.log(results);
})();
