const axios = require('axios');
const url = 'https://www.myip.com/';

exports.handler = async (event) => {
    const getHtml = async (url) => {
        return (
            await axios.get(url, {
                headers: {
                    Referer: url,
                    userAgent:
                        'Mozilla/5.0 (X11; Linux x86_64; Storebot-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
                },
            })
        ).data;
    };

    const html = await getHtml(url);

    console.log(html.split('ip">')[1].split('<')[0]);
};
