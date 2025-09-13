import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { generateLocationDigest } from "../src/digest";

// Mock Firebase Functions
jest.mock("firebase-functions", () => ({
  onSchedule: jest.fn(),
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

describe("Digest Generation", () => {
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

  describe("generateLocationDigest", () => {
    it("should generate digest for users with digest notifications", async () => {
      const locationId1 = "location1";
      const locationId2 = "location2";
      const userId1 = "user1";
      const userId2 = "user2";

      // Create test locations
      await testEnv.withSecurityRulesDisabled(async (context) => {
        // Location 1
        await context.firestore().doc(`locations/${locationId1}`).set({
          name: "Basketball Court 1",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 2, posts: 3 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Location 2
        await context.firestore().doc(`locations/${locationId2}`).set({
          name: "Soccer Field 1",
          sport: "soccer",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 1, posts: 2 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create posts for location 1
        const location1Ref = context.firestore().doc(`locations/${locationId1}`);
        for (let i = 0; i < 3; i++) {
          const postRef = location1Ref.collection("threads").doc(`post-${i}`);
          await postRef.set({
            locationId: locationId1,
            authorId: "author1",
            type: "note",
            text: `Location 1 post ${i}`,
            visibility: "place",
            likeCount: i * 2,
            replyCount: i,
            reportCount: 0,
            createdAt: new Date(Date.now() - (i * 3600000)), // 1 hour apart
            updatedAt: new Date()
          });
        }

        // Create posts for location 2
        const location2Ref = context.firestore().doc(`locations/${locationId2}`);
        for (let i = 0; i < 2; i++) {
          const postRef = location2Ref.collection("threads").doc(`post-${i}`);
          await postRef.set({
            locationId: locationId2,
            authorId: "author2",
            type: "note",
            text: `Location 2 post ${i}`,
            visibility: "place",
            likeCount: i * 3,
            replyCount: i,
            reportCount: 0,
            createdAt: new Date(Date.now() - (i * 3600000)), // 1 hour apart
            updatedAt: new Date()
          });
        }

        // Create follows with digest notifications
        await context.firestore().doc(`follows_locations/${locationId1}_${userId1}`).set({
          locationId: locationId1,
          userId: userId1,
          notifications: "digest",
          createdAt: new Date()
        });

        await context.firestore().doc(`follows_locations/${locationId2}_${userId1}`).set({
          locationId: locationId2,
          userId: userId1,
          notifications: "digest",
          createdAt: new Date()
        });

        await context.firestore().doc(`follows_locations/${locationId1}_${userId2}`).set({
          locationId: locationId1,
          userId: userId2,
          notifications: "digest",
          createdAt: new Date()
        });
      });

      // Mock the scheduled event
      const mockEvent = {
        scheduleTime: new Date().toISOString()
      };

      // Execute the function
      await generateLocationDigest(mockEvent as any);

      // Verify push notifications were sent to digest users
      const { sendPushNotification } = await import("../src/lib/notifications/push");
      expect(sendPushNotification).toHaveBeenCalledTimes(2); // One for each user

      // Verify user1 received digest with both locations
      expect(sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId1,
          title: expect.stringContaining("Daily Digest"),
          body: expect.stringContaining("5 updates from 2 places")
        })
      );

      // Verify user2 received digest with one location
      expect(sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId2,
          title: expect.stringContaining("Daily Digest"),
          body: expect.stringContaining("3 updates from 1 place")
        })
      );
    });

    it("should not send digest to users with \"all\" or \"mute\" notifications", async () => {
      const locationId = "test-location";
      const userId1 = "user1"; // all notifications
      const userId2 = "user2"; // mute notifications
      const userId3 = "user3"; // digest notifications

      // Create test location
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 3, posts: 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create a post
        const locationRef = context.firestore().doc(`locations/${locationId}`);
        const postRef = locationRef.collection("threads").doc("post1");
        await postRef.set({
          locationId,
          authorId: "author1",
          type: "note",
          text: "Test post",
          visibility: "place",
          likeCount: 5,
          replyCount: 2,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create follows with different notification preferences
        await context.firestore().doc(`follows_locations/${locationId}_${userId1}`).set({
          locationId,
          userId: userId1,
          notifications: "all",
          createdAt: new Date()
        });

        await context.firestore().doc(`follows_locations/${locationId}_${userId2}`).set({
          locationId,
          userId: userId2,
          notifications: "mute",
          createdAt: new Date()
        });

        await context.firestore().doc(`follows_locations/${locationId}_${userId3}`).set({
          locationId,
          userId: userId3,
          notifications: "digest",
          createdAt: new Date()
        });
      });

      // Mock the scheduled event
      const mockEvent = {
        scheduleTime: new Date().toISOString()
      };

      // Execute the function
      await generateLocationDigest(mockEvent as any);

      // Verify only user3 (digest) received notification
      const { sendPushNotification } = await import("../src/lib/notifications/push");
      expect(sendPushNotification).toHaveBeenCalledTimes(1);
      expect(sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId3
        })
      );
    });

    it("should handle users with no followed locations gracefully", async () => {
      // Mock the scheduled event
      const mockEvent = {
        scheduleTime: new Date().toISOString()
      };

      // Execute the function with no data
      await generateLocationDigest(mockEvent as any);

      // Verify no notifications were sent
      const { sendPushNotification } = await import("../src/lib/notifications/push");
      expect(sendPushNotification).not.toHaveBeenCalled();
    });

    it("should limit posts per location in digest", async () => {
      const locationId = "test-location";
      const userId = "user1";

      // Create test location with many posts
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 1, posts: 10 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create 10 posts
        const locationRef = context.firestore().doc(`locations/${locationId}`);
        for (let i = 0; i < 10; i++) {
          const postRef = locationRef.collection("threads").doc(`post-${i}`);
          await postRef.set({
            locationId,
            authorId: "author1",
            type: "note",
            text: `Post ${i}`,
            visibility: "place",
            likeCount: i,
            replyCount: 0,
            reportCount: 0,
            createdAt: new Date(Date.now() - (i * 3600000)), // 1 hour apart
            updatedAt: new Date()
          });
        }

        // Create follow with digest notifications
        await context.firestore().doc(`follows_locations/${locationId}_${userId}`).set({
          locationId,
          userId,
          notifications: "digest",
          createdAt: new Date()
        });
      });

      // Mock the scheduled event
      const mockEvent = {
        scheduleTime: new Date().toISOString()
      };

      // Execute the function
      await generateLocationDigest(mockEvent as any);

      // Verify digest was sent with limited posts (max 5 per location)
      const { sendPushNotification } = await import("../src/lib/notifications/push");
      expect(sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          body: expect.stringContaining("5 updates from 1 place") // Limited to 5 posts
        })
      );
    });

    it("should handle multiple locations per user correctly", async () => {
      const locationId1 = "location1";
      const locationId2 = "location2";
      const locationId3 = "location3";
      const userId = "user1";

      // Create test locations
      await testEnv.withSecurityRulesDisabled(async (context) => {
        for (const locationId of [locationId1, locationId2, locationId3]) {
          await context.firestore().doc(`locations/${locationId}`).set({
            name: `Location ${locationId}`,
            sport: "basketball",
            status: "open",
            moderators: [],
            visibility: "public",
            stats: { followers: 1, posts: 2 },
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Create posts for each location
          const locationRef = context.firestore().doc(`locations/${locationId}`);
          for (let i = 0; i < 2; i++) {
            const postRef = locationRef.collection("threads").doc(`post-${i}`);
            await postRef.set({
              locationId,
              authorId: "author1",
              type: "note",
              text: `${locationId} post ${i}`,
              visibility: "place",
              likeCount: i,
              replyCount: 0,
              reportCount: 0,
              createdAt: new Date(Date.now() - (i * 3600000)),
              updatedAt: new Date()
            });
          }

          // Create follow for each location
          await context.firestore().doc(`follows_locations/${locationId}_${userId}`).set({
            locationId,
            userId,
            notifications: "digest",
            createdAt: new Date()
          });
        }
      });

      // Mock the scheduled event
      const mockEvent = {
        scheduleTime: new Date().toISOString()
      };

      // Execute the function
      await generateLocationDigest(mockEvent as any);

      // Verify digest was sent with all locations
      const { sendPushNotification } = await import("../src/lib/notifications/push");
      expect(sendPushNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          body: expect.stringContaining("6 updates from 3 places")
        })
      );
    });

    it("should handle errors gracefully and continue processing other users", async () => {
      const locationId = "test-location";
      const userId1 = "user1";
      const userId2 = "user2";

      // Create test location
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 2, posts: 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create a post
        const locationRef = context.firestore().doc(`locations/${locationId}`);
        const postRef = locationRef.collection("threads").doc("post1");
        await postRef.set({
          locationId,
          authorId: "author1",
          type: "note",
          text: "Test post",
          visibility: "place",
          likeCount: 5,
          replyCount: 2,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create follows
        await context.firestore().doc(`follows_locations/${locationId}_${userId1}`).set({
          locationId,
          userId: userId1,
          notifications: "digest",
          createdAt: new Date()
        });

        await context.firestore().doc(`follows_locations/${locationId}_${userId2}`).set({
          locationId,
          userId: userId2,
          notifications: "digest",
          createdAt: new Date()
        });
      });

      // Mock push notification to fail for user1
      const { sendPushNotification } = await import("../src/lib/notifications/push");
      sendPushNotification
        .mockResolvedValueOnce({ success: false, error: "Failed to send" })
        .mockResolvedValueOnce({ success: true });

      // Mock the scheduled event
      const mockEvent = {
        scheduleTime: new Date().toISOString()
      };

      // Execute the function - should not throw error
      await expect(generateLocationDigest(mockEvent as any)).resolves.not.toThrow();

      // Verify both users were attempted
      expect(sendPushNotification).toHaveBeenCalledTimes(2);
    });
  });
});