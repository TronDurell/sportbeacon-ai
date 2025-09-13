/* SportBeaconAI - Memory SDK Test Suite
   Comprehensive testing for Memory SDK with Firebase emulator integration
*/

import { MemorySDK, type Memory, type Feedback } from '@sportbeacon/memory-sdk';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  clearIndexedDbPersistence,
  terminate
} from 'firebase/firestore';
import { 
  getAuth, 
  connectAuthEmulator, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';

// Test configuration
const TEST_CONFIG = {
  projectId: 'sportbeacon-test',
  authEmulatorHost: 'localhost:9099',
  firestoreEmulatorHost: 'localhost:8080',
  testTenantId: 'test-tenant-001',
  testUser: {
    email: 'test@sportbeacon.ai',
    password: 'testpassword123'
  }
};

describe('Memory SDK', () => {
  let memorySDK: MemorySDK;
  let testUserId: string;
  let auth: any;
  let db: any;

  beforeAll(async () => {
    // Initialize Firebase app for testing
    const app = initializeApp({
      projectId: TEST_CONFIG.projectId,
      apiKey: 'test-api-key',
      authDomain: 'test.firebaseapp.com'
    });

    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators
    connectAuthEmulator(auth, `http://${TEST_CONFIG.authEmulatorHost}`, { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);

    // Create test user
    try {
      await createUserWithEmailAndPassword(auth, TEST_CONFIG.testUser.email, TEST_CONFIG.testUser.password);
    } catch (error) {
      // User might already exist
    }

    // Sign in test user
    const userCredential = await signInWithEmailAndPassword(auth, TEST_CONFIG.testUser.email, TEST_CONFIG.testUser.password);
    testUserId = userCredential.user.uid;

    // Initialize Memory SDK
    memorySDK = new MemorySDK({
      tenantId: TEST_CONFIG.testTenantId,
      user: { uid: testUserId }
    });
  });

  afterAll(async () => {
    // Clean up
    try {
      await terminate(db);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Clear any existing test data
    // Note: In a real implementation, you'd clear specific collections
  });

  describe('remember() method', () => {
    it('should create a user memory successfully', async () => {
      const memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: TEST_CONFIG.testTenantId,
        scope: 'user',
        ownerId: testUserId,
        kind: 'preference',
        text: 'Prefers evening training sessions',
        tags: ['training', 'schedule'],
        source: 'ui',
        confidence: 0.8
      };

      const memoryId = await memorySDK.remember(memoryData);
      
      expect(memoryId).toBeDefined();
      expect(typeof memoryId).toBe('string');

      // Verify the memory was created in Firestore
      const memoryRef = doc(db, 'tenants', TEST_CONFIG.testTenantId, 'users', testUserId, 'memories', memoryId);
      const memoryDoc = await getDoc(memoryRef);
      
      expect(memoryDoc.exists()).toBe(true);
      const data = memoryDoc.data();
      expect(data?.text).toBe(memoryData.text);
      expect(data?.kind).toBe(memoryData.kind);
      expect(data?.score).toBe(0); // Default score
    });

    it('should throw error for tenant mismatch', async () => {
      const memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: 'wrong-tenant',
        scope: 'user',
        ownerId: testUserId,
        kind: 'preference',
        text: 'Test preference',
        source: 'ui'
      };

      await expect(memorySDK.remember(memoryData)).rejects.toThrow('Tenant mismatch');
    });

    it('should throw error when auth required but not provided', async () => {
      const unauthenticatedSDK = new MemorySDK({
        tenantId: TEST_CONFIG.testTenantId,
        user: null
      });

      const memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: TEST_CONFIG.testTenantId,
        scope: 'user',
        ownerId: testUserId,
        kind: 'preference',
        text: 'Test preference',
        source: 'ui'
      };

      await expect(unauthenticatedSDK.remember(memoryData)).rejects.toThrow('Auth required for user-scoped memory');
    });
  });

  describe('recall() method', () => {
    let testMemoryIds: string[] = [];

    beforeEach(async () => {
      // Create test memories
      const memories = [
        {
          tenantId: TEST_CONFIG.testTenantId,
          scope: 'user' as const,
          ownerId: testUserId,
          kind: 'preference' as const,
          text: 'Likes morning training sessions',
          tags: ['training', 'morning'],
          source: 'ui' as const,
          score: 0.5
        },
        {
          tenantId: TEST_CONFIG.testTenantId,
          scope: 'user' as const,
          ownerId: testUserId,
          kind: 'goal' as const,
          text: 'Improve shooting accuracy',
          tags: ['goal', 'shooting'],
          source: 'ui' as const,
          score: 0.8
        },
        {
          tenantId: TEST_CONFIG.testTenantId,
          scope: 'user' as const,
          ownerId: testUserId,
          kind: 'preference' as const,
          text: 'Prefers individual feedback',
          tags: ['training', 'feedback'],
          source: 'ui' as const,
          score: 0.3
        }
      ];

      testMemoryIds = [];
      for (const memory of memories) {
        const id = await memorySDK.remember(memory);
        testMemoryIds.push(id);
      }
    });

    it('should retrieve memories by scope and owner', async () => {
      const memories = await memorySDK.recall({
        scope: 'user',
        ownerId: testUserId,
        limit: 10
      });

      expect(memories).toHaveLength(3);
      expect(memories.every(m => m.ownerId === testUserId)).toBe(true);
    });

    it('should filter memories by kind', async () => {
      const preferences = await memorySDK.recall({
        scope: 'user',
        ownerId: testUserId,
        kind: 'preference',
        limit: 10
      });

      expect(preferences).toHaveLength(2);
      expect(preferences.every(m => m.kind === 'preference')).toBe(true);
    });

    it('should filter memories by tag', async () => {
      const trainingMemories = await memorySDK.recall({
        scope: 'user',
        ownerId: testUserId,
        tag: 'training',
        limit: 10
      });

      expect(trainingMemories).toHaveLength(2);
      expect(trainingMemories.every(m => m.tags?.includes('training'))).toBe(true);
    });

    it('should filter memories by minimum score', async () => {
      const highScoreMemories = await memorySDK.recall({
        scope: 'user',
        ownerId: testUserId,
        minScore: 0.5,
        limit: 10
      });

      expect(highScoreMemories).toHaveLength(1);
      expect(highScoreMemories[0].score).toBeGreaterThanOrEqual(0.5);
    });

    it('should respect limit parameter', async () => {
      const limitedMemories = await memorySDK.recall({
        scope: 'user',
        ownerId: testUserId,
        limit: 2
      });

      expect(limitedMemories).toHaveLength(2);
    });
  });

  describe('learn() method', () => {
    let testMemoryId: string;

    beforeEach(async () => {
      const memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: TEST_CONFIG.testTenantId,
        scope: 'user',
        ownerId: testUserId,
        kind: 'preference',
        text: 'Test memory for learning',
        source: 'ui',
        score: 0.5
      };

      testMemoryId = await memorySDK.remember(memoryData);
    });

    it('should update memory score with positive feedback', async () => {
      const feedback: Feedback = {
        delta: 0.3,
        reason: 'User confirmed this preference',
        tags: ['confirmed']
      };

      const newScore = await memorySDK.learn(testMemoryId, 'user', testUserId, feedback);
      
      expect(newScore).toBe(0.8); // 0.5 + 0.3

      // Verify the score was updated in Firestore
      const memoryRef = doc(db, 'tenants', TEST_CONFIG.testTenantId, 'users', testUserId, 'memories', testMemoryId);
      const memoryDoc = await getDoc(memoryRef);
      const data = memoryDoc.data();
      expect(data?.score).toBe(0.8);
    });

    it('should update memory score with negative feedback', async () => {
      const feedback: Feedback = {
        delta: -0.2,
        reason: 'User found this unhelpful',
        tags: ['unhelpful']
      };

      const newScore = await memorySDK.learn(testMemoryId, 'user', testUserId, feedback);
      
      expect(newScore).toBe(0.3); // 0.5 - 0.2
    });

    it('should clamp score to valid range', async () => {
      const feedback: Feedback = {
        delta: 1.0, // This would push score to 1.5, should be clamped to 1.0
        reason: 'Very positive feedback'
      };

      const newScore = await memorySDK.learn(testMemoryId, 'user', testUserId, feedback);
      
      expect(newScore).toBe(1.0);
    });

    it('should throw error for non-existent memory', async () => {
      const feedback: Feedback = {
        delta: 0.1,
        reason: 'Test feedback'
      };

      await expect(
        memorySDK.learn('non-existent-id', 'user', testUserId, feedback)
      ).rejects.toThrow('Memory not found');
    });

    it('should merge tags from feedback', async () => {
      const feedback: Feedback = {
        delta: 0.1,
        reason: 'Test feedback',
        tags: ['new-tag', 'feedback']
      };

      await memorySDK.learn(testMemoryId, 'user', testUserId, feedback);

      // Verify tags were merged
      const memoryRef = doc(db, 'tenants', TEST_CONFIG.testTenantId, 'users', testUserId, 'memories', testMemoryId);
      const memoryDoc = await getDoc(memoryRef);
      const data = memoryDoc.data();
      expect(data?.tags).toContain('new-tag');
      expect(data?.tags).toContain('feedback');
    });
  });

  describe('purgeLowValue() method', () => {
    beforeEach(async () => {
      // Create memories with different scores
      const memories = [
        {
          tenantId: TEST_CONFIG.testTenantId,
          scope: 'user' as const,
          ownerId: testUserId,
          kind: 'preference' as const,
          text: 'High value memory',
          source: 'ui' as const,
          score: 0.8
        },
        {
          tenantId: TEST_CONFIG.testTenantId,
          scope: 'user' as const,
          ownerId: testUserId,
          kind: 'preference' as const,
          text: 'Low value memory 1',
          source: 'ui' as const,
          score: -0.6
        },
        {
          tenantId: TEST_CONFIG.testTenantId,
          scope: 'user' as const,
          ownerId: testUserId,
          kind: 'preference' as const,
          text: 'Low value memory 2',
          source: 'ui' as const,
          score: -0.7
        }
      ];

      for (const memory of memories) {
        await memorySDK.remember(memory);
      }
    });

    it('should purge low-value memories', async () => {
      const purgedCount = await memorySDK.purgeLowValue('user', testUserId, -0.5);
      
      expect(purgedCount).toBe(2); // Two memories with score <= -0.5

      // Verify high-value memory still exists
      const remainingMemories = await memorySDK.recall({
        scope: 'user',
        ownerId: testUserId,
        limit: 10
      });

      expect(remainingMemories).toHaveLength(1);
      expect(remainingMemories[0].text).toBe('High value memory');
    });
  });

  describe('Security Rules Validation', () => {
    it('should prevent client from writing embedding field', async () => {
      // This test would verify that Firestore security rules prevent
      // clients from writing the embedding field directly
      const memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId: TEST_CONFIG.testTenantId,
        scope: 'user',
        ownerId: testUserId,
        kind: 'preference',
        text: 'Test memory',
        source: 'ui',
        // @ts-expect-error - This should be prevented by security rules
        embedding: [0.1, 0.2, 0.3]
      };

      // The SDK should not allow embedding field in the data structure
      expect(() => {
        memorySDK.remember(memoryData);
      }).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // This would test network error scenarios
      // For now, just verify the SDK doesn't crash on malformed data
      const invalidMemoryData = {
        tenantId: TEST_CONFIG.testTenantId,
        scope: 'user',
        ownerId: testUserId,
        kind: 'preference',
        text: '', // Invalid empty text
        source: 'ui'
      };

      await expect(memorySDK.remember(invalidMemoryData as any)).rejects.toThrow();
    });
  });
});
