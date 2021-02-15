const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async (event) => {
    const { url } = event;
    // const url = 'https://google.com/search?q=Brother%20MFC8510DN&biw=1920&bih=969&num=100';

    const options = {
        method: 'GET',
        headers: {
            accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            // 'accept-encoding': 'gzip, deflate, br',
            'accept-language':
                'en,he;q=0.9,en-US;q=0.8,fr;q=0.7,ar;q=0.6,zh-TW;q=0.5,zh;q=0.4,uk;q=0.3,ru;q=0.2,ja;q=0.1,de;q=0.1',
            'cache-control': 'max-age=0',
            cookie:
                'CGIC=IocBdGV4dC9odG1sLGFwcGxpY2F0aW9uL3hodG1sK3htbCxhcHBsaWNhdGlvbi94bWw7cT0wLjksaW1hZ2UvYXZpZixpbWFnZS93ZWJwLGltYWdlL2FwbmcsKi8qO3E9MC44LGFwcGxpY2F0aW9uL3NpZ25lZC1leGNoYW5nZTt2PWIzO3E9MC45; OGP=-19022270:; ANID=AHWqTUnwqfq6WWvYKNdp5F6UNoEuuMtxw_mM3ANZF38OAf3z3dKFKYAHWjdd3Ju8; OTZ=5829883_48_48_120960_44_365700; OGPC=19022270-1:19022519-1:; HSID=AXdFoCcyXxru6SK1H; SSID=ALMVmI63JcdiQR_8k; APISID=A9MXkaJWB2XG3ToT/AkMO51z3Ux6giS--u; SAPISID=_c800oUI6j6nBMAN/Aar2isRBZvJApwF1l; __Secure-3PAPISID=_c800oUI6j6nBMAN/Aar2isRBZvJApwF1l; SEARCH_SAMESITE=CgQI6JEB; NID=208=Qu9Snfc3jx0R0QVAhmpu83oAM6j_dtsAkEHbNj5q2KIRKmyE-7apYRm41B1P0Sa3FZUW074Vq9nbymPA0FnOy8ld4TS45JurqAwgyOA0RDOUNMCUWhs1oyH3JuzeoT8PtD1DyDkexr9akt2xUgzD7o8UzYm4M34Bv-67QG5QeepWDMGvOSGGNYw4Y2UDaakiOs_3caq8q7M7OYjSBHMRoZnUqx8qKUqhYGlG3zG3bsQVC8RZlYnXSItB7_w_DepVUI4F5mcr-qLnN9lRAAwrNiKSclHBw2xpGbrfwJXbADF48p7lnO_pc1ykJQTzu1dlGecx5-sjjxxRMR18T_1b4J4LEIIkMi0Ny9e2jDupgdE2RmOjwBUnWWFUX3JV0iUHLNfihuz98WvMZljNn7m9mumD1asQX-Dh8SsXnA; 1P_JAR=2021-02-06-17; SID=6gcwcmqQl8CMyVwQVTsPN5A0ywnRIZS-dqwHcFfWhNl3PM8n5OhdsfmPayWgqGo3AR-27g.; __Secure-3PSID=6gcwcmqQl8CMyVwQVTsPN5A0ywnRIZS-dqwHcFfWhNl3PM8nyJNJjpmvQfqShHULUint6Q.; DV=M1fVkY06rox_QP_f7OZE3e6tYoGFd9ddTMapDq-G-AYAACAcuD9TMkTrAAIAAAyZb21iQXUwlQAAABzujBTNWAdZgBADwPrmEOcmzJPXIsQAgAbC04tAEYsbCTEAAA; SIDCC=AJi4QfEtkXoYWXIyC1JZVllYPGO-gZlZ8SY1f3o7A8V5gde0bkNtp43SSgkKC9rba6UeuS1fa4o; __Secure-3PSIDCC=AJi4QfH0ALQ2HbLn53ulCUavpq1L-merHWss48_4x8RV5wx6OxtpTE87aQGW1USDEnnddzL8JpVi',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-origin',
            'upgrade-insecure-requests': 1,
            'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.146 Safari/537.36',
            'x-client-data':
                'CJK2yQEIprbJAQjBtskBCKmdygEIuMPKAQj4x8oBCKTNygEI3NXKAQjLhcsBCNWcywEI5JzLAQioncsBCPGdywEIj57LARj5uMoB',
        },
        url,
    };

    const response = await axios(options);
    console.log(response.data);

    const $ = cheerio.load(response.data);
    return [...$('.g a:not([class])')].map((el) => $(el).attr('href'));
};
