const axios = require('axios');
const axiosRetry = require('axios-retry');
const cheerio = require('cheerio');
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

const textSearch = async ({ content }) => {
    const searchUrl = `${google_url}/search?q=${encodeURIComponent(content)}&num=100`;
    console.time('request');
    const response = await axios.get(scrapeUrl(searchUrl));
    console.timeEnd('request');
    const $ = cheerio.load(response.data);
    return [...$('.g a:not([class])')].map((el) => $(el).attr('href'));
};

const imageSearch = async ({ content }) => {
    const searchUrl = `${google_url}/searchbyimage?image_url=${content}`;
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

exports.handler = async (event) => {
    const { kind, content } = event;
    let hrefs;
    switch (kind) {
        case 'text':
            hrefs = await textSearch({ content });
            break;
        case 'image':
            hrefs = await imageSearch({ content });
            break;
    }
    if (hrefs) hrefs = hrefs.filter((item, pos, self) => self.indexOf(item) == pos);

    return {
        hrefs,
    };
};
