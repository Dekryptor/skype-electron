"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const Configuration_1 = require("./configuration/Configuration");
const version = require("slimcore/lib/version");
const AppDataDir_1 = require("./AppDataDir");
AppDataDir_1.setAppDataPath(Configuration_1.default.appDataDir);
const MainIpcEventHandlers_1 = require("./MainIpcEventHandlers");
const CrashReporting_1 = require("./CrashReporting");
const ApplicationFactory_1 = require("./ApplicationFactory");
CrashReporting_1.initializeCrashReporter();
let application;
try {
    application = ApplicationFactory_1.init(Configuration_1.default);
}
catch (e) {
    console.log('Problem initializing the app', e);
}
if (application) {
    const extension = { win32: 'dll', darwin: 'dylib' }[process.platform];
    if (extension) {
        const rendererPath = require.resolve('slimcore/bin/VideoRenderer.' + extension).replace('app.asar', 'app.asar.unpacked');
        electron_1.app.commandLine.appendSwitch('register-pepper-plugins', rendererPath + ';' + version.RendererMimeType);
    }
    electron_1.app.on('ready', () => {
        application.start();
        MainIpcEventHandlers_1.default();
    });
}
