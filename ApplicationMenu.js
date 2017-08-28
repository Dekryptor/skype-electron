"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const events_1 = require("events");
const path = require("path");
const Configuration_1 = require("./configuration/Configuration");
const constants = require("./Constants");
const ExporterDialog_1 = require("./ExporterDialog");
const ClientVersion_1 = require("./ClientVersion");
const Logger_1 = require("./logger/Logger");
const Utils_1 = require("./Utils");
const SkypeUriInit_1 = require("./SkypeUriInit");
const LanguageInit_1 = require("./localisation/LanguageInit");
const MenuShortcutDecorator_1 = require("./localisation_utilities/MenuShortcutDecorator");
const Settings_1 = require("./Settings");
const ToolsMenu_1 = require("./ToolsMenu");
const PresenceStatus_1 = require("./PresenceStatus");
class ApplicationMenu extends events_1.EventEmitter {
    constructor(application) {
        super();
        this.logger = Logger_1.getInstance();
        this.exporterDialog = null;
        this.showDebugMenu = Configuration_1.default.debugMenuIncluded;
        this.status = PresenceStatus_1.PresenceStatus.Offline;
        this.application = application;
        this.updater = application.getUpdater();
        this.setupMenuLinks();
        const menu = this.buildMenu();
        application.setMenu(menu);
        if (Configuration_1.default.debugMenuAddShortcut && !Configuration_1.default.debugMenuIncluded) {
            electron_1.globalShortcut.register('Shift+Alt+Control+D', () => {
                this.showDebugMenu = true;
                this.refreshMenu();
            });
        }
    }
    setStatus(status) {
        this.status = status;
        this.logger.info('[ApplicationMenu] Changing menu. Status changed to: ' + this.status);
        this.refreshMenu();
    }
    reload() {
        this.logger.info('[ApplicationMenu] Reloading menu.');
        this.setupMenuLinks();
        this.refreshMenu();
    }
    setupMenuLinks() {
        const platform = Utils_1.getPlatformShortCode();
        const clientVersion = ClientVersion_1.getInstance().getFullVersion();
        const intsrc = '?intsrc=' + encodeURIComponent(`client-_-${platform}-_-${clientVersion}-_-menu.`);
        const setLang = `setlang=${LanguageInit_1.language.getLanguage()}`;
        this.HOME_URL = `https://www.skype.com/${LanguageInit_1.language.getLanguageCodeInSkypeFormat()}/${intsrc}home`;
        this.SUPPORT_URL = `https://go.skype.com/support.${platform}.desktop${intsrc}support&${setLang}`;
        this.COMMUNITY_URL = `https://go.skype.com/community.${platform}.desktop${intsrc}community&${setLang}`;
        this.TERMS_URL = `https://go.skype.com/legal.skype.preview${intsrc}tou&${setLang}`;
        this.PRIVACY_URL = `https://go.skype.com/privacy${intsrc}privacy&${setLang}`;
    }
    refreshMenu() {
        const menu = this.buildMenu();
        electron_1.app.emit('menu-update', menu);
    }
    buildMenu() {
        const menu = new electron_1.Menu();
        this.mainLabelDecorator = new MenuShortcutDecorator_1.MenuLabelDecorator();
        if (Utils_1.isMac()) {
            menu.append(this.buildAppMenuItem());
        }
        menu.append(this.buildFileMenuItem());
        menu.append(this.buildEditMenuItem());
        menu.append(this.buildViewMenuItem());
        if (Utils_1.isMac()) {
            menu.append(this.buildWindowMenuItem());
        }
        menu.append(this.buildToolsMenuItem());
        menu.append(this.buildHelpMenuItem());
        if (this.showDebugMenu) {
            menu.append(this.buildDebugMenu());
        }
        return menu;
    }
    buildSeparator(visible = true) {
        if (!visible) {
            return { visible: false };
        }
        return {
            type: 'separator',
            visible: true
        };
    }
    buildAppMenuItem() {
        const menuLabel = 'Skype';
        return new electron_1.MenuItem({
            label: menuLabel,
            submenu: [{
                    label: LanguageInit_1.language.getString('Menu.AboutSkypeLabel'),
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-about');
                    }
                },
                this.buildSeparator(),
                {
                    label: LanguageInit_1.language.getString('Menu.PreferencesLabel'),
                    accelerator: 'Command+,',
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-open-settings');
                    }
                },
                {
                    label: LanguageInit_1.language.getString('Menu.AudioVideoSettingsLabel'),
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-open-av-settings');
                    }
                },
                this.buildSeparator(),
                {
                    label: LanguageInit_1.language.getString('Menu.CheckForUpdatesLabel'),
                    visible: this.updater.updatesEnabled(),
                    click: () => {
                        this.updater.checkForUpdates();
                    }
                },
                this.buildSeparator(),
                {
                    label: LanguageInit_1.language.getString('Menu.ServicesLabel'),
                    role: 'services',
                    submenu: []
                },
                this.buildSeparator(),
                {
                    label: LanguageInit_1.language.getString('Menu.HideSkypeLabel'),
                    accelerator: 'Command+H',
                    role: 'hide'
                },
                {
                    label: LanguageInit_1.language.getString('Menu.HideOthersLabel'),
                    role: 'hideothers'
                },
                {
                    label: LanguageInit_1.language.getString('Menu.ShowAllLabel'),
                    role: 'unhide'
                },
                this.buildSeparator(),
                {
                    label: LanguageInit_1.language.getString('Menu.QuitSkypeLabel'),
                    accelerator: 'Command+Q',
                    click: () => {
                        this.application.quit();
                    }
                }]
        });
    }
    buildFileMenuItem() {
        const labelDecorator = new MenuShortcutDecorator_1.MenuLabelDecorator();
        const menuLabel = this.mainLabelDecorator.getLabel(LanguageInit_1.language.getString('Menu.FileLabel'));
        return new electron_1.MenuItem({
            label: menuLabel,
            submenu: [{
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.NewGroupChatLabel'), true),
                    accelerator: 'CmdOrCtrl+G',
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-new-group-chat');
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.New1on1ChatLabel'), true),
                    accelerator: 'CmdOrCtrl+N',
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-new-1-1-chat');
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.NewCallLabel'), true),
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-new-call');
                    }
                },
                this.buildSeparator(),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ViewProfileLabel'), true),
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-open-profile');
                    }
                },
                this.buildSeparator(),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.SignOutLabel')),
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-sign-out');
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.QuitLabel')),
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        this.application.quit();
                    }
                }
            ]
        });
    }
    buildEditMenuItem() {
        const labelDecorator = new MenuShortcutDecorator_1.MenuLabelDecorator();
        const menuLabel = this.mainLabelDecorator.getLabel(LanguageInit_1.language.getString('Menu.EditLabel'));
        return new electron_1.MenuItem({
            label: menuLabel,
            submenu: [{
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.UndoLabel')),
                    accelerator: 'CmdOrCtrl+Z',
                    role: 'undo'
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.RedoLabel')),
                    accelerator: Utils_1.isMac() ? 'Command+Shift+Z' : 'CmdOrCtrl+Y',
                    role: 'redo'
                },
                this.buildSeparator(),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.CutLabel')),
                    accelerator: 'CmdOrCtrl+X',
                    role: 'cut'
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.CopyLabel')),
                    accelerator: 'CmdOrCtrl+C',
                    role: 'copy'
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.PasteLabel')),
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste'
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.SelectAllLabel')),
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectall'
                },
                this.buildSeparator(),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.SearchSkypeLabel'), true),
                    accelerator: 'CmdOrCtrl+F',
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-search-skype');
                    }
                }]
        });
    }
    buildViewMenuItem() {
        const labelDecorator = new MenuShortcutDecorator_1.MenuLabelDecorator();
        const menuLabel = this.mainLabelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ViewLabel'));
        return new electron_1.MenuItem({
            label: menuLabel,
            submenu: [{
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ToggleFullScreenLabel')),
                    accelerator: Utils_1.isMac() ? 'Ctrl+Command+F' : 'F11',
                    click: (item, focusedWindow) => {
                        if (focusedWindow) {
                            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                        }
                    }
                },
                this.buildSeparator(),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ActualSizeLabel')),
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        this.emitMenuEvent('zoom-reset');
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ZoomInLabel')),
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        this.emitMenuEvent('zoom-in');
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ZoomOutLabel')),
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        this.emitMenuEvent('zoom-out');
                    }
                }]
        });
    }
    buildWindowMenuItem() {
        const labelDecorator = new MenuShortcutDecorator_1.MenuLabelDecorator();
        const menuLabel = this.mainLabelDecorator.getLabel(LanguageInit_1.language.getString('Menu.WindowLabel'));
        return new electron_1.MenuItem({
            label: menuLabel,
            role: 'window',
            submenu: [{
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.MinimizeLabel')),
                    accelerator: 'Command+M',
                    role: 'minimize'
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.CloseLabel')),
                    accelerator: 'Command+W',
                    role: 'close'
                },
                this.buildSeparator(),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.BringAllToFrontLabel')),
                    role: 'front'
                },
                this.buildSeparator(),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Skype')),
                    accelerator: 'Command+1',
                    click: item => {
                        const mainWindow = this.application.getMainWindow().window;
                        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
                    }
                }]
        });
    }
    buildToolsMenuItem() {
        const labelDecorator = new MenuShortcutDecorator_1.MenuLabelDecorator();
        const menuLabel = this.mainLabelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ToolsLabel'));
        const exporterMenuLabel = Utils_1.isLinux() ? 'Menu.ExportHistoryLinuxLabel' : 'Menu.ExportHistoryLabel';
        return new electron_1.MenuItem({
            label: menuLabel,
            submenu: [{
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.CloseToTrayLabel')),
                    type: 'checkbox',
                    checked: Settings_1.settings.get('app.minimizeToTray', false),
                    visible: !Utils_1.isMac(),
                    click: item => {
                        Settings_1.settings.set('app.minimizeToTray', item.checked);
                        electron_1.app.emit('window-minimize-to-tray', item.checked);
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.LaunchAtLogin')),
                    type: 'checkbox',
                    checked: ToolsMenu_1.ToolsMenu.isEnabled(ToolsMenu_1.ToolsMenu.LAUNCH_AT_LOGIN),
                    visible: Utils_1.isLinux(),
                    click: item => {
                        ToolsMenu_1.ToolsMenu.enable(ToolsMenu_1.ToolsMenu.LAUNCH_AT_LOGIN, item.checked);
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.LaunchMinimized')),
                    type: 'checkbox',
                    checked: ToolsMenu_1.ToolsMenu.isEnabled(ToolsMenu_1.ToolsMenu.LAUNCH_MINIMIZED),
                    visible: !Utils_1.isMac(),
                    click: item => {
                        ToolsMenu_1.ToolsMenu.enable(ToolsMenu_1.ToolsMenu.LAUNCH_MINIMIZED, item.checked);
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.SettingsLabel'), true),
                    accelerator: 'Ctrl+,',
                    visible: !Utils_1.isMac(),
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-open-settings');
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.AudioVideoSettingsLabel'), true),
                    visible: !Utils_1.isMac(),
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-open-av-settings');
                    }
                },
                this.buildSeparator(!Utils_1.isMac()),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString(exporterMenuLabel), true),
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.openExporterWindow();
                    }
                }]
        });
    }
    buildHelpMenuItem() {
        const labelDecorator = new MenuShortcutDecorator_1.MenuLabelDecorator();
        const menuLabel = this.mainLabelDecorator.getLabel(LanguageInit_1.language.getString('Menu.HelpLabel'));
        return new electron_1.MenuItem({
            label: menuLabel,
            role: 'help',
            submenu: [
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.LearnAboutSkypeLabel')),
                    click: () => {
                        electron_1.shell.openExternal(this.HOME_URL);
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.GoToSupportLabel')),
                    click: () => {
                        electron_1.shell.openExternal(this.SUPPORT_URL);
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.AskTheSkypeCommunityLabel')),
                    click: () => {
                        electron_1.shell.openExternal(this.COMMUNITY_URL);
                    }
                },
                this.buildSeparator(),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ThirdPartyNoticesLabel')),
                    click: () => {
                        electron_1.shell.openItem(constants.thirdPartyNoticesFile);
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.PrivacyStatementLabel')),
                    click: () => {
                        electron_1.shell.openExternal(this.PRIVACY_URL);
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ServiceAgreementLabel')),
                    click: () => {
                        electron_1.shell.openExternal(this.TERMS_URL);
                    }
                },
                this.buildSeparator(!Utils_1.isMac()),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.AboutSkypeLabel')),
                    visible: !Utils_1.isMac(),
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-about');
                    }
                },
                this.buildSeparator(!Utils_1.isMac() && this.updater.updatesEnabled()),
                {
                    label: LanguageInit_1.language.getString('Menu.CheckForUpdatesLabel'),
                    visible: !Utils_1.isMac() && this.updater.updatesEnabled(),
                    click: () => {
                        this.updater.checkForUpdates();
                    }
                },
                this.buildSeparator(),
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ReportProblemLabel'), true),
                    enabled: this.isAuthenticated(),
                    click: () => {
                        this.emitMenuEvent('menu-report-problem');
                    }
                }
            ]
        });
    }
    buildDebugMenu() {
        const appDataDir = electron_1.app.getPath('userData');
        const logsPath = path.join(appDataDir, '/logs');
        const skypeUri = SkypeUriInit_1.getInstance();
        const labelDecorator = new MenuShortcutDecorator_1.MenuLabelDecorator();
        const menuLabel = this.mainLabelDecorator.getLabel(LanguageInit_1.language.getString('Menu.DebugLabel'));
        const TURN_ON_LOGGING = LanguageInit_1.language.getString('Menu.EnableLoggingLabel');
        const TURN_OFF_LOGGING = LanguageInit_1.language.getString('Menu.DisableLoggingLabel');
        return new electron_1.MenuItem({
            label: menuLabel,
            submenu: [
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.UseForSkypeLinksLabel')),
                    type: 'checkbox',
                    checked: skypeUri.isRegistered(),
                    visible: !Utils_1.isLinux(),
                    click: item => {
                        skypeUri.setRegistered(item.checked);
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ReloadLabel')),
                    accelerator: 'CmdOrCtrl+R',
                    type: 'normal',
                    click: (item, focusedWindow) => {
                        if (focusedWindow) {
                            focusedWindow.reload();
                        }
                    }
                },
                {
                    label: labelDecorator.getLabel(LanguageInit_1.language.getString('Menu.ToggleDeveloperToolsLabel')),
                    type: 'normal',
                    accelerator: (Utils_1.isMac() ? 'Alt+Command+I' : 'Ctrl+Shift+I'),
                    click: (item, focusedWindow) => {
                        if (focusedWindow) {
                            focusedWindow.webContents.toggleDevTools();
                        }
                    }
                },
                {
                    label: labelDecorator.getLabel(this.logger.isLoggingEnabled() ? TURN_OFF_LOGGING : TURN_ON_LOGGING),
                    type: 'normal',
                    click: item => {
                        let dialogOptions;
                        const enableButtons = [
                            LanguageInit_1.language.getString('Dialogs.EnableLogCollection.YesButton'),
                            LanguageInit_1.language.getString('Dialogs.EnableLogCollection.NoButton')
                        ];
                        const disableButtons = [
                            LanguageInit_1.language.getString('Dialogs.DisableLogCollection.YesButton'),
                            LanguageInit_1.language.getString('Dialogs.DisableLogCollection.NoButton')
                        ];
                        if (this.logger.isLoggingEnabled()) {
                            dialogOptions = {
                                title: LanguageInit_1.language.getString('Dialogs.DisableLogCollection.Title'),
                                type: 'none',
                                icon: electron_1.nativeImage.createFromPath(path.join(constants.rootDir, 'images/Skype.png')),
                                message: LanguageInit_1.language.getString('Dialogs.DisableLogCollection.Message', { logsPath: logsPath }),
                                buttons: disableButtons,
                                cancelId: 1
                            };
                        }
                        else {
                            dialogOptions = {
                                title: LanguageInit_1.language.getString('Dialogs.DisableLogCollection.Title'),
                                type: 'none',
                                icon: electron_1.nativeImage.createFromPath(path.join(constants.rootDir, 'images/Skype.png')),
                                message: LanguageInit_1.language.getString('Dialogs.EnableLogCollection.Message', { logsPath: logsPath }),
                                buttons: enableButtons,
                                cancelId: 1
                            };
                        }
                        electron_1.dialog.showMessageBox(dialogOptions, cancel => {
                            this.logger.debug('[ApplicationMenu] Turning on logging dialog with result: ', cancel);
                            if (cancel) {
                                this.logger.debug('[ApplicationMenu] Turning on logging dialog with result: dialog canceled.');
                                return;
                            }
                            const newSetting = !this.logger.isLoggingEnabled();
                            this.logger.setLoggingEnabled(newSetting);
                            item.label = labelDecorator.getLabel(newSetting ? TURN_OFF_LOGGING : TURN_ON_LOGGING);
                            this.refreshMenu();
                        });
                    }
                }
            ]
        });
    }
    emitMenuEvent(eventName) {
        electron_1.app.emit('menu-event', eventName);
    }
    isAuthenticated() {
        return this.status !== PresenceStatus_1.PresenceStatus.Offline;
    }
    openExporterWindow() {
        if (this.exporterDialog) {
            this.exporterDialog.window.show();
            return;
        }
        this.exporterDialog = new ExporterDialog_1.ExporterDialog();
        this.exporterDialog.window.on('closed', () => {
            this.exporterDialog = null;
        });
    }
}
exports.ApplicationMenu = ApplicationMenu;
