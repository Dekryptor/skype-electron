"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const DomUtils_1 = require("../DomUtils");
const PopupWindowChannel = 'popup-window-message';
class PopupWindowApi {
    constructor() {
        electron.ipcRenderer.on(PopupWindowChannel, (event, ...args) => {
            if (this._handler) {
                this._handler(...args);
            }
        });
        window.addEventListener('unload', () => {
            console.log(`[PopupWindowApi] window unloading`);
            electron.ipcRenderer.removeAllListeners(PopupWindowChannel);
        });
    }
    sendMessage(...args) {
        electron.ipcRenderer.send(PopupWindowChannel, ...args);
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
                console.error(`[PopupWindowApi] Failed to load slimcore: ${e}`);
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
                console.error(`[PopupWindowApi] Failed to load video-renderer: ${e}`);
            }
        }
        return this._videoRenderer;
    }
}
window['popupApi'] = new PopupWindowApi();
DomUtils_1.disableDragAndDrop();
