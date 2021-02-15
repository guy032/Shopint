const axios = require('axios');
const axiosRetry = require('axios-retry');
const cheerio = require('cheerio');
const { uule } = require('uule');
const Url = require('url-parse');
const { invokeLambda } = require('./lambda');
const scraperapi_key = 'b29e8e3a0736d92679cc2d37e7e2fada';
const google_url = 'https://www.google.com';
const scrapeUrl = (url) => `http://api.scraperapi.com/?api_key=${scraperapi_key}&url=${url}`;

axiosRetry(axios, {
    retryCondition: (error) => {
        console.log('error:');
        console.log(JSON.stringify(error));
        return !error.response;
    },
});

const getHtml = async (url) => {
    return await invokeLambda({
        functionName: 'getHtmlHidden',
        payload: {
            url,
        },
    });
};

const textSearch = async ({ content, language, country }) => {
    const searchUrl = `${google_url}/search?q=${encodeURIComponent(content)}&num=100&hl=en${
        language ? `&lr=lang_${language}` : ''
    }${country ? `&gl=${country}` : ''}`;
    console.log('searchUrl: ', searchUrl);
    console.time('request');
    const response = await axios.get(scrapeUrl(searchUrl));
    console.timeEnd('request');
    const $ = cheerio.load(response.data);
    return [...$('.g a:not([class])')].map((el) => $(el).attr('href'));
};

const imageSearch = async ({ content }) => {
    const searchUrl = `${google_url}/searchbyimage?image_url=${content}`;
    console.log('searchUrl: ', searchUrl);
    console.time('request');
    const response = await axios.get(scrapeUrl(searchUrl));
    console.timeEnd('request');
    const $ = cheerio.load(response.data);
    const href = $("a[href^='/search?tbs=simg:CAQS']").first().attr('href');
    if (href) {
        const images_results_url = `${google_url}${href}`;
        const url = scrapeUrl(images_results_url);
        const { data } = await axios.get(url);
        const $images = cheerio.load(data);
        return [...$images("a[rel='noopener']")].map((el) => $(el).attr('href'));
    }
    return;
};

const shopSearch = async ({ content, country }) => {
    // we can use num=100 but usually more than 20 is not relevant
    const searchUrl = `${google_url}/search?tbm=shop&q=${encodeURIComponent(content)}&num=20&hl=en${
        country ? `&uule=${uule(country)}` : ''
    }`;
    console.log('searchUrl: ', searchUrl);
    console.log(scrapeUrl(searchUrl));
    const { data } = await axios.get(scrapeUrl(searchUrl));
    const $ = cheerio.load(data);

    let hrefs = [...$('a.translate-content[href^="/aclk?"]')].map(
        (el) => `${google_url}${$(el).attr('href').split('&sig=')[0]}`
    );

    const aggregators = [...$('a.translate-content[href^="/shopping/product/"]')]
        .map((el) => {
            const { origin, pathname, query } = new Url(`${google_url}${$(el).attr('href')}`);
            const text = $(el).closest('.sh-dlr__content').find("a:contains('Compare prices from')").text();
            return {
                shops: text ? /(\d+)/gm.exec(text)[1] : 0,
                href: `${origin}${pathname}/online${query}`,
            };
        })
        .sort((a, b) => b.shops - a.shops)
        .slice(0, 1);

    console.log(JSON.stringify(aggregators));

    if (aggregators.length > 0) {
        const aggregator = aggregators[0];
        console.log(`aggregator href: ${scrapeUrl(aggregator.href)}`);
        const $aggregator = cheerio.load((await axios.get(scrapeUrl(aggregator.href))).data);
        let aggregatorHrefs = [...$aggregator('a.internal-link[href^="/aclk?"]')].map(
            (el) => `${google_url}${$aggregator(el).attr('href').split('&sig=')[0]}`
        );
        console.log(`aggregatorHrefs: ${aggregatorHrefs.length}`);

        hrefs = [...new Set([...aggregatorHrefs, hrefs])].flat();
    }

    if (hrefs.length > 0) {
        hrefs = await Promise.all(
            hrefs.map(
                (href) =>
                    new Promise(async (res) => {
                        const html = await getHtml(href);
                        if (html) {
                            const $ = cheerio.load(html);
                            let link = $("a[href^='http']").attr('href').split('aff=')[0];
                            const lastLinkChar = link.charAt(link.length - 1);
                            if (lastLinkChar === '?' || lastLinkChar === '&') link = link.substr(0, link.length - 1);
                            res(link);
                        }
                    })
            )
        );
    } else {
        console.log(data);
        // Sometimes returns "Your search - MFC-L6900DW - did not match any shopping results."
    }

    return hrefs;
};

exports.handler = async (event) => {
    // language - full list of languagages and countries in here: https://serpapi.com/playground in dropdown
    const { kind, content, language, country } = event;
    let hrefs;
    switch (kind) {
        case 'text':
            hrefs = await textSearch({ content, language, country });
            break;
        case 'image':
            hrefs = await imageSearch({ content, country });
            break;
        case 'shop':
            hrefs = await shopSearch({ content, country });
    }

    hrefs = [...new Set(hrefs || [])];
    console.log(`hrefs: ${hrefs.length}`);
    return { hrefs };
};
