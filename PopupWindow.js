"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const path = require("path");
const Utils = require("./Utils");
const PopupWindowChannel = 'popup-window-message';
class PopupWindow {
    constructor(options) {
        this._focusable = false;
        this.messageHandler = (event, ...args) => {
            if (this._window && event.sender === this._window.webContents && this._handler) {
                this._handler(...args);
            }
        };
        this._focusable = options.focusable !== undefined ? options.focusable : true;
        options.webPreferences = options.webPreferences || {};
        options.webPreferences.preload = path.join(electron.remote.app.getAppPath(), options.preloadScript);
        options.webPreferences.nodeIntegration = false;
        options.webPreferences.webSecurity = true;
        this._handler = options.onMessage;
        const shouldShow = options.show;
        options.show = false;
        this._window = new electron.remote.BrowserWindow(options);
        this._window.setMenu(null);
        if (options.visibleOnAllWorkspaces) {
            this._window.setVisibleOnAllWorkspaces(true);
        }
        if (options.dontShare && Utils.isMac()) {
            this._window.setContentProtection(true);
        }
        electron.remote.ipcMain.on(PopupWindowChannel, this.messageHandler);
        this._window.loadURL(options.contentUri);
        this._window.once('ready-to-show', () => {
            if (shouldShow) {
                this._window.show();
            }
        });
        this._window.on('close', () => {
            this.destroy();
        });
    }
    sendMessage(...args) {
        if (!this._window || this._window.isDestroyed() || !this._window.webContents) {
            return;
        }
        this._window.webContents.send(PopupWindowChannel, ...args);
    }
    show() {
        if (!this._window || this._window.isDestroyed()) {
            return;
        }
        this._window.show();
    }
    showInactive() {
        if (!this._window || this._window.isDestroyed()) {
            return;
        }
        this._window.showInactive();
    }
    hide() {
        if (!this._window || this._window.isDestroyed()) {
            return;
        }
        this._window.hide();
    }
    setPosition(x, y) {
        if (!this._window || this._window.isDestroyed()) {
            return;
        }
        this._window.setPosition(x, y);
    }
    setSize(width, height) {
        if (!this._window || this._window.isDestroyed()) {
            return;
        }
        this._window.setSize(width, height);
    }
    destroy() {
        if (!this._window || this._window.isDestroyed()) {
            return;
        }
        this._window.setClosable(true);
        electron.remote.ipcMain.removeListener(PopupWindowChannel, this.messageHandler);
        this._window.close();
        this._window = undefined;
        this._handler = undefined;
    }
}
exports.PopupWindow = PopupWindow;
