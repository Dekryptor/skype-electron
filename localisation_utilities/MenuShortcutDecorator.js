"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MenuLabelDecorator {
    constructor() {
        this.usedCharacterCodes = new Set();
    }
    getLabel(str) {
        let insertPositon = -1;
        let lowerCasedStr = str.toLowerCase();
        for (let i = 0; i < str.length; i++) {
            let charCode = lowerCasedStr.charCodeAt(i);
            if (charCode >= MenuLabelDecorator.aCode && charCode <= MenuLabelDecorator.zCode && !this.usedCharacterCodes.has(charCode)) {
                insertPositon = i;
                this.usedCharacterCodes.add(charCode);
                break;
            }
        }
        if (insertPositon === -1) {
            for (let i = 0; i < str.length; i++) {
                let charCode = lowerCasedStr.charCodeAt(i);
                if (!this.usedCharacterCodes.has(charCode)) {
                    insertPositon = i;
                    this.usedCharacterCodes.add(charCode);
                    break;
                }
            }
        }
        if (insertPositon !== -1) {
            str = `${str.slice(0, insertPositon)}&${str.slice(insertPositon)}`;
        }
        return str;
    }
}
MenuLabelDecorator.aCode = 97;
MenuLabelDecorator.zCode = 122;
exports.MenuLabelDecorator = MenuLabelDecorator;
