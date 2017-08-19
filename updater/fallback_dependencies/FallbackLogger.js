"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class FallbackLogger extends events_1.EventEmitter {
    isLoggingEnabled() {
        return true;
    }
    isConsoleLoggingEnabled() {
        return true;
    }
    setLoggingEnabled(enabled) {
        return;
    }
    init() {
        return;
    }
    startLogging() {
        return;
    }
    stopLogging() {
        return;
    }
    end() {
        return;
    }
    info(message, object) {
        console.info(message, object);
    }
    warn(message, object) {
        console.warn(message, object);
    }
    debug(message, object) {
        console.debug(message, object);
    }
    error(message, object) {
        console.error(message, object);
    }
    log(level, appName, ...args) {
        this.info(appName, args);
    }
}
exports.FallbackLogger = FallbackLogger;
