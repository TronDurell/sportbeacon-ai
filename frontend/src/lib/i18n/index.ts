// React-compatible i18n system - replace with Vue i18n if using Vue
interface I18nInstance {
  global: {
    locale: string;
    fallbackLocale: string;
    messages: Record<string, any>;
    t: (key: string, params?: any) => string;
    setLocaleMessage: (locale: string, messages: any) => void;
  };
}

const createI18n = (config: any): I18nInstance => {
  return {
    global: {
      locale: config.locale,
      fallbackLocale: config.fallbackLocale,
      messages: config.messages,
      t: (key: string, params?: any) => {
        const messages = config.messages[config.locale] || config.messages[config.fallbackLocale] || {};
        let message = messages[key] || key;
        
        if (params) {
          Object.entries(params).forEach(([param, value]) => {
            message = message.replace(new RegExp(`{${param}}`, "g"), String(value));
          });
        }
        
        return message;
      },
      setLocaleMessage: (locale: string, messages: any) => {
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
  static detect(): string {
    // Check localStorage first
    const savedLanguage = localStorage.getItem("preferred_language");
    if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage as keyof typeof SUPPORTED_LANGUAGES]) {
      return savedLanguage;
    }

    // Check browser language
    const browserLanguage = navigator.language.split("-")[0];
    if (SUPPORTED_LANGUAGES[browserLanguage as keyof typeof SUPPORTED_LANGUAGES]) {
      return browserLanguage || 'en';
    }

    // Check navigator.languages
    for (const lang of navigator.languages) {
      const languageCode = lang.split("-")[0];
      if (SUPPORTED_LANGUAGES[languageCode as keyof typeof SUPPORTED_LANGUAGES]) {
        return languageCode || 'en';
      }
    }

    return DEFAULT_LANGUAGE;
  }

  static setLanguage(language: string): void {
    if (SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES]) {
      localStorage.setItem("preferred_language", language);
      document.documentElement.lang = language;
      document.documentElement.dir = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES].direction;
    }
  }

  static getCurrentLanguage(): string {
    return localStorage.getItem("preferred_language") || this.detect();
  }
}

// Translation loading utilities
export class TranslationLoader {
  private static loadedLanguages: Set<string> = new Set();
  private static loadingPromises: Map<string, Promise<any>> = new Map();

  static async loadLanguage(language: string): Promise<any> {
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
    } catch (error) {
      this.loadingPromises.delete(language);
      return {};
    }
  }

  private static async loadLanguageFile(language: string): Promise<any> {
    try {
      // Dynamic import of translation files
      const module = await import(`./locales/${language}.json`);
      return module.default;
    } catch (error) {
      return {};
    }
  }

  static isLanguageLoaded(language: string): boolean {
    return this.loadedLanguages.has(language);
  }

  static getLoadedLanguages(): string[] {
    return Array.from(this.loadedLanguages);
  }
}

// i18n instance
class I18nManager {
  private i18n!: I18nInstance;
  private currentLanguage: string;

  constructor() {
    this.currentLanguage = LanguageDetector.detect();
    this.initializeI18n();
  }

  private async initializeI18n(): Promise<void> {
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

  async loadLanguage(language: string): Promise<void> {
    if (!SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES]) {
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
    } catch (error) {
      }
  }

  async changeLanguage(language: string): Promise<void> {
    await this.loadLanguage(language);
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  getSupportedLanguages(): typeof SUPPORTED_LANGUAGES {
    return SUPPORTED_LANGUAGES;
  }

  t(key: string, params?: Record<string, any>): string {
    if (!this.i18n) {
      return key;
    }
    return this.i18n.global.t(key, params);
  }

  getI18nInstance(): I18nInstance {
    return this.i18n;
  }

  // Utility methods for common translations
  formatCurrency(amount: number, currency: string = "USD"): string {
    const locale = this.currentLanguage;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency
    }).format(amount);
  }

  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const locale = this.currentLanguage;
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const locale = this.currentLanguage;
    return new Intl.NumberFormat(locale, options).format(number);
  }

  formatRelativeTime(date: Date): string {
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
export const t = (key: string, params?: Record<string, any>): string => {
  return i18nManager.t(key, params);
};

export const changeLanguage = async (language: string): Promise<void> => {
  await i18nManager.changeLanguage(language);
};

export const getCurrentLanguage = (): string => {
  return i18nManager.getCurrentLanguage();
};

export const getSupportedLanguages = (): typeof SUPPORTED_LANGUAGES => {
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

// Language switcher component props
export interface LanguageSwitcherProps {
  onLanguageChange?: (language: string) => void;
  showFlags?: boolean;
  showNativeNames?: boolean;
  className?: string;
}

// Default export
export default i18nManager; 