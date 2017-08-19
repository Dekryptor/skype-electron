"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const ElectronApi_1 = require("./ElectronApi");
const ClientVersion_1 = require("./ClientVersion");
const ContextMenu_1 = require("./ContextMenu");
const LanguageInit_1 = require("./localisation/LanguageInit");
const Localisation_1 = require("./localisation/Localisation");
const Logger_1 = require("./logger/Logger");
const ipc = electron.ipcRenderer;
const app = electron.remote ? electron.remote.app : electron.app;
const slimcoreLogPath = app.getPath('userData') + '/skylib';
const mediaLogPath = app.getPath('userData') + '/media-stack';
const clientVersion = ClientVersion_1.getInstance();
function apiForMain() {
    if (!window['electronApi']) {
        setupSpellcheck(window);
        window['electronApi'] = new ElectronApi_1.ElectronApi();
    }
    const win = window;
    win['electronSafeIpc'] = ipc;
    setupCallingWithSlimCore(window);
}
exports.apiForMain = apiForMain;
function setupCallingWithSlimCore(window) {
    try {
        const slimCore = module.require('slimcore');
        const videoRenderer = module.require('slimcore/lib/video-renderer');
        let xWindow = window;
        window.addEventListener('unload', () => {
            if (xWindow.SlimCore && xWindow.SlimCore.Instance) {
                xWindow.SlimCore.Instance.dispose();
            }
        });
        xWindow.SlimCore = xWindow.SlimCore || slimCore;
        xWindow.VideoRenderer = xWindow.VideoRenderer || videoRenderer;
        const logFileName = 'slimcore-' + new Date().getTime() + '.log';
        const slimCoreOptions = {
            version: clientVersion.getFullVersion(),
            logFileName: logFileName,
            dataPath: slimcoreLogPath,
            mediaLogsPath: mediaLogPath,
            isEncrypted: true
        };
        const instance = xWindow.SlimCore.Instance || slimCore.createSlimCoreInstance(slimCoreOptions);
        xWindow.SlimCore.Instance = instance;
    }
    catch (e) {
        Logger_1.getInstance().error('[S4lApi] Init slimcore error:' + e.message + '\n' + e.stack);
    }
}
function setupSpellcheck(window) {
    try {
        let _window = window;
        const spellchecker = module.require('electron-spellchecker');
        spellchecker.setGlobalLogger(Logger_1.getInstance().debug);
        const spellcheckHandler = new spellchecker.SpellCheckHandler();
        spellcheckHandler.autoUnloadDictionariesOnBlur();
        spellcheckHandler.switchLanguage(LanguageInit_1.language.getLocale());
        LanguageInit_1.language.on(Localisation_1.Localisation.LocaleChangeEvent, (locale) => {
            spellcheckHandler.switchLanguage(locale);
        });
        setTimeout(() => { spellcheckHandler.attachToInput(); }, 1000);
        _window.spellCheckHandler = spellcheckHandler;
        let contextMenu = new ContextMenu_1.ContextMenu(_window.spellCheckHandler, null, Logger_1.getInstance(), LanguageInit_1.language);
        new spellchecker.ContextMenuListener((info) => {
            contextMenu.showPopupMenu(info);
        });
    }
    catch (e) {
        Logger_1.getInstance().error('[S4lApi] Spellchecker error:' + e.message + '\n' + e.stack);
    }
}
