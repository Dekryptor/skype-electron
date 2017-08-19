"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const electron = require("electron");
const DEVICEID_LENGTH = 32;
class DeviceInfo {
    constructor(fileName) {
        this.initialized = false;
        this.filePath = path.join(electron.app.getPath('userData'), fileName);
    }
    init(logger) {
        let stats = null;
        try {
            stats = fs.lstatSync(this.filePath);
        }
        catch (err) {
        }
        if (stats !== null && stats.isFile()) {
            try {
                let json = fs.readFileSync(this.filePath, 'utf8');
                this.info = JSON.parse(json);
                logger.info(`[DeviceInfo] Loaded deviceId: ${this.info.deviceId}.`);
            }
            catch (err) {
                logger.error(`[DeviceInfo] Failed reading ${this.filePath}.`, err.message);
                this.info = null;
            }
        }
        else {
            const deviceId = crypto.randomBytes(DEVICEID_LENGTH / 2).toString('hex');
            logger.info(`[DeviceInfo] Generated new deviceId: ${deviceId}.`);
            this.info = { deviceId };
            const infoString = JSON.stringify(this.info);
            try {
                fs.writeFileSync(this.filePath, infoString);
            }
            catch (err) {
                logger.error(`[DeviceInfo] Failed writing device info to ${this.filePath}.`, err.message);
                this.info = null;
            }
        }
        this.initialized = true;
    }
    getId() {
        if (!this.initialized) {
            throw new Error('DeviceInfo instance not initialized. Did you forget to call init?');
        }
        if (!this.info) {
            return null;
        }
        return this.info.deviceId;
    }
}
exports.DeviceInfo = DeviceInfo;
function buildDeviceInfo() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/DeviceInfo').deviceInfo;
    }
    else {
        return new DeviceInfo('device-info.json');
    }
}
exports.deviceInfo = buildDeviceInfo();
