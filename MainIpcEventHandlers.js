"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
let _sharingIndicator = null;
function _showSharingIndicator(position) {
    if (_sharingIndicator) {
        _sharingIndicator.setPosition(position);
        return;
    }
    let module;
    try {
        module = require('slimcore/lib/sharing-indicator');
    }
    catch (error) {
        console['error'](`sharing-indicator loading failed: ${error}`);
        return;
    }
    _sharingIndicator = new module.SharingIndicator({
        position: position,
        borderColor: { red: 0xD6 / 0xFF, green: 0x11 / 0xFF, blue: 0x21 / 0xFF, alpha: 1.0 },
        lineWidth: 5.0
    });
}
function _hideSharingIndicator() {
    if (_sharingIndicator) {
        _sharingIndicator.dispose();
        _sharingIndicator = null;
    }
}
let powerSaveBlockerId;
function _setScreenSaver(block) {
    if (block) {
        powerSaveBlockerId = electron.powerSaveBlocker.start('prevent-display-sleep');
    }
    else {
        if (typeof powerSaveBlockerId === 'number' &&
            electron.powerSaveBlocker.isStarted(powerSaveBlockerId)) {
            electron.powerSaveBlocker.stop(powerSaveBlockerId);
        }
    }
}
function initializeMainIpcEventHandlers() {
    const ipcMain = electron.ipcMain;
    ipcMain.on('sharingIndicator:show', (event, position) => {
        _showSharingIndicator(position);
    });
    ipcMain.on('sharingIndicator:hide', (event) => {
        _hideSharingIndicator();
    });
    ipcMain.on('block-screen-saver', (event, block) => {
        _setScreenSaver(block);
    });
}
exports.default = initializeMainIpcEventHandlers;
