import { MobileAIStudio } from '../lib/studio';

describe('MobileAIStudio', () => {
  let studio: MobileAIStudio;

  beforeEach(() => {
    studio = new MobileAIStudio();
  });

  describe('createVideoProject', () => {
    it('should create video project', async () => {
      const userId = 'test-user';
      const config = {
        title: 'Test Video',
        description: 'A test video project',
        category: 'sports_highlight'
      };

      const project = await studio.createVideoProject(userId, config);
      
      expect(project).toBeDefined();
      expect(project.userId).toBe(userId);
      expect(project.title).toBe(config.title);
      expect(project.description).toBe(config.description);
      expect(project.category).toBe(config.category);
      expect(project.status).toBe('draft');
    });
  });

  describe('publishVideo', () => {
    it('should publish video project', async () => {
      // First create a video project
      const userId = 'test-user';
      const config = {
        title: 'Test Video',
        description: 'A test video project',
        category: 'sports_highlight'
      };

      const project = await studio.createVideoProject(userId, config);
      
      // Add a video asset to make it publishable
      await studio.addVideoAsset(project.id, {
        id: 'asset-1',
        type: 'video',
        url: 'https://example.com/video.mp4',
        format: 'mp4',
        size: 1024 * 1024, // 1MB
        duration: 60,
        thumbnail: 'https://example.com/thumbnail.jpg'
      });
      
      const publishUrl = await studio.publishVideo(project.id);
      
      expect(publishUrl).toBeDefined();
      expect(typeof publishUrl).toBe('string');
      expect(publishUrl).toContain('sportbeacon.ai/studio/videos/');
    });
  });

  describe('getMonetizationTiers', () => {
    it('should return monetization tiers', async () => {
      const userId = 'test-user';
      
      const tiers = await studio.getMonetizationTiers(userId);
      
      expect(Array.isArray(tiers)).toBe(true);
      expect(tiers.length).toBeGreaterThan(0);
      
      const tier = tiers[0];
      expect(tier.id).toBeDefined();
      expect(tier.name).toBeDefined();
      expect(tier.requirements).toBeDefined();
      expect(Array.isArray(tier.requirements)).toBe(true);
      expect(tier.benefits).toBeDefined();
      expect(Array.isArray(tier.benefits)).toBe(true);
      expect(tier.revenueShare).toBeGreaterThan(0);
      expect(tier.revenueShare).toBeLessThanOrEqual(1);
    });
  });

  describe('awardBadge', () => {
    it('should award badge to user', async () => {
      const userId = 'test-user';
      const badgeType = 'first_video';
      
      const badge = await studio.awardBadge(userId, badgeType);
      
      expect(badge).toBeDefined();
      expect(badge.userId).toBe(userId);
      expect(badge.type).toBe(badgeType);
      expect(badge.name).toBeDefined();
      expect(badge.description).toBeDefined();
      expect(badge.icon).toBeDefined();
      expect(badge.earnedDate).toBeDefined();
    });
  });
}); 