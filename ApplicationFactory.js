"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const initializer = require("./Initializer");
const Logger_1 = require("./logger/Logger");
const ClientVersion_1 = require("./ClientVersion");
const Application_1 = require("./Application");
const LanguageInit_1 = require("./localisation/LanguageInit");
const Settings_1 = require("./Settings");
const Updater_1 = require("./updater/Updater");
const EcsConfigInit_1 = require("./ecs/EcsConfigInit");
const PackageInfo_1 = require("./configuration/PackageInfo");
const UpdateEventType_1 = require("./updater/UpdateEventType");
const Downloader_1 = require("./Downloader");
function init(configuration) {
    let updater = null;
    let logger;
    let clientVersion;
    let downloader;
    let shouldProceedWithStartup = true;
    try {
        initializer.initializeUpdaterDependencies(configuration);
        logger = Logger_1.getInstance();
        clientVersion = ClientVersion_1.getInstance();
        downloader = Downloader_1.getInstance();
        updater = new Updater_1.Updater(logger, EcsConfigInit_1.getInstance(), configuration, clientVersion.getVersion(), Settings_1.settings, downloader);
        updater.start();
        EcsConfigInit_1.getInstance().on('ecs-data-ready', () => {
            updater.checkForUpdates(false);
        });
    }
    catch (e) {
        const packageData = PackageInfo_1.readPackageJson().getData();
        const version = `${packageData.appVersion}.${packageData.cobrand}.${packageData.appBuild}`;
        downloader = Downloader_1.getInstance();
        updater = new Updater_1.Updater(null, null, configuration, version, Settings_1.settings, downloader);
        updater.start();
        updater.installWindowsMandatoryUpdatesIfPresent();
        updater.subscribe(Updater_1.Updater.UPDATE_RESULT, (result) => {
            if (result === UpdateEventType_1.UpdateEventType.UpdateDownloaded) {
                updater.quitAndInstall();
            }
        });
        shouldProceedWithStartup = false;
    }
    if (shouldProceedWithStartup) {
        initializer.run(configuration);
        return new Application_1.Application(configuration, logger, clientVersion, LanguageInit_1.language, updater);
    }
    else {
        throw new Error('Application failed to initialize, updater was started.');
    }
}
exports.init = init;
