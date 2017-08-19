"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ArgFilter {
    static isUnsecure(argList) {
        return argList ? argList.some(arg => ArgFilter.unsecure.some(regx => regx.test(arg))) : false;
    }
}
ArgFilter.unsecure = [
    /disable-web-security/i,
    /proxy-server/i,
    /proxy-pac-url/i,
    /allow-running-insecure-content/i
];
exports.ArgFilter = ArgFilter;
