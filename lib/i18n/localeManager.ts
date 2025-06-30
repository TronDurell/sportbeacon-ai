import { SupportedLocale, I18nConfig } from './types';
import { analytics } from '../ai/shared/analytics';

export class LocaleManager {
  private config: I18nConfig;
  private userLocales: Map<string, SupportedLocale> = new Map();

  constructor(config?: I18nConfig) {
    this.config = config || {
      defaultLocale: 'en',
      fallbackLocale: 'en',
      supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
      autoDetect: true,
      cacheTranslations: true
    };
  }

  async setUserLocale(userId: string, locale: SupportedLocale): Promise<void> {
    if (!this.config.supportedLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    this.userLocales.set(userId, locale);
    
    await analytics.track('user_locale_set', {
      userId,
      locale,
      timestamp: new Date().toISOString()
    });
  }

  async getUserLocale(userId: string): Promise<SupportedLocale> {
    const userLocale = this.userLocales.get(userId);
    
    if (userLocale) {
      return userLocale;
    }

    // Return default locale if user hasn't set one
    return this.config.defaultLocale;
  }

  getSupportedLocales(): SupportedLocale[] {
    return [...this.config.supportedLocales];
  }

  getDefaultLocale(): SupportedLocale {
    return this.config.defaultLocale;
  }

  getFallbackLocale(): SupportedLocale {
    return this.config.fallbackLocale;
  }

  isLocaleSupported(locale: string): boolean {
    return this.config.supportedLocales.includes(locale as SupportedLocale);
  }

  async getLocaleStats(): Promise<Record<SupportedLocale, number>> {
    const stats: Record<SupportedLocale, number> = {};
    
    // Initialize all supported locales with 0
    for (const locale of this.config.supportedLocales) {
      stats[locale] = 0;
    }

    // Count user preferences
    for (const locale of this.userLocales.values()) {
      stats[locale] = (stats[locale] || 0) + 1;
    }

    await analytics.track('locale_stats_accessed', {
      stats,
      timestamp: new Date().toISOString()
    });

    return stats;
  }

  async migrateUserLocale(userId: string, oldLocale: SupportedLocale, newLocale: SupportedLocale): Promise<void> {
    if (!this.config.supportedLocales.includes(newLocale)) {
      throw new Error(`Cannot migrate to unsupported locale: ${newLocale}`);
    }

    await this.setUserLocale(userId, newLocale);
    
    await analytics.track('user_locale_migrated', {
      userId,
      oldLocale,
      newLocale,
      timestamp: new Date().toISOString()
    });
  }
} 