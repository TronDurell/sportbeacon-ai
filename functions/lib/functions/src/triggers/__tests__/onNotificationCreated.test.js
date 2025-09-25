"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const test_utils_1 = require("../../__tests__/test-utils");
describe("onNotificationCreated", () => {
    beforeEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    afterEach(async () => {
        await (0, test_utils_1.clearFirestoreData)();
    });
    it("should process a new notification and update status to sent", async () => {
        // Arrange
        const notificationId = "notification-123";
        const notificationData = test_utils_1.mockData.notification;
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("notifications/{notificationId}", notificationId, notificationData);
        // Act
        await (0, index_1.onNotificationCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const updatedNotification = await (0, test_utils_1.getDocumentData)("notifications", notificationId);
        expect(updatedNotification).toBeTruthy();
        expect(updatedNotification?.status).toBe("sent");
        expect(updatedNotification?.sentAt).toBeTruthy();
    });
    it("should handle notification with missing data gracefully", async () => {
        // Arrange
        const notificationId = "notification-456";
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("notifications/{notificationId}", notificationId, {});
        // Act & Assert
        await expect((0, index_1.onNotificationCreated)(event)).resolves.not.toThrow();
    });
    it("should process email notification with complete data", async () => {
        // Arrange
        const notificationId = "notification-email-789";
        const completeEmailData = {
            ...test_utils_1.mockData.notification,
            recipient: "user789",
            type: "email",
            title: "Registration Approved",
            message: "Your registration for Youth Basketball has been approved. Welcome to the team!",
            status: "pending",
            createdAt: new Date("2024-01-15T10:00:00Z"),
            priority: "high",
            template: "registration_approved",
            variables: {
                playerName: "John Doe",
                leagueName: "Youth Basketball",
                teamName: "Eagles",
                startDate: "2024-02-01",
            },
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("notifications/{notificationId}", notificationId, completeEmailData);
        // Act
        await (0, index_1.onNotificationCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const updatedNotification = await (0, test_utils_1.getDocumentData)("notifications", notificationId);
        expect(updatedNotification?.status).toBe("sent");
        expect(updatedNotification?.sentAt).toBeTruthy();
    });
    it("should process SMS notification", async () => {
        // Arrange
        const notificationId = "notification-sms";
        const smsData = {
            ...test_utils_1.mockData.notification,
            recipient: "+1234567890",
            type: "sms",
            title: "Game Reminder",
            message: "Reminder: Your game is tomorrow at 2 PM. Don't forget your equipment!",
            status: "pending",
            priority: "medium",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("notifications/{notificationId}", notificationId, smsData);
        // Act
        await (0, index_1.onNotificationCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const updatedNotification = await (0, test_utils_1.getDocumentData)("notifications", notificationId);
        expect(updatedNotification?.status).toBe("sent");
        expect(updatedNotification?.sentAt).toBeTruthy();
    });
    it("should process push notification", async () => {
        // Arrange
        const notificationId = "notification-push";
        const pushData = {
            ...test_utils_1.mockData.notification,
            recipient: "device-token-123",
            type: "push",
            title: "New Message",
            message: "You have a new message from your coach.",
            status: "pending",
            priority: "normal",
            badge: 1,
            sound: "default",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("notifications/{notificationId}", notificationId, pushData);
        // Act
        await (0, index_1.onNotificationCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const updatedNotification = await (0, test_utils_1.getDocumentData)("notifications", notificationId);
        expect(updatedNotification?.status).toBe("sent");
        expect(updatedNotification?.sentAt).toBeTruthy();
    });
    it("should handle notification with high priority", async () => {
        // Arrange
        const notificationId = "notification-high-priority";
        const highPriorityData = {
            ...test_utils_1.mockData.notification,
            recipient: "user-high-priority",
            type: "email",
            title: "URGENT: Game Cancelled",
            message: "Due to weather conditions, today's game has been cancelled. We will reschedule soon.",
            status: "pending",
            priority: "urgent",
            requiresConfirmation: true,
            expiresAt: new Date("2024-01-15T23:59:59Z"),
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("notifications/{notificationId}", notificationId, highPriorityData);
        // Act
        await (0, index_1.onNotificationCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const updatedNotification = await (0, test_utils_1.getDocumentData)("notifications", notificationId);
        expect(updatedNotification?.status).toBe("sent");
        expect(updatedNotification?.sentAt).toBeTruthy();
    });
    it("should handle notification with attachments", async () => {
        // Arrange
        const notificationId = "notification-with-attachments";
        const attachmentData = {
            ...test_utils_1.mockData.notification,
            recipient: "user-attachments",
            type: "email",
            title: "Season Schedule",
            message: "Please find attached the complete season schedule for your team.",
            status: "pending",
            priority: "normal",
            attachments: [
                { name: "schedule.pdf", url: "https://storage.example.com/schedule.pdf", size: 1024000 },
                { name: "team_roster.xlsx", url: "https://storage.example.com/roster.xlsx", size: 512000 },
            ],
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("notifications/{notificationId}", notificationId, attachmentData);
        // Act
        await (0, index_1.onNotificationCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const updatedNotification = await (0, test_utils_1.getDocumentData)("notifications", notificationId);
        expect(updatedNotification?.status).toBe("sent");
        expect(updatedNotification?.sentAt).toBeTruthy();
    });
    it("should handle multiple notifications concurrently", async () => {
        // Arrange
        const notifications = [
            { id: "notif-1", data: { ...test_utils_1.mockData.notification, recipient: "user1", type: "email" } },
            { id: "notif-2", data: { ...test_utils_1.mockData.notification, recipient: "user2", type: "sms" } },
            { id: "notif-3", data: { ...test_utils_1.mockData.notification, recipient: "user3", type: "push" } },
        ];
        // Act
        const promises = notifications.map((notification) => {
            const event = (0, test_utils_1.createMockDocumentCreatedEvent)("notifications/{notificationId}", notification.id, notification.data);
            return (0, index_1.onNotificationCreated)(event);
        });
        await Promise.all(promises);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(300);
        // Assert
        for (const notification of notifications) {
            const updatedNotification = await (0, test_utils_1.getDocumentData)("notifications", notification.id);
            expect(updatedNotification?.status).toBe("sent");
            expect(updatedNotification?.sentAt).toBeTruthy();
        }
    });
    it("should handle notification with special characters and complex data", async () => {
        // Arrange
        const notificationId = "notification-special";
        const specialData = {
            ...test_utils_1.mockData.notification,
            recipient: "maria.garcia+special@example-domain.com",
            type: "email",
            title: "¡Bienvenido al equipo! - Welcome to the Team!",
            message: "Estimada familia García-Rodríguez,\n\nNos complace informarle que su hijo/a José María ha sido aceptado/a en el equipo de baloncesto juvenil. El entrenamiento comenzará el próximo lunes a las 4:00 PM.\n\nDear García-Rodríguez family,\n\nWe are pleased to inform you that your child José María has been accepted to the youth basketball team. Training will begin next Monday at 4:00 PM.",
            status: "pending",
            priority: "high",
            language: "es-EN",
            template: "bilingual_welcome",
            variables: {
                playerName: "José María García-Rodríguez",
                teamName: "Las Estrellas",
                coachName: "Coach María González",
                startDate: "2024-02-05",
                startTime: "16:00",
                location: "Centro Deportivo Municipal",
            },
            specialInstructions: "Send in both Spanish and English",
        };
        const event = (0, test_utils_1.createMockDocumentCreatedEvent)("notifications/{notificationId}", notificationId, specialData);
        // Act
        await (0, index_1.onNotificationCreated)(event);
        // Wait for async operations to complete
        await (0, test_utils_1.waitForAsync)(200);
        // Assert
        const updatedNotification = await (0, test_utils_1.getDocumentData)("notifications", notificationId);
        expect(updatedNotification?.status).toBe("sent");
        expect(updatedNotification?.sentAt).toBeTruthy();
    });
    // TODO: Add edge case tests
    // - Test with invalid notification types
    // - Test with missing required fields (recipient, type, message)
    // - Test with malformed email addresses
    // - Test with invalid phone numbers
    // - Test with very long message content
    // - Test with duplicate notification IDs
    // - Test with notification sending failures
    // - Test with delivery confirmation failures
    // - Test with retry logic scenarios
    // - Test with rate limiting scenarios
    // TODO: Add integration tests
    // - Test with real Firestore emulator
    // - Test with email service integration
    // - Test with SMS service integration
    // - Test with push notification service
    // - Test with template rendering service
    // - Test with delivery tracking service
    // - Test with retry mechanism
    // - Test with notification queuing
    // - Test with delivery confirmation
    // - Test with audit trail completeness
    // - Test with data consistency checks
    // - Test with performance benchmarks
    // - Test with error recovery scenarios
    // - Test with concurrent processing limits
    // - Test with notification batching
    // - Test with priority queuing
    // - Test with delivery time optimization
});
//# sourceMappingURL=onNotificationCreated.test.js.map