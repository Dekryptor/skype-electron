"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const events_1 = require("events");
const fs = require("fs");
const path = require("path");
const constants = require("../Constants");
const PackageInfo_1 = require("../configuration/PackageInfo");
const HttpsRequest_1 = require("../HttpsRequest");
class EcsConfig extends events_1.EventEmitter {
    constructor(ecsHost, logger, clientVersion, deviceInfo, exactTime) {
        super();
        this.ecsCacheFile = path.join(electron_1.app.getPath('userData'), 'ecscache.json');
        this.ecsPath = constants.ecsPath;
        this.ecsData = null;
        this.firstRun = true;
        this.retryCountLimit = 3;
        this.retryCount = 0;
        this.hostUrlIndex = 0;
        this.refreshTimer = null;
        this.retryTimer = null;
        this.ecsHost = ecsHost.split(',');
        this.logger = logger;
        this.clientVersion = clientVersion;
        this.deviceInfo = deviceInfo;
        this.exactTime = exactTime;
    }
    start() {
        this.refreshEcsConfig();
    }
    getData() {
        return this.ecsData;
    }
    hasData() {
        return (this.ecsData !== null);
    }
    stopTimers() {
        clearTimeout(this.refreshTimer);
        clearTimeout(this.retryTimer);
    }
    refreshEcsConfig() {
        this.stopTimers();
        this.firstRun = !this.hasData();
        this.getEcsConfig()
            .then(data => {
            if (data !== null) {
                this.ecsData = data;
                this.cacheDataToFile();
                this.emit('ecs-data-changed');
            }
            else {
                this.emit('ecs-data-unchanged');
            }
            this.retryCount = 0;
            if (this.firstRun) {
                this.emit('ecs-data-ready');
            }
            this.refreshTimer = setTimeout(() => {
                this.emit('ecs-data-refresh');
                this.refreshEcsConfig();
            }, EcsConfig.refreshInterval);
        })
            .catch(message => {
            if (this.retryCount >= this.retryCountLimit) {
                let logMessage = `[EcsConfig] ${message} (Retry Count Limit Exceeded: ${this.retryCount++})`;
                if (!this.hasData()) {
                    this.loadCachedDataFromFile();
                    if (this.hasData() && this.firstRun) {
                        this.logger.warn(logMessage);
                        this.logger.warn('[EcsConfig] ECS config loaded from cache file');
                        this.emit('ecs-data-ready');
                    }
                    else {
                        this.logger.error(logMessage);
                        this.emit('ecs-data-error');
                    }
                }
                else {
                    this.logger.warn(logMessage);
                    this.emit('ecs-data-fail');
                }
            }
            else {
                this.logger.warn(`[EcsConfig] ${message} (Retry Count: ${this.retryCount++})`);
                this.retryTimer = setTimeout(() => {
                    this.emit('ecs-data-retry');
                    this.refreshEcsConfig();
                }, EcsConfig.retryFailedIn);
            }
        });
    }
    cacheDataToFile() {
        try {
            let cache = {
                version: this.clientVersion.getVersion(),
                data: this.ecsData
            };
            let json = JSON.stringify(cache);
            fs.writeFileSync(this.ecsCacheFile, json);
        }
        catch (error) {
            this.logger.warn(`[EcsConfig] Error writing ecs cache: ${error.message}`);
        }
    }
    loadCachedDataFromFile() {
        let stats = null;
        try {
            stats = fs.lstatSync(this.ecsCacheFile);
        }
        catch (error) {
            this.logger.info('[EcsConfig] Ecs cache does not exist.');
            return;
        }
        try {
            if (stats !== null && stats.isFile()) {
                let json = fs.readFileSync(this.ecsCacheFile, 'utf8');
                let dataObject = JSON.parse(json);
                if (dataObject.version === this.clientVersion.getVersion()) {
                    this.ecsData = dataObject.data;
                }
                else {
                    fs.unlinkSync(this.ecsCacheFile);
                }
            }
        }
        catch (error) {
            this.logger.warn(`[EcsConfig] Error reading settings: ${error.message}`);
        }
    }
    getEcsConfig() {
        this.logger.info('[EcsConfig] Downloading ECS Config');
        let ecsHost = this.ecsHost[this.hostUrlIndex++ % this.ecsHost.length].trim();
        let path = this.ecsPath
            .replace('#CONFIG_OPTION#', PackageInfo_1.readPackageJson().getData().buildChannel)
            .replace('#PLATFORM#', this.clientVersion.getPlatform())
            .replace('#VERSION#', this.clientVersion.getVersion())
            .replace('#CLIENT_ID#', this.deviceInfo.getId());
        let ecsUrl = `https://${ecsHost}${path}`;
        let ecsHeaders = {
            'Accept': 'application/json;ver=1.0',
            'Content-Type': 'application/json'
        };
        if (this.ecsData !== null) {
            ecsHeaders['If-None-Match'] = this.ecsData.etag;
        }
        let ecsPromise = new Promise((resolve, reject) => {
            let ecsRequest = new HttpsRequest_1.HttpsRequest({
                method: 'GET',
                url: ecsUrl,
                headers: ecsHeaders,
                retryCountLimit: 1
            }, this.logger);
            ecsRequest.send().then(res => {
                if (res.headers['date']) {
                    this.exactTime.updateDelta(res.headers['date']);
                }
                if (res.statusCode === 200) {
                    this.logger.info('[EcsConfig] ECS Config successfully downloaded.');
                    let result = JSON.parse(res.body);
                    let appOverride = (result.SkypeElectronWrapper.app
                        && result.SkypeElectronWrapper.override
                        && result.SkypeElectronWrapper.override[result.SkypeElectronWrapper.app])
                        ? JSON.parse(JSON.stringify(result.SkypeElectronWrapper.override[result.SkypeElectronWrapper.app]))
                        : {};
                    resolve({
                        etag: result.Headers.ETag,
                        expires: new Date(result.Headers.Expires),
                        name: result.SkypeElectronWrapper.name,
                        app: result.SkypeElectronWrapper.app,
                        config: result.SkypeElectronWrapper.config,
                        appDisabled: result.SkypeElectronWrapper.appDisabled || false,
                        cspDisabled: result.SkypeElectronWrapper.cspDisabled || false,
                        skypetokenScopes: (result.SkypeElectronWrapper.auth && result.SkypeElectronWrapper.auth.skypetokenScopes)
                            ? result.SkypeElectronWrapper.auth.skypetokenScopes
                            : '',
                        appOverride: appOverride,
                        platformUpdaterFeedUrl: result.SkypeElectronWrapper.platformUpdaterFeedUrl,
                        updateInterval: result.SkypeElectronWrapper.updateInterval
                    });
                }
                else if (res.statusCode === 304) {
                    this.logger.info('[EcsConfig] ECS Config not changed.');
                    resolve(null);
                }
                else {
                    reject(`ECS Config download failed with code: ${res.statusCode}`);
                }
            }).catch((err) => {
                reject(err);
            });
        });
        return ecsPromise;
    }
}
EcsConfig.retryGetIn = constants.ecsRetryGetIn;
EcsConfig.retryFailedIn = constants.ecsRetryFailedIn;
EcsConfig.refreshInterval = constants.ecsRefreshInterval;
exports.EcsConfig = EcsConfig;
