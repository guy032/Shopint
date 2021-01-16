const scanUrl = require('./crawler').scanUrl;

console.log('hello shopint');
const url = 'http://matara-g.com/';

(async () => {
    console.log(await scanUrl(url));
})()

