"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const LocalizerBase = require("localizer");
const supportedLocales = {
    'ar-sa': () => require('../translations/ar.json'),
    'bg-bg': () => require('../translations/bg.json'),
    'ca-es': () => require('../translations/ca.json'),
    'cs-cz': () => require('../translations/cs.json'),
    'da-dk': () => require('../translations/da.json'),
    'de-de': () => require('../translations/de.json'),
    'el-gr': () => require('../translations/el.json'),
    'en-gb': () => require('../translations/en-GB.json'),
    'en-us': () => require('../translations/en.json'),
    'es-es': () => require('../translations/es.json'),
    'es-mx': () => require('../translations/es-MX.json'),
    'es-us': () => require('../translations/es-US.json'),
    'et-ee': () => require('../translations/et.json'),
    'fi-fi': () => require('../translations/fi.json'),
    'fr-fr': () => require('../translations/fr.json'),
    'he-il': () => require('../translations/he.json'),
    'hi-in': () => require('../translations/hi.json'),
    'hr-hr': () => require('../translations/hr.json'),
    'hu-hu': () => require('../translations/hu.json'),
    'id-id': () => require('../translations/id.json'),
    'it-it': () => require('../translations/it.json'),
    'ja-jp': () => require('../translations/ja.json'),
    'ko-kr': () => require('../translations/ko.json'),
    'lt-lt': () => require('../translations/lt.json'),
    'lv-lv': () => require('../translations/lv.json'),
    'ms-my': () => require('../translations/ms.json'),
    'nb-no': () => require('../translations/nb.json'),
    'nl-nl': () => require('../translations/nl.json'),
    'pl-pl': () => require('../translations/pl.json'),
    'pt-br': () => require('../translations/pt-BR.json'),
    'pt-pt': () => require('../translations/pt.json'),
    'ro-ro': () => require('../translations/ro.json'),
    'ru-ru': () => require('../translations/ru.json'),
    'sk-sk': () => require('../translations/sk.json'),
    'sl-si': () => require('../translations/sl.json'),
    'sr-latn-rs': () => require('../translations/sr-Latn.json'),
    'sv-se': () => require('../translations/sv.json'),
    'th-th': () => require('../translations/th.json'),
    'tr-tr': () => require('../translations/tr.json'),
    'uk-ua': () => require('../translations/uk.json'),
    'vi-vn': () => require('../translations/vi.json'),
    'zh-cn': () => require('../translations/zh-CN.json'),
    'zh-tw': () => require('../translations/zh-TW.json')
};
class Localisation extends events_1.EventEmitter {
    constructor(detectionFunction, persistence) {
        super();
        this.supportedLanguages = Object.keys(supportedLocales);
        this.getNormalizedLocale = (locale) => {
            const matchedLocale = locale.match('^[a-z]+_[A-Z]+');
            return matchedLocale ? matchedLocale[0].replace('_', '-') : locale;
        };
        this.detectionFunction = detectionFunction;
        this.persistence = persistence;
    }
    updateConfig() {
        this.englishStringTable = supportedLocales[Localisation.defaultLocale]();
        let userSetLocale = '';
        if (typeof this.persistence !== 'undefined' && this.persistence.has(Localisation.SELECTED_LOCALE_KEY)) {
            userSetLocale = this.persistence.get(Localisation.SELECTED_LOCALE_KEY);
        }
        this.detectAndSetLocale(userSetLocale);
    }
    getLanguage() {
        return this.language;
    }
    isLanguageRtl(language) {
        language = language.toLowerCase();
        return language === 'ar' || language === 'he' || language === 'iw';
    }
    getLanguageFromLocale(locale) {
        return Localisation.localeLanguageExceptions[locale] || locale.split('-')[0];
    }
    getLanguageCodeInSkypeFormat() {
        const language = this.language.toLowerCase();
        const map = {
            'zh-cn': 'zh-hans',
            'zh-tw': 'zh-hant'
        };
        return map[language] || language;
    }
    getLocale() {
        return this.locale;
    }
    setLocale(locale) {
        if (this.locale === locale) {
            return;
        }
        if (locale) {
            this.persistence.set(Localisation.SELECTED_LOCALE_KEY, locale);
        }
        else {
            this.persistence.delete(Localisation.SELECTED_LOCALE_KEY);
        }
        this.detectAndSetLocale(locale);
        this.emit(Localisation.LocaleChangeEvent, this.locale);
    }
    getUnderscoreSeparatedLocale(locale) {
        if (locale) {
            return locale.replace('-', '_');
        }
        return this.locale.replace('-', '_');
    }
    getDetectedSystemLocale() {
        return this.detectedSystemLocale;
    }
    getString(path, paramData = {}) {
        return LocalizerBase.getString(path, paramData);
    }
    detectAndSetLocale(override) {
        if (override) {
            this.detectedSystemLocale = this.getNormalizedLocale(override);
        }
        else {
            this.detectedSystemLocale = this.getNormalizedLocale(this.detectionFunction());
        }
        this.setLanguageAndLocale(this.detectedSystemLocale);
    }
    setLanguageAndLocale(locale) {
        LocalizerBase.config = {
            normalizeLocale: this.getNormalizedLocale,
            getLocaleInfoFromLocale: (locale) => {
                locale = LocalizerBase.fallbackLocale(locale, this.supportedLanguages, Localisation.defaultLocale);
                return {
                    newLocale: locale,
                    localizedStringTable: supportedLocales[locale]()
                };
            },
            defaultStringTable: supportedLocales[Localisation.defaultLocale]()
        };
        LocalizerBase.setSystemLocale(locale);
        this.locale = LocalizerBase.getLocale();
        this.language = this.getLanguageFromLocale(this.locale).toLowerCase();
        process.env.LANG = this.language;
    }
}
Localisation.LocaleChangeEvent = 'locale-change';
Localisation.defaultLocale = 'en-us';
Localisation.localeLanguageExceptions = {
    'pt-br': 'pt-br',
    'zh-cn': 'zh-cn',
    'zh-tw': 'zh-tw',
    'sr-latn-rs': 'sr-latn',
    'en-gb': 'en-gb',
    'es-us': 'es-us',
    'es-mx': 'es-mx'
};
Localisation.SELECTED_LOCALE_KEY = 'SelectedLocale';
exports.Localisation = Localisation;
