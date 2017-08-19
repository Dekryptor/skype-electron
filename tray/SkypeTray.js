"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const utils = require("../Utils");
const constants = require("../Constants");
const LanguageInit_1 = require("../localisation/LanguageInit");
const PresenceStatus_1 = require("../PresenceStatus");
class SkypeTray {
    constructor(app) {
        this.trayToolTip = null;
        this.trayIconPath = null;
        this.tray = null;
        this.trayStatus = PresenceStatus_1.PresenceStatus.Offline;
        this.trayBadgeCount = 0;
        this.baseTrayIconFolder = 'images/tray';
        this.application = app;
        this.localisation = LanguageInit_1.language;
        this.tray = new electron_1.Tray(this.getTrayIconInternal());
        this.initTrayMenu();
        electron_1.ipcMain.on('badgeCount', (event, count) => {
            this.setBadgeCount(count);
        });
        if (!utils.isMac()) {
            this.tray.on('click', () => {
                this.application.getMainWindow().showAndFocus();
            });
        }
    }
    initTrayMenu() {
        this.trayBaseToolTip = this.localisation.getString('ApplicationName');
        this.trayContentMenuArray = [
            {
                label: this.localisation.getString('TrayIcon.OpenSkypeLabel'),
                click: () => {
                    this.application.getMainWindow().showAndFocus();
                }
            },
            {
                type: 'separator'
            },
            {
                label: this.localisation.getString('TrayIcon.QuitSkypeLabel'),
                click: () => {
                    this.application.quit();
                }
            }
        ];
        this.updateTray();
    }
    setBadgeCount(count = 0) {
        this.trayBadgeCount = count;
        this.updateTray();
    }
    setStatus(status) {
        this.trayStatus = status.toLowerCase();
        this.updateTray();
    }
    getStatus() {
        return this.trayStatus;
    }
    getTooltip() {
        return this.trayToolTip;
    }
    getTrayIcon() {
        return this.trayIconPath;
    }
    updateTray() {
        this.trayToolTip = this.getTooltipInternal();
        this.trayIconPath = this.getTrayIconInternal();
        const icon = electron_1.nativeImage.createFromPath(this.trayIconPath);
        this.tray.setImage(icon);
        this.tray.setToolTip(this.trayToolTip);
        this.tray.setContextMenu(this.getMenu());
    }
    getTooltipInternal() {
        return `${this.trayBaseToolTip}`;
    }
    getTrayIconByStatusAndBadge(status, count = 0) {
        let platform = utils.isMac() ? 'mac' : utils.isWindows() ? 'win' : 'linux';
        let hiDPISuffix = utils.isMac() ? '@2x' : '';
        let extension = utils.isWindows() ? 'ico' : 'png';
        let badge = (utils.isMac() || status === PresenceStatus_1.PresenceStatus.Offline || count === 0) ? '' : 'Unread';
        let basePath = `${this.baseTrayIconFolder}/${platform}`;
        let iconPath = `${basePath}/tray-${status}${badge}Template${hiDPISuffix}.${extension}`;
        return path.join(constants.rootDir, iconPath);
    }
    getTrayIconInternal() {
        return this.getTrayIconByStatusAndBadge(this.trayStatus, this.trayBadgeCount);
    }
    getMenu() {
        let menu = electron_1.Menu.buildFromTemplate(this.trayContentMenuArray);
        return menu;
    }
}
exports.SkypeTray = SkypeTray;
