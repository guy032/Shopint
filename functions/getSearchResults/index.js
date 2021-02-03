const axios = require('axios');
const cheerio = require('cheerio');
const SerpApi = require('google-search-results-nodejs');
const scraperapi_key = 'b29e8e3a0736d92679cc2d37e7e2fada';

const DEFAULT_IMAGE_NUM_RESULTS = 50;
const DEFAULT_TEXT_NUM_RESULTS = 100;
const secretKey = 'bf51181d5f76d3907c66eec3ab797adfb44ad7e7cd9c0402247aef097826773e';

const search = new SerpApi.GoogleSearch(secretKey);

const textSearch = async ({ queryContent, numResults, country }) => {
    const textSearchParams = {
        api_key: secretKey,
        google_domain: 'google.com',
        gl: country,
    };
    return await new Promise((res) => {
        search.json({ ...textSearchParams, q: queryContent, num: numResults || DEFAULT_TEXT_NUM_RESULTS }, (data) => {
            delete data.thumbnail;
            delete data.thumbnails;

            const allowed = [
                'search_metadata',
                'search_parameters',
                'search_information',
                'organic_results',
                'pagination',
                'serpapi_pagination',
            ];

            const filtered = Object.keys(data)
                .filter((key) => allowed.includes(key))
                .reduce((obj, key) => {
                    obj[key] = data[key];
                    return obj;
                }, {});

            res(filtered);
        });
    });
};

const imageSearch = async ({ imageUrl }) => {
    const google_url = 'https://www.google.com';
    const scrapeUrl = (url) => `http://api.scraperapi.com/?api_key=${scraperapi_key}&url=${url}`;
    const searchUrl = `${google_url}/searchbyimage?image_url=${imageUrl}`;

    const $ = cheerio.load((await axios.get(scrapeUrl(searchUrl))).data);
    const href = $("a[href^='/search?tbs=simg:CAQS']").first().attr('href');
    if (href) {
        const images_results_url = `${google_url}${href}`;
        const url = scrapeUrl(images_results_url);
        const { data } = await axios.get(url);
        const $images = cheerio.load(data);
        const hrefs = [...$images("a[rel='noopener']")].map((el) => $(el).attr('href'));
        return hrefs;
    }
    return;
};

exports.handler = async (event) => {
    // parse args
    const { searchKind, queryContent, imageUrl, numResults, country } = event;
    let results;
    let links;
    switch (searchKind) {
        case 'text':
            results = await textSearch({ queryContent, numResults, country });
            const { organic_results } = results;
            links = organic_results.map((result) => result.link);
            break;
        case 'image':
            results = await imageSearch({ imageUrl, numResults });
            break;
    }

    // TODO - process to filter irrelevant results

    // TODO - process to return only links

    return {
        results,
    };
};
