"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const keytar = require("keytar");
class KeychainStore {
    constructor(logger) {
        this.logger = logger;
    }
    getPassword(service, account) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`[KeychainStore] Getting stored credentials from keytar, service: ${service}.`);
            let result = null;
            try {
                result = yield keytar.getPassword(service, account);
                if (result === null) {
                    this.logger.info('[KeychainStore] No stored credentials fetched from keytar.');
                }
            }
            catch (error) {
                this.logger.error('[KeychainStore] Getting stored credentials failed. Error: ', error);
            }
            return result;
        });
    }
    setPassword(service, account, password) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`[KeychainStore] Storing credentials, service: ${service}.`);
            try {
                yield keytar.setPassword(service, account, password);
                this.logger.info('[KeychainStore] Credentials stored.');
            }
            catch (error) {
                this.logger.error('[KeychainStore] Storing credentials failed. Error: ', error);
            }
        });
    }
    deletePassword(service, account) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`[KeychainStore] Deleting credentials, service: ${service}.`);
            let result = false;
            try {
                result = yield keytar.deletePassword(service, account);
                this.logger.info(`[KeychainStore] Deleting stored credentials. Success: ${result}.`);
            }
            catch (error) {
                this.logger.error('[KeychainStore] Deleting credentials failed. Error: ', error);
            }
            return result;
        });
    }
}
exports.KeychainStore = KeychainStore;
let instance;
function getInstance() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/KeychainStore').getInstance();
    }
    return instance;
}
exports.getInstance = getInstance;
function init(logger) {
    instance = new KeychainStore(logger);
}
exports.init = init;
