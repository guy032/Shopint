const keys = {
    name: ['name'],
    description: ['description'],
};

exports.getField = (flatSchema, kind) => {
    for (const key of Object.keys(flatSchema)) {
        if (keys[kind].includes(key)) {
            console.log(flatSchema[key]);
            return flatSchema[key];
        }
    }
};
