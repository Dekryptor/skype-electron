"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aria_1 = require("../vendor/aria/aria");
const Events_1 = require("./Events");
const LinuxDistro_1 = require("./LinuxDistro");
class TelemetryLoggerImpl {
    constructor(configuration, clientVersion, deviceInfo, language) {
        this.linuxDistro = LinuxDistro_1.getPrettyName();
        this.configuration = configuration;
        if (!aria_1.LogManager.isInitialized()) {
            aria_1.LogManager.initialize(configuration.tenantToken);
        }
        this.clientVersion = clientVersion;
        this.deviceInfo = deviceInfo;
        this.language = language;
        this.logger = new aria_1.Logger(configuration.tenantToken);
    }
    setUserId(userId) {
        this.userId = userId;
    }
    setEcsConfig(ecsConfig) {
        this.ecsConfig = ecsConfig;
    }
    log(properties) {
        if (this.userId) {
            properties.setProperty('Skype_InitiatingUser_Username', this.userId, Events_1.PIIKind.Identity);
        }
        if (this.ecsConfig && this.ecsConfig.hasData()) {
            const { etag } = this.ecsConfig.getData();
            properties.setProperty('ETag', etag);
        }
        properties.setProperty('Client_Name', this.configuration.appShortName);
        properties.setProperty('AppInfo.AppName', this.configuration.appShortName);
        properties.setProperty('Platform_Uiversion', this.clientVersion.getFullVersion());
        properties.setProperty('Platform_Id', this.clientVersion.getPlatform());
        properties.setProperty('AppInfo.Version', this.clientVersion.getVersion());
        properties.setProperty('DeviceInfo.Id', this.deviceInfo.getId());
        properties.setProperty('DeviceInfo.Locale', this.language.getDetectedSystemLocale());
        properties.setProperty('AppInfo.Language', this.language.getLanguage());
        properties.setProperty('UserInfo.Language', this.language.getLanguage());
        properties.setProperty('UserInfo.Locale', this.language.getLocale());
        if (this.linuxDistro !== null) {
            properties.setProperty('DeviceInfo.LinuxDistro', this.linuxDistro);
        }
        this.logger.logEvent(properties);
    }
}
exports.TelemetryLoggerImpl = TelemetryLoggerImpl;
