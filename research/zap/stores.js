const models = require('./models.json');

let storesNumber = 0;
for (const model of Object.values(models)) {
    const { numOfStores } = model;
    storesNumber += numOfStores;
}
console.log(storesNumber);
