const SerpApi = require('google-search-results-nodejs');

const DEFAULT_IMAGE_NUM_RESULTS = 50;
const DEFAULT_TEXT_NUM_RESULTS = 100;
const secretKey = 'bf51181d5f76d3907c66eec3ab797adfb44ad7e7cd9c0402247aef097826773e';

const search = new SerpApi.GoogleSearch(secretKey);

const textSearch = async ({ queryContent, numResults }) => {
    const textSearchParams = {
        engine: 'google',
        google_domain: 'google.com',
        api_key: secretKey,
        num: 100,
    };
    return await new Promise((res) => {
        search.json({ ...textSearchParams, q: queryContent, num: numResults || DEFAULT_TEXT_NUM_RESULTS }, (data) => {
            res(data);
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
    const { searchKind, queryContent, imageUrl, numResults } = event;
    let results = undefined;
    switch (searchKind) {
        case 'text':
            results = await textSearch({ queryContent, numResults });
            break;
        case 'image':
            results = await imageSearch({ imageUrl, numResults });
            break;
    }

    console.log(results);

    // TODO - process to filter irrelevant results
    // TODO - process to return only links

    return {
        results,
    };
};
