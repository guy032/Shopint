const axios = require('axios');
const url = 'http://checkip.amazonaws.com';

exports.handler = async (event) => {
    return (await axios.get(url)).data;
};
