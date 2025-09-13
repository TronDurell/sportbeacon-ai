import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { reportPost } from "../src/moderation";

// Mock Firebase Functions
jest.mock("firebase-functions", () => ({
  onCall: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe("Moderation System", () => {
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

  describe("reportPost", () => {
    it("should create report and increment post report count", async () => {
      const locationId = "test-location";
      const postId = "test-post";
      const reporterId = "user1";
      const reason = "inappropriate_content";

      // Create test location and post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 0, posts: 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await context.firestore().doc(`locations/${locationId}/threads/${postId}`).set({
          locationId,
          authorId: "author1",
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

      // Mock authenticated request
      const mockRequest = {
        auth: { uid: reporterId },
        data: {
          locationId,
          postId,
          reason,
          details: "This post contains inappropriate content"
        }
      };

      // Execute the function
      const result = await reportPost(mockRequest as any);

      // Verify response
      expect(result.data.success).toBe(true);
      expect(result.data.message).toContain("Report submitted successfully");

      // Verify report document was created
      const reportsSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection("moderationReports")
          .where("locationId", "==", locationId)
          .where("postId", "==", postId)
          .where("reporterId", "==", reporterId)
          .get();
      });

      expect(reportsSnapshot.docs).toHaveLength(1);
      const report = reportsSnapshot.docs[0].data();
      expect(report.reason).toBe(reason);
      expect(report.status).toBe("pending");
      expect(report.details).toBe("This post contains inappropriate content");

      // Verify post report count was incremented
      const postDoc = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore().doc(`locations/${locationId}/threads/${postId}`).get();
      });

      expect(postDoc.data()?.reportCount).toBe(1);
    });

    it("should quarantine post when report threshold is reached", async () => {
      const locationId = "test-location";
      const postId = "test-post";
      const reason = "inappropriate_content";

      // Create test location and post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 0, posts: 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await context.firestore().doc(`locations/${locationId}/threads/${postId}`).set({
          locationId,
          authorId: "author1",
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 2, // Already has 2 reports
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      // Mock authenticated request
      const mockRequest = {
        auth: { uid: "user1" },
        data: {
          locationId,
          postId,
          reason,
          details: "Third report"
        }
      };

      // Execute the function
      await reportPost(mockRequest as any);

      // Verify post was quarantined (reportCount >= threshold of 3)
      const postDoc = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore().doc(`locations/${locationId}/threads/${postId}`).get();
      });

      const postData = postDoc.data();
      expect(postData?.reportCount).toBe(3);
      expect(postData?.quarantined).toBe(true);
      expect(postData?.quarantinedAt).toBeDefined();
    });

    it("should enforce daily report limit per user", async () => {
      const locationId = "test-location";
      const postId = "test-post";
      const reporterId = "user1";
      const reason = "inappropriate_content";

      // Create test location and post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 0, posts: 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await context.firestore().doc(`locations/${locationId}/threads/${postId}`).set({
          locationId,
          authorId: "author1",
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create existing reports for the user (at daily limit)
        for (let i = 0; i < 5; i++) {
          await context.firestore().collection("moderationReports").doc(`report-${i}`).set({
            locationId: `location-${i}`,
            postId: `post-${i}`,
            reporterId,
            reason,
            details: `Report ${i}`,
            status: "pending",
            createdAt: new Date(),
            reviewedAt: null,
            reviewedBy: null,
            action: null
          });
        }
      });

      // Mock authenticated request
      const mockRequest = {
        auth: { uid: reporterId },
        data: {
          locationId,
          postId,
          reason,
          details: "This should be rejected"
        }
      };

      // Execute the function and expect error
      await expect(reportPost(mockRequest as any)).rejects.toThrow("Daily report limit exceeded");
    });

    it("should require authentication", async () => {
      const mockRequest = {
        auth: null, // No authentication
        data: {
          locationId: "test-location",
          postId: "test-post",
          reason: "inappropriate_content"
        }
      };

      // Execute the function and expect error
      await expect(reportPost(mockRequest as any)).rejects.toThrow("Authentication required");
    });

    it("should validate required fields", async () => {
      const mockRequest = {
        auth: { uid: "user1" },
        data: {
          // Missing locationId, postId, reason
          details: "Some details"
        }
      };

      // Execute the function and expect error
      await expect(reportPost(mockRequest as any)).rejects.toThrow("Missing required fields");
    });

    it("should handle non-existent post gracefully", async () => {
      const locationId = "test-location";
      const postId = "non-existent-post";
      const reporterId = "user1";
      const reason = "inappropriate_content";

      // Create test location but no post
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

      // Mock authenticated request
      const mockRequest = {
        auth: { uid: reporterId },
        data: {
          locationId,
          postId,
          reason,
          details: "This post does not exist"
        }
      };

      // Execute the function - should not throw error
      const result = await reportPost(mockRequest as any);

      // Verify report was still created
      expect(result.data.success).toBe(true);

      // Verify report document was created
      const reportsSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection("moderationReports")
          .where("postId", "==", postId)
          .get();
      });

      expect(reportsSnapshot.docs).toHaveLength(1);
    });

    it("should prevent duplicate reports from same user", async () => {
      const locationId = "test-location";
      const postId = "test-post";
      const reporterId = "user1";
      const reason = "inappropriate_content";

      // Create test location and post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 0, posts: 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await context.firestore().doc(`locations/${locationId}/threads/${postId}`).set({
          locationId,
          authorId: "author1",
          type: "note",
          text: "Test post content",
          visibility: "place",
          likeCount: 0,
          replyCount: 0,
          reportCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Create existing report from same user
        await context.firestore().collection("moderationReports").doc("existing-report").set({
          locationId,
          postId,
          reporterId,
          reason,
          details: "Existing report",
          status: "pending",
          createdAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
          action: null
        });
      });

      // Mock authenticated request
      const mockRequest = {
        auth: { uid: reporterId },
        data: {
          locationId,
          postId,
          reason,
          details: "Duplicate report"
        }
      };

      // Execute the function and expect error
      await expect(reportPost(mockRequest as any)).rejects.toThrow("You have already reported this post");
    });

    it("should handle different report reasons correctly", async () => {
      const locationId = "test-location";
      const postId = "test-post";
      const reporterId = "user1";

      // Create test location and post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 0, posts: 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await context.firestore().doc(`locations/${locationId}/threads/${postId}`).set({
          locationId,
          authorId: "author1",
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

      const reasons = [
        "inappropriate_content",
        "spam",
        "harassment",
        "violence",
        "hate_speech",
        "false_information",
        "other"
      ];

      for (const reason of reasons) {
        // Mock authenticated request
        const mockRequest = {
          auth: { uid: reporterId },
          data: {
            locationId,
            postId: `${postId}-${reason}`,
            reason,
            details: `Report for ${reason}`
          }
        };

        // Execute the function
        const result = await reportPost(mockRequest as any);

        // Verify response
        expect(result.data.success).toBe(true);
      }

      // Verify all reports were created
      const reportsSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection("moderationReports")
          .where("reporterId", "==", reporterId)
          .get();
      });

      expect(reportsSnapshot.docs).toHaveLength(reasons.length);
    });

    it("should create audit log for moderation actions", async () => {
      const locationId = "test-location";
      const postId = "test-post";
      const reporterId = "user1";
      const reason = "inappropriate_content";

      // Create test location and post
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`locations/${locationId}`).set({
          name: "Test Location",
          sport: "basketball",
          status: "open",
          moderators: [],
          visibility: "public",
          stats: { followers: 0, posts: 1 },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await context.firestore().doc(`locations/${locationId}/threads/${postId}`).set({
          locationId,
          authorId: "author1",
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

      // Mock authenticated request
      const mockRequest = {
        auth: { uid: reporterId },
        data: {
          locationId,
          postId,
          reason,
          details: "Test report"
        }
      };

      // Execute the function
      await reportPost(mockRequest as any);

      // Verify audit log was created
      const auditLogsSnapshot = await testEnv.withSecurityRulesDisabled(async (context) => {
        return await context.firestore()
          .collection("audit_logs")
          .where("action", "==", "post_reported")
          .where("locationId", "==", locationId)
          .where("postId", "==", postId)
          .get();
      });

      expect(auditLogsSnapshot.docs).toHaveLength(1);
      const auditLog = auditLogsSnapshot.docs[0].data();
      expect(auditLog.reporterId).toBe(reporterId);
      expect(auditLog.reason).toBe(reason);
    });
  });
});