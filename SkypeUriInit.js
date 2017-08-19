"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const SkypeUri_1 = require("./SkypeUri");
const Logger_1 = require("./logger/Logger");
let instance;
function buildSkypeUri() {
    const logger = Logger_1.getInstance();
    if (instance) {
        return instance;
    }
    if (electron.remote) {
        return electron.remote.require(__dirname + '/SkypeUriInit').getInstance();
    }
    else {
        return instance = new SkypeUri_1.SkypeUri(logger);
    }
}
exports.getInstance = buildSkypeUri;
