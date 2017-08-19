"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const stream_1 = require("stream");
const Utils_1 = require("../Utils");
const LogFormatter_1 = require("./LogFormatter");
class WriteStreamTarget extends stream_1.PassThrough {
    constructor(stream) {
        super();
        if (stream) {
            this.setStream(stream);
        }
    }
    setStream(stream) {
        if (this.stream) {
            this.unpipe(this.stream);
            this.stream.end();
        }
        this.stream = stream;
        this.pipe(stream);
    }
    write(formattedMessage, encoding, cb) {
        this._write(formattedMessage, encoding, cb);
        return true;
    }
    _write(chunk, encoding, cb) {
        this.push(chunk, encoding);
        if (cb) {
            process.nextTick(() => {
                cb(null, true);
            });
        }
    }
}
exports.WriteStreamTarget = WriteStreamTarget;
class STDOutTarget extends WriteStreamTarget {
    constructor() {
        super(process.stdout);
    }
}
exports.STDOutTarget = STDOutTarget;
const MAX_FILE_SIZE = 20 * 1000 * 1000;
const MAX_TIME_AFTER_CREATING = 1000 * 60 * 60 * 24;
class FileTarget extends WriteStreamTarget {
    constructor(folder, options, lazyInitialization = true) {
        super();
        this.size = 0;
        this.iteration = 1;
        this.needsLazyInitialization = false;
        this.maxFileSize = (options && options.maxFileSize) || MAX_FILE_SIZE;
        this.options = options;
        this.path = path.resolve(folder);
        Utils_1.ensureDir(this.path);
        if (lazyInitialization) {
            this.needsLazyInitialization = true;
            this.lazyInitializationFunction = this.setCurrentFile;
        }
        else {
            this.setCurrentFile();
        }
    }
    write(formattedMessage, encoding, cb) {
        if (this.needsLazyInitialization) {
            this.lazyInitializationFunction();
            this.needsLazyInitialization = false;
        }
        this._write(formattedMessage, encoding, cb);
        this.size += formattedMessage.length || 0;
        this.drainStream();
        if (this.size > this.maxFileSize) {
            this._write(LogFormatter_1.getMaxFileSizeReachedMessage(this.size));
            this.createNewFile();
        }
        if (Date.now() > this.fileCreatedTimestamp + MAX_TIME_AFTER_CREATING) {
            this._write(LogFormatter_1.getMaxTimeReachedMessage());
            this.createNewFile();
        }
        return true;
    }
    _write(chunk, encoding, cb) {
        const success = this.stream.write(chunk, encoding);
        if (!cb) {
            return;
        }
        if (success === false) {
            this.stream.once('drain', () => {
                cb(null, true);
            });
            return;
        }
        process.nextTick(() => {
            cb(null, true);
        });
    }
    drainStream() {
        if (!this.isDraining) {
            this.isDraining = true;
            this.stream.once('drain', () => {
                this.isDraining = false;
            });
        }
    }
    createNewFile() {
        this.unpipe(this.stream);
        this.stream.end();
        this.size = 0;
        if (this.fileName === this.createFileName()) {
            this.iteration += 1;
        }
        else {
            this.iteration = 1;
        }
        this.setCurrentFile();
    }
    createFileName() {
        let date = (new Date()).toISOString().replace(/:|\./g, '-');
        return path.join(this.path, `skype-${date}${this.iteration === 1 ? '' : '-' + this.iteration}.log`);
    }
    setCurrentFile() {
        this.fileName = this.createFileName();
        this.fileCreatedTimestamp = Date.now();
        const options = {
            flags: 'a',
            defaultEncoding: 'utf8',
            autoClose: true
        };
        const stream = fs.createWriteStream(this.fileName, options);
        this.setStream(stream);
    }
}
exports.FileTarget = FileTarget;
