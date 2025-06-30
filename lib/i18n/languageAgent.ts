import { SupportedLocale, LanguageDetectionResult } from './types';
import { analytics } from '../ai/shared/analytics';

export class LanguageAgent {
  private languagePatterns: Map<SupportedLocale, RegExp[]> = new Map();
  private commonWords: Map<SupportedLocale, Set<string>> = new Map();

  constructor() {
    this.initializeLanguagePatterns();
    this.initializeCommonWords();
  }

  async detectLanguage(text: string): Promise<SupportedLocale> {
    try {
      const result = await this.performDetection(text);
      
      await analytics.track('language_detected', {
        detectedLocale: result.locale,
        confidence: result.confidence,
        textLength: text.length,
        timestamp: new Date().toISOString()
      });

      return result.locale;
    } catch (error) {
      await analytics.track('language_detection_failed', {
        error: error.message,
        textLength: text.length
      });
      
      // Fallback to English
      return 'en';
    }
  }

  private async performDetection(text: string): Promise<LanguageDetectionResult> {
    const scores = new Map<SupportedLocale, number>();
    const normalizedText = text.toLowerCase().trim();

    // Score based on character patterns
    for (const [locale, patterns] of this.languagePatterns) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = normalizedText.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      scores.set(locale, score);
    }

    // Score based on common words
    for (const [locale, words] of this.commonWords) {
      const currentScore = scores.get(locale) || 0;
      const wordMatches = normalizedText.split(' ').filter(word => 
        words.has(word.toLowerCase())
      ).length;
      scores.set(locale, currentScore + wordMatches * 2);
    }

    // Find the locale with highest score
    let bestLocale: SupportedLocale = 'en';
    let bestScore = 0;

    for (const [locale, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestLocale = locale;
      }
    }

    const confidence = Math.min(bestScore / 10, 1); // Normalize confidence

    return {
      locale: bestLocale,
      confidence,
      detectedText: text
    };
  }

  private initializeLanguagePatterns(): void {
    // Spanish patterns
    this.languagePatterns.set('es', [
      /[áéíóúñ]/g,
      /\b(el|la|los|las|un|una|unos|unas)\b/g,
      /\b(es|son|está|están|tiene|tienen)\b/g,
      /\b(hola|bienvenido|gracias|por favor)\b/g,
      /\b(¿|¡)/g
    ]);

    // French patterns
    this.languagePatterns.set('fr', [
      /[àâäéèêëïîôöùûüÿç]/g,
      /\b(le|la|les|un|une|des)\b/g,
      /\b(est|sont|a|ont|être|avoir)\b/g
    ]);

    // German patterns
    this.languagePatterns.set('de', [
      /[äöüß]/g,
      /\b(der|die|das|ein|eine|eines)\b/g,
      /\b(ist|sind|hat|haben|werden|wurden)\b/g
    ]);

    // Chinese patterns
    this.languagePatterns.set('zh', [
      /[\u4e00-\u9fff]/g,
      /[的|是|在|有|和|与|或]/g
    ]);

    // Japanese patterns
    this.languagePatterns.set('ja', [
      /[\u3040-\u309f\u30a0-\u30ff]/g, // Hiragana and Katakana
      /[\u4e00-\u9fff]/g, // Kanji
      /[は|が|を|に|へ|で|と|から|まで]/g
    ]);

    // Korean patterns
    this.languagePatterns.set('ko', [
      /[\uac00-\ud7af]/g, // Hangul
      /[은|는|이|가|을|를|에|에서|로|으로]/g
    ]);

    // Arabic patterns
    this.languagePatterns.set('ar', [
      /[\u0600-\u06ff]/g, // Arabic Unicode range
      /[ال|في|من|إلى|على|عن|مع|بين]/g
    ]);
  }

  private initializeCommonWords(): void {
    // Spanish common words
    this.commonWords.set('es', new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'pero', 'si', 'no',
      'es', 'son', 'está', 'están', 'tiene', 'tienen', 'para', 'por', 'con',
      'hola', 'bienvenido', 'gracias', 'por favor', 'cómo', 'estás', 'qué'
    ]));

    // French common words
    this.commonWords.set('fr', new Set([
      'le', 'la', 'les', 'un', 'une', 'et', 'ou', 'mais', 'si', 'non',
      'est', 'sont', 'a', 'ont', 'pour', 'avec', 'dans', 'sur'
    ]));

    // German common words
    this.commonWords.set('de', new Set([
      'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'wenn', 'nicht',
      'ist', 'sind', 'hat', 'haben', 'für', 'mit', 'in', 'auf'
    ]));

    // English common words (fallback)
    this.commonWords.set('en', new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'if', 'not', 'is', 'are',
      'has', 'have', 'for', 'with', 'in', 'on', 'at', 'to', 'of'
    ]));
  }
} 