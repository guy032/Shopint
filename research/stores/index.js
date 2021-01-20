const commoncrawl = require("commoncrawl");
commoncrawl
  .searchURL("toner-supply.co.il", {
    index: 'CC-MAIN-2020-50-index',
    matchType: "domain",
    limit: 100,
  })
  .then((data) => {
    console.log(data);
  });
