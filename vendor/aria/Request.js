"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpsRequest_1 = require("../../HttpsRequest");
const Logger_1 = require("../../logger/Logger");
function request(requestOptions, callback) {
    const logger = Logger_1.getInstance();
    let client = new HttpsRequest_1.HttpsRequest(requestOptions, logger);
    client.send().then(response => {
        callback(null, response, response.body);
    }).catch((err) => {
        callback(err);
    });
}
exports.request = request;
