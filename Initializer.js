"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const logger = require("./logger/Logger");
const clientVersion = require("./ClientVersion");
const DeviceInfo_1 = require("./DeviceInfo");
const GlobalExceptionHandler_1 = require("./GlobalExceptionHandler");
const Events_1 = require("./telemetry/Events");
const telemetryLogger = require("./telemetry/TelemetryLoggerInit");
const exactTime = require("./ExactTime");
const ecsConfig = require("./ecs/EcsConfigInit");
const language = require("./localisation/LanguageInit");
const Settings_1 = require("./Settings");
const authStore = require("./login/AuthStore");
const keychainStore = require("./login/KeychainStore");
const downloader = require("./Downloader");
const downloadManager = require("./DownloadManager");
function initializeUpdaterDependencies(appConfig) {
    Settings_1.settings.init();
    logger.init(appConfig);
    logger.getInstance().init();
    DeviceInfo_1.deviceInfo.init(logger.getInstance());
    clientVersion.init();
    authStore.init();
    keychainStore.init(logger.getInstance());
    telemetryLogger.init(appConfig, clientVersion.getInstance(), DeviceInfo_1.deviceInfo, language.language);
    exactTime.init(logger.getInstance(), telemetryLogger.telemetryLogger);
    downloader.init(logger.getInstance());
    downloadManager.init(downloader.getInstance());
    ecsConfig.init(appConfig.ecsHost, logger.getInstance(), clientVersion.getInstance(), DeviceInfo_1.deviceInfo, exactTime.exactTime);
}
exports.initializeUpdaterDependencies = initializeUpdaterDependencies;
function run(appConfig) {
    ecsConfig.getInstance().on('ecs-data-ready', () => {
        telemetryLogger.telemetryLogger.setEcsConfig(ecsConfig.getInstance());
    });
    GlobalExceptionHandler_1.GlobalExceptionHandler.install(telemetryLogger.telemetryLogger);
    logger.getInstance().info(getInitialLogMessage());
    telemetryLogger.telemetryLogger.log(new Events_1.StartupEvent());
}
exports.run = run;
function getInitialLogMessage() {
    let systemMessage = `Skype logging system information:${os.EOL}`;
    systemMessage += `============================================================${os.EOL}`
        + `  Version ${clientVersion.getInstance().getFullVersion()}${os.EOL}`
        + `  Operating System: ${os.type()}, ${os.platform()} ${os.release()}${os.EOL}`
        + `  Architecture: ${os.arch()}${os.EOL}`
        + `  Total Memory: ${os.totalmem() / 1024 / 1024} MB${os.EOL}`
        + `  Free Memory: ${os.freemem() / 1024 / 1024} MB${os.EOL}`
        + `  Load average: ${os.loadavg()}${os.EOL}`
        + `  Device Id: ${DeviceInfo_1.deviceInfo.getId()}${os.EOL}`
        + `  CPU Topology: ${JSON.stringify(os.cpus())}${os.EOL}`
        + `============================================================${os.EOL}`;
    return systemMessage;
}
