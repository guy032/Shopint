const axios = require('axios');
const cheerio = require('cheerio');
const api_key = 'b29e8e3a0736d92679cc2d37e7e2fada';

const google_url = 'https://www.google.com';

const scrapeUrl = (url) => `http://api.scraperapi.com/?api_key=${api_key}&url=${url}`;

/* (async () => {
    const image_url =
        'https://konimboimages.s3.amazonaws.com/system/photos/128380/large/c2c961e0bf2c3c30f9b78da9b1bd7266.jpg';
    const searchUrl = `${google_url}/searchbyimage?image_url=${image_url}`;

    const $ = cheerio.load((await axios.get(scrapeUrl(searchUrl))).data);
    const href = $("a[href^='/search?tbs=simg:CAQS']").first().attr('href');
    if (href) {
        const images_results_url = `${google_url}${href}`;
        const url = scrapeUrl(images_results_url);
        const { data } = await axios.get(url);
        const $images = cheerio.load(data);
        const hrefs = [...$images("a[rel='noopener']")].map((el) => $(el).attr('href'));
        console.log(hrefs);
    }
})(); */

(async () => {
    const query = 'מדפסת Brother MFC8510DN ברדר';
    const searchUrl = `${google_url}/search?q=${encodeURIComponent(query)}&num=100`;
    const $ = cheerio.load((await axios.get(scrapeUrl(searchUrl))).data);
    const hrefs = [...$('.g a')].map((el) => $(el).attr('href'));
    console.log(hrefs);
})();
