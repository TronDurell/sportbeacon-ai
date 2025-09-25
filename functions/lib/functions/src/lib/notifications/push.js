"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupInvalidTokens = exports.getUserFCMTokens = exports.sendBatchedPushNotification = exports.sendPushNotification = void 0;
const firebase_functions_1 = require("firebase-functions");
async function sendPushNotification(userId, notification) {
    try {
        firebase_functions_1.logger.info("Sending push notification", {
            userId,
            title: notification.title,
            body: notification.body
        });
        // Mock implementation - in production this would:
        // 1. Get user's FCM tokens from Firestore
        // 2. Send notification via Firebase Admin SDK
        // 3. Handle token cleanup for invalid tokens
        // For testing, we'll just log and return success
        if (process.env.NODE_ENV === "test") {
            firebase_functions_1.logger.info("Mock push notification sent", { userId, notification });
            return true;
        }
        // Production implementation would go here
        // const messaging = getMessaging();
        // const tokens = await getUserFCMTokens(userId);
        // const result = await messaging.sendMulticast({
        //   tokens,
        //   notification: {
        //     title: notification.title,
        //     body: notification.body
        //   },
        //   data: notification.data
        // });
        return true;
    }
    catch (error) {
        firebase_functions_1.logger.error("Failed to send push notification", {
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}
exports.sendPushNotification = sendPushNotification;
async function sendBatchedPushNotification(notifications) {
    let success = 0;
    let failed = 0;
    for (const { userId, notification } of notifications) {
        const result = await sendPushNotification(userId, notification);
        if (result) {
            success++;
        }
        else {
            failed++;
        }
    }
    return { success, failed };
}
exports.sendBatchedPushNotification = sendBatchedPushNotification;
async function getUserFCMTokens(userId) {
    // Mock implementation - in production this would query Firestore
    // for the user's FCM tokens
    firebase_functions_1.logger.info("Getting FCM tokens for user", { userId });
    return [`mock-token-${userId}`];
}
exports.getUserFCMTokens = getUserFCMTokens;
async function cleanupInvalidTokens(userId, invalidTokens) {
    // Mock implementation - in production this would remove
    // invalid tokens from the user's document in Firestore
    firebase_functions_1.logger.info("Cleaning up invalid FCM tokens", { userId, invalidTokens });
}
exports.cleanupInvalidTokens = cleanupInvalidTokens;
//# sourceMappingURL=push.js.map