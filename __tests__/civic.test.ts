import { CivicSystem } from '../lib/civic';

describe('CivicSystem', () => {
  let civicSystem: CivicSystem;

  beforeEach(() => {
    civicSystem = new CivicSystem();
  });

  describe('getCityMetrics', () => {
    it('should return city metrics', async () => {
      const cityId = 'cary-nc';
      
      const metrics = await civicSystem.getCityMetrics(cityId);
      
      expect(metrics).toBeDefined();
      expect(metrics.cityId).toBe(cityId);
      expect(metrics.name).toBeDefined();
      expect(metrics.population).toBeGreaterThan(0);
      expect(metrics.sportsParticipation).toBeDefined();
      expect(metrics.facilities).toBeDefined();
      expect(metrics.programs).toBeDefined();
      expect(metrics.economic).toBeDefined();
      expect(metrics.health).toBeDefined();
      expect(metrics.social).toBeDefined();
      expect(metrics.environmental).toBeDefined();
      expect(metrics.technology).toBeDefined();
      expect(metrics.overallScore).toBeGreaterThan(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle non-existent city', async () => {
      const cityId = 'nonexistent-city';
      
      await expect(civicSystem.getCityMetrics(cityId))
        .rejects.toThrow();
    });
  });

  describe('trackImpact', () => {
    it('should track initiative impact', async () => {
      // First create an initiative
      const initiative = {
        name: 'Test Initiative',
        description: 'A test civic initiative',
        category: 'youth_development',
        targetMetrics: ['participation_rate', 'skill_improvement'],
        budget: 100000,
        timeline: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        stakeholders: ['cary-nc', 'local_schools'],
        status: 'planning',
        impact: {
          participants: 0,
          reach: 0,
          satisfaction: 0,
          outcomes: {},
          costEffectiveness: 0,
          sustainability: 0
        }
      };
      
      const initiativeId = await civicSystem.launchInitiative(initiative);
      
      const data = {
        participants: 100,
        reach: 500,
        satisfaction: 4.5,
        outcomes: {
          'participation_rate': 85,
          'skill_improvement': 78
        },
        costEffectiveness: 0.8,
        sustainability: 0.7
      };
      
      await expect(civicSystem.trackImpact(initiativeId, data))
        .resolves.not.toThrow();
    });
  });

  describe('generateReport', () => {
    it('should generate impact report', async () => {
      const cityId = 'cary-nc';
      const timeframe = '6 months';
      
      const report = await civicSystem.generateReport(cityId, timeframe);
      
      expect(report).toBeDefined();
      expect(report.cityId).toBe(cityId);
      expect(report.timeframe).toBe(timeframe);
      expect(report.initiatives).toBeDefined();
      expect(Array.isArray(report.initiatives)).toBe(true);
      expect(report.metrics).toBeDefined();
      expect(report.trends).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.generatedAt).toBeDefined();
    });
  });

  describe('launchInitiative', () => {
    it('should launch civic initiative', async () => {
      const initiative = {
        name: 'Test Initiative',
        description: 'A test civic initiative',
        category: 'youth_development',
        targetMetrics: ['participation_rate', 'skill_improvement'],
        budget: 100000,
        timeline: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        stakeholders: ['cary-nc', 'local_schools'],
        status: 'planning',
        impact: {
          participants: 0,
          reach: 0,
          satisfaction: 0,
          outcomes: {},
          costEffectiveness: 0,
          sustainability: 0
        }
      };
      
      const initiativeId = await civicSystem.launchInitiative(initiative);
      
      expect(initiativeId).toBeDefined();
      expect(typeof initiativeId).toBe('string');
    });
  });
}); 