const { invokeLambda } = require('./lambda');

exports.handler = async (event) => {
    const { searches } = event;

    const hrefs = (
        await Promise.all(
            searches.map(
                (search) =>
                    new Promise(async (res) => {
                        const { kind, content } = search;
                        console.log(`${kind}: ${content}`);
                        const { hrefs } = await invokeLambda({
                            functionName: 'getSearchResults',
                            payload: { kind, content },
                        });
                        if (hrefs) {
                            console.log(`${kind}: ${hrefs.length}`);
                            res(hrefs);
                        } else {
                            // retry
                            res([]);
                        }
                    })
            )
        )
    )
        .reduce((arr, row) => arr.concat(row), [])
        .filter((item, pos, self) => self.indexOf(item) == pos);
    console.log(JSON.stringify(hrefs));
    console.log(`hrefs: ${hrefs.length}`);

    const products = (
        await Promise.all(
            hrefs.map(
                (href) =>
                    new Promise(async (res) => {
                        const { url, title, meta, hrefs, product, errorMessage } = await invokeLambda({
                            functionName: 'parseSingleUrlSource',
                            payload: { url: href, parseHTML: true, parseHrefs: true, parseSchema: true },
                        });
                        if (product) {
                            console.log(url);
                            console.log(product);
                        }
                        res(product);
                    })
            )
        )
    ).filter((el) => el != null);
    console.log(`products: ${products.length}`);

    // { aggregaterating: { '@type': 'AggregateRating'
    // check if contains list of stores selling the product

    return products;
};
