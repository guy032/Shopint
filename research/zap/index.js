const getCategories = require('./getCategories');
const getSearchResults = require('./getSearchResults');
const fs = require('fs');
const axios = require('axios');
const axiosRetry = require('axios-retry');

axiosRetry(axios, { retries: 3 });

const allModels = {};

(async () => {
    let categories = await getCategories();
    console.log(JSON.stringify(categories));
    for (const i in categories) {
        console.log(`${i}: ${categories[i]}`);
    }
    // categories = ['e-winefridge'];
    /* for (category of categories) {
        let page = 1;
        let scan = true;
        while (scan) {
            const url = `https://www.zap.co.il/models.aspx?sog=${category}&orderby=snum&pageinfo=${page}&imagesview=1`;
            console.log(`${category}: ${page}`);
            const models = await getSearchResults(url);
            if (models && models.length > 0) {
                for (const model of models) {
                    model.category = category;
                    allModels[model.id] = model;
                }
                if (models.length === 24) page++;
                else scan = false;
            } else scan = false;
        }
    }
    console.log(allModels);
    console.log(`models: ${Object.keys(allModels).length}`);
    fs.writeFileSync('models.json', JSON.stringify(allModels)); */
})();
