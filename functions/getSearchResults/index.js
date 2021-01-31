const SerpApi = require('google-search-results-nodejs');

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

const imageSearch = async ({ imageUrl, numResults }) => {
    const imageSearchParams = {
        engine: 'google_reverse_image',
        image_url: imageUrl,
        api_key: secretKey,
    };

    return await Promise.all(
        [...Array((numResults || DEFAULT_IMAGE_NUM_RESULTS) / 10).keys()].map(
            (pageNum) =>
                new Promise((res) => {
                    search.json({ ...imageSearchParams, image_url: imageUrl, start: pageNum * 10 }, (data) => {
                        res(data);
                    });
                })
        )
    );
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
        links,
    };
};
