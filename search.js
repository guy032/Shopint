const imageUrl = 'https://cdn.shopify.com/s/files/1/0263/3118/5237/products/adpictureplates_800x.png?v=1608649157';

const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch("bf51181d5f76d3907c66eec3ab797adfb44ad7e7cd9c0402247aef097826773e");

const params = {
  engine: "google_reverse_image",
  image_url: imageUrl,
  api_key: 'bf51181d5f76d3907c66eec3ab797adfb44ad7e7cd9c0402247aef097826773e',
  num: 100
};

search.json(params, data => console.log(data));