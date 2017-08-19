"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const s4lApi = require("./S4lApi");
const CrashReporting_1 = require("./CrashReporting");
const PreloadShared_1 = require("./PreloadShared");
CrashReporting_1.initializeCrashReporter();
PreloadShared_1.init();
s4lApi.apiForMain();
