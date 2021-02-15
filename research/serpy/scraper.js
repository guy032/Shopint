const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const scraperapi_key = 'b29e8e3a0736d92679cc2d37e7e2fada';

const { traverse } = require('./helpers');

const scrapeUrl = (url) => `http://api.scraperapi.com/?api_key=${scraperapi_key}&url=${url}`;

(async () => {
    const link = 'https://www.google.com/search?q=apple';
    var Url = require('url-parse');
    const { origin } = Url(link);

    // const { data: html } = await axios.get(scrapeUrl(link));
    const html = fs.readFileSync('google/samples/knowledge-graph-apple-en.html').toString();

    const $ = cheerio.load(html);
    const json = require('./google/knowledge-graph.json');

    // normalize google image src
    const scripts = $('script').filter((i, script) => $(script).html().startsWith("(function(){var s='data:image/"));
    scripts.map((i, script) => {
        const html = $(script).html();
        const id = /var ii=\['(.+)'\]/gm.exec(html)[1];
        const data = /var s='(.+)';/gm.exec(html)[1];
        $(`img[id='${id}']`).attr('src', data);
    });

    traverse($, json, origin);
    // console.log(json);
    console.log(JSON.stringify(json, null, 2));
})();

// image
// secondary image

// kc:/common/topic:social media presence
// kc:/common:sideways

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
