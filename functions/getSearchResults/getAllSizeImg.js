const axios = require('axios');
const axiosRetry = require('axios-retry');
const qs = require('qs');

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
        const delay = retryCount * 1000;
        return delay;
    },
});

const getHtml = async (url) => {
    const options = {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (X11; Linux x86_64; Storebot-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
            Host: 'www.google.com',
            // Accept:
            //     'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            // 'Accept-Language': 'en',
            // 'Accept-Encoding': 'gzip, deflate, br',
            // 'Upgrade-Insecure-Requests': '1',
            // 'Cache-Control': 'max-age=0',
        },
    };
    const response = await axios.get(url, options);
    console.log(response);
    return response.data.trim().replace(/\s*[\r\n]/gm, '');
};

(async () => {
    // IE7JUb:e5gl8b;dtRDof:s370ud;R3mad:ZCNXMe;v03O1c:cJhY7b;
    const url =
        'https://www.google.com/searchbyimage?image_url=http://www.snapit.co.il/wp-content/uploads/2021/01/27725-productpicture-lores-en-l3156_main.png.png';
    console.log(url);
    const html = await getHtml(url);
    console.log(html);
})();

// const start = $("a[href^='/search?tbs=simg:CAQS']").href;
