"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TelemetryLogger_1 = require("./TelemetryLogger");
exports.telemetryLogger = null;
function init(appConfig, clientVersion, deviceInfo, language) {
    exports.telemetryLogger = new TelemetryLogger_1.TelemetryLoggerImpl(appConfig, clientVersion, deviceInfo, language);
}
exports.init = init;
