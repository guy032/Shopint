const axios = require('axios');
const axiosRetry = require('axios-retry');
const cheerio = require('cheerio');
const Url = require('url-parse');

axiosRetry(axios, { retries: 3 });

module.exports = async () => {
    const { data: html } = await axios.get('https://www.zap.co.il/catall.aspx');
    if (html) {
        const $ = cheerio.load(html);
        const categories = $('.CategoriesListBlock a')
            .toArray()
            .map((a) => a.attribs.href)
            .filter((href) => href.indexOf('models.aspx?sog=') !== -1)
            .map((href) => {
                const url = new Url(href);
                const { query } = url;
                return query.substr(5).split('&')[0];
            })
            .filter((item, pos, self) => self.indexOf(item) == pos);
        return categories;
    }
    return;
};
