"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const path = require("path");
const _ = require("lodash");
const Configuration_1 = require("./configuration/Configuration");
const constants = require("./Constants");
const LanguageInit_1 = require("./localisation/LanguageInit");
const LogsProvider_1 = require("./LogsProvider");
const KeychainStore_1 = require("./login/KeychainStore");
const SkypeUriInit_1 = require("./SkypeUriInit");
const DownloadManager_1 = require("./DownloadManager");
const ClipboardManager_1 = require("./ClipboardManager");
const MainWindow_1 = require("./MainWindow");
const CallMonitorController_1 = require("./CallMonitorController");
const ipc = electron.ipcRenderer;
const app = electron.remote ? electron.remote.app : electron.app;
const logsPath = path.join(app.getPath('userData'), Configuration_1.default.log.logsPath);
const slimcoreLogPath = path.join(app.getPath('userData'), 'skylib');
const mediaLogPath = path.join(app.getPath('userData'), 'media-stack');
const webViewBridgePreloadPath = path.join(app.getAppPath(), 'WebViewPreload.js');
exports.webViewBridgeChannelName = '__WebViewBridgeChannel__';
class ElectronApi {
    constructor() {
        this.webViewBridgePreloadPath = webViewBridgePreloadPath;
        this.webViewBridgeChannelName = exports.webViewBridgeChannelName;
        this.logsProvider = new LogsProvider_1.LogsProvider(logsPath, slimcoreLogPath, mediaLogPath);
        this.downloadManager = DownloadManager_1.getInstance();
        this.clipboardManager = ClipboardManager_1.getInstance();
        this.keychain = KeychainStore_1.getInstance();
    }
    checkForUpdates() {
        ipc.send('check-for-updates');
    }
    ipcSend(channel, ...args) {
        ipc.send(channel, ...args);
    }
    notifyStartupEnded() {
        ipc.send('application-startup-end');
    }
    notifyUserAuth(username) {
        ipc.send('authentication-user-change', username);
    }
    on(channel, listener) {
        ipc.on(channel, listener);
    }
    once(channel, listener) {
        ipc.once(channel, listener);
    }
    openWindowAndReturnRedirectUrl(url, shouldAppCloseOnInterruptedLogin, expectedUrl, loadOptions) {
        if (!expectedUrl) {
            expectedUrl = 'https://login.live.com/oauth20_desktop.srf';
        }
        ipc.send('open-new-window', url, shouldAppCloseOnInterruptedLogin, expectedUrl, loadOptions);
        return new Promise((resolve, reject) => {
            ipc.on('redirected-to-page', (event, data) => {
                resolve(data);
            });
            ipc.on('window-closed', () => {
                reject();
            });
        });
    }
    setWindowSize(width, height, animated) {
        const displays = electron.screen.getAllDisplays();
        width = _.clamp(width, 0, _.maxBy(displays, (display) => display.workAreaSize.width).workAreaSize.width);
        height = _.clamp(height, 0, _.maxBy(displays, (display) => display.workAreaSize.height).workAreaSize.height);
        ipc.send('window-set-size', width, height, animated);
    }
    setResizable(resizable) {
        ipc.send('window-set-resizable', resizable);
    }
    setMaximizable(maximizable) {
        ipc.send('window-set-maximizable', maximizable);
    }
    windowCenter() {
        ipc.send('window-center');
    }
    quitAndUpdate() {
        ipc.send('update-quit-and-install');
    }
    quitApp() {
        ipc.send('app-quit');
    }
    windowClose() {
        ipc.send('window-close');
    }
    windowMinimize() {
        ipc.send('window-minimize');
    }
    windowToggleMaximize() {
        ipc.send('window-toggle-maximize');
    }
    blockScreenSaver(block) {
        ipc.send('block-screen-saver', block);
    }
    getSystemLocale() {
        return LanguageInit_1.language.getDetectedSystemLocale();
    }
    setLocale(locale) {
        LanguageInit_1.language.setLocale(locale);
    }
    resetLocale() {
        LanguageInit_1.language.setLocale();
        return LanguageInit_1.language.getDetectedSystemLocale();
    }
    getCurrentSkypeURI() {
        return SkypeUriInit_1.getInstance().getUri();
    }
    getDefaultWindowSize() {
        return MainWindow_1.defaultWindowSize;
    }
    getLoginWindowSize() {
        return MainWindow_1.defaultLoginWindowSize;
    }
    openThirdPartyNotices() {
        electron.shell.openItem(constants.thirdPartyNoticesFile);
    }
    createCallMonitor(options) {
        options = options || {};
        return new CallMonitorController_1.CallMonitorProxy(options);
    }
    supportsTransparency() {
        if (process.platform === 'darwin') {
            return true;
        }
        return false;
    }
    focusMainWindow() {
        ipc.send('window-focus-called');
    }
    primaryDisplaySize() {
        return electron.screen.getPrimaryDisplay().workAreaSize;
    }
}
exports.ElectronApi = ElectronApi;
