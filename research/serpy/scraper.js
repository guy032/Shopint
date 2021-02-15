const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const scraperapi_key = 'b29e8e3a0736d92679cc2d37e7e2fada';

const { traverse } = require('./helpers');

const scrapeUrl = (url) => `http://api.scraperapi.com/?api_key=${scraperapi_key}&url=${url}`;

(async () => {
    const link = 'https://www.google.com/search?q=coffee';
    var Url = require('url-parse');
    const { origin } = Url(link);

    // const { data: html } = await axios.get(scrapeUrl(link));
    const html = fs.readFileSync('google/samples/knowledge-graph-apple-en.html').toString();

    const $ = cheerio.load(html);
    const json = require('./google/knowledge-graph.json');

    // normalize google image src
    $('script').map((i, script) => {
        const js = $(script)
            .html()
            .replace(/\s*[\r\n]/gm, '')
            .replace(/\s\s+/gm, ' ')
            .trim()
            .replace('(function () { var s = ', '(function(){var s=')
            .replace('var ii = ', 'var ii=');
        if (js.startsWith("(function(){var s='data:image/")) {
            const idMatch = /var ii=\['(.+)'\]/gm.exec(js);
            if (idMatch) {
                const ids = idMatch[1].replace(/'/gm, '').replace(/\s/gm, '').split(',');
                for (id of ids) {
                    const data = /var s='(.+)';/gm.exec(js)[1];
                    $(`img[id='${id}']`).attr('src', data);
                }
            }
        }
    });

    traverse($, json, origin);
    // console.log(json);
    console.log(JSON.stringify(json, null, 2));
})();

// kc:/food/food:energy
// kc:/food/food:nutrition

// hw:/collection/beverages:country of origin

// kc:/collection/knowledge_panels/has_phone:phone
// kc:/collection/knowledge_panels/local_reviewable:star_score
// kc:/collection/knowledge_panels/local_reviewable:review_summary
// kc:/collection/knowledge_panels/local_reviewable:reviews

// okra/answer_panel/Announcement
// okra/answer_panel/Coverage

// kc:/location/location:address
// kc:/location/location:hours

// kc:/local:one line summary
// kc:/local:covid uncertainty warning
// kc:/local:pending edits
// kc:/local:edit info
// kc:/local:place qa
