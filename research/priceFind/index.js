const PriceFinder = require('price-finder');
const priceFinder = new PriceFinder();

const uri = 'https://www.shooks.co.il/p161599';
priceFinder.findItemPrice(uri, function (err, price) {
    console.log(price); // 8.91
});
