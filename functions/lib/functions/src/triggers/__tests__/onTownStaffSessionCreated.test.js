"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const test_utils_1 = require("../../__tests__/test-utils");
describe("onTownStaffSessionCreated", () => {
    beforeEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    afterEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    it("should process a new staff session and create audit log", async () => {
        // Arrange
        const sessionId = "staff-session-123";
        const sessionData = test_utils_1.mockData.staffSession;
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("townStaffSessions/{sessionId}", sessionId, sessionData);
        // Act
        await (0, index_1.onTownStaffSessionCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("staff_session_created", sessionId, {
            staffId: sessionData.staffId,
        });
        expect(auditLogExists).toBe(true);
    });
    it("should handle staff session with missing data gracefully", async () => {
        // Arrange
        const sessionId = "staff-session-456";
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("townStaffSessions/{sessionId}", sessionId, {});
        // Act & Assert
        await expect((0, index_1.onTownStaffSessionCreated)(event)).resolves.not.toThrow();
    });
    it("should process staff session with complete data", async () => {
        // Arrange
        const sessionId = "staff-session-789";
        const completeSessionData = {
            ...test_utils_1.mockData.staffSession,
            staffId: "staff789",
            sessionType: "admin",
            startTime: new Date("2024-01-15T09:00:00Z"),
            endTime: null,
            activities: [],
            location: "Main Office",
            deviceInfo: {
                browser: "Chrome",
                version: "120.0.0.0",
                os: "Windows 11",
                ipAddress: "192.168.1.100",
            },
            permissions: ["read", "write", "admin"],
            sessionDuration: 0,
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("townStaffSessions/{sessionId}", sessionId, completeSessionData);
        // Act
        await (0, index_1.onTownStaffSessionCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("staff_session_created", sessionId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle staff session with different session types", async () => {
        // Arrange
        const sessionId = "staff-session-viewer";
        const viewerSessionData = {
            ...test_utils_1.mockData.staffSession,
            staffId: "staff-viewer",
            sessionType: "viewer",
            permissions: ["read"],
            activities: ["view_registrations", "view_reports"],
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("townStaffSessions/{sessionId}", sessionId, viewerSessionData);
        // Act
        await (0, index_1.onTownStaffSessionCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("staff_session_created", sessionId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle staff session with activities", async () => {
        // Arrange
        const sessionId = "staff-session-with-activities";
        const activitiesSessionData = {
            ...test_utils_1.mockData.staffSession,
            staffId: "staff-active",
            sessionType: "admin",
            activities: [
                { action: "approve_registration", timestamp: new Date("2024-01-15T10:30:00Z"), targetId: "reg123" },
                { action: "deny_age_override", timestamp: new Date("2024-01-15T11:15:00Z"), targetId: "override456" },
                { action: "update_league_settings", timestamp: new Date("2024-01-15T12:00:00Z"), targetId: "league789" },
            ],
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("townStaffSessions/{sessionId}", sessionId, activitiesSessionData);
        // Act
        await (0, index_1.onTownStaffSessionCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("staff_session_created", sessionId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle staff session with security information", async () => {
        // Arrange
        const sessionId = "staff-session-secure";
        const secureSessionData = {
            ...test_utils_1.mockData.staffSession,
            staffId: "staff-secure",
            sessionType: "admin",
            securityInfo: {
                twoFactorEnabled: true,
                lastPasswordChange: new Date("2024-01-01T00:00:00Z"),
                failedLoginAttempts: 0,
                ipWhitelist: ["192.168.1.0/24"],
                sessionTimeout: 3600,
            },
            deviceInfo: {
                browser: "Firefox",
                version: "121.0.0",
                os: "macOS",
                ipAddress: "192.168.1.50",
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
            },
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("townStaffSessions/{sessionId}", sessionId, secureSessionData);
        // Act
        await (0, index_1.onTownStaffSessionCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("staff_session_created", sessionId);
        expect(auditLogExists).toBe(true);
    });
    it("should handle multiple staff sessions concurrently", async () => {
        // Arrange
        const sessions = [
            { id: "session-1", data: { ...test_utils_1.mockData.staffSession, staffId: "staff1", sessionType: "admin" } },
            { id: "session-2", data: { ...test_utils_1.mockData.staffSession, staffId: "staff2", sessionType: "viewer" } },
            { id: "session-3", data: { ...test_utils_1.mockData.staffSession, staffId: "staff3", sessionType: "moderator" } },
        ];
        // Act
        const promises = sessions.map((session) => {
            const event = (0, test_utils_1.createMockDocumentCreatedEvent)("townStaffSessions/{sessionId}", session.id, session.data);
            return (0, index_1.onTownStaffSessionCreated)(event);
        });
        await Promise.all(promises);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        for (const session of sessions) {
            const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("staff_session_created", session.id);
            expect(auditLogExists).toBe(true);
        }
    });
    it("should handle staff session with special characters and complex data", async () => {
        // Arrange
        const sessionId = "staff-session-special";
        const specialSessionData = {
            ...test_utils_1.mockData.staffSession,
            staffId: "staff-special-123",
            staffName: "María José González-López",
            sessionType: "admin",
            location: "Main Office - Conference Room A",
            activities: [
                {
                    action: "approve_special_needs_request",
                    timestamp: new Date("2024-01-15T14:30:00Z"),
                    targetId: "request-special-456",
                    details: "Approved sign language interpreter for hearing impaired player",
                    notes: "Special accommodation request approved after consultation with accessibility coordinator",
                },
            ],
            deviceInfo: {
                browser: "Chrome",
                version: "120.0.6099.109",
                os: "Windows 11 Pro",
                ipAddress: "192.168.1.100",
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                screenResolution: "1920x1080",
                timezone: "America/New_York",
            },
            securityInfo: {
                twoFactorEnabled: true,
                lastPasswordChange: new Date("2024-01-01T00:00:00Z"),
                failedLoginAttempts: 0,
                ipWhitelist: ["192.168.1.0/24", "10.0.0.0/8"],
                sessionTimeout: 3600,
                mfaMethod: "authenticator_app",
            },
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("townStaffSessions/{sessionId}", sessionId, specialSessionData);
        // Act
        await (0, index_1.onTownStaffSessionCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const auditLogExists = await (0, test_utils_1.verifyAuditLogEntry)("staff_session_created", sessionId);
        expect(auditLogExists).toBe(true);
    });
    // TODO: Add edge case tests
    // - Test with invalid session types
    // - Test with missing required fields (staffId, sessionType)
    // - Test with malformed device information
    // - Test with very long activity lists
    // - Test with duplicate session IDs
    // - Test with invalid timestamp values
    // - Test with permission validation failures
    // - Test with security validation failures
    // - Test with audit log creation failures
    // - Test with session tracking failures
    // TODO: Add integration tests
    // - Test with real Firestore emulator
    // - Test with staff authentication service
    // - Test with permission validation service
    // - Test with security monitoring service
    // - Test with session tracking service
    // - Test with activity logging service
    // - Test with audit trail completeness
    // - Test with data consistency checks
    // - Test with performance benchmarks
    // - Test with error recovery scenarios
    // - Test with concurrent processing limits
    // - Test with rate limiting scenarios
    // - Test with session timeout handling
    // - Test with security alert workflows
});
//# sourceMappingURL=onTownStaffSessionCreated.test.js.map