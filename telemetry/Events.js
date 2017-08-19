"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const aria_1 = require("../vendor/aria/aria");
const utils = require("../Utils");
var PIIKind;
(function (PIIKind) {
    PIIKind[PIIKind["NotSet"] = 0] = "NotSet";
    PIIKind[PIIKind["DistinguishedName"] = 1] = "DistinguishedName";
    PIIKind[PIIKind["GenericData"] = 2] = "GenericData";
    PIIKind[PIIKind["IPV4Address"] = 3] = "IPV4Address";
    PIIKind[PIIKind["IPv6Address"] = 4] = "IPv6Address";
    PIIKind[PIIKind["MailSubject"] = 5] = "MailSubject";
    PIIKind[PIIKind["PhoneNumber"] = 6] = "PhoneNumber";
    PIIKind[PIIKind["QueryString"] = 7] = "QueryString";
    PIIKind[PIIKind["SipAddress"] = 8] = "SipAddress";
    PIIKind[PIIKind["SmtpAddress"] = 9] = "SmtpAddress";
    PIIKind[PIIKind["Identity"] = 10] = "Identity";
    PIIKind[PIIKind["Uri"] = 11] = "Uri";
    PIIKind[PIIKind["Fqdn"] = 12] = "Fqdn";
    PIIKind[PIIKind["IPV4AddressLegacy"] = 13] = "IPV4AddressLegacy";
})(PIIKind = exports.PIIKind || (exports.PIIKind = {}));
class ElectronTelemetryEvent extends aria_1.EventProperties {
    constructor() {
        super();
        this.setProperty('DeviceInfo_OsVersion', os.release());
        this.setProperty('UserInfo.TimeZone', utils.getTimezone());
        this.setProperty('DeviceInfo.OsName', os.type());
        this.setProperty('DeviceInfo.OsVersion', os.release());
        this.setProperty('DeviceInfo.OsBuild', os.release());
    }
}
exports.ElectronTelemetryEvent = ElectronTelemetryEvent;
class StartupEvent extends ElectronTelemetryEvent {
    constructor() {
        super();
        this.name = 'client_startup';
        this.setProperty('startup_time', Date.now());
    }
}
exports.StartupEvent = StartupEvent;
class TimeSyncEvent extends ElectronTelemetryEvent {
    constructor(delta) {
        super();
        this.name = 'time_sync_excessive';
        this.setProperty('time_delta', delta);
    }
}
exports.TimeSyncEvent = TimeSyncEvent;
class AuthenticationEvent extends ElectronTelemetryEvent {
    constructor(result, authProvider = 'msa', detailedMessage = null) {
        super();
        this.name = 'authentication_event';
        this.setProperty('authentication_result', result);
        this.setProperty('authentication_provider', authProvider);
        this.setProperty('authentication_details', detailedMessage);
    }
}
exports.AuthenticationEvent = AuthenticationEvent;
class DeprecationEvent extends ElectronTelemetryEvent {
    constructor() {
        super();
        this.name = 'application_deprecated';
    }
}
exports.DeprecationEvent = DeprecationEvent;
class UncaughtExceptionEvent extends ElectronTelemetryEvent {
    constructor(error) {
        super();
        this.name = 'uncaught_exception';
        const message = error['message'] || error.toString();
        this.setProperty('error_message', message);
        const stack = error['stack'];
        if (stack) {
            this.setProperty('error_stack', stack);
        }
    }
}
exports.UncaughtExceptionEvent = UncaughtExceptionEvent;
class ActivityStartedEvent extends ElectronTelemetryEvent {
    constructor(activityStartTime, entryPoint) {
        super();
        this.name = 'kpi_inapp_activity_started';
        this.setProperty('Entry_Point', entryPoint);
        this.setProperty('Foreground_Start_Time', activityStartTime);
    }
}
exports.ActivityStartedEvent = ActivityStartedEvent;
class ActivityEndedEvent extends ElectronTelemetryEvent {
    constructor(activityStartTime, activityEndTime, entryPoint, exitPoint) {
        super();
        this.name = 'kpi_inapp_activity_ended';
        this.setProperty('Entry_Point', entryPoint);
        this.setProperty('Exit_point', exitPoint);
        this.setProperty('Foreground_Start_Time', activityStartTime);
        this.setProperty('Foregrounded_Duration', activityEndTime - activityStartTime);
    }
}
exports.ActivityEndedEvent = ActivityEndedEvent;
