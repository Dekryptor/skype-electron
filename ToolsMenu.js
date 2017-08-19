"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const Logger_1 = require("./logger/Logger");
const Settings_1 = require("./Settings");
const Utils_1 = require("./Utils");
class ToolsMenu {
    static get LAUNCH_AT_LOGIN() {
        return 'app.launchAtLogin';
    }
    static get LAUNCH_MINIMIZED() {
        return 'app.launchMinimized';
    }
    static isEnabled(item) {
        return Settings_1.settings.get(item, false);
    }
    static enable(item, shouldBeEnabled) {
        if (item === ToolsMenu.LAUNCH_AT_LOGIN && !Utils_1.isLinux()) {
            return;
        }
        if (item === ToolsMenu.LAUNCH_AT_LOGIN) {
            ToolsMenu.updateLinuxDesktopFile(shouldBeEnabled);
        }
        Settings_1.settings.set(item, shouldBeEnabled);
    }
    static get linuxDesktopFilePath() {
        return path.join(os.homedir(), '.config', 'autostart');
    }
    static get linuxDesktopFileContent() {
        return [
            '[Desktop Entry]',
            'Name=Skype for Linux',
            'Comment=Skype Internet Telephony',
            'Exec=/usr/bin/skypeforlinux',
            'Icon=skypeforlinux',
            'Terminal=false',
            'Type=Application',
            'StartupNotify=false',
            'X-GNOME-Autostart-enabled=true'
        ].join('\n');
    }
    static updateLinuxDesktopFile(shouldBeEnabled) {
        const autoLaunchDir = ToolsMenu.linuxDesktopFilePath;
        const content = ToolsMenu.linuxDesktopFileContent;
        const filePath = path.join(autoLaunchDir, ToolsMenu.autoLaunchFilename);
        const logger = Logger_1.getInstance();
        Utils_1.ensureDir(autoLaunchDir);
        if (shouldBeEnabled) {
            try {
                fs.writeFileSync(filePath, content);
            }
            catch (error) {
                logger.error(`[Tool Menu] Unable to write to a file ${filePath}`, error);
            }
        }
        else {
            try {
                fs.unlinkSync(filePath);
            }
            catch (error) {
                logger.error(`[Tool Menu] Unable to unlink a file ${filePath}`, error);
            }
        }
    }
}
ToolsMenu.autoLaunchFilename = 'skypeforlinux.desktop';
exports.ToolsMenu = ToolsMenu;
