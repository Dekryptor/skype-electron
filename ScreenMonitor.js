"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ScreenMonitor {
    constructor(_webContents, _screen) {
        this._webContents = _webContents;
        this._screen = _screen;
        this._eventHandlingStarted = false;
        this._onDisplaysChanged = () => {
            this._webContents.send('displays-changed');
        };
    }
    startHandlingEvents() {
        if (this._eventHandlingStarted) {
            return;
        }
        this._eventHandlingStarted = true;
        this._screen.on('display-added', this._onDisplaysChanged);
        this._screen.on('display-removed', this._onDisplaysChanged);
    }
}
exports.ScreenMonitor = ScreenMonitor;
