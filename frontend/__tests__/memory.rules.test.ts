/* SportBeaconAI - Firestore Rules Tests for Memory SDK
   Tests security rules for append-only writes and owner-only reads
*/

import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'sportbeacon-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Memory SDK Security Rules', () => {
  describe('User-scoped memory events', () => {
    it('should allow authenticated users to create their own events', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceEvents = alice.firestore().collection('memories').doc('alice').collection('events');
      
      await expect(
        aliceEvents.add({
          t: new Date(),
          kind: 'feedback',
          scope: 'web',
          trace: 'test-trace',
          data: { message: 'Test feedback' }
        })
      ).resolves.not.toThrow();
    });

    it('should allow authenticated users to read their own events', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceEvents = alice.firestore().collection('memories').doc('alice').collection('events');
      
      // Create an event first
      await aliceEvents.add({
        t: new Date(),
        kind: 'feedback',
        scope: 'web',
        trace: 'test-trace',
        data: { message: 'Test feedback' }
      });
      
      // Should be able to read it
      await expect(aliceEvents.get()).resolves.not.toThrow();
    });

    it('should prevent users from creating events for other users', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const bobEvents = alice.firestore().collection('memories').doc('bob').collection('events');
      
      await expect(
        bobEvents.add({
          t: new Date(),
          kind: 'feedback',
          scope: 'web',
          trace: 'test-trace',
          data: { message: 'Attempted cross-user creation' }
        })
      ).rejects.toThrow();
    });

    it('should prevent users from reading other users events', async () => {
      const bob = testEnv.authenticatedContext('bob');
      const bobEvents = bob.firestore().collection('memories').doc('bob').collection('events');
      
      // Create an event for bob
      await bobEvents.add({
        t: new Date(),
        kind: 'feedback',
        scope: 'web',
        trace: 'test-trace',
        data: { message: 'Bob\'s private feedback' }
      });
      
      // Alice should not be able to read bob's events
      const alice = testEnv.authenticatedContext('alice');
      const bobEventsFromAlice = alice.firestore().collection('memories').doc('bob').collection('events');
      
      await expect(bobEventsFromAlice.get()).rejects.toThrow();
    });

    it('should prevent updates and deletes (append-only)', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceEvents = alice.firestore().collection('memories').doc('alice').collection('events');
      
      // Create an event
      const eventRef = await aliceEvents.add({
        t: new Date(),
        kind: 'feedback',
        scope: 'web',
        trace: 'test-trace',
        data: { message: 'Test feedback' }
      });
      
      // Should not be able to update
      await expect(
        eventRef.update({ data: { message: 'Modified feedback' } })
      ).rejects.toThrow();
      
      // Should not be able to delete
      await expect(eventRef.delete()).rejects.toThrow();
    });

    it('should validate required fields for event creation', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceEvents = alice.firestore().collection('memories').doc('alice').collection('events');
      
      // Missing required fields should fail
      await expect(
        aliceEvents.add({
          kind: 'feedback',
          scope: 'web',
          // Missing t, trace fields
          data: { message: 'Test feedback' }
        })
      ).rejects.toThrow();
    });

    it('should validate event kind values', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceEvents = alice.firestore().collection('memories').doc('alice').collection('events');
      
      // Invalid kind should fail
      await expect(
        aliceEvents.add({
          t: new Date(),
          kind: 'invalid',
          scope: 'web',
          trace: 'test-trace',
          data: { message: 'Test feedback' }
        })
      ).rejects.toThrow();
    });

    it('should validate scope values', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceEvents = alice.firestore().collection('memories').doc('alice').collection('events');
      
      // Invalid scope should fail
      await expect(
        aliceEvents.add({
          t: new Date(),
          kind: 'feedback',
          scope: 'invalid',
          trace: 'test-trace',
          data: { message: 'Test feedback' }
        })
      ).rejects.toThrow();
    });
  });

  describe('User memory snapshots', () => {
    it('should allow authenticated users to create their own snapshots', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceSnapshots = alice.firestore().collection('user_memory').doc('alice').collection('snapshots');
      
      await expect(
        aliceSnapshots.add({
          t: new Date(),
          version: 1,
          summary: 'Test summary',
          vector: [0.1, 0.2, 0.3]
        })
      ).resolves.not.toThrow();
    });

    it('should allow authenticated users to read their own snapshots', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceSnapshots = alice.firestore().collection('user_memory').doc('alice').collection('snapshots');
      
      // Create a snapshot first
      await aliceSnapshots.add({
        t: new Date(),
        version: 1,
        summary: 'Test summary',
        vector: [0.1, 0.2, 0.3]
      });
      
      // Should be able to read it
      await expect(aliceSnapshots.get()).resolves.not.toThrow();
    });

    it('should prevent users from creating snapshots for other users', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const bobSnapshots = alice.firestore().collection('user_memory').doc('bob').collection('snapshots');
      
      await expect(
        bobSnapshots.add({
          t: new Date(),
          version: 1,
          summary: 'Attempted cross-user snapshot',
          vector: [0.1, 0.2, 0.3]
        })
      ).rejects.toThrow();
    });

    it('should prevent updates and deletes for snapshots (append-only)', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceSnapshots = alice.firestore().collection('user_memory').doc('alice').collection('snapshots');
      
      // Create a snapshot
      const snapshotRef = await aliceSnapshots.add({
        t: new Date(),
        version: 1,
        summary: 'Test summary',
        vector: [0.1, 0.2, 0.3]
      });
      
      // Should not be able to update
      await expect(
        snapshotRef.update({ summary: 'Modified summary' })
      ).rejects.toThrow();
      
      // Should not be able to delete
      await expect(snapshotRef.delete()).rejects.toThrow();
    });

    it('should validate required fields for snapshot creation', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceSnapshots = alice.firestore().collection('user_memory').doc('alice').collection('snapshots');
      
      // Missing required fields should fail
      await expect(
        aliceSnapshots.add({
          version: 1,
          summary: 'Test summary',
          // Missing t field
          vector: [0.1, 0.2, 0.3]
        })
      ).rejects.toThrow();
    });

    it('should validate vector length cap', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceSnapshots = alice.firestore().collection('user_memory').doc('alice').collection('snapshots');
      
      // Vector too long should fail
      const longVector = new Array(2049).fill(0.1);
      
      await expect(
        aliceSnapshots.add({
          t: new Date(),
          version: 1,
          summary: 'Test summary',
          vector: longVector
        })
      ).rejects.toThrow();
    });
  });

  describe('Org/Team memory (optional)', () => {
    it('should allow org members to create org memories', async () => {
      const alice = testEnv.authenticatedContext('alice', { orgs: ['org1'] });
      const orgMemories = alice.firestore().collection('orgs').doc('org1').collection('memories');
      
      await expect(
        orgMemories.add({
          t: new Date(),
          kind: 'note',
          owner: 'alice',
          summary: 'Org memory'
        })
      ).resolves.not.toThrow();
    });

    it('should prevent non-org members from creating org memories', async () => {
      const alice = testEnv.authenticatedContext('alice'); // No orgs
      const orgMemories = alice.firestore().collection('orgs').doc('org1').collection('memories');
      
      await expect(
        orgMemories.add({
          t: new Date(),
          kind: 'note',
          owner: 'alice',
          summary: 'Org memory'
        })
      ).rejects.toThrow();
    });
  });

  describe('Unauthenticated access', () => {
    it('should prevent unauthenticated users from creating events', async () => {
      const unauthenticated = testEnv.unauthenticatedContext();
      const aliceEvents = unauthenticated.firestore().collection('memories').doc('alice').collection('events');
      
      await expect(
        aliceEvents.add({
          t: new Date(),
          kind: 'feedback',
          scope: 'web',
          trace: 'test-trace',
          data: { message: 'Test feedback' }
        })
      ).rejects.toThrow();
    });

    it('should prevent unauthenticated users from reading events', async () => {
      const unauthenticated = testEnv.unauthenticatedContext();
      const aliceEvents = unauthenticated.firestore().collection('memories').doc('alice').collection('events');
      
      await expect(aliceEvents.get()).rejects.toThrow();
    });

    it('should prevent unauthenticated users from creating snapshots', async () => {
      const unauthenticated = testEnv.unauthenticatedContext();
      const aliceSnapshots = unauthenticated.firestore().collection('user_memory').doc('alice').collection('snapshots');
      
      await expect(
        aliceSnapshots.add({
          t: new Date(),
          version: 1,
          summary: 'Test summary',
          vector: [0.1, 0.2, 0.3]
        })
      ).rejects.toThrow();
    });
  });
});
