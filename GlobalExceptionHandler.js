"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Events_1 = require("./telemetry/Events");
const Logger_1 = require("./logger/Logger");
class GlobalExceptionHandler {
    static install(telemetryLogger) {
        process.on('uncaughtException', (err) => {
            try {
                telemetryLogger.log(new Events_1.UncaughtExceptionEvent(err));
            }
            catch (e) {
                Logger_1.getInstance().error('Telemetry for uncaughtException failed: ' + e.message || e.toString());
            }
            Logger_1.getInstance().error('Exception caught from process: ' + err.message + ', Stack: ' + err.stack + ' ' + err.toString());
        });
    }
}
exports.GlobalExceptionHandler = GlobalExceptionHandler;
