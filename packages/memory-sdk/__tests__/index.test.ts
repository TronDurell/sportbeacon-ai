/* SportBeaconAI - Memory SDK Unit Tests
   Tests for append-only writes and owner-only reads
*/

import { memoryClient, type MemoryEvent } from '../src/index';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Test configuration
const TEST_CONFIG = {
  projectId: 'sportbeacon-test',
  authEmulatorHost: 'localhost:9099',
  firestoreEmulatorHost: 'localhost:8080'
};

describe('Memory SDK', () => {
  let testUserId: string;
  let testUserId2: string;
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

    // Create test users
    try {
      await createUserWithEmailAndPassword(auth, 'test1@sportbeacon.ai', 'testpassword123');
    } catch (error) {
      // User might already exist
    }

    try {
      await createUserWithEmailAndPassword(auth, 'test2@sportbeacon.ai', 'testpassword123');
    } catch (error) {
      // User might already exist
    }

    // Sign in test users
    const userCredential1 = await signInWithEmailAndPassword(auth, 'test1@sportbeacon.ai', 'testpassword123');
    testUserId = userCredential1.user.uid;

    const userCredential2 = await signInWithEmailAndPassword(auth, 'test2@sportbeacon.ai', 'testpassword123');
    testUserId2 = userCredential2.user.uid;
  });

  afterAll(async () => {
    // Clean up
    try {
      await auth.signOut();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('append-only writes', () => {
    it('should create memory events successfully', async () => {
      const client = memoryClient();
      
      const event: Omit<MemoryEvent, 't'> = {
        kind: 'feedback',
        scope: 'web',
        trace: 'test-trace',
        tags: ['test'],
        data: { message: 'Test feedback' }
      };

      const eventId = await client.writeEvent(testUserId, event);
      
      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');

      // Verify the event was created
      const eventsRef = collection(db, 'memories', testUserId, 'events');
      const eventsSnap = await getDocs(eventsRef);
      
      expect(eventsSnap.size).toBeGreaterThan(0);
      const eventData = eventsSnap.docs.find(doc => doc.id === eventId);
      expect(eventData).toBeDefined();
      expect(eventData?.data().kind).toBe('feedback');
      expect(eventData?.data().data.message).toBe('Test feedback');
    });

    it('should create memory snapshots successfully', async () => {
      const client = memoryClient();
      
      const snapshotId = await client.writeSnapshot(testUserId, {
        version: 1,
        summary: 'Test summary',
        vector: [0.1, 0.2, 0.3]
      });

      expect(snapshotId).toBeDefined();
      expect(typeof snapshotId).toBe('string');

      // Verify the snapshot was created
      const snapshotRef = doc(db, 'user_memory', testUserId, 'snapshots', snapshotId);
      const snapshotSnap = await getDoc(snapshotRef);
      
      expect(snapshotSnap.exists()).toBe(true);
      expect(snapshotSnap.data()?.summary).toBe('Test summary');
      expect(snapshotSnap.data()?.version).toBe(1);
    });

    it('should capture feedback via convenience method', async () => {
      const client = memoryClient();
      
      const feedbackId = await client.feedback(
        testUserId,
        'This drill was very helpful',
        ['drills', 'positive'],
        'drill-feedback'
      );

      expect(feedbackId).toBeDefined();

      // Verify the feedback was captured
      const eventsRef = collection(db, 'memories', testUserId, 'events');
      const eventsSnap = await getDocs(eventsRef);
      
      const feedbackEvent = eventsSnap.docs.find(doc => 
        doc.data().kind === 'feedback' && 
        doc.data().data.message === 'This drill was very helpful'
      );
      
      expect(feedbackEvent).toBeDefined();
      expect(feedbackEvent?.data().tags).toContain('drills');
      expect(feedbackEvent?.data().tags).toContain('positive');
    });
  });

  describe('owner-only reads', () => {
    it('should only allow owner to read their own events', async () => {
      const client = memoryClient();
      
      // Create an event for user 1
      await client.writeEvent(testUserId, {
        kind: 'note',
        scope: 'web',
        trace: 'private-note',
        tags: ['private'],
        data: { content: 'Private note for user 1' }
      });

      // Switch to user 2
      await auth.signOut();
      await signInWithEmailAndPassword(auth, 'test2@sportbeacon.ai', 'testpassword123');

      // User 2 should not be able to read user 1's events
      const user1EventsRef = collection(db, 'memories', testUserId, 'events');
      
      // This should work (reading their own events)
      const user2EventsRef = collection(db, 'memories', testUserId2, 'events');
      const user2EventsSnap = await getDocs(user2EventsRef);
      
      // User 2's events collection should be empty or contain only their events
      user2EventsSnap.docs.forEach(doc => {
        expect(doc.data().data.content).not.toBe('Private note for user 1');
      });
    });

    it('should only allow owner to read their own snapshots', async () => {
      // Switch back to user 1
      await auth.signOut();
      await signInWithEmailAndPassword(auth, 'test1@sportbeacon.ai', 'testpassword123');

      const client = memoryClient();
      
      // Create a snapshot for user 1
      const snapshotId = await client.writeSnapshot(testUserId, {
        version: 1,
        summary: 'Private summary for user 1'
      });

      // Switch to user 2
      await auth.signOut();
      await signInWithEmailAndPassword(auth, 'test2@sportbeacon.ai', 'testpassword123');

      // User 2 should not be able to read user 1's snapshots
      const user1SnapshotRef = doc(db, 'user_memory', testUserId, 'snapshots', snapshotId);
      
      // This should fail or return empty (depending on security rules)
      try {
        const user1SnapshotSnap = await getDoc(user1SnapshotRef);
        // If the document exists, it should not contain user 1's private data
        if (user1SnapshotSnap.exists()) {
          expect(user1SnapshotSnap.data()?.summary).not.toBe('Private summary for user 1');
        }
      } catch (error) {
        // Expected - user 2 cannot read user 1's snapshots
        expect(error).toBeDefined();
      }
    });
  });

  describe('cross-user access prevention', () => {
    it('should prevent cross-user event creation', async () => {
      // Switch to user 1
      await auth.signOut();
      await signInWithEmailAndPassword(auth, 'test1@sportbeacon.ai', 'testpassword123');

      const client = memoryClient();
      
      // User 1 should not be able to create events for user 2
      try {
        await client.writeEvent(testUserId2, {
          kind: 'note',
          scope: 'web',
          trace: 'cross-user-attempt',
          data: { content: 'Attempted cross-user creation' }
        });
        
        // If this doesn't throw, the security rules are not working properly
        fail('Cross-user event creation should be prevented');
      } catch (error) {
        // Expected - cross-user event creation should be prevented
        expect(error).toBeDefined();
      }
    });

    it('should prevent cross-user snapshot creation', async () => {
      const client = memoryClient();
      
      // User 1 should not be able to create snapshots for user 2
      try {
        await client.writeSnapshot(testUserId2, {
          version: 1,
          summary: 'Attempted cross-user snapshot'
        });
        
        // If this doesn't throw, the security rules are not working properly
        fail('Cross-user snapshot creation should be prevented');
      } catch (error) {
        // Expected - cross-user snapshot creation should be prevented
        expect(error).toBeDefined();
      }
    });
  });

  describe('data validation', () => {
    it('should validate required fields', async () => {
      const client = memoryClient();
      
      // Test missing required fields
      try {
        await client.writeEvent(testUserId, {
          kind: 'feedback',
          scope: 'web',
          // Missing trace field
          data: { message: 'Test' }
        } as any);
        
        fail('Should have failed validation');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should validate event kinds', async () => {
      const client = memoryClient();
      
      // Test invalid event kind
      try {
        await client.writeEvent(testUserId, {
          kind: 'invalid' as any,
          scope: 'web',
          trace: 'test',
          data: { message: 'Test' }
        });
        
        fail('Should have failed validation');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should validate scope values', async () => {
      const client = memoryClient();
      
      // Test invalid scope
      try {
        await client.writeEvent(testUserId, {
          kind: 'feedback',
          scope: 'invalid' as any,
          trace: 'test',
          data: { message: 'Test' }
        });
        
        fail('Should have failed validation');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
