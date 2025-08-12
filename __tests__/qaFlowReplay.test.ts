/**
 * 🧪 QA Flow Replay Tests
 * 
 * Integration tests for the role-based AI onboarding validation system
 */

import { validateOnboardingFlows, runAllOnboardingValidations, mockFirestore } from './qaFlowReplay';
import { playerAgent, coachAgent, parentAgent, adminAgent, scoutAgent, refereeAgent } from '../lib/ai/onboardingAgents';
import { AgentOrchestrator } from '../agents/core/agentOrchestrator';
import { UserContext, UserRole, generateTestToken } from '../backend/middleware/auth.guard';
import { FirestoreAdapter } from '../agents/core/agentFactory';

// Set timeout for all tests
jest.setTimeout(10000);

// Mock the onboarding agents
jest.mock('../lib/ai/onboardingAgents', () => ({
  playerAgent: {
    onboard: jest.fn().mockResolvedValue({
      profile_created: true,
      goals_defined: true,
      next_steps_provided: true
    })
  },
  coachAgent: {
    onboard: jest.fn().mockResolvedValue({
      profile_verified: true,
      teams_configured: true,
      resources_provided: true
    })
  },
  parentAgent: {
    onboard: jest.fn().mockResolvedValue({
      children_registered: true,
      preferences_set: true,
      notifications_configured: true
    })
  },
  adminAgent: {
    onboard: jest.fn().mockResolvedValue({
      permissions_granted: true,
      tools_accessible: true,
      workflow_configured: true
    })
  },
  scoutAgent: {
    onboard: jest.fn().mockResolvedValue({
      evaluation_tools_ready: true,
      reporting_configured: true,
      criteria_set: true
    })
  },
  refereeAgent: {
    onboard: jest.fn().mockResolvedValue({
      schedule_accessible: true,
      rules_understood: true,
      communication_ready: true
    })
  }
}));

// Mock Firestore adapter for testing
const createMockFirestoreAdapter = (): FirestoreAdapter => ({
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      get: jest.fn(() => Promise.resolve({
        exists: true,
        data: () => ({ testData: 'mock' })
      })),
      delete: jest.fn(() => Promise.resolve()),
    })),
    add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        docs: [{ id: 'mock-doc', data: () => ({ testData: 'mock' }) }]
      })),
    })),
  })),
  doc: jest.fn(() => ({
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve({
      exists: true,
      data: () => ({ testData: 'mock' })
    })),
    delete: jest.fn(() => Promise.resolve()),
  })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  get: jest.fn(() => Promise.resolve({
    exists: true,
    data: () => ({ testData: 'mock' })
  })),
  delete: jest.fn(() => Promise.resolve()),
  add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  where: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({
      docs: [{ id: 'mock-doc', data: () => ({ testData: 'mock' }) }]
    })),
  })),
});

// Test user contexts for different roles
const createTestUserContext = (role: UserRole): UserContext => ({
  id: `test-${role}-${Date.now()}`,
  role,
  email: `test-${role}@example.com`,
  token: generateTestToken({ role }),
  permissions: role === UserRole.ADMIN 
    ? ['read', 'write', 'delete', 'admin']
    : role === UserRole.COACH 
    ? ['read', 'write', 'delete']
    : ['read', 'write']
});

describe('QA Flow Replay System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateOnboardingFlows', () => {
    it('should validate Player onboarding flow successfully', async () => {
      const result = await validateOnboardingFlows('Player', playerAgent);
      
      expect(result.role).toBe('Player');
      expect(result.testsRun).toBeGreaterThan(0);
      expect(result.testsPassed).toBeGreaterThan(0);
      expect(result.testsFailed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.performance.duration).toBeGreaterThan(0);
    });

    it('should validate Coach onboarding flow successfully', async () => {
      const result = await validateOnboardingFlows('Coach', coachAgent);
      
      expect(result.role).toBe('Coach');
      expect(result.testsRun).toBeGreaterThan(0);
      expect(result.testsPassed).toBeGreaterThan(0);
      expect(result.testsFailed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate Parent onboarding flow successfully', async () => {
      const result = await validateOnboardingFlows('Parent', parentAgent);
      
      expect(result.role).toBe('Parent');
      expect(result.testsRun).toBeGreaterThan(0);
      expect(result.testsPassed).toBeGreaterThan(0);
      expect(result.testsFailed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate Admin onboarding flow successfully', async () => {
      const result = await validateOnboardingFlows('Admin', adminAgent);
      
      expect(result.role).toBe('Admin');
      expect(result.testsRun).toBeGreaterThan(0);
      expect(result.testsPassed).toBeGreaterThan(0);
      expect(result.testsFailed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate Scout onboarding flow successfully', async () => {
      const result = await validateOnboardingFlows('Scout', scoutAgent);
      
      expect(result.role).toBe('Scout');
      expect(result.testsRun).toBeGreaterThan(0);
      expect(result.testsPassed).toBeGreaterThan(0);
      expect(result.testsFailed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate Referee onboarding flow successfully', async () => {
      const result = await validateOnboardingFlows('Referee', refereeAgent);
      
      expect(result.role).toBe('Referee');
      expect(result.testsRun).toBeGreaterThan(0);
      expect(result.testsPassed).toBeGreaterThan(0);
      expect(result.testsFailed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid role gracefully', async () => {
      const invalidAgent = { onboard: jest.fn() };
      
      await expect(validateOnboardingFlows('InvalidRole', invalidAgent))
        .rejects.toThrow('No test data or criteria found for role: InvalidRole');
    });

    it('should handle agent without onboard method', async () => {
      const invalidAgent = {};
      
      const result = await validateOnboardingFlows('Player', invalidAgent);
      
      expect(result.testsFailed).toBe(1);
      expect(result.errors).toContain('Player agent missing onboard method');
    });

    it('should handle agent that returns null', async () => {
      const nullAgent = {
        onboard: jest.fn().mockResolvedValue(null)
      };
      
      const result = await validateOnboardingFlows('Player', nullAgent);
      
      expect(result.testsFailed).toBe(1);
      expect(result.errors).toContain('Player onboarding returned no result');
    });
  });

  describe('runAllOnboardingValidations', () => {
    it('should run all role validations successfully', async () => {
      const results = await runAllOnboardingValidations();
      
      expect(results.results).toHaveLength(6); // 6 roles
      expect(results.summary.totalTests).toBeGreaterThan(0);
      expect(results.summary.totalPassed).toBeGreaterThan(0);
      expect(results.summary.totalFailed).toBe(0);
      expect(results.summary.successRate).toBe(100);
      expect(results.summary.totalDuration).toBeGreaterThan(0);
    });

    it('should include all expected roles in results', async () => {
      const results = await runAllOnboardingValidations();
      
      const roles = results.results.map(r => r.role);
      expect(roles).toContain('Player');
      expect(roles).toContain('Coach');
      expect(roles).toContain('Parent');
      expect(roles).toContain('Admin');
      expect(roles).toContain('Scout');
      expect(roles).toContain('Referee');
    });

    it('should handle individual role failures gracefully', async () => {
      // Mock a failing agent
      const originalPlayerAgent = playerAgent.onboard;
      playerAgent.onboard = jest.fn().mockRejectedValue(new Error('Test failure'));
      
      const results = await runAllOnboardingValidations();
      
      expect(results.summary.totalFailed).toBeGreaterThan(0);
      expect(results.summary.successRate).toBeLessThan(100);
      
      // Restore original mock
      playerAgent.onboard = originalPlayerAgent;
    });
  });

  describe('Mock Firestore', () => {
    it('should provide mock Firestore functionality', () => {
      expect(mockFirestore.collection).toBeDefined();
      expect(typeof mockFirestore.collection).toBe('function');
      
      const mockCollection = mockFirestore.collection('test');
      expect(mockCollection.doc).toBeDefined();
      expect(mockCollection.add).toBeDefined();
      expect(mockCollection.where).toBeDefined();
    });

    it('should handle document operations', async () => {
      const mockCollection = mockFirestore.collection('test');
      const mockDoc = mockCollection.doc('test-id');
      
      await expect(mockDoc.set({})).resolves.toEqual({});
      await expect(mockDoc.update({})).resolves.toEqual({});
      await expect(mockDoc.get()).resolves.toEqual({
        exists: true,
        data: () => ({})
      });
    });

    it('should handle collection operations', async () => {
      const mockCollection = mockFirestore.collection('test');
      
      await expect(mockCollection.add({})).resolves.toEqual({ id: 'test-doc-id' });
      await expect(mockCollection.where('field', '==', 'value').get()).resolves.toEqual({
        docs: []
      });
    });
  });

  describe('Performance Validation', () => {
    it('should track performance metrics', async () => {
      const result = await validateOnboardingFlows('Player', playerAgent);
      
      expect(result.performance.startTime).toBeGreaterThan(0);
      expect(result.performance.endTime).toBeGreaterThan(0);
      expect(result.performance.duration).toBeGreaterThan(0);
      expect(result.performance.endTime).toBeGreaterThan(result.performance.startTime);
    });

    it('should warn about slow performance', async () => {
      // Mock a slow agent
      const slowAgent = {
        onboard: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 6000)) // 6 seconds
        )
      };
      
      const result = await validateOnboardingFlows('Player', slowAgent);
      
      expect(result.warnings).toContain(expect.stringContaining('Onboarding took'));
    });
  });

  describe('Error Handling', () => {
    it('should handle agent errors gracefully', async () => {
      const errorAgent = {
        onboard: jest.fn().mockRejectedValue(new Error('Agent error'))
      };
      
      const result = await validateOnboardingFlows('Player', errorAgent);
      
      expect(result.testsFailed).toBe(1);
      expect(result.errors).toContain('Agent error');
    });

    it('should handle empty data validation', async () => {
      const result = await validateOnboardingFlows('Player', playerAgent);
      
      // The validation should handle empty data gracefully
      expect(result.testsPassed).toBeGreaterThan(0);
    });
  });
});

describe('QA Flow Replay - Unified Agent System', () => {
  let orchestrator: AgentOrchestrator;
  let mockFirestore: FirestoreAdapter;

  beforeEach(() => {
    mockFirestore = createMockFirestoreAdapter();
    orchestrator = new AgentOrchestrator(mockFirestore, {
      enableLogging: true,
      maxRetries: 2,
      timeoutMs: 5000
    });
  });

  afterEach(async () => {
    await orchestrator.cleanup();
  });

  describe('Coach Agent Onboarding Flow', () => {
    it('should complete coach onboarding successfully', async () => {
      const userContext = createTestUserContext(UserRole.COACH);
      
      const operations = [
        orchestrator.executeAgentCommand('coachAgent', 'getPerformanceReports', userContext),
        orchestrator.executeAgentCommand('coachAgent', 'generateWorkoutPlan', userContext, {
          playerId: 'test-player',
          difficulty: 'intermediate',
          focus: 'strength'
        }),
        orchestrator.executeAgentCommand('coachAgent', 'updateUserMetrics', userContext, {
          playerId: 'test-player',
          metrics: { fitness: 0.8, strength: 0.7 }
        })
      ];

      const results = await Promise.allSettled(operations);

      // Check all operations succeeded
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Operation ${index} failed:`, result.reason);
        }
        expect(result.status).toBe('fulfilled');
      });

      // Verify successful operations
      const fulfilledResults = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value);

      expect(fulfilledResults).toHaveLength(3);
      fulfilledResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.agentType).toBe('coachAgent');
        expect(result.response).toBeDefined();
        expect(result.logs).toHaveLength(2); // Start and end logs
      });
    });

    it('should reject unauthorized coach operations', async () => {
      const userContext = createTestUserContext(UserRole.PLAYER); // Wrong role
      
      const result = await orchestrator.executeAgentCommand(
        'coachAgent', 
        'getPerformanceReports', 
        userContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient permissions');
    });
  });

  describe('Player Agent Onboarding Flow', () => {
    it('should complete player onboarding successfully', async () => {
      const userContext = createTestUserContext(UserRole.PLAYER);
      
      const operations = [
        orchestrator.executeAgentCommand('playerAgent', 'getWorkoutPlan', userContext),
        orchestrator.executeAgentCommand('playerAgent', 'submitProgress', userContext, {
          sessionData: { duration: 45, exercises: ['pushups', 'squats'] }
        }),
        orchestrator.executeAgentCommand('playerAgent', 'getAchievements', userContext)
      ];

      const results = await Promise.allSettled(operations);

      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });

      const fulfilledResults = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value);

      expect(fulfilledResults).toHaveLength(3);
      fulfilledResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.agentType).toBe('playerAgent');
      });
    });
  });

  describe('Parent Agent Onboarding Flow', () => {
    it('should complete parent onboarding successfully', async () => {
      const userContext = createTestUserContext(UserRole.PARENT);
      
      const operations = [
        orchestrator.executeAgentCommand('parentAgent', 'getChildProgress', userContext, {
          childId: 'test-child-123'
        }),
        orchestrator.executeAgentCommand('parentAgent', 'setPreferences', userContext, {
          preferences: { notifications: true, weeklyReports: true }
        })
      ];

      const results = await Promise.allSettled(operations);

      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });

      const fulfilledResults = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value);

      expect(fulfilledResults).toHaveLength(2);
      fulfilledResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.agentType).toBe('parentAgent');
      });
    });
  });

  describe('Scout Agent Onboarding Flow', () => {
    it('should complete scout onboarding successfully', async () => {
      const userContext = createTestUserContext(UserRole.SCOUT);
      
      const operations = [
        orchestrator.executeAgentCommand('scoutAgent', 'analyzePlayer', userContext, {
          playerId: 'test-player-456',
          videoUrl: 'https://example.com/video.mp4'
        }),
        orchestrator.executeAgentCommand('scoutAgent', 'generateReport', userContext, {
          playerId: 'test-player-456'
        })
      ];

      const results = await Promise.allSettled(operations);

      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });

      const fulfilledResults = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value);

      expect(fulfilledResults).toHaveLength(2);
      fulfilledResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.agentType).toBe('scoutAgent');
      });
    });
  });

  describe('Admin Agent Onboarding Flow', () => {
    it('should complete admin onboarding successfully', async () => {
      const userContext = createTestUserContext(UserRole.ADMIN);
      
      const operations = [
        orchestrator.executeAgentCommand('adminAgent', 'getSystemStats', userContext),
        orchestrator.executeAgentCommand('adminAgent', 'manageUsers', userContext, {
          action: 'update',
          userId: 'test-user',
          userData: { status: 'active' }
        })
      ];

      const results = await Promise.allSettled(operations);

      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });

      const fulfilledResults = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value);

      expect(fulfilledResults).toHaveLength(2);
      fulfilledResults.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.agentType).toBe('adminAgent');
      });
    });
  });

  describe('Cross-Agent Permission Validation', () => {
    it('should validate permissions correctly across different agents', async () => {
      const testCases = [
        { role: UserRole.COACH, agent: 'coachAgent', command: 'getPerformanceReports', shouldSucceed: true },
        { role: UserRole.PLAYER, agent: 'coachAgent', command: 'getPerformanceReports', shouldSucceed: false },
        { role: UserRole.PLAYER, agent: 'playerAgent', command: 'getWorkoutPlan', shouldSucceed: true },
        { role: UserRole.COACH, agent: 'playerAgent', command: 'getWorkoutPlan', shouldSucceed: true },
        { role: UserRole.ADMIN, agent: 'adminAgent', command: 'getSystemStats', shouldSucceed: true },
        { role: UserRole.COACH, agent: 'adminAgent', command: 'getSystemStats', shouldSucceed: false },
      ];

      const results = await Promise.allSettled(
        testCases.map(testCase => {
          const userContext = createTestUserContext(testCase.role);
          return orchestrator.executeAgentCommand(
            testCase.agent,
            testCase.command,
            userContext
          );
        })
      );

      results.forEach((result, index) => {
        const testCase = testCases[index];
        if (result.status === 'fulfilled') {
          const operationResult = result.value;
          expect(operationResult.success).toBe(testCase.shouldSucceed);
          
          if (!testCase.shouldSucceed) {
            expect(operationResult.error).toContain('Insufficient permissions');
          }
        } else {
          fail(`Test case ${index} failed unexpectedly: ${result.reason}`);
        }
      });
    });
  });

  describe('Orchestrator Health and Logging', () => {
    it('should maintain health status and logging', async () => {
      const userContext = createTestUserContext(UserRole.COACH);
      
      // Execute some operations
      await orchestrator.executeAgentCommand('coachAgent', 'getPerformanceReports', userContext);
      
      // Check health status
      const health = await orchestrator.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.details.stats.activeAgents).toBeGreaterThan(0);
      
      // Check logs
      const logs = await orchestrator.getLogs({ userId: userContext.id });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].agentType).toBe('coachAgent');
      expect(logs[0].userId).toBe(userContext.id);
    });

    it('should handle agent cleanup properly', async () => {
      const userContext = createTestUserContext(UserRole.PLAYER);
      
      // Create an agent
      await orchestrator.executeAgentCommand('playerAgent', 'getWorkoutPlan', userContext);
      
      // Check stats before cleanup
      const statsBefore = await orchestrator.getAgentStats();
      expect(statsBefore.totalAgents).toBeGreaterThan(0);
      
      // Cleanup
      await orchestrator.cleanup();
      
      // Check stats after cleanup
      const statsAfter = await orchestrator.getAgentStats();
      expect(statsAfter.totalAgents).toBe(0);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should handle Firestore errors gracefully', async () => {
      // Create a failing Firestore adapter
      const failingFirestore: FirestoreAdapter = {
        ...createMockFirestoreAdapter(),
        collection: jest.fn(() => {
          throw new Error('Firestore connection failed');
        })
      };

      const failingOrchestrator = new AgentOrchestrator(failingFirestore);
      const userContext = createTestUserContext(UserRole.COACH);

      const result = await failingOrchestrator.executeAgentCommand(
        'coachAgent',
        'getPerformanceReports',
        userContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Firestore connection failed');
    });

    it('should retry operations on temporary failures', async () => {
      let attemptCount = 0;
      const retryFirestore: FirestoreAdapter = {
        ...createMockFirestoreAdapter(),
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            set: jest.fn(() => {
              attemptCount++;
              if (attemptCount < 3) {
                return Promise.reject(new Error('Temporary failure'));
              }
              return Promise.resolve();
            }),
            update: jest.fn(() => Promise.resolve()),
            get: jest.fn(() => Promise.resolve({
              exists: true,
              data: () => ({ testData: 'mock' })
            })),
            delete: jest.fn(() => Promise.resolve()),
          })),
          add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
          where: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({
              docs: [{ id: 'mock-doc', data: () => ({ testData: 'mock' }) }]
            })),
          })),
        }))
      };

      const retryOrchestrator = new AgentOrchestrator(retryFirestore, { maxRetries: 3 });
      const userContext = createTestUserContext(UserRole.COACH);

      const result = await retryOrchestrator.executeAgentCommand(
        'coachAgent',
        'updateUserMetrics',
        userContext,
        { playerId: 'test', metrics: { test: 1 } }
      );

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3); // Should have retried 3 times
    });
  });
}); 