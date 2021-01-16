const Crawler = require("crawler");
const Url = require("url-parse");
const url = "https://www.zipy.co.il";
const originUrlObj = new Url(url);

let visitedURLs = [];

console.time('scan');
let c = new Crawler({
  maxConnections: 100,
});

c.on('drain', () => {
  console.timeEnd('scan');
  console.log(visitedURLs.length);
});

const crawlAllUrls = async (url) => {
  console.log(`Crawling ${url}`);
  await c.queue({
    uri: url,
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
    },
    callback: (err, res, done) => {
      if (err) throw err;
      let $ = res.$;
      try {
        let urls = $("a");
        Object.keys(urls).forEach((item) => {
          if (urls[item].type === "tag") {
            let href = urls[item].attribs.href;
            if (href === '#') href = undefined;
            if (href) {
              let link = new Url(href);
              if (link.host === '') link = new Url(`${originUrlObj.origin}${href}`);
              const {
                origin, pathname, host,
              } = link;
              link = `${origin}${pathname}`;  
              if (link && host.indexOf(originUrlObj.host) !== -1 && !visitedURLs.includes(link) && !link.endsWith('.pdf') && !link.endsWith('.jpg') && !link.endsWith('.jpeg') && !link.endsWith('.png')) {
                visitedURLs.push(link);
                crawlAllUrls(link);
              }
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
};

crawlAllUrls(url);

setTimeout(() => {
}, 10000);
