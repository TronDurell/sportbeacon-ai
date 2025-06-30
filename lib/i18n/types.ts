export type SupportedLocale = 
  | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko'
  | 'ar' | 'hi' | 'bn' | 'tr' | 'nl' | 'sv' | 'no' | 'da' | 'fi' | 'pl';

export interface I18nConfig {
  defaultLocale: SupportedLocale;
  fallbackLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  autoDetect: boolean;
  cacheTranslations: boolean;
}

export type TranslationKey = 
  | 'welcome_message'
  | 'coach_assistant_title'
  | 'scout_eval_title'
  | 'civic_indexer_title'
  | 'venue_predictor_title'
  | 'onboarding_step_1'
  | 'onboarding_step_2'
  | 'onboarding_step_3'
  | 'onboarding_step_4'
  | 'onboarding_step_5'
  | 'onboarding_step_6'
  | 'error_generic'
  | 'success_saved'
  | 'loading'
  | 'submit'
  | 'cancel'
  | 'save'
  | 'delete'
  | 'edit'
  | 'view';

export interface TranslationData {
  [key: string]: {
    [locale in SupportedLocale]?: string;
  };
}

export interface LanguageDetectionResult {
  locale: SupportedLocale;
  confidence: number;
  detectedText: string;
}

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLocale: SupportedLocale;
  targetLocale: SupportedLocale;
  confidence: number;
} 