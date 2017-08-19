"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const Url = require("url");
const Logger_1 = require("../logger/Logger");
function install() {
    electron_1.app.on('browser-window-created', function (evt, window) {
        Logger_1.getInstance().info('[WindowInterceptor] Registering new window interceptor.');
        window.webContents.on('new-window', function (event, urlParam, frameName, disposition, options) {
            Logger_1.getInstance().info('Trying to create new-window: ', urlParam);
            let url = Url.parse(urlParam);
            event.preventDefault();
            if (url.protocol !== 'file:') {
                Logger_1.getInstance().info('Opening in new window: ', url.href);
                electron_1.shell.openExternal(urlParam);
            }
        });
    });
}
exports.install = install;
