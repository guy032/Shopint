const axios = require('axios');
const axiosRetry = require('axios-retry');
const cheerio = require('cheerio');

axiosRetry(axios, { retries: 3 });

module.exports = async (url) => {
    const response = await axios.get(url);
    if (response.request.res.responseUrl.indexOf('/models.aspx?') !== -1) {
        const { data: html } = response;
        if (html) {
            const $ = cheerio.load(html);
            const models = [];
            const $compareModels = $('.CompareModel');
            if ($compareModels.length > 0) {
                for ($compareModel of $compareModels) {
                    const model = {};
                    model.id = $compareModel.attribs.id.substr(4);
                    model.title = $($compareModel).find($('.ProdInfoTitle')).text().trim();
                    model.numOfStores = Number($($compareModel).find($('.numOfStores .num')).text());
                    models.push(model);
                }
                return models;
            }
        }
    }
    return;
};
