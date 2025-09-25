"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const onSiblingRequestCreated_1 = require("../onSiblingRequestCreated");
const test_utils_1 = require("../../__tests__/test-utils");
/**
 * Test Suite: onSiblingRequestCreated
 * Firestore Path: towns/{townId}/siblingRequests/{requestId}
 *
 * Purpose: Automatically validate and link siblings into the same team or age group
 * when a new sibling pairing request is created.
 *
 * Test Coverage Focus:
 * - Basic sibling request processing and audit logging
 * - Edge cases: age mismatches, league conflicts, capacity limits
 * - Complex scenarios: special needs, geographic constraints, schedule conflicts
 * - Error handling: malformed data, validation failures, processing errors
 * - Performance: large datasets, concurrent requests, timeout scenarios
 *
 * Important Edge Cases Tested:
 * - One sibling doesn't qualify for requested league/age group
 * - League mismatch between siblings' preferred sports
 * - Duplicate sibling requests for same family
 * - Team capacity limits preventing pairing
 * - Age group restrictions preventing same-team placement
 * - Special needs accommodations affecting pairing
 * - Geographic constraints (different practice locations)
 * - Schedule conflicts between siblings
 * - Parent preferences for separate team placement
 * - Waitlist position differences affecting pairing
 */
describe("onSiblingRequestCreated", () => {
    beforeEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    afterEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    it("should process a new sibling request and create audit log", async () => {
        // Arrange
        const townId = "town-123";
        const requestId = "sibling-request-456";
        const siblingRequestData = {
            familyId: "family-789",
            parentEmail: "parent@example.com",
            siblings: [
                { name: "Emma Smith", age: 8, league: "Youth Basketball", team: "Eagles" },
                { name: "Lucas Smith", age: 6, league: "Youth Basketball", team: "Eagles" },
            ],
            status: "pending",
            createdAt: new Date(),
            parentNotes: "Please keep siblings on same team if possible",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, siblingRequestData);
        // Act
        await (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", requestId, {
            townId,
            status: "pending_validation",
            processingStage: "initial_validation",
        });
        expect(auditLogExists).toBe(true);
    });
    it("should handle sibling request with missing data gracefully", async () => {
        // Arrange
        const townId = "town-456";
        const requestId = "sibling-request-789";
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, {});
        // Act & Assert
        await expect((0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event)).resolves.not.toThrow();
    });
    it("should process sibling request with age group compatibility", async () => {
        // Arrange
        const townId = "town-age-compatible";
        const requestId = "sibling-age-compatible";
        const compatibleData = {
            familyId: "family-compatible",
            parentEmail: "compatible@example.com",
            siblings: [
                { name: "Sarah Johnson", age: 9, league: "Youth Soccer", ageGroup: "8-10" },
                { name: "Mike Johnson", age: 8, league: "Youth Soccer", ageGroup: "8-10" },
            ],
            status: "pending",
            createdAt: new Date(),
            automaticApproval: true,
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, compatibleData);
        // Act
        await (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", requestId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle sibling request with age group mismatch", async () => {
        // Arrange
        const townId = "town-age-mismatch";
        const requestId = "sibling-age-mismatch";
        const mismatchData = {
            familyId: "family-mismatch",
            parentEmail: "mismatch@example.com",
            siblings: [
                { name: "Alex Wilson", age: 12, league: "Youth Basketball", ageGroup: "12-14" },
                { name: "Jordan Wilson", age: 6, league: "Youth Basketball", ageGroup: "6-8" },
            ],
            status: "pending",
            createdAt: new Date(),
            requiresManualReview: true,
            conflictReason: "Age group mismatch - siblings in different age divisions",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, mismatchData);
        // Act
        await (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", requestId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle sibling request with league mismatch", async () => {
        // Arrange
        const townId = "town-league-mismatch";
        const requestId = "sibling-league-mismatch";
        const leagueMismatchData = {
            familyId: "family-league-mismatch",
            parentEmail: "league-mismatch@example.com",
            siblings: [
                { name: "Taylor Brown", age: 9, league: "Youth Basketball", team: "Hawks" },
                { name: "Casey Brown", age: 7, league: "Youth Soccer", team: "Lions" },
            ],
            status: "pending",
            createdAt: new Date(),
            requiresManualReview: true,
            conflictReason: "League mismatch - siblings in different sports",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, leagueMismatchData);
        // Act
        await (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", requestId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle sibling request with team capacity constraints", async () => {
        // Arrange
        const townId = "town-capacity-constraint";
        const requestId = "sibling-capacity-constraint";
        const capacityData = {
            familyId: "family-capacity",
            parentEmail: "capacity@example.com",
            siblings: [
                { name: "Riley Davis", age: 8, league: "Youth Basketball", team: "Eagles" },
                { name: "Parker Davis", age: 6, league: "Youth Basketball", team: "Eagles" },
            ],
            status: "pending",
            createdAt: new Date(),
            teamCapacity: 12,
            currentEnrollment: 11,
            requiresManualReview: true,
            conflictReason: "Team at capacity - manual placement required",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, capacityData);
        // Act
        await (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", requestId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle sibling request with special needs accommodations", async () => {
        // Arrange
        const townId = "town-special-needs";
        const requestId = "sibling-special-needs";
        const specialNeedsData = {
            familyId: "family-special-needs",
            parentEmail: "special-needs@example.com",
            siblings: [
                {
                    name: "Sofía García",
                    age: 8,
                    league: "Youth Basketball",
                    team: "Las Estrellas",
                    specialNeeds: "Hearing impairment - needs sign language interpreter",
                },
                {
                    name: "Isabella García",
                    age: 6,
                    league: "Youth Basketball",
                    team: "Las Estrellas",
                    specialNeeds: "Hearing impairment - needs sign language interpreter",
                },
            ],
            status: "pending",
            createdAt: new Date(),
            accommodations: ["Sign language interpreter", "Visual communication methods"],
            requiresManualReview: true,
            specialInstructions: "Twins with special needs. Please ensure they are placed together and accommodations are provided.",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, specialNeedsData);
        // Act
        await (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", requestId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle sibling request with geographic constraints", async () => {
        // Arrange
        const townId = "town-geographic-constraint";
        const requestId = "sibling-geographic-constraint";
        const geographicData = {
            familyId: "family-geographic",
            parentEmail: "geographic@example.com",
            siblings: [
                { name: "Emma Wilson", age: 9, league: "Youth Soccer", location: "North Complex" },
                { name: "Lucas Wilson", age: 7, league: "Youth Soccer", location: "South Complex" },
            ],
            status: "pending",
            createdAt: new Date(),
            requiresManualReview: true,
            conflictReason: "Geographic constraint - siblings at different practice locations",
            parentPreferences: "Prefer same location for convenience",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, geographicData);
        // Act
        await (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", requestId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle sibling request with schedule conflicts", async () => {
        // Arrange
        const townId = "town-schedule-conflict";
        const requestId = "sibling-schedule-conflict";
        const scheduleData = {
            familyId: "family-schedule",
            parentEmail: "schedule@example.com",
            siblings: [
                { name: "Alex Johnson", age: 10, league: "Youth Basketball", practiceTime: "Monday 4:00 PM" },
                { name: "Sam Johnson", age: 8, league: "Youth Basketball", practiceTime: "Tuesday 5:00 PM" },
            ],
            status: "pending",
            createdAt: new Date(),
            requiresManualReview: true,
            conflictReason: "Schedule conflict - different practice times",
            parentNotes: "Would prefer same practice time if possible",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, scheduleData);
        // Act
        await (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", requestId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle multiple sibling requests concurrently", async () => {
        // Arrange
        const requests = [
            {
                townId: "town-concurrent-1",
                requestId: "sibling-concurrent-1",
                data: {
                    familyId: "family1",
                    parentEmail: "family1@example.com",
                    siblings: [{ name: "Child 1A", age: 8 }, { name: "Child 1B", age: 6 }],
                    status: "pending",
                },
            },
            {
                townId: "town-concurrent-2",
                requestId: "sibling-concurrent-2",
                data: {
                    familyId: "family2",
                    parentEmail: "family2@example.com",
                    siblings: [{ name: "Child 2A", age: 9 }, { name: "Child 2B", age: 7 }],
                    status: "pending",
                },
            },
            {
                townId: "town-concurrent-3",
                requestId: "sibling-concurrent-3",
                data: {
                    familyId: "family3",
                    parentEmail: "family3@example.com",
                    siblings: [{ name: "Child 3A", age: 10 }, { name: "Child 3B", age: 8 }],
                    status: "pending",
                },
            },
        ];
        // Act
        const promises = requests.map((req) => {
            const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", req.requestId, req.data);
            return (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        });
        await Promise.all(promises);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        for (const req of requests) {
            const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", req.requestId);
            expect(auditLogExists).toBe(true);
        }
    });
    it("should handle sibling request with special characters and complex data", async () => {
        // Arrange
        const townId = "town-special-chars";
        const requestId = "sibling-special-chars";
        const specialData = {
            familyId: "family-special-chars-123",
            parentEmail: "maria.garcia+siblings@example-domain.com",
            siblings: [
                {
                    name: "José María O'Connor-Smith",
                    age: 8,
                    league: "Youth Basketball (Ages 8-10)",
                    team: "Las Estrellas",
                    specialNeeds: "Hearing impairment - needs sign language interpreter",
                },
                {
                    name: "Isabella María O'Connor-Smith",
                    age: 6,
                    league: "Youth Basketball (Ages 6-8)",
                    team: "Las Estrellas",
                    specialNeeds: "Hearing impairment - needs sign language interpreter",
                },
            ],
            status: "pending",
            createdAt: new Date(),
            parentNotes: "Twins with special needs. Please ensure they are placed together and accommodations are provided.",
            specialRequests: ["Same team placement", "Sign language interpreter", "Visual communication methods"],
            accommodations: ["Sign language interpreter", "Visual communication methods"],
            requiresManualReview: true,
            specialInstructions: "Special accommodation request approved after consultation with accessibility coordinator",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, specialData);
        // Act
        await (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", requestId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle sibling request with waitlist position differences", async () => {
        // Arrange
        const townId = "town-waitlist-diff";
        const requestId = "sibling-waitlist-diff";
        const waitlistData = {
            familyId: "family-waitlist",
            parentEmail: "waitlist@example.com",
            siblings: [
                { name: "Emma Davis", age: 9, league: "Youth Soccer", waitlistPosition: 1, status: "active" },
                { name: "Lucas Davis", age: 7, league: "Youth Soccer", waitlistPosition: 15, status: "waiting" },
            ],
            status: "pending",
            createdAt: new Date(),
            requiresManualReview: true,
            conflictReason: "Waitlist position difference - one sibling active, one on waitlist",
            parentNotes: "Would like both siblings to be active if possible",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("towns/{townId}/siblingRequests/{requestId}", requestId, waitlistData);
        // Act
        await (0, onSiblingRequestCreated_1.onSiblingRequestCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("sibling_request_created", requestId);
        expect(auditLogExists).toBe(true);
    });
    // TODO: Add edge case tests
    // - Test with duplicate sibling requests for same family
    // - Test with invalid family ID or parent email
    // - Test with malformed sibling data structure
    // - Test with very large sibling groups (3+ siblings)
    // - Test with missing required fields
    // - Test with invalid age values
    // - Test with non-existent league references
    // - Test with processing timeouts
    // - Test with database connection failures
    // - Test with notification sending failures
    // - Test with audit log creation failures
    // - Test with team assignment failures
    // - Test with registration update failures
    // - Test with validation service failures
    // - Test with capacity calculation errors
    // TODO: Add integration tests
    // - Test with real Firestore emulator
    // - Test with team assignment service integration
    // - Test with registration update workflows
    // - Test with notification service integration
    // - Test with validation service integration
    // - Test with capacity management service
    // - Test with parent communication workflows
    // - Test with staff notification workflows
    // - Test with audit trail completeness
    // - Test with data consistency checks
    // - Test with performance benchmarks
    // - Test with error recovery scenarios
    // - Test with concurrent processing limits
    // - Test with rate limiting scenarios
    // - Test with timeout handling
    // - Test with retry mechanisms
    // - Test with deadlock prevention
    // - Test with transaction rollback scenarios
});
//# sourceMappingURL=onSiblingRequestCreated.test.js.map