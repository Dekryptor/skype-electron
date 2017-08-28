"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const querystring = require("querystring");
const electron = require("electron");
const WindowsAutoUpdater_1 = require("./WindowsAutoUpdater");
const LinuxAutoUpdater_1 = require("./LinuxAutoUpdater");
const PackageInfo_1 = require("../configuration/PackageInfo");
const utils = require("../Utils");
const UpdateEventType_1 = require("./UpdateEventType");
const FallbackLogger_1 = require("./fallback_dependencies/FallbackLogger");
const CachedPublisher_1 = require("../CachedPublisher");
class Updater extends CachedPublisher_1.CachedPublisher {
    constructor(logger, ecsConfig, appConfig, clientVersion, persistence, downloader) {
        super();
        this.autoUpdater = null;
        this.updateInterval = 0;
        this.isCheckingOrDownloadingUpdates = false;
        this.explicitCheck = true;
        this.updateInitiated = false;
        if (logger) {
            this.logger = logger;
        }
        else {
            this.logger = new FallbackLogger_1.FallbackLogger();
            this.logger.info('[Updater] initialized with fallback logger.');
        }
        if (ecsConfig) {
            this.logger.info('[Updater] initialized with an ECS config provider.');
            this.ecsConfig = ecsConfig;
        }
        this.appConfig = appConfig;
        if (persistence) {
            this.persistence = persistence;
        }
        else {
            this.persistence = new Map();
            this.logger.info('[Updater] initialized with fallback persistence.');
        }
        this.clientVersion = clientVersion;
        this.downloader = downloader;
        if (utils.isMac()) {
            this.autoUpdater = electron.remote ? electron.remote.autoUpdater : electron.autoUpdater;
        }
        else if (utils.isWindows()) {
            this.autoUpdater = new WindowsAutoUpdater_1.WindowsAutoUpdater(this.logger, appConfig, this.persistence, this.clientVersion, this.downloader);
        }
        else {
            this.autoUpdater = new LinuxAutoUpdater_1.LinuxAutoUpdater(this.logger, this.ecsConfig, this.clientVersion);
        }
        this.registerAutoUpdaterEvents();
        this.registerEcsUpdate();
        this.logger.info('[Updater] initialized.');
    }
    start() {
        this.logger.info('[Updater] start() called.');
        if (this.updatesEnabled()) {
            let config;
            if (this.ecsConfig) {
                config = this.ecsConfig.getData();
            }
            this.updateInterval = config && config.updateInterval ? config.updateInterval : Updater.DEFAULT_UPDATE_INTERVAL;
            this.logger.info('[Updater] Update interval set to', this.updateInterval);
            this.logger.info('[Updater] Starting unexplicit update check as the updater was started.');
            this.checkForUpdates(false);
            this.startPeriodicChecks();
        }
        else {
            this.logger.info('[Updater] Updates disabled.');
        }
    }
    checkForUpdates(explicit = true) {
        if (!this.updatesEnabled()) {
            return;
        }
        this.explicitCheck = explicit;
        this.logger.info(`[Updater] Checking for updates, explicit check: ${explicit}`);
        if (this.isCheckingOrDownloadingUpdates) {
            this.logger.info('[Updater] Checking for updates already in progress');
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.CheckingForUpdates, this.explicitCheck);
            return;
        }
        let feedUrl = this.getUpdateFeedUrl();
        if (!feedUrl && !utils.isLinux()) {
            return;
        }
        this.setSemaphore();
        this.logger.info('[Updater] Setting update feed url to: ' + feedUrl);
        this.autoUpdater.setFeedURL(feedUrl);
        this.autoUpdater.checkForUpdates();
    }
    updatesEnabled() {
        return this.appConfig.enableUpdates;
    }
    quitAndInstall() {
        if (this.updateInitiated) {
            return;
        }
        this.updateInitiated = true;
        this.logger.info('[Updater] got quit and install command');
        this.emitEvent(Updater.INSTALL_UPDATE);
    }
    installUpdate() {
        if (utils.isLinux()) {
            return;
        }
        this.logger.info('[Updater] Actually running the update installation');
        this.autoUpdater.quitAndInstall();
    }
    installWindowsMandatoryUpdatesIfPresent() {
        if (utils.isWindows() && this.appConfig.enableUpdates) {
            return this.autoUpdater.installMandatoryUpdatesIfPresent();
        }
        return false;
    }
    getUpdateFeedUrl() {
        let config;
        if (this.ecsConfig) {
            config = this.ecsConfig.getData();
        }
        let updaterFeedUrl;
        if (config) {
            updaterFeedUrl = config.platformUpdaterFeedUrl;
        }
        if (!updaterFeedUrl) {
            this.logger.info('[Updater] Platform updater feed URL not set.');
            let fallbackUrl = this.appConfig.fallbackUpdaterFeedUrl;
            if (fallbackUrl) {
                updaterFeedUrl = fallbackUrl;
            }
            else {
                this.logger.info('[Updater] Fallback platform updater feed URL not set. Breaking a check for updates');
                return undefined;
            }
        }
        return updaterFeedUrl + '?' + this.getQueryString();
    }
    registerAutoUpdaterEvents() {
        if (!this.autoUpdater) {
            return;
        }
        this.autoUpdater.on('checking-for-update', () => {
            this.logger.info('[Updater] Checking for update.');
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.CheckingForUpdates, this.explicitCheck);
        });
        this.autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
            const updateDetails = {
                releaseName,
                releaseNotes,
                releaseDate,
                updateURL
            };
            this.logger.info('[Updater] Update downloaded.', updateDetails);
            this.resetSemaphore();
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.UpdateDownloaded, this.explicitCheck, updateDetails);
        });
        this.autoUpdater.on('update-available', () => {
            this.logger.info('[Updater] Update available.');
            this.setSemaphore(3 * 60 * 1000);
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.UpdateAvailable, this.explicitCheck);
        });
        this.autoUpdater.on('update-not-available', () => {
            this.logger.info('[Updater] Update not found.');
            this.resetSemaphore();
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.NoUpdateAvailable, this.explicitCheck);
        });
        this.autoUpdater.on('error', (error) => {
            this.logger.info('[Updater] There was an error when updating: ' +
                (error !== undefined && error.message !== undefined ? error.message : error));
            this.resetSemaphore();
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.Error, this.explicitCheck);
        });
    }
    registerEcsUpdate() {
        if (this.ecsConfig && this.autoUpdater) {
            this.ecsConfig.on('ecs-data-ready', () => {
                this.handleEcsUpdate();
            });
            this.ecsConfig.on('ecs-data-changed', () => {
                this.handleEcsUpdate();
            });
        }
    }
    handleEcsUpdate() {
        if (!this.updatesEnabled()) {
            return;
        }
        let config = this.ecsConfig.getData();
        let updateInterval = config && config.updateInterval ? config.updateInterval : Updater.DEFAULT_UPDATE_INTERVAL;
        if (this.updateInterval !== updateInterval) {
            this.updateInterval = updateInterval;
            this.logger.info(`[Updater] Update interval set to ${this.updateInterval}, rescheduling update checks`);
            if (this.updateTimer) {
                clearInterval(this.updateTimer);
                this.updateTimer = undefined;
                this.startPeriodicChecks();
            }
        }
    }
    startPeriodicChecks() {
        if (!this.updateTimer) {
            this.logger.debug(`[Updater] Calling startPeriodicChecks with interval ${this.updateInterval}`);
            let callback = () => { this.checkForUpdates(false); };
            this.updateTimer = setInterval(callback, this.updateInterval);
        }
    }
    setSemaphore(timeout = 30 * 1000) {
        this.isCheckingOrDownloadingUpdates = true;
        if (this.checkingForUpdatesTimeout) {
            clearTimeout(this.checkingForUpdatesTimeout);
        }
        this.checkingForUpdatesTimeout = setTimeout(() => { this.resetSemaphore(); }, timeout);
    }
    resetSemaphore() {
        this.isCheckingOrDownloadingUpdates = false;
        if (this.checkingForUpdatesTimeout) {
            clearTimeout(this.checkingForUpdatesTimeout);
            this.checkingForUpdatesTimeout = null;
        }
    }
    getQueryString() {
        return querystring.stringify({
            'version': this.clientVersion,
            'os': utils.getPlatformShortCode(),
            'ring': PackageInfo_1.readPackageJson().getData().buildChannel,
            'app': PackageInfo_1.readPackageJson().getData().app,
            't': Date.now()
        });
    }
}
Updater.DEFAULT_UPDATE_INTERVAL = 4 * 60 * 60 * 1000;
Updater.UPDATE_RESULT = 'update-result';
Updater.INSTALL_UPDATE = 'install-update';
exports.Updater = Updater;
let updater = null;
exports.default = updater;
function init(logger, ecsConfig, appConfig, clientVersion, persistence, downloader) {
    updater = new Updater(logger, ecsConfig, appConfig, clientVersion.getVersion(), persistence, downloader);
}
exports.init = init;
