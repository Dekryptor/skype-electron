"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UpdateEventType;
(function (UpdateEventType) {
    UpdateEventType[UpdateEventType["UpdateDownloaded"] = 0] = "UpdateDownloaded";
    UpdateEventType[UpdateEventType["NoUpdateAvailable"] = 1] = "NoUpdateAvailable";
    UpdateEventType[UpdateEventType["CheckingForUpdates"] = 2] = "CheckingForUpdates";
    UpdateEventType[UpdateEventType["UpdateAvailable"] = 3] = "UpdateAvailable";
    UpdateEventType[UpdateEventType["Error"] = 4] = "Error";
})(UpdateEventType = exports.UpdateEventType || (exports.UpdateEventType = {}));
exports.updateEventName = {
    UpdateDownloaded: 'update-downloaded',
    NoUpdateAvailable: 'update-not-available',
    CheckingForUpdates: 'checking-for-update',
    UpdateAvailable: 'update-available',
    Error: 'update-error'
};
