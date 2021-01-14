const { countries, asin } = require("../amazon-buddy/lib");

// https://www.amazon.ca/dp/B08HWZMSJY
// https://www.amazon.es/dp/B08739TY2T
// https://www.amazon.de/dp/B07ZCS93VT

exports.getAmazonProductByUrl = async (url) => {
  const countriesList = await countries();
  try {
    const { host, pathname } = url;
    const productCode = pathname.split('/').pop();
    const { country_code } = countriesList.find(country => country.host === host);
    // add offers: https://www.amazon.de/dp/B07ZCS93VT (B07ZCS93VT, B07ZCVNTP3, B07ZCV955X, B07ZCTG8Q2)
    const product_by_asin = await asin({ asin: productCode, country: country_code });
    let { result } = product_by_asin;
    result = result[0];
    return result;
  } catch (error) {
    console.log(error);
  }
};
