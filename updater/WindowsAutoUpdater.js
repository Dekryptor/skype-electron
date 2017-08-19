"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const childProcess = require("child_process");
const electron_1 = require("electron");
const path = require("path");
const fs = require("fs");
const HttpsRequest_1 = require("../HttpsRequest");
const SkypeVersionUtility_1 = require("./SkypeVersionUtility");
class WindowsAutoUpdater extends events_1.EventEmitter {
    constructor(logger, appConfig, persistence, currentVersion, downloader) {
        super();
        this.awaitingInstallerVersionKey = 'updates.windows.awaiting-installer-version';
        this.persistence = persistence;
        this.logger = logger;
        this.installerFileName = `${appConfig.appExeName}-Setup.exe`;
        this.currentVersion = currentVersion;
        this.downloader = downloader;
    }
    setFeedURL(url) {
        this.feedUrl = url;
    }
    getFeedURL() {
        return this.feedUrl;
    }
    checkForUpdates() {
        this.emit('checking-for-update');
        this.logger.info('[WindowsAutoUpdater] checking for update');
        let updateRequest = new HttpsRequest_1.HttpsRequest({
            method: 'GET',
            url: this.feedUrl,
            headers: {
                'Accept': 'application/json;ver=1.0',
                'Content-Type': 'application/json'
            },
            retryIn: 3
        }, this.logger);
        updateRequest.send().then(res => {
            if (res.statusCode === 200) {
                let parsedResponse = JSON.parse(res.body);
                let url = parsedResponse.url;
                let versionFound = parsedResponse.name;
                this.logger.info(`[WindowsAutoUpdater] update found: ${JSON.stringify(parsedResponse)}. Version: ${versionFound}`);
                this.emit('update-available');
                if (this.persistence.has(this.awaitingInstallerVersionKey) &&
                    this.persistence.get(this.awaitingInstallerVersionKey) === versionFound) {
                    this.emitUpdateDownloadedWithDetails(parsedResponse);
                }
                else {
                    this.downloadUpdate(url, versionFound, parsedResponse);
                }
            }
            else {
                this.logger.info('[WindowsAutoUpdater] Update not found. Status code: ' + res.statusCode);
                this.emit('update-not-available');
            }
        }).catch((error) => {
            this.logger.error('[WindowsAutoUpdater] error retrieving the updates status: ' + error.message);
            this.emit('error', { message: error.message });
        });
    }
    quitAndInstall() {
        this.logger.info('[WindowsAutoUpdater] got quit and install command.');
        if (!this.persistence.has(this.awaitingInstallerVersionKey)) {
            this.logger.info('[WindowsAutoUpdater] quit and install interrupted - no file entry.');
            return false;
        }
        let updaterLocation = path.join(electron_1.app.getPath('userData'), this.installerFileName);
        try {
            let stats = fs.statSync(updaterLocation);
            if (stats.isFile()) {
                this.runInstaller(updaterLocation);
                return true;
            }
            else {
                this.logger.error('[WindowsAutoUpdater] Cannot install pending update as the file is missing.');
                this.persistence.delete(this.awaitingInstallerVersionKey);
            }
        }
        catch (error) {
            this.logger.error('[WindowsAutoUpdater] Cannot install pending update as the file is missing.');
            this.persistence.delete(this.awaitingInstallerVersionKey);
        }
        return false;
    }
    installMandatoryUpdatesIfPresent() {
        this.logger.info('[WindowsAutoUpdater] A try to install mandatory Updates initiated.');
        if (this.persistence.has(this.awaitingInstallerVersionKey)) {
            let awaitingVersion = SkypeVersionUtility_1.SkypeVersionUtility.extractVersionFromReleaseNameString(this.persistence.get(this.awaitingInstallerVersionKey));
            if (SkypeVersionUtility_1.SkypeVersionUtility.getHigherOfVersions(this.currentVersion, awaitingVersion) === this.currentVersion) {
                this.persistence.delete(this.awaitingInstallerVersionKey);
                this.logger.info('[WindowsAutoUpdater] Currently installed versioned is equal or higher.');
            }
            else {
                this.logger.info('[WindowsAutoUpdater] Persistence has an awaiting higher installer version saved, installing an update.');
                let pending = this.quitAndInstall();
                if (pending) {
                    electron_1.app.quit();
                }
                return pending;
            }
        }
        return false;
    }
    runInstaller(updaterLocation) {
        this.logger.info('[WindowsAutoUpdater] Spawning silent updater process ' + updaterLocation);
        childProcess.spawn(updaterLocation, ['/silent', '!desktopicon'], {
            detached: true
        });
    }
    downloadUpdate(url, version, parsedMetadata) {
        this.logger.info('[WindowsAutoUpdater] starting to download the update from: ' + url);
        this.persistence.delete(this.awaitingInstallerVersionKey);
        this.emit('update-downloading');
        let updateDownloadLocation = path.join(electron_1.app.getPath('userData'), this.installerFileName);
        const updateRequest = this.downloader.getFromUrl(url, updateDownloadLocation);
        updateRequest.on('finished', data => {
            this.logger.info('[WindowsAutoUpdater] update downloaded to: ' + data.body.path);
            this.persistence.set(this.awaitingInstallerVersionKey, version);
            this.emitUpdateDownloadedWithDetails(parsedMetadata);
        });
        updateRequest.on('failed', () => {
            this.logger.info('[WindowsAutoUpdater] error while downloading the update file.');
            this.emit('error');
        });
    }
    emitUpdateDownloadedWithDetails(parsedMetadata) {
        this.emit('update-downloaded', {}, parsedMetadata.notes, parsedMetadata.name, new Date(parsedMetadata.pub_date), parsedMetadata.url);
    }
}
exports.WindowsAutoUpdater = WindowsAutoUpdater;
