"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const test_utils_1 = require("../../__tests__/test-utils");
describe("parentFollowUpEmails", () => {
    beforeEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    afterEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    it("should process parent follow-up emails successfully", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with pending requests older than 3 days
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-old-1": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
            },
            "override-old-2": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-11T14:30:00Z"),
                lastReminderSent: null,
            },
        });
        await (0, test_utils_1.seedTestData)("siblingPairings", {
            "pairing-old-1": {
                ...test_utils_1.mockData.siblingPairing,
                status: "pending",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
            },
        });
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        const pairingCount = await (0, test_utils_1.countDocuments)("siblingPairings");
        expect(overrideCount).toBe(2);
        expect(pairingCount).toBe(1);
    });
    it("should handle empty dataset gracefully", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        const pairingCount = await (0, test_utils_1.countDocuments)("siblingPairings");
        expect(overrideCount).toBe(0);
        expect(pairingCount).toBe(0);
    });
    it("should process only requests older than 3 days", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with mixed ages
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-old": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
            },
            "override-recent": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-14T10:00:00Z"),
                lastReminderSent: null,
            },
        });
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(2);
    });
    it("should handle requests with existing reminders", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with existing reminders
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-with-reminder": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: new Date("2024-01-13T10:00:00Z"),
                reminderCount: 1,
            },
        });
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(1);
    });
    it("should process multiple request types", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with different request types
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-multi-1": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
            },
        });
        await (0, test_utils_1.seedTestData)("siblingPairings", {
            "pairing-multi-1": {
                ...test_utils_1.mockData.siblingPairing,
                status: "pending",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
            },
        });
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-multi-1": {
                ...test_utils_1.mockData.waitlistEntry,
                status: "waiting",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
            },
        });
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        const pairingCount = await (0, test_utils_1.countDocuments)("siblingPairings");
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(overrideCount).toBe(1);
        expect(pairingCount).toBe(1);
        expect(waitlistCount).toBe(1);
    });
    it("should handle requests with different statuses", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with different statuses
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-pending": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
            },
            "override-approved": {
                ...test_utils_1.mockData.ageOverride,
                status: "approved",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
            },
            "override-denied": {
                ...test_utils_1.mockData.ageOverride,
                status: "denied",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
            },
        });
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(3);
    });
    it("should handle requests with multiple reminders", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with multiple reminders
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-multiple-reminders": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-05T10:00:00Z"),
                lastReminderSent: new Date("2024-01-12T10:00:00Z"),
                reminderCount: 2,
                reminderHistory: [
                    { sentAt: new Date("2024-01-08T10:00:00Z"), type: "first_reminder" },
                    { sentAt: new Date("2024-01-12T10:00:00Z"), type: "second_reminder" },
                ],
            },
        });
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(1);
    });
    it("should handle requests with special characters and complex data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with special characters
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-special": {
                ...test_utils_1.mockData.ageOverride,
                childName: "José María O'Connor-Smith",
                parentEmail: "jose.maria+followup@example-domain.com",
                reason: "This is a very detailed reason with multiple sentences. The child has demonstrated exceptional skills in multiple sports and has received professional training.",
                status: "pending",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
                specialNeeds: "Hearing impairment - needs sign language interpreter",
                additionalNotes: "Special accommodation request for sign language interpreter",
            },
        });
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(1);
    });
    it("should handle large dataset for follow-up emails", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Create large dataset
        const largeOverrideData = {};
        const largePairingData = {};
        for (let i = 1; i <= 50; i++) {
            largeOverrideData[`override-large-${i}`] = {
                ...test_utils_1.mockData.ageOverride,
                childName: `Child ${i}`,
                parentEmail: `parent${i}@example.com`,
                status: "pending",
                createdAt: new Date(`2024-01-${10 + (i % 5)}T${10 + (i % 10)}:00:00Z`),
                lastReminderSent: null,
            };
            largePairingData[`pairing-large-${i}`] = {
                ...test_utils_1.mockData.siblingPairing,
                familyId: `family${i}`,
                parentEmail: `parent${i}@example.com`,
                status: "pending",
                createdAt: new Date(`2024-01-${10 + (i % 5)}T${10 + (i % 10)}:00:00Z`),
                lastReminderSent: null,
            };
        }
        await (0, test_utils_1.seedTestData)("ageOverrides", largeOverrideData);
        await (0, test_utils_1.seedTestData)("siblingPairings", largePairingData);
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(500);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        const pairingCount = await (0, test_utils_1.countDocuments)("siblingPairings");
        expect(overrideCount).toBe(50);
        expect(pairingCount).toBe(50);
    });
    it("should handle scheduled event with specific timezone", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)("2024-01-15T10:00:00Z", "America/New_York");
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-timezone": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
            },
        });
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(1);
    });
    it("should handle requests with different reminder frequencies", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with different reminder frequencies
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-first-reminder": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-10T10:00:00Z"),
                lastReminderSent: null,
                reminderCount: 0,
            },
            "override-second-reminder": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-05T10:00:00Z"),
                lastReminderSent: new Date("2024-01-12T10:00:00Z"),
                reminderCount: 1,
            },
            "override-final-reminder": {
                ...test_utils_1.mockData.ageOverride,
                status: "pending",
                createdAt: new Date("2024-01-01T10:00:00Z"),
                lastReminderSent: new Date("2024-01-08T10:00:00Z"),
                reminderCount: 2,
            },
        });
        // Act
        await index_1.parentFollowUpEmails.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(3);
    });
    // TODO: Add edge case tests
    // - Test with malformed email addresses
    // - Test with missing required fields
    // - Test with invalid date ranges
    // - Test with processing timeouts
    // - Test with database connection failures
    // - Test with email sending failures
    // - Test with reminder tracking failures
    // - Test with concurrent processing conflicts
    // - Test with data validation failures
    // - Test with rate limiting scenarios
    // TODO: Add integration tests
    // - Test with real Firestore emulator
    // - Test with email service integration
    // - Test with reminder tracking service
    // - Test with parent communication workflows
    // - Test with email template rendering
    // - Test with email delivery tracking
    // - Test with audit trail completeness
    // - Test with data consistency checks
    // - Test with performance benchmarks
    // - Test with error recovery scenarios
    // - Test with concurrent processing limits
    // - Test with email batching optimization
    // - Test with reminder frequency management
    // - Test with monitoring and alerting
    // - Test with email personalization
    // - Test with multi-language support
});
//# sourceMappingURL=parentFollowUpEmails.test.js.map