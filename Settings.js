"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const kFlushTimeout = 100;
class Settings {
    constructor(filename) {
        this.data = new Map();
        this.filename = filename;
    }
    init() {
        this.readFromDisk();
    }
    has(key) {
        return this.data.has(key);
    }
    get(key, defaultValue) {
        return this.data.has(key) ? this.data.get(key) : defaultValue;
    }
    delete(key) {
        this.data.delete(key);
        this.flushToDisk();
    }
    set(key, value) {
        this.data.set(key, value);
        this.flushToDisk();
    }
    readFromDisk() {
        let stats = null;
        try {
            stats = fs.lstatSync(this.filename);
        }
        catch (error) {
        }
        try {
            if (stats !== null && stats.isFile()) {
                let json = fs.readFileSync(this.filename, 'utf8');
                this.data = objectToMap(JSON.parse(json));
            }
        }
        catch (error) {
            console.warn(`Error reading settings: ${error.message}`);
        }
    }
    writeToDisk() {
        try {
            let json = JSON.stringify(mapToObject(this.data));
            fs.writeFileSync(this.filename, json);
        }
        catch (error) {
            console.warn(`Error writing settings: ${error.message}`);
        }
    }
    flushToDisk() {
        let callback = () => {
            this.writeToDisk();
        };
        clearTimeout(this.flushTimer);
        this.flushTimer = setTimeout(callback, kFlushTimeout);
    }
}
exports.Settings = Settings;
function mapToObject(map) {
    let obj = Object.create(null);
    map.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}
function objectToMap(obj) {
    let map = new Map();
    for (let key of Object.keys(obj)) {
        map.set(key, obj[key]);
    }
    return map;
}
function buildSettings() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/Settings').settings;
    }
    else {
        let filename = path.join(electron.app.getPath('userData'), 'settings.json');
        return new Settings(filename);
    }
}
exports.settings = buildSettings();
