"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
function isMac() {
    return process.platform === 'darwin';
}
exports.isMac = isMac;
function isWindows() {
    return process.platform === 'win32';
}
exports.isWindows = isWindows;
function isLinux() {
    return process.platform === 'linux';
}
exports.isLinux = isLinux;
function getPlatformShortCode() {
    if (isMac()) {
        return 'mac';
    }
    else if (isWindows()) {
        return process.arch === 'x64' ? 'win64' : 'win';
    }
    else if (isLinux()) {
        return 'linux';
    }
    return 'unknown';
}
exports.getPlatformShortCode = getPlatformShortCode;
function pickByPlatform(win, mac, linux) {
    if (isLinux()) {
        return linux;
    }
    if (isMac()) {
        return mac;
    }
    if (isWindows()) {
        return win;
    }
    throw new Error('Trying to get setting for usupported platform.');
}
exports.pickByPlatform = pickByPlatform;
function atob(str) {
    return new Buffer(str, 'base64').toString('binary');
}
exports.atob = atob;
function isDir(dirPath) {
    let stats;
    try {
        stats = fs.statSync(dirPath);
    }
    catch (err) {
    }
    return stats && stats.isDirectory();
}
function mkdirp(dirPath) {
    const normalizedPath = path.resolve(dirPath);
    try {
        fs.mkdirSync(normalizedPath);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            mkdirp(path.dirname(normalizedPath));
            return mkdirp(normalizedPath);
        }
        if (isDir(normalizedPath)) {
            return;
        }
        throw err;
    }
}
function ensureDir(dirPath) {
    const normalizedPath = path.resolve(dirPath);
    if (isDir(normalizedPath)) {
        return;
    }
    mkdirp(normalizedPath);
}
exports.ensureDir = ensureDir;
function cleanupDir(targetDir) {
    let files;
    try {
        files = fs.readdirSync(targetDir);
    }
    catch (e) {
    }
    for (let i = 0; i < files.length; i++) {
        let filename = path.join(targetDir, files[i]);
        if (fs.statSync(filename).isFile()) {
            try {
                fs.unlinkSync(filename);
            }
            catch (e) {
            }
        }
        else {
            cleanupDir(filename);
        }
    }
    try {
        fs.rmdirSync(targetDir);
    }
    catch (e) {
    }
}
exports.cleanupDir = cleanupDir;
function getTimezone() {
    const pad = function (n, c) {
        n = n + '';
        if (n.length < c) {
            let zeros = [];
            zeros.length = ++c - n.length;
            return zeros.join('0') + n;
        }
        else {
            return n;
        }
    };
    let sign;
    let timezone = new Date().getTimezoneOffset() * (-1);
    if (timezone >= 0) {
        sign = '+';
    }
    else {
        sign = '-';
    }
    timezone = Math.abs(timezone);
    const minutes = timezone % 60;
    const hours = (timezone - minutes) / 60;
    const normailzedMinutes = pad(minutes.toString(), 2);
    const normalizedHours = pad(hours.toString(), 2);
    return sign + normalizedHours + ':' + normailzedMinutes;
}
exports.getTimezone = getTimezone;
function secondsToTime(seconds) {
    let days = Math.floor(seconds / 86400);
    let hours = Math.floor((seconds - (days * 86400)) / 3600);
    let minutes = Math.floor((seconds - (hours * 3600) - (days * 86400)) / 60);
    let secs = seconds - (days * 86400) - (hours * 3600) - (minutes * 60);
    function numPad(numero) {
        let prefix = (numero < 10) ? '0' : '';
        return prefix + numero;
    }
    let humanReadable = (days > 0) ? days + 'days ' : '';
    return humanReadable + numPad(hours) + ':' + numPad(minutes) + ':' + numPad(secs);
}
exports.secondsToTime = secondsToTime;
