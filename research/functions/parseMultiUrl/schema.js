const { JSDOM } = require('jsdom');
const WAE = require('jsonld-parser').default;

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

// https://www.scrapingbee.com/blog/scraping-e-commerce-product-data/
// JSON-LD, RDF-A (todo: check if works), Microdata
exports.getProductSchema = (html) => {
    html = html
        .replace(/http:\/\/schema.org/gm, 'https://schema.org')
        .replace(/https:\/\/schema.org\/product/gm, 'https://schema.org/Product')
        .replace(/http:\/\/data-vocabulary.org\/Product/gm, 'https://schema.org/Product');
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
    } else {
        const ldHTMLSelector = document.querySelector('[itemtype="https://schema.org/Product"]');
        if (ldHTMLSelector) {
            const { outerHTML } = ldHTMLSelector;
            const parsed = WAE().parse(outerHTML.replace(/\s*[\r\n]/gm, ''));
            const { microdata } = parsed;
            const { Product } = microdata;
            product = Product[0];
        }
    }

    if (product) {
        product = ConvertKeysToLowerCase(product);
    }
    return product;
};
