const Crawler = require("crawler");

const obselete = [];

var c = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
      var $ = res.$;
      // $ is Cheerio by default
      //a lean implementation of core jQuery designed specifically for the server
      console.log($("title").text());
    }
    done();
  },
});

function crawlAllUrls(url) {
  console.log(`Crawling ${url}`);
  c.queue({
    uri: url,
    callback: function (err, res, done) {
      if (err) throw err;
      let $ = res.$;
      try {
        let urls = $("a");
        Object.keys(urls).forEach((item) => {
          if (urls[item].type === "tag") {
            let href = urls[item].attribs.href;
            if (href && !obselete.includes(href)) {
              href = href.trim();
              obselete.push(href);
              // Slow down the
              setTimeout(function () {
                href.startsWith("http")
                  ? crawlAllUrls(href)
                  : crawlAllUrls(`${url}${href}`); // The latter might need extra code to test if its the same site and it is a full domain with no URI
              }, 5000);
            }
          }
        });
      } catch (e) {
        console.log(e);
        console.error(`Encountered an error crawling ${url}. Aborting crawl.`);
        done();
      }
      done();
    },
  });
}

crawlAllUrls("http://www.matara-g.com/75875-%D7%A7%D7%98%D7%9C%D7%95%D7%92-%D7%9E%D7%95%D7%A6%D7%A8%D7%99%D7%9D");
