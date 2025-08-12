import { civicAgent } from '../civicAgent';
import type { 
  WaitlistActionInput, 
  SiblingConflictInput, 
  DecisionSummaryInput,
  AIRecommendation,
  SiblingConflict,
  DecisionSummary 
} from '../civicAgent';

describe('CivicAgent', () => {
  describe('recommendWaitlistAction', () => {
    test('should approve when child meets age requirements', async () => {
      const input: WaitlistActionInput = {
        childAge: 8,
        requestedAge: 8,
        leagueId: 'league-u8-soccer',
        reason: 'Child wants to play soccer',
        parentId: 'parent-001',
        timestamp: new Date()
      };

      const recommendation = await civicAgent.recommendWaitlistAction(input);

      expect(recommendation.action).toBe('approve');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.riskLevel).toBe('low');
      expect(recommendation.factors).toContain('age_requirement_met');
    });

    test('should approve one year under with available slots', async () => {
      const input: WaitlistActionInput = {
        childAge: 7,
        requestedAge: 8,
        leagueId: 'league-u8-soccer',
        reason: 'Child is advanced for age',
        parentId: 'parent-001',
        timestamp: new Date()
      };

      const recommendation = await civicAgent.recommendWaitlistAction(input);

      expect(recommendation.action).toBe('approve');
      expect(recommendation.confidence).toBeGreaterThan(0.7);
      expect(recommendation.suggestedConditions).toContain('Parent must sign age waiver');
    });

    test('should waitlist one year under with no available slots', async () => {
      const input: WaitlistActionInput = {
        childAge: 7,
        requestedAge: 8,
        leagueId: 'league-u10-basketball', // Full league
        reason: 'Child wants to play basketball',
        parentId: 'parent-001',
        timestamp: new Date()
      };

      const recommendation = await civicAgent.recommendWaitlistAction(input);

      expect(recommendation.action).toBe('waitlist');
      expect(recommendation.factors).toContain('no_slots_available');
    });

    test('should require manual review for two years under', async () => {
      const input: WaitlistActionInput = {
        childAge: 6,
        requestedAge: 8,
        leagueId: 'league-u8-soccer',
        reason: 'Child is very advanced',
        parentId: 'parent-001',
        timestamp: new Date()
      };

      const recommendation = await civicAgent.recommendWaitlistAction(input);

      expect(recommendation.action).toBe('manual_review');
      expect(recommendation.riskLevel).toBe('high');
      expect(recommendation.factors).toContain('requires_review');
    });

    test('should reject for significant age difference', async () => {
      const input: WaitlistActionInput = {
        childAge: 5,
        requestedAge: 8,
        leagueId: 'league-u8-soccer',
        reason: 'Child is mature for age',
        parentId: 'parent-001',
        timestamp: new Date()
      };

      const recommendation = await civicAgent.recommendWaitlistAction(input);

      expect(recommendation.action).toBe('reject');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.riskLevel).toBe('high');
      expect(recommendation.factors).toContain('age_difference_significant');
    });

    test('should increase confidence with strong justification', async () => {
      const input: WaitlistActionInput = {
        childAge: 7,
        requestedAge: 8,
        leagueId: 'league-u8-soccer',
        reason: 'Child has advanced soccer experience and skills',
        parentId: 'parent-001',
        timestamp: new Date()
      };

      const recommendation = await civicAgent.recommendWaitlistAction(input);

      expect(recommendation.factors).toContain('strong_justification');
      expect(recommendation.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('checkSiblingConflicts', () => {
    test('should detect age mismatch conflict', async () => {
      const input: SiblingConflictInput = {
        childId: 'child-001', // age 7
        siblingId: 'sibling-002', // age 10
        leagueId: 'league-u8-soccer',
        timestamp: new Date()
      };

      const conflict = await civicAgent.checkSiblingConflicts(input);

      expect(conflict).not.toBeNull();
      expect(conflict?.conflictType).toBe('age_mismatch');
      expect(conflict?.severity).toBe('high');
      expect(conflict?.description).toContain('Age difference of 3 years');
    });

    test('should detect skill level mismatch', async () => {
      const input: SiblingConflictInput = {
        childId: 'child-001', // beginner
        siblingId: 'child-003', // advanced
        leagueId: 'league-u8-soccer',
        timestamp: new Date()
      };

      const conflict = await civicAgent.checkSiblingConflicts(input);

      expect(conflict).not.toBeNull();
      expect(conflict?.conflictType).toBe('skill_level');
      expect(conflict?.severity).toBe('medium');
      expect(conflict?.description).toContain('Skill level mismatch');
    });

    test('should detect team capacity conflict', async () => {
      const input: SiblingConflictInput = {
        childId: 'child-001',
        siblingId: 'sibling-001',
        leagueId: 'league-u10-basketball', // Full league
        timestamp: new Date()
      };

      const conflict = await civicAgent.checkSiblingConflicts(input);

      expect(conflict).not.toBeNull();
      expect(conflict?.conflictType).toBe('team_capacity');
      expect(conflict?.severity).toBe('high');
      expect(conflict?.description).toContain('Team at maximum capacity');
    });

    test('should return null when no conflicts detected', async () => {
      const input: SiblingConflictInput = {
        childId: 'child-001', // age 7
        siblingId: 'sibling-001', // age 6
        leagueId: 'league-u8-soccer',
        timestamp: new Date()
      };

      const conflict = await civicAgent.checkSiblingConflicts(input);

      expect(conflict).toBeNull();
    });
  });

  describe('generateDecisionSummary', () => {
    test('should generate approval summary', async () => {
      const recommendation: AIRecommendation = {
        action: 'approve',
        confidence: 0.85,
        rationale: 'Child meets age requirements for requested league',
        factors: ['age_requirement_met'],
        riskLevel: 'low',
        suggestedConditions: ['Parent must sign waiver']
      };

      const input: DecisionSummaryInput = {
        requestId: 'request-001',
        recommendation,
        childName: 'John Doe',
        leagueName: 'U8 Soccer',
        adminId: 'admin-001'
      };

      const summary = await civicAgent.generateDecisionSummary(input);

      expect(summary.decision).toBe('approve');
      expect(summary.summary).toContain('✅ **APPROVED**');
      expect(summary.summary).toContain('John Doe');
      expect(summary.summary).toContain('U8 Soccer');
      expect(summary.summary).toContain('85%');
      expect(summary.keyFactors).toEqual(['age_requirement_met']);
      expect(summary.confidence).toBe(0.85);
    });

    test('should generate rejection summary', async () => {
      const recommendation: AIRecommendation = {
        action: 'reject',
        confidence: 0.9,
        rationale: 'Age difference too significant for league requirements',
        factors: ['age_difference_significant', 'safety_concerns'],
        riskLevel: 'high'
      };

      const input: DecisionSummaryInput = {
        requestId: 'request-002',
        recommendation,
        childName: 'Jane Smith',
        leagueName: 'U10 Basketball',
        adminId: 'admin-001'
      };

      const summary = await civicAgent.generateDecisionSummary(input);

      expect(summary.decision).toBe('reject');
      expect(summary.summary).toContain('❌ **REJECTED**');
      expect(summary.summary).toContain('Jane Smith');
      expect(summary.summary).toContain('U10 Basketball');
      expect(summary.summary).toContain('90%');
    });

    test('should generate waitlist summary', async () => {
      const recommendation: AIRecommendation = {
        action: 'waitlist',
        confidence: 0.7,
        rationale: 'One year under age limit but no available slots',
        factors: ['age_difference_minimal', 'no_slots_available'],
        riskLevel: 'medium'
      };

      const input: DecisionSummaryInput = {
        requestId: 'request-003',
        recommendation,
        childName: 'Bob Johnson',
        leagueName: 'U12 Baseball',
        adminId: 'admin-001'
      };

      const summary = await civicAgent.generateDecisionSummary(input);

      expect(summary.decision).toBe('waitlist');
      expect(summary.summary).toContain('⏳ **WAITLISTED**');
      expect(summary.summary).toContain('Bob Johnson');
      expect(summary.summary).toContain('U12 Baseball');
    });

    test('should generate manual review summary', async () => {
      const recommendation: AIRecommendation = {
        action: 'manual_review',
        confidence: 0.4,
        rationale: 'Two years under age limit requires manual review',
        factors: ['age_difference_moderate', 'requires_review'],
        riskLevel: 'high'
      };

      const input: DecisionSummaryInput = {
        requestId: 'request-004',
        recommendation,
        childName: 'Alice Brown',
        leagueName: 'U8 Soccer',
        adminId: 'admin-001'
      };

      const summary = await civicAgent.generateDecisionSummary(input);

      expect(summary.decision).toBe('manual_review');
      expect(summary.summary).toContain('🔍 **MANUAL REVIEW REQUIRED**');
      expect(summary.summary).toContain('Alice Brown');
      expect(summary.summary).toContain('U8 Soccer');
    });
  });

  describe('Integration Tests', () => {
    test('should process complete waitlist override workflow', async () => {
      // Step 1: Get recommendation
      const actionInput: WaitlistActionInput = {
        childAge: 7,
        requestedAge: 8,
        leagueId: 'league-u8-soccer',
        reason: 'Child has advanced soccer skills',
        parentId: 'parent-001',
        timestamp: new Date()
      };

      const recommendation = await civicAgent.recommendWaitlistAction(actionInput);
      expect(recommendation.action).toBe('approve');

      // Step 2: Check for sibling conflicts
      const conflictInput: SiblingConflictInput = {
        childId: 'child-001',
        siblingId: 'sibling-002',
        leagueId: 'league-u8-soccer',
        timestamp: new Date()
      };

      const conflict = await civicAgent.checkSiblingConflicts(conflictInput);
      expect(conflict).not.toBeNull();

      // Step 3: Generate decision summary
      const summaryInput: DecisionSummaryInput = {
        requestId: 'request-001',
        recommendation,
        childName: 'Test Child',
        leagueName: 'U8 Soccer',
        adminId: 'admin-001'
      };

      const summary = await civicAgent.generateDecisionSummary(summaryInput);
      expect(summary.decision).toBe('approve');
      expect(summary.summary).toContain('Test Child');
    });

    test('should handle edge cases gracefully', async () => {
      // Test with unknown league
      const unknownLeagueInput: WaitlistActionInput = {
        childAge: 7,
        requestedAge: 8,
        leagueId: 'unknown-league',
        reason: 'Test reason',
        parentId: 'parent-001',
        timestamp: new Date()
      };

      const recommendation = await civicAgent.recommendWaitlistAction(unknownLeagueInput);
      expect(recommendation.action).toBe('manual_review');
      expect(recommendation.confidence).toBeLessThan(0.5);
      expect(recommendation.factors).toContain('unknown_league');
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple requests efficiently', async () => {
      const startTime = Date.now();
      
      const promises = Array.from({ length: 10 }, (_, i) => 
        civicAgent.recommendWaitlistAction({
          childAge: 7 + (i % 3),
          requestedAge: 8,
          leagueId: 'league-u8-soccer',
          reason: `Test request ${i}`,
          parentId: `parent-${i}`,
          timestamp: new Date()
        })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // All results should be valid recommendations
      results.forEach(result => {
        expect(result.action).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
        expect(result.riskLevel).toBeDefined();
      });
    });
  });
}); 