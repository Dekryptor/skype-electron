"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const domUtils = require("./DomUtils");
const Settings_1 = require("./Settings");
const LanguageInit_1 = require("./localisation/LanguageInit");
const Logger_1 = require("./logger/Logger");
const logger = Logger_1.getInstance();
const LogLevel_1 = require("./logger/LogLevel");
const LogFormatter_1 = require("./logger/LogFormatter");
const electron_1 = require("electron");
const zoomLevelKey = 'main-window.zoom-level';
const TIME_OF_DAY_REGEX = new RegExp('^[0-9]+:[0-9]+:[0-9]+:[0-9]+$');
const ZOOM_LEVEL_MAX = 10000;
const ZOOM_LEVEL_MIN = -1 * ZOOM_LEVEL_MAX;
function init(allowedLinkDomains = ['', 'login.skype.com', 'login.live.com', 'signup.live.com']) {
    logger.info('[PreLoad] Loading: ' + location.href);
    domUtils.disableDragAndDrop();
    electron_1.webFrame.setVisualZoomLevelLimits(1, 1);
    makeZoomable();
    if (allowedLinkDomains.indexOf(location.hostname) < 0) {
        logger.debug('[PreLoad] External page, make links open in a browser');
        domUtils.forceLinksToDefaultBrowser();
    }
    else if (location.hostname === '') {
        tlsFix();
        overrideWindowFocus();
        overrideLogger();
        overrideWindowOpener();
    }
}
exports.init = init;
function setZoomLevel(level) {
    electron_1.webFrame.setLayoutZoomLevelLimits(ZOOM_LEVEL_MIN, ZOOM_LEVEL_MAX);
    electron_1.webFrame.setZoomLevel(level);
    const actualZoomLevel = electron_1.webFrame.getZoomLevel();
    electron_1.webFrame.setLayoutZoomLevelLimits(actualZoomLevel, actualZoomLevel);
    Settings_1.settings.set(zoomLevelKey, actualZoomLevel);
}
function makeZoomable() {
    electron_1.ipcRenderer.on('zoom-reset', function () {
        setZoomLevel(0);
    });
    electron_1.ipcRenderer.on('zoom-in', function () {
        setZoomLevel(electron_1.webFrame.getZoomLevel() + 1);
    });
    electron_1.ipcRenderer.on('zoom-out', function () {
        setZoomLevel(electron_1.webFrame.getZoomLevel() - 1);
    });
    setZoomLevel(Settings_1.settings.get(zoomLevelKey, 0));
}
function tlsFix() {
    let immediate = setImmediate;
    process.once('loaded', function () {
        global.setImmediate = immediate;
    });
}
function overrideWindowFocus() {
    window.focus = function () {
        electron_1.ipcRenderer.send('window-focus-called');
    };
}
function overrideWindowOpener() {
    let linkOpener = electron_1.remote.shell.openExternal;
    window.open = function (url) {
        if (url) {
            linkOpener(url);
            return;
        }
        function setter(propertyName) {
            return function (object, property, value) {
                if (property === propertyName && value) {
                    linkOpener(value);
                }
                object[property] = value;
                return true;
            };
        }
        let proxyHandler = {
            get: function (object, property) {
                if (property === 'location') {
                    return new Proxy({}, { set: setter('href') });
                }
                return object[property];
            },
            set: setter('location')
        };
        return new Proxy({}, proxyHandler);
    };
}
function overrideLogger() {
    if (!logger.isLoggingEnabled()) {
        return;
    }
    const consoleLogging = logger.isConsoleLoggingEnabled();
    ['error', 'warn', 'info', 'log'].forEach(function (method) {
        let original = console[method];
        let level = (method === 'log') ? LogLevel_1.LogLevel.INFO : LogLevel_1.LogLevel[method.toUpperCase()];
        console[method] = function () {
            if (consoleLogging) {
                original.apply(console, arguments);
            }
            let message = '[app]';
            let args = (arguments && arguments.length > 0) ? Array.prototype.slice.call(arguments) : undefined;
            if (args && typeof args[0] === 'string' && args[0].match(TIME_OF_DAY_REGEX)) {
                message += `[${args[1]}]`;
                args = args.slice(2);
            }
            message = LogFormatter_1.formatMessage(message, level, args);
            logger.log.bind(logger, level).apply(logger, [message]);
        };
    });
}
function exposeLocalisationModule() {
    window['localisation'] = LanguageInit_1.language;
    window['domLocaliser'] = LanguageInit_1.domLocaliser;
}
