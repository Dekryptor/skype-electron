"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const DomUtils_1 = require("../DomUtils");
const PreloadShared_1 = require("../PreloadShared");
const CallMonitorChannel = 'call-monitor-message';
class CallMonitorApi {
    constructor() {
        electron.ipcRenderer.on(CallMonitorChannel, (event, ...args) => {
            if (this._handler) {
                this._handler(...args);
            }
        });
        window.addEventListener('unload', () => {
            console.log(`[CallMonitorApi] window unloading`);
            electron.ipcRenderer.removeAllListeners(CallMonitorChannel);
        });
    }
    sendMessage(...args) {
        electron.ipcRenderer.send(CallMonitorChannel, ...args);
    }
    onMessage(handler) {
        this._handler = handler;
    }
    supportsTransparency() {
        if (process.platform === 'darwin') {
            return true;
        }
        return false;
    }
    get slimcore() {
        if (!this._slimcore) {
            try {
                this._slimcore = module.require('slimcore');
            }
            catch (e) {
                console.error(`[CallMonitorApi] Failed to load slimcore: ${e}`);
            }
        }
        return this._slimcore;
    }
    get videoRenderer() {
        if (!this._videoRenderer) {
            try {
                this._videoRenderer = module.require('slimcore/lib/video-renderer');
            }
            catch (e) {
                console.error(`[CallMonitorApi] Failed to load video-renderer: ${e}`);
            }
        }
        return this._videoRenderer;
    }
}
window['callMonitorApi'] = new CallMonitorApi();
PreloadShared_1.overrideLogger();
DomUtils_1.disableDragAndDrop();
