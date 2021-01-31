const { JSDOM } = require('jsdom');
const WAE = require('jsonld-parser').default;
const { parse: ogParse } = require('parse-open-graph');

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
exports.getProductSchema = (origin, html) => {
    html = html
        .replace(/http:\/\/schema.org/gm, 'https://schema.org')
        .replace(/https:\/\/schema.org\/product/gm, 'https://schema.org/Product')
        .replace(/http:\/\/data-vocabulary.org\/Product/gm, 'https://schema.org/Product');
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const ldHTMLSelector = document.querySelector('[itemtype="https://schema.org/Product"]');
    const ogMetas = document.querySelectorAll('meta[property^="og:"]');
    let product;
    if (ldScripts.length > 0) {
        for (ldScript of ldScripts) {
            let { textContent } = ldScript;
            textContent = textContent
                .trim()
                .replace(/\s*[\r\n]/gm, '')
                .replace(/^(\/\/\s*)?<!\[CDATA\[|(\/\/\s*)?\]\]>$/g, '');
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
