const Serpy = require('serpy');
const s = new Serpy('lQ6fAgR4EW9zxXb4MoZk');
(async function () {
    console.log(await s.search({ query: 'coffee', language: 'iw', country: 'il' }));
})();
