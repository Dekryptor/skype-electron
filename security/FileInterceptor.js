"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron = require("electron");
const url = require("url");
const path = require("path");
const constants = require("../Constants");
const Utils_1 = require("../Utils");
const Logger_1 = require("../logger/Logger");
const app = electron.remote ? electron.remote.app : electron.app;
const allowedAppDataDir = app.getPath('userData');
const allowedRootDir = app.getAppPath();
function install() {
    installFilter(allowedRootDir, allowedAppDataDir);
}
exports.install = install;
function applyApplicationInterceptor(urlPath, appRootDir) {
    const assetPaths = [
        constants.applicationUrl,
        `${constants.protocol}/css`,
        `${constants.protocol}/common`,
        `${constants.protocol}/fonts`,
        `${constants.protocol}/images`,
        `${constants.protocol}/js`,
        `${constants.protocol}/media`,
        `${constants.protocol}/exporter-dialog`,
        `${constants.protocol}/call-monitor`
    ];
    const isAssetPath = !!assetPaths.find(path => urlPath.startsWith(path));
    const isSourceMap = urlPath.length - urlPath.lastIndexOf('.map') === '.map'.length;
    if (isAssetPath || isSourceMap) {
        return urlPath;
    }
    if (urlPath.startsWith(constants.protocol)) {
        let lettersToStrip = Utils_1.isWindows() ? `${constants.protocol}/`.length : constants.protocol.length;
        let requestedPath = url.parse(urlPath.slice(lettersToStrip)).pathname;
        let rootPath = url.parse(appRootDir).pathname;
        if (requestedPath.startsWith(rootPath)) {
            let relativePath = requestedPath.slice(rootPath.length);
            if (relativePath.startsWith('/')) {
                relativePath = relativePath.substring(1);
            }
            Logger_1.getInstance().debug('[File Interceptor] Absolute path normalized to: ', relativePath);
            return `${constants.protocol}/${relativePath}`;
        }
    }
    Logger_1.getInstance().error('[File Interceptor] Disallowed resource path: ', urlPath);
    return constants.applicationUrl;
}
function installFilter(appRootDir, appDataDir) {
    Logger_1.getInstance().info('Registering protocol interceptors');
    electron_1.protocol.interceptFileProtocol('file', function (request, callback) {
        Logger_1.getInstance().debug('[File Interceptor] Intercepted file request: ', request.url);
        if (!request || !request.url) {
            Logger_1.getInstance().error('[File Interceptor] Invalid empty request: ', request);
            throw new Error('Invalid empty request');
        }
        const applicationFilteredUrl = applyApplicationInterceptor(request.url, appRootDir);
        let parts = url.parse(applicationFilteredUrl);
        if (!parts || !parts.pathname) {
            let msg = 'Invalid request to: ' + request.url;
            Logger_1.getInstance().info(msg);
            throw new Error(msg);
        }
        let p = path.join(appRootDir, parts.pathname);
        Logger_1.getInstance().debug('[File Interceptor] Loading: ', p);
        callback(p);
    });
}
exports.installFilter = installFilter;
