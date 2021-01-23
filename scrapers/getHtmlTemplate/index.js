const axios = require('axios');

exports.handler = async (event) => {
    const getHtml = async (url) => {
        return (
            await axios.get(url, {
                headers: {
                    Referer: url,
                    userAgent:
                        event.userAgent ||
                        'Mozilla/5.0 (X11; Linux x86_64; Storebot-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
                },
            })
        ).data;
    };

    return await getHtml(event.url);
};
