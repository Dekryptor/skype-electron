"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const SkypeVersionUtility_1 = require("./SkypeVersionUtility");
const UpdateEventType_1 = require("./UpdateEventType");
class LinuxAutoUpdater extends events_1.EventEmitter {
    constructor(logger, ecsConfig, currentVersion) {
        super();
        this.logger = logger;
        this.ecsConfig = ecsConfig;
        this.currentVersion = currentVersion;
    }
    setFeedURL(url) {
    }
    getFeedURL() {
        return '';
    }
    checkForUpdates() {
        if (!this.ecsConfig) {
            return;
        }
        this.emit(UpdateEventType_1.updateEventName.CheckingForUpdates);
        this.logger.info('[LinuxAutoUpdater] Checking for update');
        let ecsData = this.ecsConfig.getData();
        if (ecsData && ecsData.appDisabled) {
            this.logger.info('[LinuxAutoUpdater] Application disabled - report mandatory system update');
            this.emit(UpdateEventType_1.updateEventName.UpdateDownloaded, {}, 'none', 'skypeforlinux mandatory', new Date(), 'none');
        }
        if (ecsData && ecsData.lastVersionAvailable &&
            SkypeVersionUtility_1.SkypeVersionUtility.getHigherOfVersions(this.currentVersion, ecsData.lastVersionAvailable) !== this.currentVersion) {
            this.logger.info(`[LinuxAutoUpdater] Update found: ${ecsData.lastVersionAvailable}`);
            this.emit(UpdateEventType_1.updateEventName.UpdateDownloaded, {}, 'none', 'skypeforlinux', new Date(), 'none');
        }
        else {
            this.logger.info('[LinuxAutoUpdater] Update not found.');
            this.emit(UpdateEventType_1.updateEventName.NoUpdateAvailable);
        }
    }
    quitAndInstall() {
    }
}
exports.LinuxAutoUpdater = LinuxAutoUpdater;
