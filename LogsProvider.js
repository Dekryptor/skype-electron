"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const electron = require("electron");
const _ = require("lodash");
const JSZip = require("jszip");
class LogsProvider {
    constructor(_logsBaseDirectory, _slimcoreBaseDirectory, _mediaBaseDirectory) {
        this._logsBaseDirectory = _logsBaseDirectory;
        this._slimcoreBaseDirectory = _slimcoreBaseDirectory;
        this._mediaBaseDirectory = _mediaBaseDirectory;
    }
    mostRecentLogFileUris(history) {
        return new Promise((resolve, reject) => {
            resolve(_.head(this._getAllRecentFilesNames(this._logsBaseDirectory, ['.log'], history)));
        });
    }
    allRecentLogFileUris(history) {
        return new Promise((resolve, reject) => {
            resolve(this._getAllLogFilenames(history));
        });
    }
    zippedLogFileBundle(history) {
        return new Promise((resolve, reject) => {
            const fileNames = this._getAllLogFilenames(history);
            const zipFile = new JSZip();
            fileNames.forEach(fn => {
                try {
                    this._addBufferToZip(zipFile, path.basename(fn), fs.readFileSync(fn));
                }
                catch (error) {
                }
            });
            this._getGpuInfo()
                .then(info => {
                this._addBufferToZip(zipFile, 'gpuinfo.html', new Buffer(info));
            })
                .catch(_.noop)
                .then(() => {
                resolve(new File([zipFile.generate({ type: 'uint8array' })], 's4l-desktop-logs.zip', { type: 'application/zip' }));
            });
        });
    }
    _addBufferToZip(zip, fileName, content) {
        zip.file(fileName, content, { binary: true, compression: 'DEFLATE' });
    }
    _getAllLogFilenames(history) {
        return this._getAllRecentFilesNames(this._logsBaseDirectory, ['.log'], history)
            .concat(this._getAllRecentFilesNames(this._slimcoreBaseDirectory, ['.log'], history))
            .concat(this._getAllRecentFilesNames(this._mediaBaseDirectory, ['.etl', '.blog'], history));
    }
    _getAllRecentFilesNames(baseDir, extensions, history) {
        const fileHistory = history ? history * 1000 : LogsProvider.DefaultHistory;
        const oldestAllowedTime = new Date().getTime() - fileHistory;
        const maxFileSize = 256 * 1024 * 1024;
        try {
            let files = fs.readdirSync(baseDir);
            return files.map(name => {
                const stats = fs.lstatSync(path.join(baseDir, name));
                return { name,
                    time: stats.mtime.getTime(),
                    size: stats.size };
            })
                .filter(o => (o.time > oldestAllowedTime)
                && (o.size > 0)
                && (o.size < maxFileSize)
                && _.some(extensions, e => o.name.endsWith(e)))
                .sort((a, b) => b.time - a.time)
                .map(val => path.join(baseDir, val.name));
        }
        catch (error) {
            return [];
        }
    }
    _getGpuInfo() {
        return new Promise((resolve, reject) => {
            let browserWindow = new electron.remote.BrowserWindow({
                show: false
            });
            function cleanup() {
                browserWindow.removeAllListeners();
                browserWindow.destroy();
                browserWindow = null;
            }
            browserWindow.webContents.once('did-finish-load', () => {
                browserWindow.webContents.executeJavaScript('document.documentElement.innerHTML', false, body => {
                    setTimeout(cleanup, 0);
                    resolve(body);
                });
            });
            browserWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
                setTimeout(cleanup, 0);
                reject(new Error(errorDescription));
            });
            browserWindow.loadURL('chrome://gpu');
        });
    }
}
LogsProvider.DefaultHistory = 1000 * 60 * 60 * 8;
exports.LogsProvider = LogsProvider;
