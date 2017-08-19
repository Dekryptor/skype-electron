"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const electron = require("electron");
class PackageInfo {
    constructor(packageJsonDir) {
        let packageJsonPath = path.join(packageJsonDir, 'package.json');
        this.info = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }
    getData() {
        if (!this.info) {
            throw new Error('Package info not initialized.');
        }
        return this.info;
    }
}
exports.PackageInfo = PackageInfo;
function readPackageJson() {
    let path = electron.remote ? electron.remote.app.getAppPath() : electron.app.getAppPath();
    return new PackageInfo(path);
}
exports.readPackageJson = readPackageJson;
