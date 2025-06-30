import { SupportedLocale, TranslationKey, TranslationResult, TranslationData } from './types';
import { analytics } from '../ai/shared/analytics';

export class TranslationService {
  private translations: TranslationData = {};
  private cache: Map<string, string> = new Map();

  constructor() {
    this.initializeTranslations();
  }

  async translatePrompt(prompt: string, targetLocale: SupportedLocale): Promise<string> {
    if (targetLocale === 'en') {
      return prompt;
    }

    try {
      const cacheKey = `${prompt}_${targetLocale}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      const translated = await this.performTranslation(prompt, targetLocale);
      
      this.cache.set(cacheKey, translated);
      
      await analytics.track('prompt_translated', {
        sourceLocale: 'en',
        targetLocale,
        promptLength: prompt.length,
        timestamp: new Date().toISOString()
      });

      return translated;
    } catch (error) {
      await analytics.track('prompt_translation_failed', {
        targetLocale,
        error: error.message,
        promptLength: prompt.length
      });
      
      return prompt; // Fallback to original
    }
  }

  async translateKey(key: TranslationKey, locale: SupportedLocale): Promise<string> {
    if (locale === 'en') {
      return this.translations[key]?.['en'] || key;
    }

    try {
      const translated = this.translations[key]?.[locale];
      
      if (translated) {
        await analytics.track('key_translated', {
          key,
          locale,
          timestamp: new Date().toISOString()
        });
        
        return translated;
      }

      // Fallback to English
      return this.translations[key]?.['en'] || key;
    } catch (error) {
      await analytics.track('key_translation_failed', {
        key,
        locale,
        error: error.message
      });
      
      return this.translations[key]?.['en'] || key;
    }
  }

  private async performTranslation(text: string, targetLocale: SupportedLocale): Promise<string> {
    // In a real implementation, this would call a translation API
    // For now, we'll use a simple mapping approach
    
    const translations: Record<SupportedLocale, Record<string, string>> = {
      es: {
        'Welcome to SportBeaconAI': 'Bienvenido a SportBeaconAI',
        'Coach Assistant': 'Asistente de Entrenador',
        'Scout Evaluation': 'Evaluación de Observador',
        'Civic Indexer': 'Indexador Cívico',
        'Venue Predictor': 'Predictor de Venues',
        'Complete your profile': 'Complete su perfil',
        'Configure features': 'Configurar características',
        'Invite your team': 'Invitar a su equipo',
        'Customize branding': 'Personalizar marca',
        'Launch your chapter': 'Lanzar su capítulo'
      },
      fr: {
        'Welcome to SportBeaconAI': 'Bienvenue sur SportBeaconAI',
        'Coach Assistant': 'Assistant Entraîneur',
        'Scout Evaluation': 'Évaluation Scout',
        'Civic Indexer': 'Indexeur Civique',
        'Venue Predictor': 'Prédicteur de Lieux',
        'Complete your profile': 'Complétez votre profil',
        'Configure features': 'Configurer les fonctionnalités',
        'Invite your team': 'Invitez votre équipe',
        'Customize branding': 'Personnaliser la marque',
        'Launch your chapter': 'Lancez votre chapitre'
      },
      de: {
        'Welcome to SportBeaconAI': 'Willkommen bei SportBeaconAI',
        'Coach Assistant': 'Trainer-Assistent',
        'Scout Evaluation': 'Scout-Bewertung',
        'Civic Indexer': 'Bürger-Indexer',
        'Venue Predictor': 'Veranstaltungsort-Vorhersage',
        'Complete your profile': 'Vervollständigen Sie Ihr Profil',
        'Configure features': 'Funktionen konfigurieren',
        'Invite your team': 'Laden Sie Ihr Team ein',
        'Customize branding': 'Branding anpassen',
        'Launch your chapter': 'Starten Sie Ihr Kapitel'
      }
    };

    const localeTranslations = translations[targetLocale] || {};
    let translatedText = text;

    for (const [english, translated] of Object.entries(localeTranslations)) {
      translatedText = translatedText.replace(new RegExp(english, 'gi'), translated);
    }

    return translatedText;
  }

  private initializeTranslations(): void {
    this.translations = {
      welcome_message: {
        en: 'Welcome to SportBeaconAI',
        es: 'Bienvenido a SportBeaconAI',
        fr: 'Bienvenue sur SportBeaconAI',
        de: 'Willkommen bei SportBeaconAI'
      },
      coach_assistant_title: {
        en: 'Coach Assistant',
        es: 'Asistente de Entrenador',
        fr: 'Assistant Entraîneur',
        de: 'Trainer-Assistent'
      },
      scout_eval_title: {
        en: 'Scout Evaluation',
        es: 'Evaluación de Observador',
        fr: 'Évaluation Scout',
        de: 'Scout-Bewertung'
      },
      civic_indexer_title: {
        en: 'Civic Indexer',
        es: 'Indexador Cívico',
        fr: 'Indexeur Civique',
        de: 'Bürger-Indexer'
      },
      venue_predictor_title: {
        en: 'Venue Predictor',
        es: 'Predictor de Venues',
        fr: 'Prédicteur de Lieux',
        de: 'Veranstaltungsort-Vorhersage'
      },
      onboarding_step_1: {
        en: 'Welcome to SportBeaconAI',
        es: 'Bienvenido a SportBeaconAI',
        fr: 'Bienvenue sur SportBeaconAI',
        de: 'Willkommen bei SportBeaconAI'
      },
      onboarding_step_2: {
        en: 'Complete Your Profile',
        es: 'Complete su perfil',
        fr: 'Complétez votre profil',
        de: 'Vervollständigen Sie Ihr Profil'
      },
      onboarding_step_3: {
        en: 'Configure Features',
        es: 'Configurar características',
        fr: 'Configurer les fonctionnalités',
        de: 'Funktionen konfigurieren'
      },
      onboarding_step_4: {
        en: 'Invite Your Team',
        es: 'Invitar a su equipo',
        fr: 'Invitez votre équipe',
        de: 'Laden Sie Ihr Team ein'
      },
      onboarding_step_5: {
        en: 'Customize Branding',
        es: 'Personalizar marca',
        fr: 'Personnaliser la marque',
        de: 'Branding anpassen'
      },
      onboarding_step_6: {
        en: 'Launch Your Chapter',
        es: 'Lanzar su capítulo',
        fr: 'Lancez votre chapitre',
        de: 'Starten Sie Ihr Kapitel'
      }
    };
  }
} 