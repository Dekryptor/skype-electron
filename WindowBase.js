"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const Logger_1 = require("./logger/Logger");
class WindowBase {
    constructor(options, shouldBeHidden, shouldMinimizeToTray) {
        this.instance = new electron_1.BrowserWindow(options);
        this.instance.once('ready-to-show', () => {
            Logger_1.getInstance().info('[WindowBase] Window is ready to show.');
            if (shouldBeHidden) {
                this.instance.showInactive();
                if (shouldMinimizeToTray) {
                    this.instance.hide();
                }
                else {
                    this.instance.minimize();
                }
            }
            else {
                this.instance.show();
            }
        });
    }
    get window() {
        return this.instance;
    }
    get webContents() {
        return this.instance.webContents;
    }
}
exports.WindowBase = WindowBase;
