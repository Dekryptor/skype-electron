"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const os = require("os");
const main_db_exporter_1 = require("main-db-exporter");
const LanguageInit_1 = require("../localisation/LanguageInit");
const Logger_1 = require("../logger/Logger");
const DomUtils_1 = require("../DomUtils");
const AuthStore_1 = require("../login/AuthStore");
const TARGET_EXPORT_DIR = 'skype-export';
const logger = Logger_1.getInstance();
const skypeId = AuthStore_1.getInstance().getUsername();
class ExporterApi {
    constructor(username) {
        this.username = username;
    }
    getOutputFolder() {
        return this.getDefaultOutputFolder();
    }
    openOutputFolder() {
        electron_1.remote.shell.showItemInFolder(path.join(this.getDefaultOutputFolder(), 'index.html'));
    }
    openInBrowser() {
        electron_1.remote.shell.openItem(path.join(this.getDefaultOutputFolder(), 'index.html'));
    }
    fetchDefaultDbAccounts() {
        return main_db_exporter_1.fetchDefaultDbAccountsAsync();
    }
    exportAccounts(accounts, progressReporter) {
        return main_db_exporter_1.exportAccountsAsync(accounts, this.getDefaultOutputFolder(), progressReporter);
    }
    getDefaultOutputFolder() {
        return path.join(os.homedir(), TARGET_EXPORT_DIR);
    }
}
window['exporterApi'] = new ExporterApi(skypeId);
window['domLocaliser'] = LanguageInit_1.domLocaliser;
window['localisation'] = LanguageInit_1.language;
window['logger'] = logger;
DomUtils_1.disableDragAndDrop();
