"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
class AuthStore {
    setUsername(username) {
        this.username = username;
    }
    getUsername() {
        return this.username;
    }
    isAuthenticated() {
        return !!this.username;
    }
}
exports.AuthStore = AuthStore;
let instance;
function getInstance() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/AuthStore').getInstance();
    }
    return instance;
}
exports.getInstance = getInstance;
function init() {
    instance = new AuthStore();
}
exports.init = init;
