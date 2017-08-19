"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const Utils_1 = require("./Utils");
const PackageInfo_1 = require("./configuration/PackageInfo");
class ClientVersion {
    constructor() {
        this.cobrand = '0';
        this.platform = Utils_1.pickByPlatform('1433', '1432', '1431');
        const packageData = PackageInfo_1.readPackageJson().getData();
        this.clientVersionShort = packageData.appVersion;
        this.buildVersion = packageData.appBuild;
        this.cobrand = packageData.cobrand;
    }
    getPlatform() {
        return this.platform;
    }
    getCobrand() {
        return this.cobrand;
    }
    getVersion() {
        return this.clientVersionShort + '.' + this.cobrand + '.' + this.buildVersion;
    }
    getFullVersion() {
        return this.platform + '/' + this.getVersion() + '/';
    }
}
exports.ClientVersion = ClientVersion;
let instance = null;
function init() {
    instance = new ClientVersion();
}
exports.init = init;
function getInstance() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/ClientVersion').getInstance();
    }
    else {
        return instance;
    }
}
exports.getInstance = getInstance;
