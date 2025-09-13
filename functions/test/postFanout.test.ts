import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { onLocationPostCreated } from "../src/postFanout";

// Mock Firebase Functions
jest.mock("firebase-functions", () => ({
  onDocumentCreated: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock push notifications
jest.mock("../src/lib/notifications/push", () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true })
}));

describe("Post Fan-out Logic", () => {
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

  describe("onLocationPostCreated", () => {
    it("should increment location stats and fan out to followers", async () => {
      const locationId = "test-location";
      const postId = "test-post";
      const authorId = "author1";

      // Create test location with followers
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const locationRef = context.firestore().doc(`locations/${locationId}`);
        await locationRef.set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: {
            followers: 2,
            posts: 5
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create followers
        await context.firestore().doc(`follows_locations/${locationId}_user1`).set({
          locationId,
          userId: "user1",
          notifications: "all",
          createdAt: new Date()
        });

        await context.firestore().doc(`follows_locations/${locationId}_user2`).set({
          locationId,
          userId: "user2",
          notifications: "digest",
          createdAt: new Date()
        });
      });

      // Create the post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const postRef = context.firestore().doc(`locations/${locationId}/threads/${postId}`);
        await postRef.set({
          locationId,
          authorId,
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      // Simulate the trigger
      const mockChange = {
        data: () => ({
          locationId,
          authorId,
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        id: postId,
        ref: {
          path: `locations/${locationId}/threads/${postId}`
        }
      };

      // Execute the function
      await onLocationPostCreated(mockChange as any, { params: { locationId, postId } } as any);

      // Verify location stats updated
      const locationDoc = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore().doc(`locations/${locationId}`).get();
      });

      const locationData = locationDoc.data();
      expect(locationData?.stats.posts).toBe(6);
      expect(locationData?.stats.lastPostAt).toBeDefined();

      // Verify posts fanned out to followers' feeds
      const user1FeedSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection("users/user1/home_location_feed")
          .where("postRef", "==", `locations/${locationId}/threads/${postId}`)
          .get();
      });

      const user2FeedSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection("users/user2/home_location_feed")
          .where("postRef", "==", `locations/${locationId}/threads/${postId}`)
          .get();
      });

      expect(user1FeedSnapshot.docs).toHaveLength(1);
      expect(user2FeedSnapshot.docs).toHaveLength(1);

      // Verify feed items have correct structure
      const user1FeedItem = user1FeedSnapshot.docs[0].data();
      expect(user1FeedItem.source.kind).toBe("location");
      expect(user1FeedItem.source.locationId).toBe(locationId);
      expect(user1FeedItem.rank).toBeDefined();
    });

    it("should send push notifications to users with \"all\" preference", async () => {
      const locationId = "test-location";
      const postId = "test-post";
      const authorId = "author1";

      // Create test location with followers
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const locationRef = context.firestore().doc(`locations/${locationId}`);
        await locationRef.set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 1, posts: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create follower with "all" notifications
        await context.firestore().doc(`follows_locations/${locationId}_user1`).set({
          locationId,
          userId: "user1",
          notifications: "all",
          createdAt: new Date()
        });
      });

      // Create the post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const postRef = context.firestore().doc(`locations/${locationId}/threads/${postId}`);
        await postRef.set({
          locationId,
          authorId,
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const mockChange = {
        data: () => ({
          locationId,
          authorId,
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        id: postId,
        ref: { path: `locations/${locationId}/threads/${postId}` }
      };

      await onLocationPostCreated(mockChange as any, { params: { locationId, postId } } as any);

      // Verify push notification was sent (mocked)
      const { sendPushNotification } = await import("../src/lib/notifications/push");
      expect(sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user1",
          title: expect.stringContaining("Test Location"),
          body: expect.stringContaining("Test post content")
        })
      );
    });

    it("should not send push notifications to users with \"mute\" preference", async () => {
      const locationId = "test-location";
      const postId = "test-post";
      const authorId = "author1";

      // Create test location with followers
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const locationRef = context.firestore().doc(`locations/${locationId}`);
        await locationRef.set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 1, posts: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create follower with "mute" notifications
        await context.firestore().doc(`follows_locations/${locationId}_user1`).set({
          locationId,
          userId: "user1",
          notifications: "mute",
          createdAt: new Date()
        });
      });

      // Create the post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const postRef = context.firestore().doc(`locations/${locationId}/threads/${postId}`);
        await postRef.set({
          locationId,
          authorId,
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const mockChange = {
        data: () => ({
          locationId,
          authorId,
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        id: postId,
        ref: { path: `locations/${locationId}/threads/${postId}` }
      };

      await onLocationPostCreated(mockChange as any, { params: { locationId, postId } } as any);

      // Verify no push notification was sent
      const { sendPushNotification } = await import("../src/lib/notifications/push");
      expect(sendPushNotification).not.toHaveBeenCalled();
    });

    it("should create audit log entry", async () => {
      const locationId = "test-location";
      const postId = "test-post";
      const authorId = "author1";

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

      // Create the post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const postRef = context.firestore().doc(`locations/${locationId}/threads/${postId}`);
        await postRef.set({
          locationId,
          authorId,
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const mockChange = {
        data: () => ({
          locationId,
          authorId,
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        id: postId,
        ref: { path: `locations/${locationId}/threads/${postId}` }
      };

      await onLocationPostCreated(mockChange as any, { params: { locationId, postId } } as any);

      // Verify audit log created
      const auditLogsSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection("audit_logs")
          .where("action", "==", "location_post_created")
          .where("locationId", "==", locationId)
          .where("postId", "==", postId)
          .get();
      });

      expect(auditLogsSnapshot.docs).toHaveLength(1);
      const auditLog = auditLogsSnapshot.docs[0].data();
      expect(auditLog.authorId).toBe(authorId);
      expect(auditLog.type).toBe("note");
      expect(auditLog.metadata.visibility).toBe("place");
    });

    it("should handle missing post data gracefully", async () => {
      const locationId = "test-location";
      const postId = "test-post";

      const mockChange = {
        data: () => null, // No data
        id: postId,
        ref: { path: `locations/${locationId}/threads/${postId}` }
      };

      // Should not throw error
      await expect(onLocationPostCreated(mockChange as any, { params: { locationId, postId } } as any))
        .resolves.not.toThrow();
    });

    it("should handle different post types correctly", async () => {
      const locationId = "test-location";
      const postId = "test-poll";
      const authorId = "author1";

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

      // Create a poll post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const postRef = context.firestore().doc(`locations/${locationId}/threads/${postId}`);
        await postRef.set({
          locationId,
          authorId,
          type: "poll",
          text: "What time works best?",
          poll: {
            question: "What time works best?",
            options: ["Morning", "Afternoon", "Evening"],
            closesAt: new Date(Date.now() + 86400000)
          },
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      const mockChange = {
        data: () => ({
          locationId,
          authorId,
          type: "poll",
          text: "What time works best?",
          poll: {
            question: "What time works best?",
            options: ["Morning", "Afternoon", "Evening"],
            closesAt: new Date(Date.now() + 86400000)
          },
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        id: postId,
        ref: { path: `locations/${locationId}/threads/${postId}` }
      };

      await onLocationPostCreated(mockChange as any, { params: { locationId, postId } } as any);

      // Verify location stats updated
      const locationDoc = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore().doc(`locations/${locationId}`).get();
      });

      expect(locationDoc.data()?.stats.posts).toBe(1);

      // Verify audit log includes poll metadata
      const auditLogsSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection("audit_logs")
          .where("action", "==", "location_post_created")
          .where("type", "==", "poll")
          .get();
      });

      expect(auditLogsSnapshot.docs).toHaveLength(1);
    });
  });
});