"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const ElectronApi_1 = require("./ElectronApi");
(function (window) {
    'use strict';
    if (window.WebViewBridge) {
        return;
    }
    function callFunction(func, message) {
        if ('function' === typeof func) {
            func(message);
        }
    }
    const document = window.document;
    var WebViewBridge = {
        send: (message) => {
            electron.ipcRenderer.sendToHost(ElectronApi_1.webViewBridgeChannelName, message);
        },
        onMessage: null
    };
    electron.ipcRenderer.on(ElectronApi_1.webViewBridgeChannelName, (sender, message) => {
        if (message) {
            callFunction(WebViewBridge.onMessage, message);
        }
    });
    window.WebViewBridge = WebViewBridge;
    let customEvent = document.createEvent('Event');
    customEvent.initEvent('WebViewBridge', true, true);
    document.dispatchEvent(customEvent);
}(window));
