"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const constants = require("./Constants");
class DownloadManager {
    constructor(downloader) {
        this.DOWNLOADS_FOLDER_PATH = electron.app.getPath('downloads') || path.join(constants.appDataDir, 'Downloads');
        this._downloader = downloader;
    }
    getFromUrlWithProgressUpdate(fileUrl, targetFilename, headers) {
        let filename = this.getUniqueFullPath(targetFilename);
        return this._downloader.getFromUrl(fileUrl, filename, headers);
    }
    buildDownloadedFileOptions(path) {
        return {
            path: path,
        };
    }
    getUniqueFullPath(originalFileName) {
        let fileNameWithoutExtension = '';
        let extension = '';
        if (originalFileName.startsWith('.')) {
            fileNameWithoutExtension = originalFileName;
        }
        else {
            let fileSplit = originalFileName.split('.');
            extension = (fileSplit.length > 1) ? '.' + fileSplit.pop() : '';
            fileNameWithoutExtension = fileSplit.join('.');
        }
        let filenameFound = false;
        let duplicateNumber = 0;
        let fullPath;
        while (!filenameFound) {
            let duplicateNumberString = duplicateNumber === 0 ? '' : ` (${duplicateNumber})`;
            let fullFileName = `${fileNameWithoutExtension}${duplicateNumberString}${extension}`;
            fullPath = path.join(this.DOWNLOADS_FOLDER_PATH, fullFileName);
            filenameFound = !fs.existsSync(fullPath);
            duplicateNumber++;
        }
        return fullPath;
    }
    openFile(fileUri) {
        return electron.shell.openItem(fileUri);
    }
    getFileStats(fileUri) {
        return new Promise((resolve, reject) => {
            fs.stat(fileUri, (err, stats) => {
                if (err) {
                    return reject(err);
                }
                resolve({
                    fileSizeInBytes: stats.size,
                    lastUpdatedTime: stats.mtime.getTime()
                });
            });
        });
    }
    fileExists(fileUri) {
        return new Promise((resolve, reject) => {
            fs.access(fileUri, err => {
                if (err && err.code === 'ENOENT') {
                    resolve(false);
                }
                else if (err) {
                    reject(err);
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    abort(fileUri) {
        return this._downloader.abort(fileUri);
    }
}
exports.DownloadManager = DownloadManager;
exports.downloadManager = null;
function getInstance() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/DownloadManager').downloadManager;
    }
    else {
        return exports.downloadManager;
    }
}
exports.getInstance = getInstance;
function init(downloader) {
    exports.downloadManager = new DownloadManager(downloader);
}
exports.init = init;
