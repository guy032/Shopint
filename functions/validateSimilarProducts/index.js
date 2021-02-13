const { invokeLambda } = require('./lambda');
const { getField } = require('./schema-parsers/parser');

const flatten = function (data) {
    var result = {};
    function recurse(cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for (var i = 0, l = cur.length; i < l; i++) recurse(cur[i], prop + '[' + i + ']');
            if (l == 0) result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + '.' + p : p);
            }
            if (isEmpty && prop) result[prop] = {};
        }
    }
    recurse(data, '');
    return result;
};

const getProductForUrl = (url) => {
    return new Promise(async (res) => {
        const { product } = await invokeLambda({
            functionName: 'parseSingleUrlSource',
            payload: { url, parseHTML: true, parseHrefs: false, parseSchema: true },
        });
        res(product);
    });
};

exports.handler = async (event) => {
    const { baseProduct, exactMatchProducts, possibleSuspects } = event;

    const promises = [];

    promises.push(getProductForUrl(baseProduct));
    promises.push(Promise.all(exactMatchProducts.map((href) => getProductForUrl(href))));
    promises.push(Promise.all(possibleSuspects.map((href) => getProductForUrl(href))));

    const [baseProductSchema, exactMatchSchemas, possibleSuspectsSchemas] = await Promise.all(promises);

    const validatedFields = {};
    const textKinds = ['name', 'description'];
    for (const kind of textKinds) {
        validatedFields[kind] = [];
    }
    for (const validatedSchema of [baseProductSchema, ...exactMatchSchemas]) {
        for (const kind of textKinds) {
            validatedFields[kind].push(getField(flatten(validatedSchema), kind));
        }
    }

    console.log('validated names: ', JSON.stringify(validatedFields['name']));
    console.log('validated descriptions: ', JSON.stringify(validatedFields['description']));

    const suspectedFields = {};
    for (const kind of textKinds) {
        suspectedFields[kind] = [];
    }
    for (const validatedSchema of [...possibleSuspectsSchemas]) {
        for (const kind of textKinds) {
            suspectedFields[kind].push(getField(flatten(validatedSchema), kind));
        }
    }

    console.log('suspected names: ', JSON.stringify(suspectedFields['name']));
    console.log('suspected descriptions: ', JSON.stringify(suspectedFields['description']));

    // const name = getField(flatSchema, 'name');
    // const description = getField(flatSchema, 'description');
    // console.log('name is: ', name);
    // console.log('description is: ', description);
    return;
};
