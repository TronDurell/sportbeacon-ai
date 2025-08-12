import { townRecIntegrityTask } from '../task';
import type { 
  WaitlistOverrideRequest, 
  SiblingConflict, 
  AIRecommendation,
  DecisionSummary,
  AuditLogEntry 
} from '../task';

// Mock the civic agent
jest.mock('../../../agents/ai/townrec/civicAgent', () => ({
  civicAgent: {
    recommendWaitlistAction: jest.fn(),
    checkSiblingConflicts: jest.fn(),
    generateDecisionSummary: jest.fn()
  }
}));

import { civicAgent } from '../../../agents/ai/townrec/civicAgent';

describe('TownRecIntegrityTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    townRecIntegrityTask.clearAuditLog();
  });

  describe('processWaitlistOverride', () => {
    const mockRequest: WaitlistOverrideRequest = {
      id: 'request-001',
      childId: 'child-001',
      childName: 'John Doe',
      childAge: 7,
      leagueId: 'league-u8-soccer',
      leagueName: 'U8 Soccer',
      requestedAge: 8,
      actualAge: 7,
      reason: 'Child has advanced soccer skills',
      parentId: 'parent-001',
      parentName: 'Jane Doe',
      timestamp: new Date(),
      status: 'pending'
    };

    test('should process waitlist override with AI recommendation', async () => {
      const mockRecommendation: AIRecommendation = {
        action: 'approve',
        confidence: 0.85,
        rationale: 'Child meets requirements with available slots',
        factors: ['age_difference_minimal', 'slots_available'],
        riskLevel: 'low',
        suggestedConditions: ['Parent must sign waiver']
      };

      const mockSummary: DecisionSummary = {
        requestId: 'request-001',
        decision: 'approve',
        summary: '✅ **APPROVED**: John Doe can join U8 Soccer',
        keyFactors: ['age_difference_minimal', 'slots_available'],
        confidence: 0.85,
        timestamp: new Date(),
        adminId: 'system'
      };

      (civicAgent.recommendWaitlistAction as jest.Mock).mockResolvedValue(mockRecommendation);
      (civicAgent.generateDecisionSummary as jest.Mock).mockResolvedValue(mockSummary);

      const result = await townRecIntegrityTask.processWaitlistOverride(mockRequest);

      expect(result.decision).toBe('approve');
      expect(result.recommendation).toEqual(mockRecommendation);
      expect(result.summary).toEqual(mockSummary);
      expect(result.auditEntry.action).toBe('waitlist_override_processed');
      expect(result.auditEntry.decision).toBe('approve');
      expect(result.auditEntry.aiRecommendation).toEqual(mockRecommendation);
    });

    test('should handle rejection recommendation', async () => {
      const mockRecommendation: AIRecommendation = {
        action: 'reject',
        confidence: 0.9,
        rationale: 'Age difference too significant',
        factors: ['age_difference_significant'],
        riskLevel: 'high'
      };

      const mockSummary: DecisionSummary = {
        requestId: 'request-001',
        decision: 'reject',
        summary: '❌ **REJECTED**: John Doe cannot join U8 Soccer',
        keyFactors: ['age_difference_significant'],
        confidence: 0.9,
        timestamp: new Date(),
        adminId: 'system'
      };

      (civicAgent.recommendWaitlistAction as jest.Mock).mockResolvedValue(mockRecommendation);
      (civicAgent.generateDecisionSummary as jest.Mock).mockResolvedValue(mockSummary);

      const result = await townRecIntegrityTask.processWaitlistOverride(mockRequest);

      expect(result.decision).toBe('reject');
      expect(result.recommendation).toEqual(mockRecommendation);
      expect(result.auditEntry.decision).toBe('reject');
    });

    test('should log audit entry correctly', async () => {
      const mockRecommendation: AIRecommendation = {
        action: 'waitlist',
        confidence: 0.7,
        rationale: 'No available slots',
        factors: ['no_slots_available'],
        riskLevel: 'medium'
      };

      const mockSummary: DecisionSummary = {
        requestId: 'request-001',
        decision: 'waitlist',
        summary: '⏳ **WAITLISTED**: John Doe added to waitlist',
        keyFactors: ['no_slots_available'],
        confidence: 0.7,
        timestamp: new Date(),
        adminId: 'system'
      };

      (civicAgent.recommendWaitlistAction as jest.Mock).mockResolvedValue(mockRecommendation);
      (civicAgent.generateDecisionSummary as jest.Mock).mockResolvedValue(mockSummary);

      await townRecIntegrityTask.processWaitlistOverride(mockRequest);

      const auditLog = townRecIntegrityTask.getAuditLog();
      expect(auditLog).toHaveLength(1);
      
      const auditEntry = auditLog[0];
      expect(auditEntry.action).toBe('waitlist_override_processed');
      expect(auditEntry.requestId).toBe('request-001');
      expect(auditEntry.metadata.childAge).toBe(7);
      expect(auditEntry.metadata.requestedAge).toBe(8);
      expect(auditEntry.metadata.confidence).toBe(0.7);
    });
  });

  describe('checkSiblingConflicts', () => {
    test('should detect and log sibling conflicts', async () => {
      const mockConflict: SiblingConflict = {
        id: 'conflict-001',
        childId: 'child-001',
        siblingId: 'sibling-001',
        leagueId: 'league-u8-soccer',
        conflictType: 'age_mismatch',
        severity: 'high',
        description: 'Age difference of 3 years',
        suggestedResolution: 'Consider separate leagues',
        timestamp: new Date()
      };

      (civicAgent.checkSiblingConflicts as jest.Mock).mockResolvedValue(mockConflict);

      const conflicts = await townRecIntegrityTask.checkSiblingConflicts(
        'child-001',
        ['sibling-001'],
        'league-u8-soccer'
      );

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toEqual(mockConflict);

      // Check audit log
      const auditLog = townRecIntegrityTask.getAuditLog();
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].action).toBe('sibling_conflicts_detected');
      expect(auditLog[0].metadata.conflicts).toHaveLength(1);
    });

    test('should handle no conflicts gracefully', async () => {
      (civicAgent.checkSiblingConflicts as jest.Mock).mockResolvedValue(null);

      const conflicts = await townRecIntegrityTask.checkSiblingConflicts(
        'child-001',
        ['sibling-001'],
        'league-u8-soccer'
      );

      expect(conflicts).toHaveLength(0);

      // No audit entry should be created for no conflicts
      const auditLog = townRecIntegrityTask.getAuditLog();
      expect(auditLog).toHaveLength(0);
    });

    test('should handle multiple siblings', async () => {
      const mockConflict1: SiblingConflict = {
        id: 'conflict-001',
        childId: 'child-001',
        siblingId: 'sibling-001',
        leagueId: 'league-u8-soccer',
        conflictType: 'age_mismatch',
        severity: 'high',
        description: 'Age difference of 3 years',
        suggestedResolution: 'Consider separate leagues',
        timestamp: new Date()
      };

      const mockConflict2: SiblingConflict = {
        id: 'conflict-002',
        childId: 'child-001',
        siblingId: 'sibling-002',
        leagueId: 'league-u8-soccer',
        conflictType: 'skill_level',
        severity: 'medium',
        description: 'Skill level mismatch',
        suggestedResolution: 'Consider skill-based placement',
        timestamp: new Date()
      };

      (civicAgent.checkSiblingConflicts as jest.Mock)
        .mockResolvedValueOnce(mockConflict1)
        .mockResolvedValueOnce(mockConflict2);

      const conflicts = await townRecIntegrityTask.checkSiblingConflicts(
        'child-001',
        ['sibling-001', 'sibling-002'],
        'league-u8-soccer'
      );

      expect(conflicts).toHaveLength(2);
      expect(conflicts[0]).toEqual(mockConflict1);
      expect(conflicts[1]).toEqual(mockConflict2);
    });
  });

  describe('processBatchWaitlistRequests', () => {
    const mockRequests: WaitlistOverrideRequest[] = [
      {
        id: 'request-001',
        childId: 'child-001',
        childName: 'John Doe',
        childAge: 7,
        leagueId: 'league-u8-soccer',
        leagueName: 'U8 Soccer',
        requestedAge: 8,
        actualAge: 7,
        reason: 'Advanced skills',
        parentId: 'parent-001',
        parentName: 'Jane Doe',
        timestamp: new Date(),
        status: 'pending'
      },
      {
        id: 'request-002',
        childId: 'child-002',
        childName: 'Jane Smith',
        childAge: 6,
        leagueId: 'league-u8-soccer',
        leagueName: 'U8 Soccer',
        requestedAge: 8,
        actualAge: 6,
        reason: 'Mature for age',
        parentId: 'parent-002',
        parentName: 'Bob Smith',
        timestamp: new Date(),
        status: 'pending'
      }
    ];

    test('should process batch requests correctly', async () => {
      const mockRecommendation1: AIRecommendation = {
        action: 'approve',
        confidence: 0.85,
        rationale: 'Approved with conditions',
        factors: ['age_difference_minimal'],
        riskLevel: 'low'
      };

      const mockRecommendation2: AIRecommendation = {
        action: 'manual_review',
        confidence: 0.4,
        rationale: 'Requires review',
        factors: ['age_difference_moderate'],
        riskLevel: 'high'
      };

      const mockSummary1: DecisionSummary = {
        requestId: 'request-001',
        decision: 'approve',
        summary: 'Approved John Doe',
        keyFactors: ['age_difference_minimal'],
        confidence: 0.85,
        timestamp: new Date(),
        adminId: 'system'
      };

      const mockSummary2: DecisionSummary = {
        requestId: 'request-002',
        decision: 'manual_review',
        summary: 'Manual review for Jane Smith',
        keyFactors: ['age_difference_moderate'],
        confidence: 0.4,
        timestamp: new Date(),
        adminId: 'system'
      };

      (civicAgent.recommendWaitlistAction as jest.Mock)
        .mockResolvedValueOnce(mockRecommendation1)
        .mockResolvedValueOnce(mockRecommendation2);
      
      (civicAgent.generateDecisionSummary as jest.Mock)
        .mockResolvedValueOnce(mockSummary1)
        .mockResolvedValueOnce(mockSummary2);

      (civicAgent.checkSiblingConflicts as jest.Mock).mockResolvedValue(null);

      const result = await townRecIntegrityTask.processBatchWaitlistRequests(mockRequests);

      expect(result.processed).toHaveLength(2);
      expect(result.processed[0].decision).toBe('approve');
      expect(result.processed[1].decision).toBe('manual_review');
      expect(result.conflicts).toHaveLength(0);
      expect(result.auditEntries).toHaveLength(2);
    });

    test('should detect conflicts for approved requests', async () => {
      const mockRecommendation: AIRecommendation = {
        action: 'approve',
        confidence: 0.85,
        rationale: 'Approved',
        factors: ['age_difference_minimal'],
        riskLevel: 'low'
      };

      const mockSummary: DecisionSummary = {
        requestId: 'request-001',
        decision: 'approve',
        summary: 'Approved',
        keyFactors: ['age_difference_minimal'],
        confidence: 0.85,
        timestamp: new Date(),
        adminId: 'system'
      };

      const mockConflict: SiblingConflict = {
        id: 'conflict-001',
        childId: 'child-001',
        siblingId: 'sibling-001',
        leagueId: 'league-u8-soccer',
        conflictType: 'age_mismatch',
        severity: 'high',
        description: 'Age difference',
        suggestedResolution: 'Separate leagues',
        timestamp: new Date()
      };

      (civicAgent.recommendWaitlistAction as jest.Mock).mockResolvedValue(mockRecommendation);
      (civicAgent.generateDecisionSummary as jest.Mock).mockResolvedValue(mockSummary);
      (civicAgent.checkSiblingConflicts as jest.Mock).mockResolvedValue(mockConflict);

      const result = await townRecIntegrityTask.processBatchWaitlistRequests([mockRequests[0]]);

      expect(result.processed).toHaveLength(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toEqual(mockConflict);
    });
  });

  describe('generateDirectorReport', () => {
    test('should generate comprehensive report', async () => {
      const decisions = [
        {
          request: mockRequests[0],
          decision: 'approve' as const,
          recommendation: {
            action: 'approve',
            confidence: 0.85,
            rationale: 'Approved',
            factors: ['age_difference_minimal'],
            riskLevel: 'low' as const
          },
          summary: {
            requestId: 'request-001',
            decision: 'approve',
            summary: 'Approved',
            keyFactors: ['age_difference_minimal'],
            confidence: 0.85,
            timestamp: new Date(),
            adminId: 'system'
          }
        },
        {
          request: mockRequests[1],
          decision: 'reject' as const,
          recommendation: {
            action: 'reject',
            confidence: 0.9,
            rationale: 'Rejected',
            factors: ['age_difference_significant'],
            riskLevel: 'high' as const
          },
          summary: {
            requestId: 'request-002',
            decision: 'reject',
            summary: 'Rejected',
            keyFactors: ['age_difference_significant'],
            confidence: 0.9,
            timestamp: new Date(),
            adminId: 'system'
          }
        }
      ];

      const report = await townRecIntegrityTask.generateDirectorReport(decisions);

      expect(report.statistics.total).toBe(2);
      expect(report.statistics.approved).toBe(1);
      expect(report.statistics.rejected).toBe(1);
      expect(report.statistics.averageConfidence).toBe(0.875);
      expect(report.summary).toContain('Processed 2 waitlist override requests');
      expect(report.summary).toContain('1 approved, 1 rejected');
    });

    test('should generate alerts for high-risk scenarios', async () => {
      const decisions = [
        {
          request: mockRequests[0],
          decision: 'approve' as const,
          recommendation: {
            action: 'approve',
            confidence: 0.3, // Low confidence
            rationale: 'Approved with low confidence',
            factors: ['uncertain'],
            riskLevel: 'high' as const
          },
          summary: {
            requestId: 'request-001',
            decision: 'approve',
            summary: 'Approved with low confidence',
            keyFactors: ['uncertain'],
            confidence: 0.3,
            timestamp: new Date(),
            adminId: 'system'
          }
        }
      ];

      const report = await townRecIntegrityTask.generateDirectorReport(decisions);

      expect(report.riskAlerts).toContain('Low confidence in AI recommendations');
      expect(report.riskAlerts).toContain('1 high-risk decisions require director attention');
    });
  });

  describe('Audit Logging', () => {
    test('should maintain audit log correctly', async () => {
      const mockRecommendation: AIRecommendation = {
        action: 'approve',
        confidence: 0.85,
        rationale: 'Approved',
        factors: ['age_difference_minimal'],
        riskLevel: 'low'
      };

      const mockSummary: DecisionSummary = {
        requestId: 'request-001',
        decision: 'approve',
        summary: 'Approved',
        keyFactors: ['age_difference_minimal'],
        confidence: 0.85,
        timestamp: new Date(),
        adminId: 'system'
      };

      (civicAgent.recommendWaitlistAction as jest.Mock).mockResolvedValue(mockRecommendation);
      (civicAgent.generateDecisionSummary as jest.Mock).mockResolvedValue(mockSummary);

      await townRecIntegrityTask.processWaitlistOverride(mockRequests[0]);

      const auditLog = townRecIntegrityTask.getAuditLog();
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].action).toBe('waitlist_override_processed');
      expect(auditLog[0].requestId).toBe('request-001');
    });

    test('should clear audit log for testing', () => {
      townRecIntegrityTask.clearAuditLog();
      const auditLog = townRecIntegrityTask.getAuditLog();
      expect(auditLog).toHaveLength(0);
    });
  });
}); 