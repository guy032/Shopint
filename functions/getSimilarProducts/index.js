const { invokeLambda } = require('./lambda');

exports.handler = async (event) => {
    const { searches } = event;

    const numTries = 2;
    const hrefs = [
        ...new Set(
            (
                await Promise.all(
                    searches.map(
                        (search) =>
                            new Promise(async (res) => {
                                const currTries = 0;

                                while (currTries < numTries) {
                                    const { kind, content } = search;
                                    console.log(`${kind}: ${content}`);
                                    const { hrefs } = await invokeLambda({
                                        functionName: 'getSearchResults',
                                        payload: { kind, content },
                                    });
                                    if (hrefs) {
                                        console.log(`${kind}: ${hrefs.length}`);
                                        res(hrefs);
                                        return;
                                    } else {
                                        currTries++;
                                    }
                                }
                            })
                    )
                )
            ).flat()
        ),
    ];
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
