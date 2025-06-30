import { GrantSystem } from '../lib/grants';

describe('GrantSystem', () => {
  let grantSystem: GrantSystem;

  beforeEach(() => {
    grantSystem = new GrantSystem();
  });

  describe('findGrants', () => {
    it('should find grants matching criteria', async () => {
      const criteria = {
        category: 'youth_programs',
        amount: {
          min: 5000,
          max: 50000
        },
        location: {
          country: 'USA'
        },
        eligibility: {
          organizationType: ['nonprofit'],
          focusAreas: ['youth_development'],
          experienceLevel: 'established_organization'
        },
        deadline: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31')
        }
      };

      const grants = await grantSystem.findGrants(criteria);
      
      expect(Array.isArray(grants)).toBe(true);
      expect(grants.length).toBeGreaterThan(0);
      
      const grant = grants[0];
      expect(grant.category).toBe('youth_programs');
      expect(grant.amount.min).toBeGreaterThanOrEqual(5000);
      expect(grant.amount.max).toBeLessThanOrEqual(50000);
    });

    it('should return empty array for no matches', async () => {
      const criteria = {
        category: 'nonexistent_category',
        amount: { min: 0, max: 1000 },
        location: { country: 'XX' },
        eligibility: {
          organizationType: ['nonexistent'],
          focusAreas: ['nonexistent'],
          experienceLevel: 'any'
        },
        deadline: {
          from: new Date('2020-01-01'),
          to: new Date('2020-12-31')
        }
      };

      const grants = await grantSystem.findGrants(criteria);
      
      expect(Array.isArray(grants)).toBe(true);
      expect(grants.length).toBe(0);
    });
  });

  describe('generateApplicationDraft', () => {
    it('should generate application draft', async () => {
      const grantId = 'grant-001';
      const organizationData = {
        name: 'Test Organization',
        type: 'nonprofit',
        establishedYear: 2020,
        targetPopulation: 'youth',
        serviceArea: 'local community',
        mission: 'To serve the community',
        staffCount: 10,
        annualParticipants: 500
      };

      const draft = await grantSystem.generateApplicationDraft(grantId, organizationData);
      
      expect(draft).toBeDefined();
      expect(draft.grantId).toBe(grantId);
      expect(draft.sections).toBeDefined();
      expect(Array.isArray(draft.sections)).toBe(true);
      expect(draft.completionPercentage).toBeGreaterThan(0);
      expect(draft.status).toBe('draft');
    });
  });

  describe('trackDeadlines', () => {
    it('should return upcoming deadlines', async () => {
      const deadlines = await grantSystem.trackDeadlines();
      
      expect(Array.isArray(deadlines)).toBe(true);
    });
  });

  describe('subscribeToGrant', () => {
    it('should subscribe user to grant', async () => {
      const grantId = 'grant-001';
      const userId = 'test-user';
      
      await expect(grantSystem.subscribeToGrant(grantId, userId))
        .resolves.not.toThrow();
    });
  });
}); 