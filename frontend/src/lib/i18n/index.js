const createI18n = (config) => {
    return {
        global: {
            locale: config.locale,
            fallbackLocale: config.fallbackLocale,
            messages: config.messages,
            t: (key, params) => {
                const messages = config.messages[config.locale] || config.messages[config.fallbackLocale] || {};
                let message = messages[key] || key;
                if (params) {
                    Object.entries(params).forEach(([param, value]) => {
                        message = message.replace(new RegExp(`{${param}}`, "g"), String(value));
                    });
                }
                return message;
            },
            setLocaleMessage: (locale, messages) => {
                config.messages[locale] = messages;
            }
        }
    };
};
// Supported languages
export const SUPPORTED_LANGUAGES = {
    en: {
        name: "English",
        nativeName: "English",
        flag: "🇺🇸",
        direction: "ltr"
    },
    es: {
        name: "Spanish",
        nativeName: "Español",
        flag: "🇪🇸",
        direction: "ltr"
    },
    fr: {
        name: "French",
        nativeName: "Français",
        flag: "🇫🇷",
        direction: "ltr"
    },
    pt: {
        name: "Portuguese",
        nativeName: "Português",
        flag: "🇵🇹",
        direction: "ltr"
    },
    sw: {
        name: "Swahili",
        nativeName: "Kiswahili",
        flag: "🇹🇿",
        direction: "ltr"
    }
};
export const DEFAULT_LANGUAGE = "en";
export const FALLBACK_LANGUAGE = "en";
// Language detection utilities
export class LanguageDetector {
    static detect() {
        // Check localStorage first
        const savedLanguage = localStorage.getItem("preferred_language");
        if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
            return savedLanguage;
        }
        // Check browser language
        const browserLanguage = navigator.language.split("-")[0];
        if (SUPPORTED_LANGUAGES[browserLanguage]) {
            return browserLanguage || 'en';
        }
        // Check navigator.languages
        for (const lang of navigator.languages) {
            const languageCode = lang.split("-")[0];
            if (SUPPORTED_LANGUAGES[languageCode]) {
                return languageCode || 'en';
            }
        }
        return DEFAULT_LANGUAGE;
    }
    static setLanguage(language) {
        if (SUPPORTED_LANGUAGES[language]) {
            localStorage.setItem("preferred_language", language);
            document.documentElement.lang = language;
            document.documentElement.dir = SUPPORTED_LANGUAGES[language].direction;
        }
    }
    static getCurrentLanguage() {
        return localStorage.getItem("preferred_language") || this.detect();
    }
}
// Translation loading utilities
export class TranslationLoader {
    static loadedLanguages = new Set();
    static loadingPromises = new Map();
    static async loadLanguage(language) {
        if (this.loadedLanguages.has(language)) {
            return Promise.resolve({});
        }
        if (this.loadingPromises.has(language)) {
            return this.loadingPromises.get(language);
        }
        const loadPromise = this.loadLanguageFile(language);
        this.loadingPromises.set(language, loadPromise);
        try {
            const translations = await loadPromise;
            this.loadedLanguages.add(language);
            this.loadingPromises.delete(language);
            return translations;
        }
        catch (error) {
            this.loadingPromises.delete(language);
            return {};
        }
    }
    static async loadLanguageFile(language) {
        try {
            // Dynamic import of translation files
            const module = await import(`./locales/${language}.json`);
            return module.default;
        }
        catch (error) {
            return {};
        }
    }
    static isLanguageLoaded(language) {
        return this.loadedLanguages.has(language);
    }
    static getLoadedLanguages() {
        return Array.from(this.loadedLanguages);
    }
}
// i18n instance
class I18nManager {
    i18n;
    currentLanguage;
    constructor() {
        this.currentLanguage = LanguageDetector.detect();
        this.initializeI18n();
    }
    async initializeI18n() {
        // Load default language first
        const defaultTranslations = await TranslationLoader.loadLanguage(DEFAULT_LANGUAGE);
        this.i18n = createI18n({
            locale: this.currentLanguage,
            fallbackLocale: FALLBACK_LANGUAGE,
            messages: {
                [DEFAULT_LANGUAGE]: defaultTranslations
            }
        });
        // Load current language if different from default
        if (this.currentLanguage !== DEFAULT_LANGUAGE) {
            await this.loadLanguage(this.currentLanguage);
        }
    }
    async loadLanguage(language) {
        if (!SUPPORTED_LANGUAGES[language]) {
            return;
        }
        try {
            const translations = await TranslationLoader.loadLanguage(language);
            if (this.i18n) {
                this.i18n.global.setLocaleMessage(language, translations);
                this.i18n.global.locale = language;
                this.currentLanguage = language;
                LanguageDetector.setLanguage(language);
            }
        }
        catch (error) {
        }
    }
    async changeLanguage(language) {
        await this.loadLanguage(language);
    }
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    getSupportedLanguages() {
        return SUPPORTED_LANGUAGES;
    }
    t(key, params) {
        if (!this.i18n) {
            return key;
        }
        return this.i18n.global.t(key, params);
    }
    getI18nInstance() {
        return this.i18n;
    }
    // Utility methods for common translations
    formatCurrency(amount, currency = "USD") {
        const locale = this.currentLanguage;
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency
        }).format(amount);
    }
    formatDate(date, options) {
        const locale = this.currentLanguage;
        return new Intl.DateTimeFormat(locale, options).format(date);
    }
    formatNumber(number, options) {
        const locale = this.currentLanguage;
        return new Intl.NumberFormat(locale, options).format(number);
    }
    formatRelativeTime(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        for (const [unit, seconds] of Object.entries(intervals)) {
            const interval = Math.floor(diffInSeconds / seconds);
            if (interval >= 1) {
                return this.t(`time.${unit}${interval === 1 ? "" : "s"}`, { count: interval });
            }
        }
        return this.t("time.justNow");
    }
}
// Export singleton instance
export const i18nManager = new I18nManager();
// Convenience functions
export const t = (key, params) => {
    return i18nManager.t(key, params);
};
export const changeLanguage = async (language) => {
    await i18nManager.changeLanguage(language);
};
export const getCurrentLanguage = () => {
    return i18nManager.getCurrentLanguage();
};
export const getSupportedLanguages = () => {
    return i18nManager.getSupportedLanguages();
};
// React hook for i18n (if using React)
export const useI18n = () => {
    return {
        t: i18nManager.t.bind(i18nManager),
        changeLanguage: i18nManager.changeLanguage.bind(i18nManager),
        getCurrentLanguage: i18nManager.getCurrentLanguage.bind(i18nManager),
        getSupportedLanguages: i18nManager.getSupportedLanguages.bind(i18nManager),
        formatCurrency: i18nManager.formatCurrency.bind(i18nManager),
        formatDate: i18nManager.formatDate.bind(i18nManager),
        formatNumber: i18nManager.formatNumber.bind(i18nManager),
        formatRelativeTime: i18nManager.formatRelativeTime.bind(i18nManager)
    };
};
// Default export
export default i18nManager;
