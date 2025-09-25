"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const test_utils_1 = require("../../__tests__/test-utils");
describe("onAgeOverrideCreated", () => {
    beforeEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    afterEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    it("should process a new age override request and create audit log", async () => {
        // Arrange
        const overrideId = "age-override-123";
        const overrideData = test_utils_1.mockData.ageOverride;
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("ageOverrides/{overrideId}", overrideId, overrideData);
        // Act
        await (0, index_1.onAgeOverrideCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("age_override_created", overrideId, {
            status: "pending_review",
        });
        expect(auditLogExists).toBe(true);
    });
    it("should handle age override with missing data gracefully", async () => {
        // Arrange
        const overrideId = "age-override-456";
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("ageOverrides/{overrideId}", overrideId, {});
        // Act & Assert
        await expect((0, index_1.onAgeOverrideCreated)(event)).resolves.not.toThrow();
    });
    it("should process age override with complete data", async () => {
        // Arrange
        const overrideId = "age-override-789";
        const completeOverrideData = {
            ...test_utils_1.mockData.ageOverride,
            childName: "Sarah Johnson",
            parentEmail: "sarah.johnson@example.com",
            requestedLeague: "Youth Soccer",
            currentAge: 6,
            ageRequirement: 7,
            reason: "Advanced soccer skills and previous experience",
            status: "pending",
            requestedBy: "parent456",
            createdAt: new Date("2024-01-15T14:30:00Z"),
            supportingDocuments: ["soccer_certificate.pdf"],
            coachRecommendation: "Excellent player, ready for next level",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("ageOverrides/{overrideId}", overrideId, completeOverrideData);
        // Act
        await (0, index_1.onAgeOverrideCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("age_override_created", overrideId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle age override with minimal age difference", async () => {
        // Arrange
        const overrideId = "age-override-minimal";
        const minimalData = {
            ...test_utils_1.mockData.ageOverride,
            currentAge: 7,
            ageRequirement: 8,
            reason: "Birthday falls just after cutoff date",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("ageOverrides/{overrideId}", overrideId, minimalData);
        // Act
        await (0, index_1.onAgeOverrideCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("age_override_created", overrideId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle age override with significant age difference", async () => {
        // Arrange
        const overrideId = "age-override-significant";
        const significantData = {
            ...test_utils_1.mockData.ageOverride,
            currentAge: 5,
            ageRequirement: 8,
            reason: "Exceptionally talented player with professional coaching",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("ageOverrides/{overrideId}", overrideId, significantData);
        // Act
        await (0, index_1.onAgeOverrideCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("age_override_created", overrideId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle multiple age override requests concurrently", async () => {
        // Arrange
        const overrides = [
            { id: "override-1", data: { ...test_utils_1.mockData.ageOverride, childName: "Child 1", currentAge: 6, ageRequirement: 7 } },
            { id: "override-2", data: { ...test_utils_1.mockData.ageOverride, childName: "Child 2", currentAge: 7, ageRequirement: 8 } },
            { id: "override-3", data: { ...test_utils_1.mockData.ageOverride, childName: "Child 3", currentAge: 5, ageRequirement: 7 } },
        ];
        // Act
        const promises = overrides.map((override) => {
            const event = (0, test_utils_1.createMockDocumentCreatedEvent)("ageOverrides/{overrideId}", override.id, override.data);
            return (0, index_1.onAgeOverrideCreated)(event);
        });
        await Promise.all(promises);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        for (const override of overrides) {
            const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("age_override_created", override.id);
            expect(auditLogExists).toBe(true);
        }
    });
    it("should handle age override with special characters and long text", async () => {
        // Arrange
        const overrideId = "age-override-special";
        const specialData = {
            ...test_utils_1.mockData.ageOverride,
            childName: "María José González-López",
            parentEmail: "maria.jose+override@example-domain.com",
            reason: "This is a very detailed reason with multiple sentences. The child has demonstrated exceptional skills in multiple sports and has received professional training. The family has consulted with coaches and sports psychologists who all agree that the child is ready for the next level. This decision has been carefully considered and is supported by extensive documentation.",
            supportingDocuments: ["medical_clearance.pdf", "coach_recommendation.pdf", "performance_videos.zip"],
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("ageOverrides/{overrideId}", overrideId, specialData);
        // Act
        await (0, index_1.onAgeOverrideCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("age_override_created", overrideId);
        expect(auditLogExists).toBe(true);
    });
    // TODO: Add edge case tests
    // - Test with invalid age values (negative, zero, very large)
    // - Test with missing required fields (childName, parentEmail, etc.)
    // - Test with malformed email addresses
    // - Test with very long reason text (exceeding limits)
    // - Test with duplicate override requests
    // - Test with conflicting age override requests
    // - Test with policy compliance validation
    // - Test with staff assignment logic
    // - Test with notification sending failures
    // - Test with audit log creation failures
    // TODO: Add integration tests
    // - Test with real Firestore emulator
    // - Test with email notification service
    // - Test with staff assignment workflows
    // - Test with policy validation service
    // - Test with document storage service
    // - Test with approval workflow integration
    // - Test with parent communication workflows
    // - Test with staff notification workflows
    // - Test with audit trail completeness
    // - Test with data consistency checks
    // - Test with performance benchmarks
    // - Test with error recovery scenarios
    // - Test with concurrent processing limits
    // - Test with rate limiting scenarios
});
//# sourceMappingURL=onAgeOverrideCreated.test.js.map