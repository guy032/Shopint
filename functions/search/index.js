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

exports.handler = async (event) => {
    // language - full list of languagages and countries in here: https://serpapi.com/playground in dropdown
    const { apiKey, kind, content, language, country } = event['queryStringParameters'];
    let hrefs;
    switch (kind) {
        case 'text':
            hrefs = await textSearch({ content, language, country });
            break;
        case 'image':
            hrefs = await imageSearch({ content, language, country });
            break;
    }

    const password = 'janJvN64Dlp2OSGdw6qiNHgMHA30nCJ7bnAwalVxBMznNpabVq';
    const allowed = (
        await axios.get(
            `https://us-central1-serpy-2da88.cloudfunctions.net/getSerpyUserQuota?apiKey=${apiKey}&applyUsage=true&password=${password}`
        )
    ).data;
    if (isNaN(allowed) || parseInt(allowed) <= 0) {
        return {
            message: 'not allowed',
        };
    }

    const data = (
        await axios.get(
            scrapeUrl(
                `${google_url}/search?q=${encodeURIComponent(content)}&biw=1920&bih=969&num=100${
                    language ? `&hl=${language}` : ''
                }${country ? `&gl=${country}` : ''}`
            )
        )
    ).data;

    return {
        kind,
        content,
        language,
        country,
        data,
    };
};
