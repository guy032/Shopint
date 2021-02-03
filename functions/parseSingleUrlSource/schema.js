const { JSDOM } = require('jsdom');
const WAE = require('jsonld-parser').default;
const { parse: ogParse } = require('parse-open-graph');
const fs = require('fs');

const ConvertKeysToLowerCase = (obj) => {
    var key,
        keys = Object.keys(obj);
    var n = keys.length;
    var newobj = {};
    while (n--) {
        key = keys[n];
        newobj[key.toLowerCase()] = obj[key];
    }
    return newobj;
};

// https://snowqueen.ru/product/uteplennaja-kurtka-s-kapjushonom-241926000
// https://www.google.com/searchbyimage?image_url=http://www.snapit.co.il/wp-content/uploads/2021/01/27725-productpicture-lores-en-l3156_main.png.png
// get different html results with axios compares with postman

// JSON-LD, RDF-A (todo: check if works), Microdata, Open Graph
exports.getProductSchema = (origin, html) => {
    html = html
        .trim()
        .replace(/\s*[\r\n]/gm, '')
        .replace(/http:\/\/schema.org/gm, 'https://schema.org')
        .replace(/https:\/\/schema.org\/product/gm, 'https://schema.org/Product')
        .replace(/http:\/\/data-vocabulary.org\/Product/gm, 'https://schema.org/Product')
        .replace(/typeof="product"/gm, 'typeof="Product"');
    console.log(html);
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const ldHTMLSelector = document.querySelector('[itemtype="https://schema.org/Product"]');
    const rfdHTMLSelectors = document.querySelectorAll('[vocab="https://schema.org/"][typeof="Product"]');
    console.log(rfdHTMLSelectors.length);
    const ogMetas = document.querySelectorAll('meta[property^="og:"]');
    let product;
    if (ldScripts.length > 0) {
        for (ldScript of ldScripts) {
            let { textContent } = ldScript;
            textContent = textContent.replace(/^(\/\/\s*)?<!\[CDATA\[|(\/\/\s*)?\]\]>$/g, '');
            const jsonLd = JSON.parse(textContent);
            if (Array.isArray(jsonLd)) {
                product = jsonLd.find((item) => item['@type'].indexOf('Product') !== -1);
            } else {
                const type = jsonLd['@type'];
                if (type) {
                    if (jsonLd['@type'].indexOf('Product') !== -1) {
                        product = jsonLd;
                    }
                } else {
                    const graph = jsonLd['@graph'];
                    if (graph) product = graph.find((item) => item['@type'].indexOf('Product') !== -1);
                }
            }
        }
    } else if (ldHTMLSelector) {
        const { outerHTML } = ldHTMLSelector;
        const parsed = WAE().parse(outerHTML.replace(/\s*[\r\n]/gm, ''));
        const { microdata } = parsed;
        const { Product } = microdata;
        product = Product[0];
    } else if (rfdHTMLSelectors.length > 0) {
        console.log('RFD-A');
    } else if (ogMetas.length > 0) {
        const { og } = ogParse(
            [...ogMetas].map((el) => ({
                property: el.getAttribute('property'),
                content: el.getAttribute('content').trim(),
            }))
        );
        const { type } = og;
        if (type.toLowerCase() === 'product') product = og;
    }

    if (product) {
        product = JSON.stringify(product);
        product = product.replace(/&amp;/gm, '&').replace(/&#160;/gm, ' ');
        product = JSON.parse(product);

        if (product.url && product.url.startsWith('/')) product.url = `${origin}${product.url}`;
        if (product.image && !Array.isArray(product.image) && product.image.startsWith('/')) {
            product.image = `${origin}${product.image}`;
        }

        product = ConvertKeysToLowerCase(product);
    }
    return product;
};
