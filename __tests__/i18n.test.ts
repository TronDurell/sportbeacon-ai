import { I18nSystem } from '../lib/i18n';

describe('I18nSystem', () => {
  let i18nSystem: I18nSystem;

  beforeEach(() => {
    i18nSystem = new I18nSystem();
  });

  describe('detectLanguage', () => {
    it('should detect English text', async () => {
      const text = 'Welcome to SportBeaconAI';
      const locale = await i18nSystem.detectLanguage(text);
      
      expect(locale).toBe('en');
    });

    it('should detect Spanish text', async () => {
      const text = 'Hola, bienvenido a SportBeaconAI. ¿Cómo estás?';
      const locale = await i18nSystem.detectLanguage(text);
      
      expect(locale).toBe('es');
    });

    it('should detect French text', async () => {
      const text = 'Bienvenue sur SportBeaconAI';
      const locale = await i18nSystem.detectLanguage(text);
      
      expect(locale).toBe('fr');
    });
  });

  describe('translatePrompt', () => {
    it('should translate English prompt to Spanish', async () => {
      const prompt = 'Welcome to SportBeaconAI';
      const translated = await i18nSystem.translatePrompt(prompt, 'es');
      
      expect(translated).toBeDefined();
      expect(typeof translated).toBe('string');
      expect(translated).toContain('Bienvenido');
    });

    it('should return original prompt for English target', async () => {
      const prompt = 'Welcome to SportBeaconAI';
      const translated = await i18nSystem.translatePrompt(prompt, 'en');
      
      expect(translated).toBe(prompt);
    });
  });

  describe('translateKey', () => {
    it('should translate welcome message', async () => {
      const translated = await i18nSystem.translateKey('welcome_message', 'es');
      
      expect(translated).toBeDefined();
      expect(typeof translated).toBe('string');
    });

    it('should return key for unsupported locale', async () => {
      const translated = await i18nSystem.translateKey('welcome_message', 'xx' as any);
      
      expect(translated).toBe('Welcome to SportBeaconAI');
    });
  });

  describe('getSupportedLocales', () => {
    it('should return list of supported locales', () => {
      const locales = i18nSystem.getSupportedLocales();
      
      expect(Array.isArray(locales)).toBe(true);
      expect(locales.length).toBeGreaterThan(0);
      expect(locales).toContain('en');
      expect(locales).toContain('es');
      expect(locales).toContain('fr');
    });
  });

  describe('setUserLocale', () => {
    it('should set user locale', async () => {
      const userId = 'test-user';
      const locale = 'es';
      
      await i18nSystem.setUserLocale(userId, locale);
      const userLocale = await i18nSystem.getUserLocale(userId);
      
      expect(userLocale).toBe(locale);
    });
  });
}); 