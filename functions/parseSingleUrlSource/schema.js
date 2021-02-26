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

// https://snowqueen.ru/product/uteplennaja-kurtka-s-kapjushonom-241926000
// https://www.google.com/searchbyimage?image_url=http://www.snapit.co.il/wp-content/uploads/2021/01/27725-productpicture-lores-en-l3156_main.png.png
// get different html results with axios compares with postman

exports.getProductSchema = (origin, html) => {
    html = html
        .trim()
        .replace(/\s*[\r\n]/gm, '')
        .replace(/http:\/\/schema.org/gm, 'https://schema.org')
        .replace(/https:\/\/schema.org\/product/gm, 'https://schema.org/Product')
        .replace(/http:\/\/data-vocabulary.org\/Product/gm, 'https://schema.org/Product')
        .replace(/typeof="product"/gm, 'typeof="Product"')
        .replace(/property="product:price/gm, 'property="og:price');
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const ldHTMLSelector = document.querySelector('[itemtype="https://schema.org/Product"]');
    const rfdHTMLSelectors = document.querySelectorAll('[vocab="https://schema.org/"][typeof="Product"]');
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
        console.log('todo: RFD-A');
        // https://developers.google.com/search/docs/data-types/product#rdfa
    } else if (ogMetas.length > 0) {
        const { og } = ogParse(
            [...ogMetas].map((el) => ({
                property: el.getAttribute('property'),
                content: el.getAttribute('content').trim(),
            }))
        );
        const { type } = og;
        if (type && type.toLowerCase() === 'product') product = og;
        else {
            console.log(JSON.stringify(og));
            // we are missing type of product or price attribute to consider this as a product
            // https://ksp.co.il/?uin=102134 has a clue with itemprop="itemCondition"
        }

        // todo: many times no product type but yet it's a product
        // https://www.azrieli.com/o/b7246227-4374-4478-ae01-3ba89190dbd8
        // https://www.e-katalog.ru/CASIO-G-SHOCK-DW-5600E-1V.htm
        // price is missing many times from the headers but exists in Facebook Pixel Code if bigger than 0/1
        // https://publicwww.com/websites/%22fbq%28%27track%27%2C+%27ViewContent%27%22+%22content_type%3A+%27product%27%22+%22currency%22/2
        // fbq('track', 'ViewContent', {
        //     content_ids: ['b7246227-4374-4478-ae01-3ba89190dbd8'],
        //     content_type: 'product',
        //     value: 2430.00,
        //     currency: 'ILS'
        // });
        // fbq('track', 'ViewContent', {
        //     content_category: 'Наручные часы',
        //     content_name: 'Casio G-Shock DW-5600E-1V',
        //     content_ids: [362312],
        //     content_type: 'product',
        //     currency: 'RUB',
        //     value: 0.00
        // });
    }
    // If we found the product link through a source like Google Shopping or Zap and they know the details of the product fallback to this.

    if (product) {
        product = JSON.stringify(product);
        product = product.replace(/&amp;/gm, '&').replace(/&#160;/gm, ' ');
        product = JSON.parse(product);

        if (product.url && product.url.startsWith('/')) product.url = `${origin}${product.url}`;
        if (product.image && typeof product.image === 'string' && product.image.startsWith('/')) {
            product.image = `${origin}${product.image}`;
        }

        product = ConvertKeysToLowerCase(product);
    }
    return product;
};
