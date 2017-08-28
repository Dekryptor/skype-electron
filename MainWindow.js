"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const electron = require("electron");
const constants = require("./Constants");
const utils = require("./Utils");
const WindowBase_1 = require("./WindowBase");
const Settings_1 = require("./Settings");
const OAuthWindow_1 = require("./login/OAuthWindow");
const SkypeUriInit_1 = require("./SkypeUriInit");
const ScreenMonitor_1 = require("./ScreenMonitor");
const windowPositionKey = 'main-window.position';
const windowMaximizedKey = 'main-window.isMaximised';
exports.minimumWindowSize = {
    width: 460,
    height: 660
};
exports.defaultWindowSize = {
    width: 1024,
    height: 768
};
exports.defaultLoginWindowSize = {
    width: 460,
    height: 660
};
class MainWindow extends WindowBase_1.WindowBase {
    constructor(appConfig, logger, clientVersion, updater, localisation) {
        super(MainWindow.getWindowOptions(appConfig, logger, localisation), Settings_1.settings.get('app.launchMinimized', false), Settings_1.settings.get('app.minimizeToTray'));
        this.closingAllowed = false;
        this.minimizeToTray = false;
        this.redirectionHooks = new Map();
        this.oAuthWindow = OAuthWindow_1.OAuthWindow.getInstance();
        this.skypeUri = SkypeUriInit_1.getInstance();
        this.badgeCount = 0;
        this.appConfig = appConfig;
        this.localisation = localisation;
        this.logger = logger;
        this.minimizeToTray = Settings_1.settings.get('app.minimizeToTray');
        this.handleBadgeIcons();
        this.handleNotifications();
        this.handleWindowPosition();
        this.handleWindowClose();
        this.handleRedirectionHooks();
        this.handleOAuthLogin();
        this.handleWindowEvents();
        this.handleDisplayChanges();
        this.handleClearStorage();
        this.forwardSkypeUri();
        if (Settings_1.settings.get(windowMaximizedKey, false) && !Settings_1.settings.get('app.launchMinimized', false)) {
            this.window.maximize();
        }
    }
    static getWindowOptions(appConfig, logger, localisation) {
        let windowOptions = {
            'width': exports.defaultLoginWindowSize.width,
            'height': exports.defaultLoginWindowSize.height,
            'resizable': true,
            'maximizable': true,
            'title': localisation.getString('ApplicationName'),
            'autoHideMenuBar': utils.isWindows(),
            'webPreferences': {
                'preload': path.join(electron_1.app.getAppPath(), 'Preload.js'),
                'nodeIntegration': false,
                'webviewTag': true,
                'webSecurity': true
            },
            'minWidth': exports.minimumWindowSize.width,
            'minHeight': exports.minimumWindowSize.width,
            'show': false
        };
        if (utils.isLinux()) {
            windowOptions['icon'] = path.resolve(electron_1.app.getAppPath(), `../../../pixmaps/${appConfig.appShortName}.png`);
        }
        if (Settings_1.settings.has(windowPositionKey)) {
            try {
                let savedPosition = Settings_1.settings.get(windowPositionKey);
                let displayBounds = electron_1.screen.getDisplayMatching(savedPosition).bounds;
                if (MainWindow.isPointOutOfBounds(savedPosition.x, displayBounds.x, displayBounds.width)
                    || MainWindow.isPointOutOfBounds(savedPosition.y, displayBounds.y, displayBounds.height)) {
                    delete savedPosition.x;
                    delete savedPosition.y;
                }
                Object.assign(windowOptions, savedPosition);
            }
            catch (e) {
                logger.error('[MainWindow] corrupted window position settings.');
            }
        }
        return windowOptions;
    }
    static isPointOutOfBounds(point, start, length) {
        return !(point >= start) || !(point <= start + length);
    }
    showAndFocus() {
        if (this.window.isMinimized()) {
            this.window.restore();
        }
        this.window.show();
        this.window.focus();
        this.window.setMinimumSize(exports.minimumWindowSize.width, exports.minimumWindowSize.height);
    }
    resetWindowTitle() {
        this.updateWindowTitleWithBadge(this.badgeCount);
    }
    registerRedirectionHook(url, callback = null) {
        this.redirectionHooks.set(url, callback);
    }
    loadApplication() {
        this.logger.info('[MainWindow] Loading application.');
        this.window.loadURL(constants.applicationUrl);
    }
    getUrl() {
        return this.webContents.getURL();
    }
    callWhenPageLoaded(fn) {
        if (!this.webContents.isLoading()) {
            fn();
        }
        else {
            setTimeout(() => {
                this.callWhenPageLoaded(fn);
            }, 200);
        }
    }
    ;
    forwardSkypeUri() {
        this.skypeUri.on('skype-uri-available', () => {
            this.logger.info('[MainWindow] Forwarding Skype Uri Available event');
            this.webContents.send('skype-uri-available');
        });
    }
    handleRedirectionHooks() {
        let self = this;
        this.webContents.on('will-navigate', (event, url) => {
            this.logger.info('[MainWindow] WILL NAVIGATE: ', url);
            let callback = self.urlHasHook(url);
            if (callback !== null) {
                event.preventDefault();
                callback(url);
            }
        });
        this.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl, isMainFrame) => {
            if (!isMainFrame) {
                return;
            }
            this.logger.info('[MainWindow] GOT REDIRECT REQUEST TO: ', newUrl);
            let callback = self.urlHasHook(newUrl);
            if (callback !== null) {
                event.preventDefault();
                callback(newUrl);
            }
        });
    }
    urlHasHook(url) {
        for (let [key, value] of this.redirectionHooks) {
            if (url.startsWith(key) && value !== null) {
                this.logger.info('Redirection hook found');
                return value;
            }
        }
        return null;
    }
    handleBadgeIcons() {
        electron_1.ipcMain.on('badgeCount', (event, count) => {
            this.badgeCount = count;
            let badge = (count !== 0) ? count + '' : '';
            electron_1.app.setBadgeCount(count);
            if (this.window.setOverlayIcon) {
                this.window.setOverlayIcon(this.badgeIconForNumber(badge), badge);
            }
            this.updateWindowTitleWithBadge(count);
        });
        this.window.on('page-title-updated', (event, title) => {
            event.preventDefault();
        });
    }
    updateWindowTitleWithBadge(count) {
        this.window.setTitle(this.localisation.getString('ApplicationName') + (count ? ` [${count}]` : ''));
    }
    handleNotifications() {
        electron_1.ipcMain.on('notification-activated', () => {
            this.showAndFocus();
        });
        electron_1.ipcMain.on('notification-delivered', () => {
            this.window.isFocused() || this.window.flashFrame(true);
        });
        this.window.on('focus', () => {
            this.window.flashFrame(false);
        });
    }
    handleOAuthLogin() {
        electron_1.ipcMain.on('open-new-window', (event, url, shouldAppCloseOnInterruptedLogin, expectedUrl, loadOptions) => {
            if (this.oAuthWindow.isLoginWindowOpen()) {
                return;
            }
            this.logger.info('[MainWindow] received an OAuth login window request.');
            this.oAuthWindow.setExpectedUrl(expectedUrl);
            this.oAuthWindow.makeOAuthLoginWindow(url, shouldAppCloseOnInterruptedLogin, loadOptions).then((resultUrl) => {
                this.logger.info('[MainWindow] responding to the OAuth login window request.');
                event.sender.send('redirected-to-page', resultUrl);
                this.oAuthWindow.destroyTheLoginWindow();
            }).catch(err => {
                this.logger.info('[MainWindow] responding with error to the OAuth login window request.', err);
                event.sender.send('window-closed');
                this.oAuthWindow.destroyTheLoginWindow();
            });
        });
        this.window.on('focus', () => {
            if (this.oAuthWindow) {
                this.oAuthWindow.focus();
            }
        });
    }
    handleWindowEvents() {
        electron_1.ipcMain.on('window-close', () => {
            this.window.close();
        });
        electron_1.ipcMain.on('window-minimize', () => {
            this.window.minimize();
        });
        electron_1.ipcMain.on('window-set-size', (event, width, height, animated) => {
            this.window.setContentSize(width, height, animated);
        });
        electron_1.ipcMain.on('window-set-resizable', (event, resizable) => {
            this.window.setResizable(resizable);
        });
        electron_1.ipcMain.on('window-set-maximizable', (event, maximizable) => {
            this.window.setMaximizable(maximizable);
        });
        electron_1.ipcMain.on('window-center', (event, maximizable) => {
            this.window.center();
        });
        electron_1.app.on('window-minimize-to-tray', (isMinimized) => {
            this.minimizeToTray = isMinimized;
        });
        electron_1.ipcMain.on('window-toggle-maximize', () => {
            if (this.window.isMaximized()) {
                this.window.unmaximize();
            }
            else {
                this.window.maximize();
            }
        });
        electron_1.ipcMain.on('window-focus-called', () => {
            this.showAndFocus();
        });
        this.window.on('enter-full-screen', () => {
            this.webContents.send('enter-full-screen');
        });
        this.window.on('leave-full-screen', () => {
            this.webContents.send('leave-full-screen');
        });
        electron_1.ipcMain.on('force-leave-full-screen', () => {
            this.window.setFullScreen(false);
        });
    }
    handleDisplayChanges() {
        if (this._screenMonitor) {
            return;
        }
        this._screenMonitor = new ScreenMonitor_1.ScreenMonitor(this.webContents, electron.screen);
        this._screenMonitor.startHandlingEvents();
    }
    handleWindowPosition() {
        this.window.on('move', () => {
            this.saveWindowPosition();
        });
        this.window.on('resize', () => {
            this.saveWindowPosition();
        });
        this.window.on('maximize', () => {
            Settings_1.settings.set(windowMaximizedKey, true);
            this.webContents.send('window-maximized');
        });
        this.window.on('unmaximize', () => {
            Settings_1.settings.set(windowMaximizedKey, false);
            this.webContents.send('window-unmaximized');
        });
        this.window.on('focus', () => {
            this.webContents.send('window-focus');
        });
        this.window.on('blur', () => {
            this.webContents.send('window-blur');
        });
        this.window.on('minimize', () => {
            this.webContents.send('window-minimize');
        });
        this.window.on('restore', () => {
            this.webContents.send('window-restore');
        });
    }
    saveWindowPosition() {
        Settings_1.settings.set(windowMaximizedKey, this.window.isMaximized());
        Settings_1.settings.set(windowPositionKey, this.window.getBounds());
    }
    handleWindowClose() {
        this.window.on('close', event => {
            if (this.allowClosing) {
                return;
            }
            event.preventDefault();
            if (this.window.isFullScreen() && utils.isMac()) {
                this.window.once('leave-full-screen', () => {
                    this.window.hide();
                });
                this.window.setFullScreen(false);
            }
            else if (utils.isMac() || this.minimizeToTray) {
                this.window.hide();
            }
            else {
                this.window.minimize();
            }
        });
    }
    badgeIconForNumber(value) {
        let suffix = /^[1-9]$/.test(value) ? `_${value}` : '';
        let file = path.join(__dirname, `images/badge/badge${suffix}.ico`);
        return value ? electron.nativeImage.createFromPath(file) : null;
    }
    get allowClosing() {
        return this.closingAllowed;
    }
    set allowClosing(value) {
        this.closingAllowed = value;
    }
    handleClearStorage() {
        electron_1.ipcMain.on('clear-storage', (event, options) => {
            this.logger.info('[MainWindow] received clear storage request.');
            if (this.webContents && this.webContents.session) {
                this.webContents.session.clearStorageData(options, () => {
                    this.logger.info('[MainWindow] storage cleared.');
                    event.sender.send('clear-storage-success');
                });
            }
            else {
                this.logger.info('[MainWindow] storage clear failed - session is null.');
                event.sender.send('clear-storage-failed');
            }
        });
    }
}
exports.MainWindow = MainWindow;
