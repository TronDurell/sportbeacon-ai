import {onAgeOverrideCreated} from "../index";
import {
  createMockDocumentCreatedEvent,
  clearFirestoreData,
  verifyAuditLogEntry,
  mockData,
  waitForAsync,
  MockFirestoreEvent,
} from "../../__tests__/test-utils";

describe("onAgeOverrideCreated", () => {
  beforeEach(async () => {
    await clearFirestoreData();
  });

  afterEach(async () => {
    await clearFirestoreData();
  });

  it("should process a new age override request and create audit log", async () => {
    // Arrange
    const overrideId = "age-override-123";
    const overrideData = mockData.ageOverride;
    const event = createMockDocumentCreatedEvent("ageOverrides/{overrideId}", overrideId, overrideData);

    // Act
    await onAgeOverrideCreated(event as any);

    // Wait for async operations to complete
    await waitForAsync(200);

    // Assert
    const auditLogExists = await verifyAuditLogEntry("age_override_created", overrideId, {
      status: "pending_review",
    });

    expect(auditLogExists).toBe(true);
  });

  it("should handle age override with missing data gracefully", async () => {
    // Arrange
    const overrideId = "age-override-456";
    const event = createMockDocumentCreatedEvent("ageOverrides/{overrideId}", overrideId, {});

    // Act & Assert
    await expect(onAgeOverrideCreated(event as any)).resolves.not.toThrow();
  });

  it("should process age override with complete data", async () => {
    // Arrange
    const overrideId = "age-override-789";
    const completeOverrideData = {
      ...mockData.ageOverride,
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
    const event = createMockDocumentCreatedEvent("ageOverrides/{overrideId}", overrideId, completeOverrideData);

    // Act
    await onAgeOverrideCreated(event as any);

    // Wait for async operations to complete
    await waitForAsync(200);

    // Assert
    const auditLogExists = await verifyAuditLogEntry("age_override_created", overrideId);
    expect(auditLogExists).toBe(true);
  });

  it("should handle age override with minimal age difference", async () => {
    // Arrange
    const overrideId = "age-override-minimal";
    const minimalData = {
      ...mockData.ageOverride,
      currentAge: 7,
      ageRequirement: 8,
      reason: "Birthday falls just after cutoff date",
    };
    const event = createMockDocumentCreatedEvent("ageOverrides/{overrideId}", overrideId, minimalData);

    // Act
    await onAgeOverrideCreated(event as any);

    // Wait for async operations to complete
    await waitForAsync(200);

    // Assert
    const auditLogExists = await verifyAuditLogEntry("age_override_created", overrideId);
    expect(auditLogExists).toBe(true);
  });

  it("should handle age override with significant age difference", async () => {
    // Arrange
    const overrideId = "age-override-significant";
    const significantData = {
      ...mockData.ageOverride,
      currentAge: 5,
      ageRequirement: 8,
      reason: "Exceptionally talented player with professional coaching",
    };
    const event = createMockDocumentCreatedEvent("ageOverrides/{overrideId}", overrideId, significantData);

    // Act
    await onAgeOverrideCreated(event as any);

    // Wait for async operations to complete
    await waitForAsync(200);

    // Assert
    const auditLogExists = await verifyAuditLogEntry("age_override_created", overrideId);
    expect(auditLogExists).toBe(true);
  });

  it("should handle multiple age override requests concurrently", async () => {
    // Arrange
    const overrides = [
      {id: "override-1", data: {...mockData.ageOverride, childName: "Child 1", currentAge: 6, ageRequirement: 7}},
      {id: "override-2", data: {...mockData.ageOverride, childName: "Child 2", currentAge: 7, ageRequirement: 8}},
      {id: "override-3", data: {...mockData.ageOverride, childName: "Child 3", currentAge: 5, ageRequirement: 7}},
    ];

    // Act
    const promises = overrides.map((override) => {
      const event = createMockDocumentCreatedEvent("ageOverrides/{overrideId}", override.id, override.data);
      return onAgeOverrideCreated(event as any);
    });

    await Promise.all(promises);

    // Wait for async operations to complete
    await waitForAsync(300);

    // Assert
    for (const override of overrides) {
      const auditLogExists = await verifyAuditLogEntry("age_override_created", override.id);
      expect(auditLogExists).toBe(true);
    }
  });

  it("should handle age override with special characters and long text", async () => {
    // Arrange
    const overrideId = "age-override-special";
    const specialData = {
      ...mockData.ageOverride,
      childName: "María José González-López",
      parentEmail: "maria.jose+override@example-domain.com",
      reason: "This is a very detailed reason with multiple sentences. The child has demonstrated exceptional skills in multiple sports and has received professional training. The family has consulted with coaches and sports psychologists who all agree that the child is ready for the next level. This decision has been carefully considered and is supported by extensive documentation.",
      supportingDocuments: ["medical_clearance.pdf", "coach_recommendation.pdf", "performance_videos.zip"],
    };
    const event = createMockDocumentCreatedEvent("ageOverrides/{overrideId}", overrideId, specialData);

    // Act
    await onAgeOverrideCreated(event as any);

    // Wait for async operations to complete
    await waitForAsync(200);

    // Assert
    const auditLogExists = await verifyAuditLogEntry("age_override_created", overrideId);
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

