"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const test_utils_1 = require("../../__tests__/test-utils");
describe("weeklyDirectorDigest", () => {
    beforeEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    afterEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    it("should process weekly director digest successfully", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data for the week
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-approved-1": { ...test_utils_1.mockData.ageOverride, status: "approved", approvedAt: new Date("2024-01-10T10:00:00Z") },
            "override-approved-2": { ...test_utils_1.mockData.ageOverride, status: "approved", approvedAt: new Date("2024-01-11T14:30:00Z") },
            "override-denied-1": { ...test_utils_1.mockData.ageOverride, status: "denied", deniedAt: new Date("2024-01-12T09:15:00Z") },
            "override-pending-1": { ...test_utils_1.mockData.ageOverride, status: "pending" },
        });
        await (0, test_utils_1.seedTestData)("registrations", {
            "registration-1": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-10T10:00:00Z") },
            "registration-2": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-11T14:30:00Z") },
            "registration-3": { ...test_utils_1.mockData.registration, status: "cancelled", registrationDate: new Date("2024-01-12T09:15:00Z") },
        });
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        expect(overrideCount).toBe(4);
        expect(registrationCount).toBe(3);
    });
    it("should handle empty dataset gracefully", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        expect(overrideCount).toBe(0);
        expect(registrationCount).toBe(0);
    });
    it("should process digest with only approvals", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with only approvals
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-approved-1": { ...test_utils_1.mockData.ageOverride, status: "approved", approvedAt: new Date("2024-01-10T10:00:00Z") },
            "override-approved-2": { ...test_utils_1.mockData.ageOverride, status: "approved", approvedAt: new Date("2024-01-11T14:30:00Z") },
            "override-approved-3": { ...test_utils_1.mockData.ageOverride, status: "approved", approvedAt: new Date("2024-01-12T09:15:00Z") },
        });
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(3);
    });
    it("should process digest with only denials", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with only denials
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-denied-1": { ...test_utils_1.mockData.ageOverride, status: "denied", deniedAt: new Date("2024-01-10T10:00:00Z") },
            "override-denied-2": { ...test_utils_1.mockData.ageOverride, status: "denied", deniedAt: new Date("2024-01-11T14:30:00Z") },
        });
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(2);
    });
    it("should process digest with pending requests", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with pending requests
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-pending-1": { ...test_utils_1.mockData.ageOverride, status: "pending", createdAt: new Date("2024-01-10T10:00:00Z") },
            "override-pending-2": { ...test_utils_1.mockData.ageOverride, status: "pending", createdAt: new Date("2024-01-11T14:30:00Z") },
            "override-pending-3": { ...test_utils_1.mockData.ageOverride, status: "pending", createdAt: new Date("2024-01-12T09:15:00Z") },
        });
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(3);
    });
    it("should process digest with mixed registration statuses", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with mixed registration statuses
        await (0, test_utils_1.seedTestData)("registrations", {
            "registration-active-1": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-10T10:00:00Z") },
            "registration-active-2": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-11T14:30:00Z") },
            "registration-cancelled-1": { ...test_utils_1.mockData.registration, status: "cancelled", registrationDate: new Date("2024-01-12T09:15:00Z") },
            "registration-pending-1": { ...test_utils_1.mockData.registration, status: "pending", registrationDate: new Date("2024-01-13T16:45:00Z") },
        });
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        expect(registrationCount).toBe(4);
    });
    it("should process digest with sibling pairing data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with sibling pairing requests
        await (0, test_utils_1.seedTestData)("siblingPairings", {
            "pairing-approved-1": { ...test_utils_1.mockData.siblingPairing, status: "approved", approvedAt: new Date("2024-01-10T10:00:00Z") },
            "pairing-denied-1": { ...test_utils_1.mockData.siblingPairing, status: "denied", deniedAt: new Date("2024-01-11T14:30:00Z") },
            "pairing-pending-1": { ...test_utils_1.mockData.siblingPairing, status: "pending", createdAt: new Date("2024-01-12T09:15:00Z") },
        });
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const pairingCount = await (0, test_utils_1.countDocuments)("siblingPairings");
        expect(pairingCount).toBe(3);
    });
    it("should process digest with waitlist data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with waitlist entries
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-1": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", createdAt: new Date("2024-01-10T10:00:00Z") },
            "waitlist-2": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", createdAt: new Date("2024-01-11T14:30:00Z") },
            "waitlist-3": { ...test_utils_1.mockData.waitlistEntry, status: "active", createdAt: new Date("2024-01-12T09:15:00Z") },
        });
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(waitlistCount).toBe(3);
    });
    it("should handle digest with special characters and complex data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with special characters
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-special": {
                ...test_utils_1.mockData.ageOverride,
                childName: "José María O'Connor-Smith",
                parentEmail: "jose.maria+digest@example-domain.com",
                reason: "This is a very detailed reason with multiple sentences. The child has demonstrated exceptional skills in multiple sports and has received professional training.",
                status: "approved",
                approvedAt: new Date("2024-01-10T10:00:00Z"),
                approvedBy: "staff-special-123",
                notes: "Special accommodation request approved after consultation with accessibility coordinator",
            },
        });
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(1);
    });
    it("should handle large dataset for weekly digest", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Create large dataset
        const largeOverrideData = {};
        const largeRegistrationData = {};
        for (let i = 1; i <= 50; i++) {
            largeOverrideData[`override-large-${i}`] = {
                ...test_utils_1.mockData.ageOverride,
                childName: `Child ${i}`,
                parentEmail: `parent${i}@example.com`,
                status: i % 3 === 0 ? "approved" : i % 3 === 1 ? "denied" : "pending",
                createdAt: new Date(`2024-01-${10 + (i % 5)}T${10 + (i % 10)}:00:00Z`),
            };
            largeRegistrationData[`registration-large-${i}`] = {
                ...test_utils_1.mockData.registration,
                playerId: `player${i}`,
                status: i % 2 === 0 ? "active" : "cancelled",
                registrationDate: new Date(`2024-01-${10 + (i % 5)}T${10 + (i % 10)}:00:00Z`),
            };
        }
        await (0, test_utils_1.seedTestData)("ageOverrides", largeOverrideData);
        await (0, test_utils_1.seedTestData)("registrations", largeRegistrationData);
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(500);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        expect(overrideCount).toBe(50);
        expect(registrationCount).toBe(50);
    });
    it("should handle scheduled event with specific timezone", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)("2024-01-15T09:00:00Z", "America/New_York");
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-timezone": { ...test_utils_1.mockData.ageOverride, status: "approved", approvedAt: new Date("2024-01-10T10:00:00Z") },
        });
        // Act
        await index_1.weeklyDirectorDigest.test();
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(1);
    });
    // TODO: Add edge case tests
    // - Test with malformed data structures
    // - Test with missing required fields
    // - Test with invalid date ranges
    // - Test with processing timeouts
    // - Test with database connection failures
    // - Test with email sending failures
    // - Test with report generation failures
    // - Test with data aggregation failures
    // - Test with concurrent processing conflicts
    // - Test with data validation failures
    // TODO: Add integration tests
    // - Test with real Firestore emulator
    // - Test with email service integration
    // - Test with report generation service
    // - Test with data aggregation service
    // - Test with director notification workflows
    // - Test with audit trail completeness
    // - Test with data consistency checks
    // - Test with performance benchmarks
    // - Test with error recovery scenarios
    // - Test with concurrent processing limits
    // - Test with rate limiting scenarios
    // - Test with report archiving workflows
    // - Test with historical data tracking
    // - Test with monitoring and alerting
    // - Test with report customization
    // - Test with multi-director support
});
//# sourceMappingURL=weeklyDirectorDigest.test.js.map