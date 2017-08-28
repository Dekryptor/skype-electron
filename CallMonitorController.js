"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const path = require("path");
const Utils = require("./Utils");
const CallMonitorMessage = 'call-monitor-message';
const CallMonitorCreate = 'call-monitor-create';
const CallMonitorDestroy = 'call-monitor-destroy';
const CallMonitorInvoke = 'call-monitor-invoke';
class CallMonitorProxy {
    constructor(options) {
        this._messageHandler = (event, ...args) => {
            if (this._handler) {
                this._handler(...args);
            }
        };
        this._handler = options.onMessage;
        if (electron.remote) {
            electron.ipcRenderer.on(CallMonitorMessage, this._messageHandler);
            electron.ipcRenderer.send(CallMonitorCreate, options);
        }
    }
    _sendInvoke(method, ...args) {
        electron.ipcRenderer.send(CallMonitorInvoke, method, ...args);
    }
    show() {
        this._sendInvoke('show');
    }
    showInactive() {
        this._sendInvoke('showInactive');
    }
    hide() {
        this._sendInvoke('hide');
    }
    setPosition(x, y) {
        this._sendInvoke('setPosition', x, y);
    }
    setSize(width, height) {
        this._sendInvoke('setSize', width, height);
    }
    sendMessage(...args) {
        electron.ipcRenderer.send(CallMonitorMessage, ...args);
    }
    destroy() {
        electron.ipcRenderer.send(CallMonitorDestroy);
        electron.ipcRenderer.removeListener(CallMonitorMessage, this._messageHandler);
        this._handler = undefined;
    }
}
exports.CallMonitorProxy = CallMonitorProxy;
class CallMonitorController {
    constructor(logger) {
        this._closingWindows = [];
        this._createHandler = (event, options) => {
            if (!this._window) {
                options.webPreferences = options.webPreferences || {};
                options.webPreferences.preload = path.join(electron.app.getAppPath(), options.preloadScript);
                options.webPreferences.nodeIntegration = false;
                options.webPreferences.webSecurity = true;
                const shouldShow = options.show;
                options.show = false;
                this._window = new electron.BrowserWindow(options);
                this._window.setMenu(null);
                this._owner = event.sender;
                electron.ipcMain.on(CallMonitorDestroy, this._destroyHandler);
                electron.ipcMain.on(CallMonitorInvoke, this._invokeHandler);
                electron.ipcMain.on(CallMonitorMessage, this._messageHandler);
                if (options.visibleOnAllWorkspaces) {
                    this._window.setVisibleOnAllWorkspaces(true);
                }
                if (options.dontShare && Utils.isMac()) {
                    this._window.setContentProtection(true);
                }
                this._window.loadURL(options.contentUri);
                this._window.once('ready-to-show', () => {
                    if (shouldShow) {
                        this._window.show();
                    }
                });
                this._logger.info('[CallMonitorController] Created new call monitor window.');
            }
            else {
                this._logger.error('[CallMonitorController] Attempt to create more than one call monitor.');
            }
        };
        this._invokeHandler = (event, method, ...args) => {
            if (this._window && !this._window.isDestroyed() && typeof this._window[method] === 'function') {
                this._window[method](...args);
            }
        };
        this._messageHandler = (event, ...args) => {
            if (this._window && this._owner && this._window.webContents) {
                if (event.sender === this._window.webContents) {
                    this._owner.send(CallMonitorMessage, ...args);
                }
                else if (event.sender === this._owner) {
                    this._window.webContents.send(CallMonitorMessage, ...args);
                }
            }
        };
        this._destroyHandler = () => {
            if (this._window && !this._window.isDestroyed()) {
                this._logger.info('[CallMonitorController] Closing call monitor window.');
                this._window.setClosable(true);
                electron.ipcMain.removeListener(CallMonitorMessage, this._messageHandler);
                electron.ipcMain.removeListener(CallMonitorInvoke, this._invokeHandler);
                electron.ipcMain.removeListener(CallMonitorDestroy, this._destroyHandler);
                this._observeClose(this._window);
                this._window.close();
                this._owner = undefined;
                this._window = undefined;
            }
        };
        this._logger = logger;
        if (electron.ipcMain) {
            electron.ipcMain.on(CallMonitorCreate, this._createHandler);
        }
    }
    _observeClose(window) {
        this._closingWindows.push(window);
        window.on('closed', () => {
            this._closingWindows = this._closingWindows.filter(w => w !== window);
            this._logger.info('[CallMonitorController] Call monitor window closed.');
        });
    }
}
exports.CallMonitorController = CallMonitorController;
