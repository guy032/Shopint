const HCCrawler = require('headless-chrome-crawler');
const Url = require('url-parse');

const url = "https://alluxur.com";

(async () => {
  console.time("scan");
  var visitedURLs = [];
  const crawler = await HCCrawler.launch({
    // Function to be evaluated in browsers
    evaluatePage: () => ({
      title: $("title").text(),
      link: $("a").attr("href"),
      linkslen: $("a").length
    }),
    // Function to be called with evaluated results from browsers
    onSuccess: async result => {
      if (!visitedURLs.includes(result.options.url)) {
        visitedURLs.push(result.options.url);
        console.log(visitedURLs.length, result.options.url);
        for (let link of result.links) {
          link = new Url(link);
          const {
            origin, pathname,
          } = link;
          link = `${origin}${pathname}`;
          if (link.startsWith(url) && !visitedURLs.includes(link) && !link.endsWith('.pdf') && !link.endsWith('.jpg') && !link.endsWith('.jpeg') && !link.endsWith('.png') ) {
            crawler.queue({ url: link, maxDepth: 1, waitUntil: 'networkidle0', timeout: 10000 });
          }
        }
      }
    },
    // catch all errors
    onError: error => {
      console.log(error);
    }
  });

  await crawler.queue({ url, maxDepth: 1, waitUntil: 'networkidle0', timeout: 10000 });
  await crawler.onIdle(); // Resolved when no queue is left
  await crawler.close(); // Close the crawler
  console.timeEnd("scan");
})();
