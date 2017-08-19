"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const events_1 = require("events");
const utils = require("./Utils");
const Settings_1 = require("./Settings");
const registerSkypeUriKey = 'app.registerSkypeUri';
class SkypeUri extends events_1.EventEmitter {
    constructor(logger) {
        super();
        this.lastCommand = null;
        this.logger = logger;
    }
    newInstallation() {
        if (!Settings_1.settings.has(registerSkypeUriKey)) {
            this.setRegistered(true);
            return true;
        }
        return false;
    }
    isRegistered() {
        return Settings_1.settings.get(registerSkypeUriKey, false);
    }
    setRegistered(enabled) {
        Settings_1.settings.set(registerSkypeUriKey, enabled);
        if (enabled) {
            this.registerProtocol();
        }
        else {
            this.unregisterProtocol();
        }
    }
    ensureRegistered() {
        this.setRegistered(this.isRegistered());
    }
    handleArgs(rawArgs) {
        if (rawArgs.length < 1) {
            return;
        }
        let skypeUri = this.findUri(rawArgs);
        if (!skypeUri) {
            this.logger.info('[SkypeUri] No Skype URI found in args');
            return;
        }
        this.logger.info(`[SkypeUri] Handle Skype URI ${skypeUri}`);
        this.lastCommand = skypeUri;
        this.emitSkypeUriAvailable();
    }
    getUri() {
        let uri = this.lastCommand;
        this.lastCommand = null;
        return uri;
    }
    registerProtocol() {
        if (utils.isLinux()) {
            return;
        }
        if (!electron_1.app.isDefaultProtocolClient(SkypeUri.SKYPE_PROTOCOL)) {
            if (electron_1.app.setAsDefaultProtocolClient(SkypeUri.SKYPE_PROTOCOL)) {
                this.logger.info(`[SkypeUri] Successfully registered as client for ${SkypeUri.SKYPE_PROTOCOL} protocol`);
            }
            else {
                this.logger.info(`[SkypeUri] Failed registering as client for ${SkypeUri.SKYPE_PROTOCOL} protocol`);
            }
        }
    }
    unregisterProtocol() {
        if (utils.isLinux()) {
            return;
        }
        if (electron_1.app.isDefaultProtocolClient(SkypeUri.SKYPE_PROTOCOL)) {
            if (electron_1.app.removeAsDefaultProtocolClient(SkypeUri.SKYPE_PROTOCOL)) {
                this.logger.info(`[SkypeUri] Successfully unregistered as client for ${SkypeUri.SKYPE_PROTOCOL} protocol`);
            }
            else {
                this.logger.info(`[SkypeUri] Failed unregistering as client for ${SkypeUri.SKYPE_PROTOCOL} protocol`);
            }
        }
        else {
            this.logger.info(`[SkypeUri] No need to unregister as client for ${SkypeUri.SKYPE_PROTOCOL} protocol - not registered`);
        }
    }
    findUri(rawArgs) {
        let match = null;
        for (let i = 0; i < rawArgs.length; i++) {
            let item = rawArgs[i];
            if (item.startsWith(`${SkypeUri.SKYPE_PROTOCOL}:`)) {
                match = item;
                break;
            }
        }
        return match;
    }
    emitSkypeUriAvailable() {
        this.emit('skype-uri-available');
    }
}
SkypeUri.SKYPE_PROTOCOL = 'skype';
exports.SkypeUri = SkypeUri;
