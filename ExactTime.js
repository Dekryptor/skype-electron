"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const Events_1 = require("./telemetry/Events");
class ExactTime {
    constructor(logger, telemetryLogger) {
        this.delta = 0;
        this.reported = false;
        this.logger = logger;
        this.telemetryLogger = telemetryLogger;
    }
    updateDelta(serverTime) {
        let server = Date.parse(serverTime);
        let localNow = Math.floor(Date.now() / 1000);
        if (server > 0) {
            server = Math.floor(server / 1000);
            let delta = server - localNow;
            if (Math.abs(delta) > ExactTime.SAFE_DELTA) {
                this.logger.info(`[ExactTime] Delta time is ${delta}s.`);
                this.delta = delta;
                this.reportExcessive();
            }
            else {
                this.logger.info('[ExactTime] Delta time is small, reset to 0.');
                this.delta = 0;
            }
        }
        else {
            this.logger.error('[ExactTime] Unable to parse server time, reset delta to 0.');
            this.delta = 0;
        }
    }
    getDelta() {
        return this.delta;
    }
    getNow() {
        let localNow = Math.floor(Date.now() / 1000);
        return localNow + this.delta;
    }
    reportExcessive() {
        if (this.reported) {
            return;
        }
        this.reported = true;
        this.telemetryLogger.log(new Events_1.TimeSyncEvent(this.getDelta()));
    }
}
ExactTime.SAFE_DELTA = 180;
exports.ExactTime = ExactTime;
function getInstance() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/ExactTime').exactTime;
    }
    else {
        return null;
    }
}
exports.getInstance = getInstance;
exports.exactTime = getInstance();
function init(logger, telemetryLogger) {
    exports.exactTime = new ExactTime(logger, telemetryLogger);
}
exports.init = init;
