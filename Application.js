"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const parseArgs = require("minimist");
const utils = require("./Utils");
const constants = require("./Constants");
const fileInterceptor = require("./security/FileInterceptor");
const windowInterceptor = require("./security/WindowInterceptor");
const cookies = require("./Cookies");
const CredentialsMigration_1 = require("./CredentialsMigration");
const MainWindow_1 = require("./MainWindow");
const SkypeUriInit_1 = require("./SkypeUriInit");
const EcsConfigInit_1 = require("./ecs/EcsConfigInit");
const EcsConfig_1 = require("./ecs/EcsConfig");
const SkypeTray_1 = require("./tray/SkypeTray");
const ApplicationMenu_1 = require("./ApplicationMenu");
const PresenceStatus_1 = require("./PresenceStatus");
const CallMonitorController_1 = require("./CallMonitorController");
const AuthStore_1 = require("./login/AuthStore");
const Updater_1 = require("./updater/Updater");
const UpdateEventType_1 = require("./updater/UpdateEventType");
const ArgFilter_1 = require("./security/ArgFilter");
const LanguageInit = require("./localisation/LanguageInit");
const Localisation_1 = require("./localisation/Localisation");
class Application {
    constructor(configuration, logger, clientVersion, localisation, updater) {
        this.appIcon = null;
        this.mainWindow = null;
        this.skypeUri = null;
        this.isReady = false;
        this.storedArgs = null;
        this.menu = null;
        this.cleanupRunning = false;
        this.installOnQuit = false;
        this.handleApplicationStarted = () => {
            this.logger.info('[Application] App startup sequence ended.');
            if (this.updateDetails) {
                this.mainWindow.webContents.send(UpdateEventType_1.updateEventName.UpdateDownloaded, this.updateDetails);
            }
        };
        if (!configuration) {
            throw new Error('Invalid argument: configuration must not be null!');
        }
        if (!logger) {
            throw new Error('Invalid argument: logger must not be null!');
        }
        if (!clientVersion) {
            throw new Error('Invalid argument: clientVersion must not be null!');
        }
        this.configuration = configuration;
        this.localisation = localisation;
        this.logger = logger;
        this.clientVersion = clientVersion;
        this.updater = updater;
        this.authStore = AuthStore_1.getInstance();
        this.registerUpdateEventHandlers();
        this.registerUrlHandler();
        this.args = parseArgs(process.argv.slice(1));
        logger.info('[Application] Commandline arguments:', this.args);
        this.applyArgumentSecurityFilter();
        windowInterceptor.install();
    }
    start() {
        CredentialsMigration_1.copyOldCredentials();
        LanguageInit.init();
        this.appMenu = new ApplicationMenu_1.ApplicationMenu(this);
        if (electron_1.app.setAppUserModelId) {
            electron_1.app.setAppUserModelId(constants.appUserModelId);
        }
        if (this.args['datapath']) {
            electron_1.app.setPath('userData', this.args['datapath']);
        }
        let shouldQuit = !this.args['secondary'] && electron_1.app.makeSingleInstance((argv) => this.runInFirstInstance(argv));
        if (shouldQuit || this.args['shutdown']) {
            this.quit();
            return;
        }
        this.registerInstallerListener();
        let pendingInstaller = this.updater.installWindowsMandatoryUpdatesIfPresent();
        if (pendingInstaller) {
            return;
        }
        fileInterceptor.install();
        this.updateUserTasks(true);
        this.mainWindow = this.createMainWindow();
        this.updateMenu(this.menu);
        this.appIcon = new SkypeTray_1.SkypeTray(this);
        this.skypeUri = this.registerSkypeUri();
        this.installAppLifecycleHandlers(this.mainWindow);
        this.registerLocaleChangeListener();
        this.registerPowerMonitorHandlers();
        this.mainWindow.loadApplication();
        this.initEcs();
        this.callMonitorController = new CallMonitorController_1.CallMonitorController(this.logger);
        this.isReady = true;
    }
    setMenu(menu) {
        if (!this.menu) {
            this.addMenuListeners();
        }
        this.updateMenu(menu);
    }
    getUpdater() {
        return this.updater;
    }
    quit() {
        this.logger.info(`[Application] Calling app.quit`);
        electron_1.app.quit();
    }
    getMainWindow() {
        return this.mainWindow;
    }
    registerLocaleChangeListener() {
        this.localisation.on(Localisation_1.Localisation.LocaleChangeEvent, (locale) => {
            this.logger.info(`[Application] Locale change event - reinit translated content to ${locale}`);
            this.appIcon.initTrayMenu();
            this.updateUserTasks(false);
            this.updateUserTasks(true);
            this.appMenu.reload();
            this.mainWindow.resetWindowTitle();
        });
    }
    updateMenu(menu) {
        if (utils.isMac()) {
            electron_1.Menu.setApplicationMenu(menu);
        }
        else if (this.mainWindow) {
            this.mainWindow.window.setMenu(menu);
        }
        this.menu = menu;
    }
    registerInstallerListener() {
        this.updater.subscribe(Updater_1.Updater.INSTALL_UPDATE, () => {
            this.installOnQuit = true;
            if (this.mainWindow) {
                this.mainWindow.window.hide();
            }
            this.quit();
        });
    }
    registerSkypeUri() {
        let skypeUri = SkypeUriInit_1.getInstance();
        if (!skypeUri.newInstallation()) {
            skypeUri.ensureRegistered();
        }
        let argsForUri = null;
        if (this.args['_']) {
            argsForUri = this.args['_'];
        }
        if (this.storedArgs) {
            argsForUri = this.storedArgs;
        }
        skypeUri.handleArgs(argsForUri);
        return skypeUri;
    }
    initEcs() {
        EcsConfigInit_1.getInstance().on('ecs-data-ready', () => {
            this.handleEcsSuccess();
        });
        EcsConfigInit_1.getInstance().on('ecs-data-error', () => {
            this.handleEcsError(this.mainWindow);
        });
        EcsConfigInit_1.getInstance().start();
    }
    handleEcsSuccess() {
        let ecsConfigData = EcsConfigInit_1.getInstance().getData();
        this.logger.info('[Application] ECS Config loaded');
        this.logger.debug('[Application] ecsConfigData is ', ecsConfigData);
    }
    handleEcsError(mainWindow) {
        setTimeout(() => {
            EcsConfigInit_1.getInstance().refreshEcsConfig();
        }, EcsConfig_1.EcsConfig.retryGetIn);
    }
    registerUpdateEventHandlers() {
        electron_1.ipcMain.on('update-quit-and-install', () => {
            this.logger.info('[Application] Quit and install update');
            this.updater.quitAndInstall();
        });
        electron_1.ipcMain.on('check-for-updates', () => {
            this.updater.checkForUpdates();
        });
        this.updater.subscribe(Updater_1.Updater.UPDATE_RESULT, (result, explicit, details) => {
            switch (result) {
                case UpdateEventType_1.UpdateEventType.UpdateDownloaded:
                case UpdateEventType_1.UpdateEventType.NoUpdateAvailable:
                case UpdateEventType_1.UpdateEventType.CheckingForUpdates:
                case UpdateEventType_1.UpdateEventType.UpdateAvailable:
                case UpdateEventType_1.UpdateEventType.Error:
                    let eventName = UpdateEventType_1.updateEventName[UpdateEventType_1.UpdateEventType[result]];
                    this.logger.info(`[Application] ${eventName}. Explicit check = ${explicit}`);
                    if (explicit || result === UpdateEventType_1.UpdateEventType.UpdateDownloaded) {
                        this.mainWindow.webContents.send(eventName, details);
                        this.updateDetails = details;
                    }
                    break;
                default:
                    this.logger.info(`[Application] No updates found. Explicit check = ${explicit}`);
                    break;
            }
        });
    }
    registerUrlHandler() {
        electron_1.app.on('open-url', (event, url) => {
            event.preventDefault();
            let urlToArgs = [url];
            if (this.isReady) {
                this.mainWindow.showAndFocus();
                this.skypeUri.handleArgs(urlToArgs);
            }
            else {
                this.storedArgs = urlToArgs;
            }
        });
    }
    registerPowerMonitorHandlers() {
        electron_1.powerMonitor.on('resume', () => {
            this.mainWindow.webContents.send('resume');
        });
        electron_1.powerMonitor.on('suspend', () => {
            this.mainWindow.webContents.send('suspend');
        });
    }
    runInFirstInstance(argv) {
        let argumentList = parseArgs(argv.slice(1));
        if (argumentList['shutdown']) {
            this.quit();
            return;
        }
        if (this.mainWindow) {
            this.mainWindow.showAndFocus();
        }
        this.logger.info('[Application] Attempted to run second instance without secondary parameter');
        this.logger.info('[Application] Commandline arguments:', argumentList);
        if (argumentList['_']) {
            if (this.skypeUri) {
                this.skypeUri.handleArgs(argumentList['_']);
            }
        }
    }
    createMainWindow() {
        let mainWindow = new MainWindow_1.MainWindow(this.configuration, this.logger, this.clientVersion, this.updater, this.localisation);
        mainWindow.window.on('close', (event) => {
            if (!this.cleanupRunning && this.authStore.isAuthenticated()) {
                this.logger.info('[Application] Running cleanup for MainWindow close.');
                this.cleanup(() => {
                    if (mainWindow.window)
                        mainWindow.window.close();
                });
                event.preventDefault();
            }
            else {
                this.logger.info('[Application] MainWindow closing.');
            }
        });
        mainWindow.window.on('closed', () => {
            this.logger.debug('[Application] MainWindow got closed event');
            mainWindow = null;
        });
        mainWindow.webContents.on('did-start-loading', function () {
            cookies.removeMSACookies(mainWindow.webContents.session);
        });
        mainWindow.registerRedirectionHook('file:///', function () {
            mainWindow.loadApplication();
        });
        return mainWindow;
    }
    installAppLifecycleHandlers(mainWindow) {
        if (!mainWindow) {
            throw new Error('Window instance not supplied');
        }
        electron_1.app.on('window-all-closed', () => {
            this.logger.debug('[Application] Quitting as all windows were closed');
            this.quit();
        });
        electron_1.app.on('before-quit', () => {
            if (mainWindow) {
                this.logger.debug('[Application] before-quit sets allowClosing to true');
                mainWindow.allowClosing = true;
            }
        });
        electron_1.app.on('activate', () => {
            if (mainWindow && !mainWindow.window.isVisible()) {
                mainWindow.showAndFocus();
            }
        });
        electron_1.app.on('quit', () => {
            if (this.installOnQuit) {
                this.installOnQuit = false;
                this.updater.installUpdate();
            }
            this.logger.debug('[Application] App on quit stops logging');
            this.logger.stopLogging();
            this.updateUserTasks(false);
        });
        electron_1.ipcMain.on('application-startup-end', this.handleApplicationStarted);
        electron_1.ipcMain.on('authentication-user-change', (event, username) => {
            if (username) {
                this.authStore.setUsername(username);
                this.setPresenceStatus(PresenceStatus_1.PresenceStatus.Online);
                this.logger.info('[Application] User authenticated', username);
            }
            else {
                this.authStore.setUsername();
                this.setPresenceStatus(PresenceStatus_1.PresenceStatus.Offline);
                this.logger.info('[Application] User logged out');
            }
        });
    }
    setPresenceStatus(status) {
        this.appIcon.setStatus(status);
        this.appMenu.setStatus(status);
    }
    applyArgumentSecurityFilter() {
        if (ArgFilter_1.ArgFilter.isUnsecure(process.argv)) {
            process.exit(-1);
        }
    }
    updateUserTasks(isRunning) {
        if (!utils.isWindows()) {
            return;
        }
        let quitTask = {
            title: this.localisation.getString('Menu.QuitSkypeLabel'),
            description: this.localisation.getString('Menu.QuitSkypeLabel'),
            program: process.execPath,
            arguments: '--shutdown',
            iconPath: process.execPath,
            iconIndex: 0
        };
        electron_1.app.setUserTasks(isRunning ? [quitTask] : []);
    }
    addMenuListeners() {
        electron_1.app.on('menu-update', (menu) => {
            this.updateMenu(menu);
        });
        electron_1.app.on('menu-event', (message) => {
            if (!this.mainWindow.window.isFocused()) {
                this.mainWindow.showAndFocus();
            }
            this.mainWindow.webContents.send(message);
        });
    }
    cleanup(done) {
        if (this.mainWindow && this.mainWindow.webContents && !this.cleanupRunning) {
            this.cleanupRunning = true;
            const timer = setTimeout(() => {
                electron_1.ipcMain.removeAllListeners('app-exit-ack');
                this.logger.info('[Application] Cleanup timeout.');
                done();
            }, 5000);
            electron_1.ipcMain.on('app-exit-ack', () => {
                clearTimeout(timer);
                this.logger.info('[Application] Received cleanup ack.');
                done();
            });
            this.mainWindow.webContents.send('app-exit');
        }
    }
}
exports.Application = Application;
