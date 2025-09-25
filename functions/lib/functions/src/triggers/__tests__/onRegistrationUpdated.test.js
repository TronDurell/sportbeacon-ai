"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const test_utils_1 = require("../../__tests__/test-utils");
describe("onRegistrationUpdated", () => {
    beforeEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    afterEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    it("should process registration update and create audit log", async () => {
        // Arrange
        const registrationId = "registration-123";
        const beforeData = { ...test_utils_1.mockData.registration, status: "pending" };
        const afterData = { ...test_utils_1.mockData.registration, status: "active" };
        const event = (0, test_utils_1.createMockDocumentUpdatedEvent)("registrations/{registrationId}", registrationId, beforeData, afterData);
        // Act
        await (0, index_1.onRegistrationUpdated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("registration_updated", registrationId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle registration update with missing data gracefully", async () => {
        // Arrange
        const registrationId = "registration-456";
        const event = (0, test_utils_1.createMockDocumentUpdatedEvent)("registrations/{registrationId}", registrationId, {}, {});
        // Act & Assert
        await expect((0, index_1.onRegistrationUpdated)(event)).resolves.not.toThrow();
    });
    it("should process registration status change from pending to active", async () => {
        // Arrange
        const registrationId = "registration-status-change";
        const beforeData = {
            ...test_utils_1.mockData.registration,
            status: "pending",
            registrationDate: new Date("2024-01-10T10:00:00Z"),
            updatedAt: new Date("2024-01-10T10:00:00Z"),
        };
        const afterData = {
            ...test_utils_1.mockData.registration,
            status: "active",
            registrationDate: new Date("2024-01-10T10:00:00Z"),
            updatedAt: new Date("2024-01-15T14:30:00Z"),
            approvedBy: "staff123",
            approvedAt: new Date("2024-01-15T14:30:00Z"),
        };
        const event = (0, test_utils_1.createMockDocumentUpdatedEvent)("registrations/{registrationId}", registrationId, beforeData, afterData);
        // Act
        await (0, index_1.onRegistrationUpdated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("registration_updated", registrationId);
        expect(auditLogExists).toBe(true);
    });
    it("should process registration status change from active to cancelled", async () => {
        // Arrange
        const registrationId = "registration-cancelled";
        const beforeData = {
            ...test_utils_1.mockData.registration,
            status: "active",
            registrationDate: new Date("2024-01-10T10:00:00Z"),
            updatedAt: new Date("2024-01-10T10:00:00Z"),
        };
        const afterData = {
            ...test_utils_1.mockData.registration,
            status: "cancelled",
            registrationDate: new Date("2024-01-10T10:00:00Z"),
            updatedAt: new Date("2024-01-20T16:45:00Z"),
            cancelledBy: "parent456",
            cancelledAt: new Date("2024-01-20T16:45:00Z"),
            cancellationReason: "Schedule conflict",
        };
        const event = (0, test_utils_1.createMockDocumentUpdatedEvent)("registrations/{registrationId}", registrationId, beforeData, afterData);
        // Act
        await (0, index_1.onRegistrationUpdated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("registration_updated", registrationId);
        expect(auditLogExists).toBe(true);
    });
    it("should process registration with team change", async () => {
        // Arrange
        const registrationId = "registration-team-change";
        const beforeData = {
            ...test_utils_1.mockData.registration,
            teamId: "team123",
            status: "active",
            updatedAt: new Date("2024-01-10T10:00:00Z"),
        };
        const afterData = {
            ...test_utils_1.mockData.registration,
            teamId: "team456",
            status: "active",
            updatedAt: new Date("2024-01-15T14:30:00Z"),
            teamChangeReason: "Balancing team sizes",
        };
        const event = (0, test_utils_1.createMockDocumentUpdatedEvent)("registrations/{registrationId}", registrationId, beforeData, afterData);
        // Act
        await (0, index_1.onRegistrationUpdated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("registration_updated", registrationId);
        expect(auditLogExists).toBe(true);
    });
    it("should process registration with league change", async () => {
        // Arrange
        const registrationId = "registration-league-change";
        const beforeData = {
            ...test_utils_1.mockData.registration,
            leagueId: "league123",
            status: "active",
            updatedAt: new Date("2024-01-10T10:00:00Z"),
        };
        const afterData = {
            ...test_utils_1.mockData.registration,
            leagueId: "league456",
            status: "active",
            updatedAt: new Date("2024-01-15T14:30:00Z"),
            leagueChangeReason: "Age group adjustment",
        };
        const event = (0, test_utils_1.createMockDocumentUpdatedEvent)("registrations/{registrationId}", registrationId, beforeData, afterData);
        // Act
        await (0, index_1.onRegistrationUpdated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("registration_updated", registrationId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle registration update with no status change", async () => {
        // Arrange
        const registrationId = "registration-no-status-change";
        const beforeData = {
            ...test_utils_1.mockData.registration,
            status: "active",
            updatedAt: new Date("2024-01-10T10:00:00Z"),
        };
        const afterData = {
            ...test_utils_1.mockData.registration,
            status: "active",
            updatedAt: new Date("2024-01-15T14:30:00Z"),
            notes: "Updated contact information",
        };
        const event = (0, test_utils_1.createMockDocumentUpdatedEvent)("registrations/{registrationId}", registrationId, beforeData, afterData);
        // Act
        await (0, index_1.onRegistrationUpdated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("registration_updated", registrationId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle multiple registration updates concurrently", async () => {
        // Arrange
        const registrations = [
            {
                id: "reg-1",
                before: { ...test_utils_1.mockData.registration, status: "pending" },
                after: { ...test_utils_1.mockData.registration, status: "active" },
            },
            {
                id: "reg-2",
                before: { ...test_utils_1.mockData.registration, status: "active" },
                after: { ...test_utils_1.mockData.registration, status: "cancelled" },
            },
            {
                id: "reg-3",
                before: { ...test_utils_1.mockData.registration, teamId: "team1" },
                after: { ...test_utils_1.mockData.registration, teamId: "team2" },
            },
        ];
        // Act
        const promises = registrations.map((reg) => {
            const event = (0, test_utils_1.createMockDocumentUpdatedEvent)("registrations/{registrationId}", reg.id, reg.before, reg.after);
            return (0, index_1.onRegistrationUpdated)(event);
        });
        await Promise.all(promises);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        for (const reg of registrations) {
            const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("registration_updated", reg.id);
            expect(auditLogExists).toBe(true);
        }
    });
    it("should handle registration update with special characters and complex data", async () => {
        // Arrange
        const registrationId = "registration-special";
        const beforeData = {
            ...test_utils_1.mockData.registration,
            status: "pending",
            playerName: "José María O'Connor-Smith",
            parentEmail: "jose.maria+reg@example-domain.com",
            specialNeeds: "Hearing impairment - needs sign language interpreter",
            updatedAt: new Date("2024-01-10T10:00:00Z"),
        };
        const afterData = {
            ...test_utils_1.mockData.registration,
            status: "active",
            playerName: "José María O'Connor-Smith",
            parentEmail: "jose.maria+reg@example-domain.com",
            specialNeeds: "Hearing impairment - needs sign language interpreter",
            accommodations: ["Sign language interpreter", "Visual communication methods"],
            updatedAt: new Date("2024-01-15T14:30:00Z"),
            approvedBy: "staff-special-123",
            approvedAt: new Date("2024-01-15T14:30:00Z"),
            notes: "Special accommodations approved and arranged",
        };
        const event = (0, test_utils_1.createMockDocumentUpdatedEvent)("registrations/{registrationId}", registrationId, beforeData, afterData);
        // Act
        await (0, index_1.onRegistrationUpdated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("registration_updated", registrationId);
        expect(auditLogExists).toBe(true);
    });
    // TODO: Add edge case tests
    // - Test with invalid status transitions
    // - Test with missing required fields
    // - Test with malformed data structures
    // - Test with very large data payloads
    // - Test with duplicate registration updates
    // - Test with conflicting team/league assignments
    // - Test with notification sending failures
    // - Test with audit log creation failures
    // - Test with capacity validation failures
    // - Test with waitlist processing failures
    // TODO: Add integration tests
    // - Test with real Firestore emulator
    // - Test with email notification service
    // - Test with league capacity updates
    // - Test with waitlist processing workflows
    // - Test with team assignment service
    // - Test with parent communication workflows
    // - Test with staff notification workflows
    // - Test with audit trail completeness
    // - Test with data consistency checks
    // - Test with performance benchmarks
    // - Test with error recovery scenarios
    // - Test with concurrent processing limits
    // - Test with rate limiting scenarios
    // - Test with special needs accommodation workflows
});
//# sourceMappingURL=onRegistrationUpdated.test.js.map