"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const EcsConfig_1 = require("./EcsConfig");
let instance = null;
function getInstance() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/EcsConfigInit').getInstance();
    }
    return instance;
}
exports.getInstance = getInstance;
function init(ecsHost, logger, clientVersion, deviceInfo, exactTime) {
    instance = new EcsConfig_1.EcsConfig(ecsHost, logger, clientVersion, deviceInfo, exactTime);
}
exports.init = init;
