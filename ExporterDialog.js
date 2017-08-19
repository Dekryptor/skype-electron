"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const WindowBase_1 = require("./WindowBase");
const Logger_1 = require("./logger/Logger");
const LanguageInit_1 = require("./localisation/LanguageInit");
const Utils_1 = require("./Utils");
class ExporterDialog extends WindowBase_1.WindowBase {
    constructor() {
        super({
            'title': LanguageInit_1.language.getString(Utils_1.isLinux() ? 'Menu.ExportHistoryLinuxLabel' : 'Menu.ExportHistoryLabel'),
            'width': 600,
            'height': 500,
            'useContentSize': true,
            'resizable': true,
            'fullscreen': false,
            'show': false,
            'webPreferences': {
                'preload': path.join(__dirname, 'exporter-dialog', 'Preload.js'),
                'nodeIntegration': false,
                'webSecurity': true
            }
        });
        this.window.setMenu(null);
        this.webContents.on('did-finish-load', () => {
            Logger_1.getInstance().info('[ExporterDialog] Showing Exporter dialog');
            this.window.show();
        });
        this.window.on('close', () => {
            Logger_1.getInstance().info('[ExporterDialog] Closing Exporter dialog');
        });
        const aboutUrl = 'file:///exporter-dialog/index.html';
        this.window.loadURL(aboutUrl);
    }
}
exports.ExporterDialog = ExporterDialog;
