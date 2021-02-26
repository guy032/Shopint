const axios = require('axios');
const cheerio = require('cheerio');
const Url = require('url-parse');
const { invokeLambda } = require('./lambda');
const aggregators = require('./aggregators/list.json');
// let hrefs = require('./hrefs.json');
const scraperapi_key = 'b29e8e3a0736d92679cc2d37e7e2fada';
const scrapeUrl = (url) => `http://api.scraperapi.com/?api_key=${scraperapi_key}&url=${url}`;

exports.handler = async (event) => {
    const { searches } = event;
    // https://moz.com/ugc/geolocation-the-ultimate-tip-to-emulate-local-search
    // https://developers.google.com/adwords/api/docs/appendix/geotargeting

    const numTries = 3;
    let hrefs = [
        ...new Set(
            (
                await Promise.all(
                    searches.map(
                        (search) =>
                            new Promise(async (res) => {
                                let currTries = 0;

                                while (currTries < numTries) {
                                    const { kind, content, language, country } = search;
                                    console.log(`${kind}: ${content}`);
                                    const { hrefs } = await invokeLambda({
                                        functionName: 'getSearchResults',
                                        payload: { kind, content, language, country },
                                    });
                                    if (hrefs && hrefs.length > 0) {
                                        console.log(JSON.stringify(hrefs));
                                        console.log(`${kind}: ${hrefs.length}`);
                                        res(hrefs);
                                        return;
                                    } else {
                                        currTries++;
                                        console.log(`retry ${kind} ${currTries}`);
                                    }
                                }
                                res([]);
                            })
                    )
                )
            ).flat()
        ),
    ].flat();
    console.log(JSON.stringify(hrefs));
    console.log(`hrefs: ${hrefs.length}`);

    const getHtml = async (url) => {
        return await invokeLambda({
            functionName: 'getHtmlHidden',
            payload: {
                url,
            },
        });
    };

    const getAggregatorLinks = async (url, aggregator) => {
        console.log(`request: ${url}`);
        const html = await getHtml(url);
        const $ = cheerio.load(html);

        const { origin } = new Url(url);

        const { className } = aggregators[aggregator];
        const links = $(className)
            .map((i, a) => `${origin}${a.attribs.href}`)
            .toArray();

        let results = [];
        // todo: cache links from aggregators in Firestore to save time and cost
        switch (aggregator) {
            case 'zap.co.il':
                results = await Promise.all(
                    // todo: change scraperapi to getHtml with headers in response
                    links.map(
                        (link) =>
                            new Promise(async (res) => {
                                console.log(`get: ${link}`);
                                try {
                                    const zapUrl = (await axios.get(scrapeUrl(link))).headers['sa-final-url'];
                                    console.log(`zap: ${link} => ${zapUrl}`);
                                    res(zapUrl);
                                } catch {
                                    console.log(`zap: ${link} => failed`);
                                    res(null);
                                }
                            })
                    )
                );
                break;
            case 'ret.co.il':
                const retAff = 'aff=Ret&utm_source=ret.co.il';
                results = await Promise.all(
                    links.map(
                        (link) =>
                            new Promise(async (res) => {
                                console.log(`ret: ${link}`);
                                try {
                                    const retUrl = /window\.location\.href = "(.+)"; /gm
                                        .exec(await getHtml(link))[1]
                                        .replace(/\\u0026/gm, '&')
                                        .replace(`?${retAff}`, '')
                                        .replace(`&${retAff}`, '');
                                    console.log(`ret: ${link} => ${retUrl}`);
                                    res(retUrl);
                                } catch {
                                    console.log(`ret: ${link} => failed`);
                                    res(null);
                                }
                            })
                    )
                );
                break;
        }
        return results || [];
    };

    const promises = [];
    Object.keys(aggregators).map((aggregator) => {
        const href = hrefs.find((href) => href.includes(aggregator));
        if (href) {
            const deletedHrefs = hrefs.splice(hrefs.indexOf(href), 1);
            console.log(`deleted: ${deletedHrefs[0]}`);
            promises.push(new Promise(async (res) => res(await getAggregatorLinks(href, aggregator))));
        }
    });
    const aggregatorLinks = (await Promise.all(promises)).flat();
    hrefs = [...new Set(hrefs.concat(...aggregatorLinks))];
    console.log(JSON.stringify(hrefs));
    console.log(`hrefs: ${hrefs.length}`);

    // exclude domains: brother.co.il, youtube.com, yad2.co.il

    const domains = [];
    for (href of hrefs) {
        let { host } = new Url(href);
        if (host !== '') {
            host = host.startsWith('www.') ? host.substr(4) : host;
            if (!domains.find((domain) => domain === host)) domains.push(host);
            else console.log(`domain: ${host} duplicated`);
        }
    }

    console.log(JSON.stringify(domains));
    console.log(`unique domains: ${domains.length}`);

    const products = (
        await Promise.all(
            hrefs.map(
                (href) =>
                    new Promise(async (res) => {
                        const { url, title, meta, hrefs, product, errorMessage } = await invokeLambda({
                            functionName: 'parseSingleUrlSource',
                            payload: { url: href, parseHTML: true, parseHrefs: true, parseSchema: true },
                        });
                        // if (product) {
                        //     console.log(url);
                        //     console.log(product);
                        // }
                        res(product);
                    })
            )
        )
    ).filter((el) => el != null);

    // offers/0/url remove non-empty duplicate links

    console.log(`products: ${products.length}`);

    return products;
};
