"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const test_utils_1 = require("../../__tests__/test-utils");
describe("waitlistDailyScan", () => {
    beforeEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    afterEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    it("should process daily waitlist scan successfully", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-1": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", createdAt: new Date("2024-01-14T10:00:00Z") },
            "waitlist-2": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", createdAt: new Date("2024-01-14T11:00:00Z") },
            "waitlist-3": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", createdAt: new Date("2024-01-14T12:00:00Z") },
        });
        // Act
        await index_1.waitlistDailyScan.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(waitlistCount).toBe(3);
    });
    it("should handle empty waitlist gracefully", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Act
        await index_1.waitlistDailyScan.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(waitlistCount).toBe(0);
    });
    it("should process waitlist with age override requests", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-age-1": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", hasAgeOverride: true },
            "waitlist-age-2": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", hasAgeOverride: true },
        });
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-1": { ...test_utils_1.mockData.ageOverride, status: "pending" },
            "override-2": { ...test_utils_1.mockData.ageOverride, status: "pending" },
        });
        // Act
        await index_1.waitlistDailyScan.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(waitlistCount).toBe(2);
        expect(overrideCount).toBe(2);
    });
    it("should process waitlist with sibling pairing requests", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-sibling-1": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", hasSiblingPairing: true },
            "waitlist-sibling-2": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", hasSiblingPairing: true },
        });
        await (0, test_utils_1.seedTestData)("siblingPairings", {
            "pairing-1": { ...test_utils_1.mockData.siblingPairing, status: "pending" },
            "pairing-2": { ...test_utils_1.mockData.siblingPairing, status: "pending" },
        });
        // Act
        await index_1.waitlistDailyScan.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        const pairingCount = await (0, test_utils_1.countDocuments)("siblingPairings");
        expect(waitlistCount).toBe(2);
        expect(pairingCount).toBe(2);
    });
    it("should process waitlist with capacity changes", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-capacity-1": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", league: "Youth Basketball",
                waitlistPosition: 1 },
            "waitlist-capacity-2": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", league: "Youth Basketball",
                waitlistPosition: 2 },
            "waitlist-capacity-3": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", league: "Youth Soccer", waitlistPosition: 1 },
        });
        await (0, test_utils_1.seedTestData)("leagues", {
            "league-basketball": { name: "Youth Basketball", capacity: 20, currentEnrollment: 18 },
            "league-soccer": { name: "Youth Soccer", capacity: 15, currentEnrollment: 15 },
        });
        // Act
        await index_1.waitlistDailyScan.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(waitlistCount).toBe(3);
    });
    it("should handle waitlist with mixed statuses", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with different statuses
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-active": { ...test_utils_1.mockData.waitlistEntry, status: "active" },
            "waitlist-waiting": { ...test_utils_1.mockData.waitlistEntry, status: "waiting" },
            "waitlist-cancelled": { ...test_utils_1.mockData.waitlistEntry, status: "cancelled" },
            "waitlist-approved": { ...test_utils_1.mockData.waitlistEntry, status: "approved" },
        });
        // Act
        await index_1.waitlistDailyScan.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(waitlistCount).toBe(4);
    });
    it("should process waitlist with priority levels", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with different priorities
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-high": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", priority: "high", waitlistPosition: 1 },
            "waitlist-medium": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", priority: "medium", waitlistPosition: 2 },
            "waitlist-low": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", priority: "low", waitlistPosition: 3 },
        });
        // Act
        await index_1.waitlistDailyScan.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(waitlistCount).toBe(3);
    });
    it("should handle waitlist with special characters and complex data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with special characters
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-special": {
                ...test_utils_1.mockData.waitlistEntry,
                childName: "José María O'Connor-Smith",
                parentEmail: "jose.maria+waitlist@example-domain.com",
                league: "Youth Basketball (Ages 8-10)",
                specialNeeds: "Hearing impairment - needs sign language interpreter",
                additionalNotes: "Special accommodation request for sign language interpreter",
                status: "waiting",
                priority: "high",
                waitlistPosition: 1,
            },
        });
        // Act
        await index_1.waitlistDailyScan.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(waitlistCount).toBe(1);
    });
    it("should handle large waitlist dataset", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Create large dataset
        const largeWaitlistData = {};
        for (let i = 1; i <= 100; i++) {
            largeWaitlistData[`waitlist-large-${i}`] = {
                ...test_utils_1.mockData.waitlistEntry,
                childName: `Child ${i}`,
                parentEmail: `parent${i}@example.com`,
                status: "waiting",
                waitlistPosition: i,
                createdAt: new Date(`2024-01-${14 + Math.floor(i / 10)}T${10 + (i % 10)}:00:00Z`),
            };
        }
        await (0, test_utils_1.seedTestData)("waitlists", largeWaitlistData);
        // Act
        await index_1.waitlistDailyScan.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(500);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(waitlistCount).toBe(100);
    });
    it("should handle scheduled event with specific timezone", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)("2024-01-15T08:00:00Z", "America/New_York");
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-timezone": { ...test_utils_1.mockData.waitlistEntry, status: "waiting" },
        });
        // Act
        await index_1.waitlistDailyScan.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(waitlistCount).toBe(1);
    });
    // TODO: Add edge case tests
    // - Test with malformed waitlist data
    // - Test with missing required fields
    // - Test with invalid league references
    // - Test with capacity overflow scenarios
    // - Test with processing timeouts
    // - Test with database connection failures
    // - Test with notification sending failures
    // - Test with audit log creation failures
    // - Test with concurrent processing conflicts
    // - Test with data validation failures
    // TODO: Add integration tests
    // - Test with real Firestore emulator
    // - Test with email notification service
    // - Test with league capacity management
    // - Test with age override processing workflows
    // - Test with sibling pairing processing workflows
    // - Test with parent notification workflows
    // - Test with staff notification workflows
    // - Test with audit trail completeness
    // - Test with data consistency checks
    // - Test with performance benchmarks
    // - Test with error recovery scenarios
    // - Test with concurrent processing limits
    // - Test with rate limiting scenarios
    // - Test with batch processing optimization
    // - Test with retry mechanisms
    // - Test with monitoring and alerting
});
//# sourceMappingURL=waitlistDailyScan.test.js.map