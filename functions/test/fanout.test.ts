import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { onFollowLocationCreated, onFollowLocationDeleted } from "../src/followHandlers";

// Mock Firebase Functions
jest.mock("firebase-functions", () => ({
  onDocumentCreated: jest.fn(),
  onDocumentDeleted: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe("Follow Handlers - Fan-out Logic", () => {
  let testEnv: RulesTestEnvironment;
  let app: any;
  let db: any;

  beforeAll(async () => {
    // Initialize Firebase app for testing
    app = initializeApp({
      projectId: "sportbeacon-test"
    });
    
    db = getFirestore(app);
    
    testEnv = await initializeTestEnvironment({
      projectId: "sportbeacon-test",
      firestore: {
        host: "localhost",
        port: 8080
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe("onFollowLocationCreated", () => {
    it("should backfill K=25 newest posts to user home feed", async () => {
      const locationId = "test-location";
      const userId = "user1";
      const followId = `${locationId}_${userId}`;

      // Create test location
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const locationRef = context.firestore().doc(`locations/${locationId}`);
        await locationRef.set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: {
            followers: 0,
            posts: 0
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create 30 test posts (more than K=25)
        for (let i = 0; i < 30; i++) {
          const postRef = locationRef.collection("threads").doc(`post-${i}`);
          await postRef.set({
            locationId,
            authorId: "author1",
            type: "note",
            text: `Test post ${i}`,
            visibility: "place",
            likeCount: i,
            replyCount: 0,
            reportCount: 0,
            createdAt: new Date(Date.now() - (i * 1000)), // Older posts first
            updatedAt: new Date()
          });
        }
      });

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const followRef = context.firestore().doc(`follows_locations/${followId}`);
        await followRef.set({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        });
      });

      // Simulate the trigger
      const mockChange = {
        data: () => ({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        }),
        id: followId,
        ref: {
          path: `follows_locations/${followId}`
        }
      };

      // Execute the function
      await onFollowLocationCreated(mockChange as any, { params: { followId } } as any);

      // Verify location stats updated
      const locationDoc = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore().doc(`locations/${locationId}`).get();
      });

      expect(locationDoc.data()?.stats.followers).toBe(1);

      // Verify home feed items created (should be 25 most recent)
      const homeFeedSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection(`users/${userId}/home_location_feed`)
          .orderBy("createdAt", "desc")
          .get();
      });

      expect(homeFeedSnapshot.docs).toHaveLength(25);
      
      // Verify posts are ordered by recency (newest first)
      const firstPost = homeFeedSnapshot.docs[0].data();
      expect(firstPost.postRef).toContain("post-0"); // Most recent post
    });

    it("should increment location follower count", async () => {
      const locationId = "test-location";
      const userId = "user1";
      const followId = `${locationId}_${userId}`;

      // Create test location with initial stats
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: {
            followers: 5,
            posts: 10
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`follows_locations/${followId}`).set({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        });
      });

      const mockChange = {
        data: () => ({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        }),
        id: followId,
        ref: { path: `follows_locations/${followId}` }
      };

      await onFollowLocationCreated(mockChange as any, { params: { followId } } as any);

      // Verify follower count incremented
      const locationDoc = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore().doc(`locations/${locationId}`).get();
      });

      expect(locationDoc.data()?.stats.followers).toBe(6);
    });

    it("should create audit log entry", async () => {
      const locationId = "test-location";
      const userId = "user1";
      const followId = `${locationId}_${userId}`;

      // Create test location
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 0, posts: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`follows_locations/${followId}`).set({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        });
      });

      const mockChange = {
        data: () => ({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        }),
        id: followId,
        ref: { path: `follows_locations/${followId}` }
      };

      await onFollowLocationCreated(mockChange as any, { params: { followId } } as any);

      // Verify audit log created
      const auditLogsSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection("audit_logs")
          .where("action", "==", "location_followed")
          .where("userId", "==", userId)
          .where("locationId", "==", locationId)
          .get();
      });

      expect(auditLogsSnapshot.docs).toHaveLength(1);
      const auditLog = auditLogsSnapshot.docs[0].data();
      expect(auditLog.followId).toBe(followId);
      expect(auditLog.metadata.notifications).toBe("all");
    });

    it("should handle empty location gracefully", async () => {
      const locationId = "empty-location";
      const userId = "user1";
      const followId = `${locationId}_${userId}`;

      // Create test location with no posts
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Empty Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 0, posts: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      // Create follow document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`follows_locations/${followId}`).set({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        });
      });

      const mockChange = {
        data: () => ({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        }),
        id: followId,
        ref: { path: `follows_locations/${followId}` }
      };

      // Should not throw error
      await expect(onFollowLocationCreated(mockChange as any, { params: { followId } } as any))
        .resolves.not.toThrow();

      // Verify follower count still incremented
      const locationDoc = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore().doc(`locations/${locationId}`).get();
      });

      expect(locationDoc.data()?.stats.followers).toBe(1);
    });
  });

  describe("onFollowLocationDeleted", () => {
    it("should remove location posts from user home feed", async () => {
      const locationId = "test-location";
      const userId = "user1";
      const followId = `${locationId}_${userId}`;

      // Create test location
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: {
            followers: 1,
            posts: 5
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create some home feed items
        const homeFeedRef = context.firestore().collection(`users/${userId}/home_location_feed`);
        await homeFeedRef.doc("item1").set({
          source: { kind: "location", locationId },
          postRef: "locations/test-location/threads/post1",
          rank: 100,
          createdAt: new Date()
        });
        await homeFeedRef.doc("item2").set({
          source: { kind: "location", locationId: "other-location" },
          postRef: "locations/other-location/threads/post2",
          rank: 90,
          createdAt: new Date()
        });
      });

      const mockChange = {
        data: () => ({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        }),
        id: followId,
        ref: { path: `follows_locations/${followId}` }
      };

      await onFollowLocationDeleted(mockChange as any, { params: { followId } } as any);

      // Verify only location-specific items removed
      const homeFeedSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection(`users/${userId}/home_location_feed`)
          .get();
      });

      expect(homeFeedSnapshot.docs).toHaveLength(1);
      expect(homeFeedSnapshot.docs[0].data().source.locationId).toBe("other-location");
    });

    it("should decrement location follower count", async () => {
      const locationId = "test-location";
      const userId = "user1";
      const followId = `${locationId}_${userId}`;

      // Create test location with initial stats
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: {
            followers: 10,
            posts: 5
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const mockChange = {
        data: () => ({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        }),
        id: followId,
        ref: { path: `follows_locations/${followId}` }
      };

      await onFollowLocationDeleted(mockChange as any, { params: { followId } } as any);

      // Verify follower count decremented
      const locationDoc = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore().doc(`locations/${locationId}`).get();
      });

      expect(locationDoc.data()?.stats.followers).toBe(9);
    });

    it("should create audit log entry for unfollow", async () => {
      const locationId = "test-location";
      const userId = "user1";
      const followId = `${locationId}_${userId}`;

      // Create test location
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 1, posts: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const mockChange = {
        data: () => ({
          locationId,
          userId,
          notifications: "all",
          createdAt: new Date()
        }),
        id: followId,
        ref: { path: `follows_locations/${followId}` }
      };

      await onFollowLocationDeleted(mockChange as any, { params: { followId } } as any);

      // Verify audit log created
      const auditLogsSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection("audit_logs")
          .where("action", "==", "location_unfollowed")
          .where("userId", "==", userId)
          .where("locationId", "==", locationId)
          .get();
      });

      expect(auditLogsSnapshot.docs).toHaveLength(1);
      const auditLog = auditLogsSnapshot.docs[0].data();
      expect(auditLog.followId).toBe(followId);
    });

    it("should handle missing follow data gracefully", async () => {
      const followId = "missing-follow";

      const mockChange = {
        data: () => null, // No data
        id: followId,
        ref: { path: `follows_locations/${followId}` }
      };

      // Should not throw error
      await expect(onFollowLocationDeleted(mockChange as any, { params: { followId } } as any))
        .resolves.not.toThrow();
    });
  });
});