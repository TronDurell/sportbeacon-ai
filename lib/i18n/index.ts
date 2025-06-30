/**
 * @fileoverview Internationalization System with LanguageAgent
 * Provides auto-language detection, prompt translation, and multi-language support
 * 
 * Executive Leadership Clause: This module maintains founder vision
 * for global community accessibility while ensuring cultural sensitivity.
 */

import { LanguageAgent } from './languageAgent';
import { TranslationService } from './translation';
import { LocaleManager } from './localeManager';
import { I18nConfig, SupportedLocale, TranslationKey } from './types';

export class I18nSystem {
  private languageAgent: LanguageAgent;
  private translationService: TranslationService;
  private localeManager: LocaleManager;

  constructor(config?: I18nConfig) {
    this.languageAgent = new LanguageAgent();
    this.translationService = new TranslationService();
    this.localeManager = new LocaleManager(config);
  }

  async detectLanguage(text: string): Promise<SupportedLocale> {
    return this.languageAgent.detectLanguage(text);
  }

  async translatePrompt(prompt: string, targetLocale: SupportedLocale): Promise<string> {
    return this.translationService.translatePrompt(prompt, targetLocale);
  }

  async translateKey(key: TranslationKey, locale: SupportedLocale): Promise<string> {
    return this.translationService.translateKey(key, locale);
  }

  getSupportedLocales(): SupportedLocale[] {
    return this.localeManager.getSupportedLocales();
  }

  async setUserLocale(userId: string, locale: SupportedLocale): Promise<void> {
    await this.localeManager.setUserLocale(userId, locale);
  }

  async getUserLocale(userId: string): Promise<SupportedLocale> {
    return this.localeManager.getUserLocale(userId);
  }
}

export * from './types';
export * from './languageAgent';
export * from './translation';
export * from './localeManager'; 