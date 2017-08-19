"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DomLocaliser {
    translateDomElement(rootElement) {
        this.translateElementText(rootElement);
        this.translateElementAttributes(rootElement);
    }
    constructor(getTranslationFunction) {
        this.getTranslation = getTranslationFunction;
    }
    translateElementText(rootElement) {
        let elementsWithLocalization = rootElement.querySelectorAll('[i18n]');
        for (let i = 0; i < elementsWithLocalization.length; i++) {
            let elem = elementsWithLocalization[i];
            let translationKey = elem.getAttribute('i18n');
            let translationParamsString = elem.getAttribute('i18n-params');
            let translationParams = null;
            if (translationParamsString !== null) {
                translationParams = this.getParamsFromString(translationParamsString);
            }
            let translatedText = this.getTranslation(translationKey, translationParams);
            elem.insertAdjacentHTML('afterbegin', translatedText);
        }
    }
    translateElementAttributes(rootElement) {
        let elementsWithLocalization = rootElement.querySelectorAll('[i18n-attributes]');
        for (let i = 0; i < elementsWithLocalization.length; i++) {
            let elem = elementsWithLocalization[i];
            let localizationAttributesString = elem.getAttribute('i18n-attributes');
            let localizationAttributes = this.getParamsFromString(localizationAttributesString);
            this.translateAttributes(elem, localizationAttributes);
        }
    }
    translateAttributes(elem, localizationAttributes) {
        let attributes = Object.keys(localizationAttributes);
        for (let i = 0; i < attributes.length; i++) {
            let attribute = attributes[i];
            let attributeValue = this.getTranslation(localizationAttributes[attribute]);
            elem.setAttribute(attribute, attributeValue);
        }
    }
    getParamsFromString(paramsString) {
        let keyValuePairs = paramsString.split(';;');
        let params = {};
        for (let i = 0; i < keyValuePairs.length; i++) {
            let pair = keyValuePairs[i].split('=');
            params[pair.shift()] = pair.join('=');
        }
        return params;
    }
}
exports.DomLocaliser = DomLocaliser;
