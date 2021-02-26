const { invokeLambda } = require('./lambda');

exports.handler = async (event) => {
    const { urls } = event;

    const products = (
        await Promise.all(
            urls.map(
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

    return products;
};
