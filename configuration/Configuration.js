"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("../Utils");
const LogLevel_1 = require("../logger/LogLevel");
const hockeyAppID = Utils_1.pickByPlatform('ff1d9b79f7e24f94a25c219342810116', 'dc41ba3cd30c48e087ae5a14a97d7693', '19caa34de1f34220a3230ebacc111f84');
let configuration = {
    environment: 'preview',
    appShortName: Utils_1.pickByPlatform('skype-preview', 'skype-preview', 'skypeforlinux'),
    appExeName: Utils_1.pickByPlatform('Skype-Preview', 'Skype-Preview', 'skypeforlinux'),
    appDataDir: Utils_1.pickByPlatform('Microsoft/Skype for Desktop', 'Microsoft/Skype for Desktop', 'skypeforlinux'),
    tenantToken: 'a173030604a34bdcbf21ca59134c7430-2a34e3b5-60e1-4a11-ad6d-2e9eac9ac07c-6614',
    enableUpdates: true,
    fallbackUpdaterFeedUrl: 'https://get.skype.com/s4l-update',
    debugMenuIncluded: false,
    debugMenuAddShortcut: true,
    ecsHost: 'a.config.skype.com,b.config.skype.com',
    log: {
        enableLogging: true,
        consoleLogging: false,
        loggingLevel: LogLevel_1.LogLevel.INFO,
        logsPath: '/logs',
        enableLogCleaning: true,
        additionalLogPathsToClean: ['skylib']
    },
    crashReporterUrl: !hockeyAppID ? undefined : `https://rink.hockeyapp.net/api/2/apps/${hockeyAppID}/crashes/upload`
};
exports.default = configuration;
