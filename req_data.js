const _ = require("lodash");
const Request = require("request");
const https = require("https");

//const Request2 = new Request;

module.exports = async body => {
    let result = await JSON.parse(body);
    console.log(result);
    return result;
};