"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const stream_1 = require("stream");
const events_1 = require("events");
const path = require("path");
const constants = require("../Constants");
const Settings_1 = require("../Settings");
const formatter = require("./LogFormatter");
const LogLevel_1 = require("./LogLevel");
const LogTransforms_1 = require("./LogTransforms");
const LogTargets_1 = require("./LogTargets");
const FileLogRetention_1 = require("./FileLogRetention");
const LOGGING_LEVEL_KEY = 'logging.level';
const LOGGING_ENABLED_KEY = 'logging.enabled';
const CONSOLE_LOGGING_KEY = 'logging.console';
class DefaultLogger extends events_1.EventEmitter {
    constructor(configuration, appConfig) {
        super();
        this.isLogging = false;
        this.configuration = configuration;
        this.appConfig = appConfig;
        this.stream = new stream_1.PassThrough();
        if (configuration.transforms) {
            this.stream = configuration.transforms.reduce((transformedStream, transform) => {
                return transformedStream.pipe(transform);
            }, this.stream);
        }
        if (configuration.targets) {
            configuration.targets.forEach(target => {
                this.stream.pipe(target);
            });
        }
    }
    isLoggingEnabled() {
        return !!Settings_1.settings.get(LOGGING_ENABLED_KEY, this.appConfig.log.enableLogging);
    }
    isConsoleLoggingEnabled() {
        return !!Settings_1.settings.get(CONSOLE_LOGGING_KEY, this.appConfig.log.enableLogging);
    }
    setLoggingEnabled(enabled) {
        Settings_1.settings.set(LOGGING_ENABLED_KEY, enabled);
        if (enabled) {
            this.startLogging();
        }
        else {
            this.stopLogging();
        }
        this.emit('logging-enabled-changed');
    }
    init() {
        if (this.isLoggingEnabled()) {
            this.startLogging();
        }
    }
    startLogging() {
        if (this.isLogging) {
            return;
        }
        this.isLogging = true;
    }
    stopLogging() {
        if (!this.isLogging) {
            return;
        }
        this.stream.write(formatter.getClosingLogMessage());
        this.isLogging = false;
    }
    end() {
        let closedTargetCount = 0;
        let alreadyClosed = false;
        let closingTimeoutHandle;
        const targets = this.configuration.targets || [];
        let targetCount = targets.length;
        const handleTargetClose = () => {
            closedTargetCount += 1;
            if (closedTargetCount < targetCount) {
                return;
            }
            if (!alreadyClosed) {
                clearTimeout(closingTimeoutHandle);
                this.emit('close');
            }
        };
        closingTimeoutHandle = setTimeout(() => {
            if (!alreadyClosed) {
                this.emit('close');
            }
        }, constants.logCloseTimeout);
        targets.forEach(target => {
            target.on('finish', handleTargetClose);
            target.end();
        });
    }
    info(message, object) {
        this.write(message, LogLevel_1.LogLevel.INFO, object);
    }
    warn(message, object) {
        this.write(message, LogLevel_1.LogLevel.WARN, object);
    }
    debug(message, object) {
        this.write(message, LogLevel_1.LogLevel.DEBUG, object);
    }
    error(message, object) {
        this.write(message, LogLevel_1.LogLevel.ERROR, object);
    }
    log(level, ...formattedMessage) {
        if (!this.isLogging || this.loggingLevel() < level) {
            return;
        }
        this.stream.write(formattedMessage[0]);
    }
    write(message, level, object) {
        if (!this.isLogging || this.loggingLevel() < level) {
            return;
        }
        this.stream.write(formatter.formatMessage(message, level, object && [object]));
    }
    loggingLevel() {
        return Settings_1.settings.get(LOGGING_LEVEL_KEY, this.appConfig.log.loggingLevel);
    }
}
exports.DefaultLogger = DefaultLogger;
let logger = null;
function getInstance() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/Logger').getInstance();
    }
    else {
        return logger;
    }
}
exports.getInstance = getInstance;
function init(appConfig) {
    let logsPath = path.join(constants.appDataDir, appConfig.log.logsPath);
    const targets = Settings_1.settings.get(CONSOLE_LOGGING_KEY, appConfig.log.consoleLogging) ?
        [new LogTargets_1.FileTarget(logsPath, { maxFileSize: appConfig.log.logFileSize }), new LogTargets_1.STDOutTarget()] :
        [new LogTargets_1.FileTarget(logsPath, { maxFileSize: appConfig.log.logFileSize })];
    logger = new DefaultLogger({
        transforms: [new LogTransforms_1.SkypetokenTransform()],
        targets
    }, appConfig);
    if (appConfig.log.enableLogCleaning) {
        FileLogRetention_1.FileLogRetentionUtility.removeOldLogs(logsPath, appConfig, logger);
    }
}
exports.init = init;
