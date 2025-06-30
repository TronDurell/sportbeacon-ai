import { ChapterManager } from '../lib/chapters';

describe('ChapterManager', () => {
  let chapterManager: ChapterManager;

  beforeEach(() => {
    chapterManager = new ChapterManager();
  });

  describe('createChapter', () => {
    it('should create a new chapter successfully', async () => {
      const config = {
        name: 'Test Chapter',
        location: {
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country'
        },
        contact: {
          email: 'test@example.com'
        },
        settings: {
          autoOnboarding: true,
          customBranding: false,
          analyticsEnabled: true
        },
        features: {
          coachAgent: true,
          scoutEval: true,
          civicIndexer: false,
          venuePredictor: false
        }
      };

      const chapterId = await chapterManager.createChapter(config);
      
      expect(chapterId).toBeDefined();
      expect(typeof chapterId).toBe('string');
      expect(chapterId).toContain('chapter-');
    });

    it('should handle chapter creation errors', async () => {
      const invalidConfig = {} as any;
      
      await expect(chapterManager.createChapter(invalidConfig))
        .rejects.toThrow();
    });
  });

  describe('getChapterMetrics', () => {
    it('should return chapter metrics', async () => {
      const chapterId = 'test-chapter-id';
      const metrics = await chapterManager.getChapterMetrics(chapterId);
      
      expect(metrics).toBeDefined();
      expect(metrics.chapterId).toBe(chapterId);
      expect(metrics.activeUsers).toBeGreaterThan(0);
      expect(metrics.totalEvents).toBeGreaterThan(0);
      expect(metrics.revenue).toBeGreaterThan(0);
    });
  });

  describe('generateOnboardingScript', () => {
    it('should generate onboarding script', async () => {
      const chapterId = 'test-chapter-id';
      const script = await chapterManager.generateOnboardingScript(chapterId);
      
      expect(script).toBeDefined();
      expect(typeof script).toBe('string');
      expect(script).toContain('SportBeaconAI Chapter Onboarding Script');
      expect(script).toContain(chapterId);
    });
  });
}); 