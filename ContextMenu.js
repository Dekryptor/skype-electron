"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const { Menu, MenuItem } = electron_1.remote;
class ContextMenu {
    constructor(spellCheckHandler, windowOrWebView = null, logger, localisation) {
        this.spellCheckHandler = spellCheckHandler;
        this.logger = logger;
        this.language = localisation;
        windowOrWebView = windowOrWebView || electron_1.remote.getCurrentWebContents();
        let ctorName = Object.getPrototypeOf(windowOrWebView).constructor.name;
        if (ctorName === 'WebContents') {
            this.getWebContents = () => windowOrWebView;
        }
        else {
            this.getWebContents = 'webContents' in windowOrWebView ?
                () => windowOrWebView.webContents :
                () => windowOrWebView.getWebContents();
        }
    }
    showPopupMenu(contextInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let menu = yield this.buildMenuForElement(contextInfo);
            if (!menu)
                return;
            menu.popup(electron_1.remote.getCurrentWindow(), { async: true });
        });
    }
    buildMenuForElement(contextInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug(`[ContextMenu] Got context menu event with args: ${JSON.stringify(contextInfo)}`);
            if (contextInfo.isEditable || (contextInfo.inputFieldType && contextInfo.inputFieldType !== 'none')) {
                return yield this.buildMenuForTextInput(contextInfo);
            }
            return null;
        });
    }
    buildMenuForTextInput(contextInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let menu = new Menu();
            yield this.addSpellingItems(menu, contextInfo);
            this.addCut(menu, contextInfo);
            this.addCopy(menu, contextInfo);
            this.addPaste(menu, contextInfo);
            return menu;
        });
    }
    addSpellingItems(menu, contextInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let target = this.getWebContents();
            if (!contextInfo.misspelledWord || contextInfo.misspelledWord.length < 1) {
                return menu;
            }
            if (!this.spellCheckHandler.currentSpellchecker) {
                return menu;
            }
            let corrections = yield this.spellCheckHandler.getCorrectionsForMisspelling(contextInfo.misspelledWord);
            if (!corrections || !corrections.length) {
                return menu;
            }
            corrections.forEach((correction) => {
                let item = new MenuItem({
                    label: correction,
                    click: () => target.replaceMisspelling(correction)
                });
                menu.append(item);
            });
            this.addSeparator(menu);
            if (process.platform === 'darwin') {
                let learnWord = new MenuItem({
                    label: this.language.getString('Menu.AddToDictionaryLabel'),
                    click: () => __awaiter(this, void 0, void 0, function* () {
                        target.replaceMisspelling(contextInfo.selectionText);
                        try {
                            yield this.spellCheckHandler.addToDictionary(contextInfo.misspelledWord);
                        }
                        catch (e) {
                            this.logger.error(`[ContextMenu] Failed to add entry to dictionary: ${e.message}`);
                        }
                    })
                });
                menu.append(learnWord);
            }
            return menu;
        });
    }
    addCut(menu, menuInfo) {
        menu.append(new MenuItem({
            label: this.language.getString('Menu.CutLabel'),
            enabled: menuInfo.editFlags.canCut,
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
        }));
        return menu;
    }
    addCopy(menu, menuInfo) {
        menu.append(new MenuItem({
            label: this.language.getString('Menu.CopyLabel'),
            accelerator: 'CmdOrCtrl+C',
            enabled: menuInfo.editFlags.canCopy,
            role: 'copy'
        }));
        return menu;
    }
    addPaste(menu, menuInfo) {
        menu.append(new MenuItem({
            label: this.language.getString('Menu.PasteLabel'),
            accelerator: 'CmdOrCtrl+V',
            enabled: menuInfo.editFlags.canPaste,
            role: 'paste'
        }));
        return menu;
    }
    addSeparator(menu) {
        menu.append(new MenuItem({ type: 'separator' }));
        return menu;
    }
}
exports.ContextMenu = ContextMenu;
