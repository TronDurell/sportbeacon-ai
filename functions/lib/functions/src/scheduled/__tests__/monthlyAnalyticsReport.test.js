"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const test_utils_1 = require("../../__tests__/test-utils");
describe("monthlyAnalyticsReport", () => {
    beforeEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    afterEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    it("should process monthly analytics report successfully", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data for the month
        await (0, test_utils_1.seedTestData)("registrations", {
            "registration-1": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-05T10:00:00Z") },
            "registration-2": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-10T14:30:00Z") },
            "registration-3": { ...test_utils_1.mockData.registration, status: "cancelled", registrationDate: new Date("2024-01-15T09:15:00Z") },
        });
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-1": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", createdAt: new Date("2024-01-05T10:00:00Z") },
            "waitlist-2": { ...test_utils_1.mockData.waitlistEntry, status: "active", createdAt: new Date("2024-01-10T14:30:00Z") },
        });
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-1": { ...test_utils_1.mockData.ageOverride, status: "approved", createdAt: new Date("2024-01-05T10:00:00Z") },
            "override-2": { ...test_utils_1.mockData.ageOverride, status: "denied", createdAt: new Date("2024-01-10T14:30:00Z") },
            "override-3": { ...test_utils_1.mockData.ageOverride, status: "pending", createdAt: new Date("2024-01-15T09:15:00Z") },
        });
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(registrationCount).toBe(3);
        expect(waitlistCount).toBe(2);
        expect(overrideCount).toBe(3);
    });
    it("should handle empty dataset gracefully", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(registrationCount).toBe(0);
        expect(waitlistCount).toBe(0);
        expect(overrideCount).toBe(0);
    });
    it("should process analytics with only registrations", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with only registrations
        await (0, test_utils_1.seedTestData)("registrations", {
            "registration-active-1": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-05T10:00:00Z") },
            "registration-active-2": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-10T14:30:00Z") },
            "registration-cancelled-1": { ...test_utils_1.mockData.registration, status: "cancelled", registrationDate: new Date("2024-01-15T09:15:00Z") },
            "registration-pending-1": { ...test_utils_1.mockData.registration, status: "pending", registrationDate: new Date("2024-01-20T16:45:00Z") },
        });
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        expect(registrationCount).toBe(4);
    });
    it("should process analytics with only waitlist data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with only waitlist entries
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-waiting-1": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", createdAt: new Date("2024-01-05T10:00:00Z") },
            "waitlist-waiting-2": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", createdAt: new Date("2024-01-10T14:30:00Z") },
            "waitlist-active-1": { ...test_utils_1.mockData.waitlistEntry, status: "active", createdAt: new Date("2024-01-15T09:15:00Z") },
        });
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(waitlistCount).toBe(3);
    });
    it("should process analytics with only age override data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with only age overrides
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-approved-1": { ...test_utils_1.mockData.ageOverride, status: "approved", createdAt: new Date("2024-01-05T10:00:00Z") },
            "override-approved-2": { ...test_utils_1.mockData.ageOverride, status: "approved", createdAt: new Date("2024-01-10T14:30:00Z") },
            "override-denied-1": { ...test_utils_1.mockData.ageOverride, status: "denied", createdAt: new Date("2024-01-15T09:15:00Z") },
            "override-pending-1": { ...test_utils_1.mockData.ageOverride, status: "pending", createdAt: new Date("2024-01-20T16:45:00Z") },
        });
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(overrideCount).toBe(4);
    });
    it("should process analytics with sibling pairing data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with sibling pairing requests
        await (0, test_utils_1.seedTestData)("siblingPairings", {
            "pairing-approved-1": { ...test_utils_1.mockData.siblingPairing, status: "approved", createdAt: new Date("2024-01-05T10:00:00Z") },
            "pairing-denied-1": { ...test_utils_1.mockData.siblingPairing, status: "denied", createdAt: new Date("2024-01-10T14:30:00Z") },
            "pairing-pending-1": { ...test_utils_1.mockData.siblingPairing, status: "pending", createdAt: new Date("2024-01-15T09:15:00Z") },
        });
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const pairingCount = await (0, test_utils_1.countDocuments)("siblingPairings");
        expect(pairingCount).toBe(3);
    });
    it("should process analytics with league-specific data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with league-specific registrations
        await (0, test_utils_1.seedTestData)("registrations", {
            "registration-basketball-1": { ...test_utils_1.mockData.registration, status: "active", leagueId: "basketball",
                registrationDate: new Date("2024-01-05T10:00:00Z") },
            "registration-basketball-2": { ...test_utils_1.mockData.registration, status: "active", leagueId: "basketball",
                registrationDate: new Date("2024-01-10T14:30:00Z") },
            "registration-soccer-1": { ...test_utils_1.mockData.registration, status: "active", leagueId: "soccer", registrationDate: new Date("2024-01-15T09:15:00Z") },
            "registration-baseball-1": { ...test_utils_1.mockData.registration, status: "active", leagueId: "baseball", registrationDate: new Date("2024-01-20T16:45:00Z") },
        });
        await (0, test_utils_1.seedTestData)("leagues", {
            "basketball": { name: "Youth Basketball", capacity: 20, currentEnrollment: 18 },
            "soccer": { name: "Youth Soccer", capacity: 15, currentEnrollment: 12 },
            "baseball": { name: "Youth Baseball", capacity: 18, currentEnrollment: 15 },
        });
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        const leagueCount = await (0, test_utils_1.countDocuments)("leagues");
        expect(registrationCount).toBe(4);
        expect(leagueCount).toBe(3);
    });
    it("should handle analytics with special characters and complex data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with special characters
        await (0, test_utils_1.seedTestData)("registrations", {
            "registration-special": {
                ...test_utils_1.mockData.registration,
                playerName: "José María O'Connor-Smith",
                parentEmail: "jose.maria+analytics@example-domain.com",
                leagueId: "basketball-special",
                status: "active",
                registrationDate: new Date("2024-01-05T10:00:00Z"),
                specialNeeds: "Hearing impairment - needs sign language interpreter",
                accommodations: ["Sign language interpreter", "Visual communication methods"],
            },
        });
        await (0, test_utils_1.seedTestData)("ageOverrides", {
            "override-special": {
                ...test_utils_1.mockData.ageOverride,
                childName: "María José González-López",
                parentEmail: "maria.jose+analytics@example-domain.com",
                reason: "This is a very detailed reason with multiple sentences. The child has demonstrated exceptional skills in multiple sports and has received professional training.",
                status: "approved",
                createdAt: new Date("2024-01-10T14:30:00Z"),
                approvedBy: "staff-special-123",
                notes: "Special accommodation request approved after consultation with accessibility coordinator",
            },
        });
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(registrationCount).toBe(1);
        expect(overrideCount).toBe(1);
    });
    it("should handle large dataset for monthly analytics", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Create large dataset
        const largeRegistrationData = {};
        const largeWaitlistData = {};
        const largeOverrideData = {};
        for (let i = 1; i <= 100; i++) {
            largeRegistrationData[`registration-large-${i}`] = {
                ...test_utils_1.mockData.registration,
                playerId: `player${i}`,
                status: i % 3 === 0 ? "active" : i % 3 === 1 ? "cancelled" : "pending",
                registrationDate: new Date(`2024-01-${5 + (i % 25)}T${10 + (i % 10)}:00:00Z`),
            };
            largeWaitlistData[`waitlist-large-${i}`] = {
                ...test_utils_1.mockData.waitlistEntry,
                childName: `Child ${i}`,
                parentEmail: `parent${i}@example.com`,
                status: i % 2 === 0 ? "waiting" : "active",
                createdAt: new Date(`2024-01-${5 + (i % 25)}T${10 + (i % 10)}:00:00Z`),
            };
            largeOverrideData[`override-large-${i}`] = {
                ...test_utils_1.mockData.ageOverride,
                childName: `Child ${i}`,
                parentEmail: `parent${i}@example.com`,
                status: i % 3 === 0 ? "approved" : i % 3 === 1 ? "denied" : "pending",
                createdAt: new Date(`2024-01-${5 + (i % 25)}T${10 + (i % 10)}:00:00Z`),
            };
        }
        await (0, test_utils_1.seedTestData)("registrations", largeRegistrationData);
        await (0, test_utils_1.seedTestData)("waitlists", largeWaitlistData);
        await (0, test_utils_1.seedTestData)("ageOverrides", largeOverrideData);
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(500);
        // Assert
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        const overrideCount = await (0, test_utils_1.countDocuments)("ageOverrides");
        expect(registrationCount).toBe(100);
        expect(waitlistCount).toBe(100);
        expect(overrideCount).toBe(100);
    });
    it("should handle scheduled event with specific timezone", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)("2024-02-01T07:00:00Z", "America/New_York");
        await (0, test_utils_1.seedTestData)("registrations", {
            "registration-timezone": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-05T10:00:00Z") },
        });
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        expect(registrationCount).toBe(1);
    });
    it("should process analytics with historical trend data", async () => {
        // Arrange
        const event = (0, test_utils_1.createMockScheduledEvent)();
        // Seed test data with historical trends
        await (0, test_utils_1.seedTestData)("registrations", {
            "registration-trend-1": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-01T10:00:00Z") },
            "registration-trend-2": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-15T14:30:00Z") },
            "registration-trend-3": { ...test_utils_1.mockData.registration, status: "active", registrationDate: new Date("2024-01-31T09:15:00Z") },
        });
        await (0, test_utils_1.seedTestData)("waitlists", {
            "waitlist-trend-1": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", createdAt: new Date("2024-01-01T10:00:00Z") },
            "waitlist-trend-2": { ...test_utils_1.mockData.waitlistEntry, status: "waiting", createdAt: new Date("2024-01-15T14:30:00Z") },
            "waitlist-trend-3": { ...test_utils_1.mockData.waitlistEntry, status: "active", createdAt: new Date("2024-01-31T09:15:00Z") },
        });
        // Act
        await (0, index_1.monthlyAnalyticsReport)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        const registrationCount = await (0, test_utils_1.countDocuments)("registrations");
        const waitlistCount = await (0, test_utils_1.countDocuments)("waitlists");
        expect(registrationCount).toBe(3);
        expect(waitlistCount).toBe(3);
    });
    // TODO: Add edge case tests
    // - Test with malformed data structures
    // - Test with missing required fields
    // - Test with invalid date ranges
    // - Test with processing timeouts
    // - Test with database connection failures
    // - Test with report generation failures
    // - Test with data aggregation failures
    // - Test with concurrent processing conflicts
    // - Test with data validation failures
    // - Test with report archiving failures
    // TODO: Add integration tests
    // - Test with real Firestore emulator
    // - Test with report generation service
    // - Test with data aggregation service
    // - Test with stakeholder notification workflows
    // - Test with report archiving service
    // - Test with historical data tracking
    // - Test with audit trail completeness
    // - Test with data consistency checks
    // - Test with performance benchmarks
    // - Test with error recovery scenarios
    // - Test with concurrent processing limits
    // - Test with rate limiting scenarios
    // - Test with report customization
    // - Test with monitoring and alerting
    // - Test with trend analysis
    // - Test with predictive analytics
});
//# sourceMappingURL=monthlyAnalyticsReport.test.js.map