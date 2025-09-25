"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const test_utils_1 = require("../../__tests__/test-utils");
describe("onWaitlistEntryCreated", () => {
    beforeEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    afterEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    it("should process a new waitlist entry and create audit log", async () => {
        // Arrange
        const entryId = "waitlist-entry-123";
        const waitlistData = test_utils_1.mockData.waitlistEntry;
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("waitlists/{entryId}", entryId, waitlistData);
        // Act
        await (0, index_1.onWaitlistEntryCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("waitlist_entry_created", entryId, {
            processed: false,
            status: undefined,
        });
        expect(auditLogExists).toBe(true);
    });
    it("should handle waitlist entry with missing data gracefully", async () => {
        // Arrange
        const entryId = "waitlist-entry-456";
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("waitlists/{entryId}", entryId, {});
        // Act & Assert
        await expect((0, index_1.onWaitlistEntryCreated)(event)).resolves.not.toThrow();
    });
    it("should process waitlist entry with complete data", async () => {
        // Arrange
        const entryId = "waitlist-entry-789";
        const completeWaitlistData = {
            ...test_utils_1.mockData.waitlistEntry,
            childName: "John Doe",
            parentEmail: "john.doe@example.com",
            league: "Youth Soccer",
            waitlistPosition: 5,
            priority: "medium",
            status: "waiting",
            createdAt: new Date("2024-01-15T10:00:00Z"),
            additionalNotes: "Player has previous experience",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("waitlists/{entryId}", entryId, completeWaitlistData);
        // Act
        await (0, index_1.onWaitlistEntryCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("waitlist_entry_created", entryId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle multiple waitlist entries concurrently", async () => {
        // Arrange
        const entries = [
            { id: "entry-1", data: { ...test_utils_1.mockData.waitlistEntry, childName: "Child 1" } },
            { id: "entry-2", data: { ...test_utils_1.mockData.waitlistEntry, childName: "Child 2" } },
            { id: "entry-3", data: { ...test_utils_1.mockData.waitlistEntry, childName: "Child 3" } }
        ];
        // Act
        const promises = entries.map((entry) => {
            const event = (0, test_utils_1.createMockDocumentCreatedEvent)("waitlists/{entryId}", entry.id, entry.data);
            return (0, index_1.onWaitlistEntryCreated)(event);
        });
        await Promise.all(promises);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        for (const entry of entries) {
            const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("waitlist_entry_created", entry.id);
            expect(auditLogExists).toBe(true);
        }
    });
    it("should handle waitlist entry with special characters in data", async () => {
        // Arrange
        const entryId = "waitlist-entry-special";
        const specialData = {
            ...test_utils_1.mockData.waitlistEntry,
            childName: "José María O'Connor-Smith",
            parentEmail: "jose.maria+test@example-domain.com",
            league: "Youth Basketball (Ages 8-10)",
            additionalNotes: "Special requirements: Left-handed player, needs accommodation",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("waitlists/{entryId}", entryId, specialData);
        // Act
        await (0, index_1.onWaitlistEntryCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("waitlist_entry_created", entryId);
        expect(auditLogExists).toBe(true);
    });
    // TODO: Add edge case tests
    // - Test with very large data payloads
    // - Test with malformed data structures
    // - Test with missing required fields
    // - Test with duplicate entry handling
    // - Test with league capacity validation
    // - Test with email notification sending
    // - Test with error handling scenarios
    // - Test with rate limiting scenarios
    // - Test with concurrent processing limits
    // - Test with data validation failures
    // TODO: Add integration tests
    // - Test with real Firestore emulator
    // - Test with email service integration
    // - Test with notification service integration
    // - Test with league capacity updates
    // - Test with parent notification workflows
    // - Test with staff notification workflows
    // - Test with audit trail completeness
    // - Test with data consistency checks
    // - Test with performance benchmarks
    // - Test with error recovery scenarios
});
//# sourceMappingURL=onWaitlistEntryCreated.test.js.map