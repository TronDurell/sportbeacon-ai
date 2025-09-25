"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationHistory = exports.sendBulkNotifications = exports.updateNotificationPreferences = exports.getUserNotificationPreferences = exports.updateUserActivity = exports.triggerCoachNotifications = void 0;
const https_1 = require("firebase-functions/v2/https");
// Removed unused import
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const types_1 = require("../types");
const http_1 = require("../lib/http");
const validate_1 = require("../lib/validate");
const validate_2 = require("../lib/validate");
// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = (0, firestore_1.getFirestore)();
// Helper function to validate user authentication
const validateAuth = async (context) => {
    if (!context || !context.auth || !(0, types_1.isAuthContext)(context.auth)) {
        throw new Error("Unauthorized: User not authenticated");
    }
    return context.auth;
};
/**
 * Notification Function: Trigger Coach Notifications
 * Triggers notifications for coaches based on various events
 */
exports.triggerCoachNotifications = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        const { eventType, coachId, data } = req.body;
        logger.info("Coach notification trigger received", {
            eventType,
            coachId,
            requestId
        });
        // TODO: Implement coach notification triggering
        // - Validate event type and coach ID
        // - Check coach notification preferences
        // - Generate notification content
        // - Send notifications via preferred channels
        // - Log notification activity
        const notificationData = {
            notificationId: `notification_${Date.now()}`,
            type: "coach",
            coachId,
            eventType,
            data,
            status: "sent",
            createdAt: new Date(),
        };
        // Store notification
        await db.collection("notifications").add(notificationData);
        res.json({
            success: true,
            message: "Coach notification triggered",
            data: { notificationId: notificationData.notificationId },
            requestId
        });
    }
    catch (err) {
        logger.error("Coach notification trigger error", err, { requestId });
        res.status(500).json({
            success: false,
            message: "Coach notification trigger failed",
            error: err,
            requestId
        });
    }
}));
/**
 * Notification Function: Update User Activity
 * Updates user activity and triggers relevant notifications
 */
exports.updateUserActivity = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.updateUserActivitySchema, req.body);
        const { activityType, activityData } = validatedData;
        logger.info("User activity update requested", {
            activityType,
            requestId
        });
        // TODO: Implement user activity tracking
        // - Store activity in database
        // - Check for notification triggers
        // - Update user metrics
        // - Send relevant notifications
        // - Log activity for analytics
        const activityRecord = {
            activityType,
            activityData,
            timestamp: new Date(),
        };
        // Store activity
        await db.collection("userActivities").add(activityRecord);
        res.status(200).json({
            success: true,
            message: "User activity updated successfully",
            requestId
        });
    }
    catch (error) {
        if (error.name === 'BadRequest') {
            res.status(400).json({
                error: error.message,
                requestId
            });
            return;
        }
        logger.error('User activity update error:', error, { requestId });
        res.status(500).json({
            error: 'Failed to update user activity',
            requestId
        });
    }
}));
/**
 * Notification Function: Get User Notification Preferences
 * Retrieves notification preferences for authenticated users
 */
exports.getUserNotificationPreferences = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate query parameters
        const validatedData = (0, validate_2.validateBody)(validate_1.getUserNotificationPreferencesSchema, req.query);
        logger.info("Notification preferences requested", {
            requestId
        });
        // TODO: Implement preferences retrieval
        // - Query user preferences from database
        // - Return formatted preferences
        // - Include default preferences if none set
        const preferences = {
            email: true,
            push: true,
            sms: false,
            weeklyReports: true,
            coachUpdates: true,
        };
        res.status(200).json({
            success: true,
            message: "Notification preferences retrieved",
            data: { preferences },
            requestId
        });
    }
    catch (error) {
        if (error.name === 'BadRequest') {
            res.status(400).json({
                error: error.message,
                requestId
            });
            return;
        }
        logger.error('Get notification preferences error:', error, { requestId });
        res.status(500).json({
            error: 'Failed to get notification preferences',
            requestId
        });
    }
}));
/**
 * Notification Function: Update Notification Preferences
 * Updates notification preferences for authenticated users
 */
exports.updateNotificationPreferences = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.updateNotificationPreferencesSchema, req.body);
        const { preferences } = validatedData;
        logger.info("Notification preferences update requested", {
            preferences,
            requestId
        });
        // TODO: Implement preferences update
        // - Validate preference settings
        // - Update user preferences in database
        // - Apply changes immediately
        // - Log preference changes
        res.status(200).json({
            success: true,
            message: "Notification preferences updated successfully",
            requestId
        });
    }
    catch (error) {
        if (error.name === 'BadRequest') {
            res.status(400).json({
                error: error.message,
                requestId
            });
            return;
        }
        logger.error('Update notification preferences error:', error, { requestId });
        res.status(500).json({
            error: 'Failed to update notification preferences',
            requestId
        });
    }
}));
/**
 * Notification Function: Send Bulk Notifications
 * Sends notifications to multiple users
 */
exports.sendBulkNotifications = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.sendBulkNotificationsSchema, req.body);
        const { userIds, notificationType, content, priority } = validatedData;
        logger.info("Bulk notification requested", {
            count: userIds?.length,
            type: notificationType,
            requestId
        });
        // TODO: Implement bulk notification sending
        // - Validate user IDs and content
        // - Check user preferences
        // - Send notifications via appropriate channels
        // - Track delivery status
        // - Log bulk operation
        const bulkNotification = {
            bulkId: `bulk_${Date.now()}`,
            userIds,
            notificationType,
            content,
            priority,
            status: "processing",
            createdAt: new Date(),
        };
        // Store bulk notification request
        await db.collection("bulkNotifications").add(bulkNotification);
        res.status(200).json({
            success: true,
            message: "Bulk notification initiated",
            data: { bulkId: bulkNotification.bulkId },
            requestId
        });
    }
    catch (error) {
        if (error.name === 'BadRequest') {
            res.status(400).json({
                error: error.message,
                requestId
            });
            return;
        }
        logger.error('Send bulk notifications error:', error, { requestId });
        res.status(500).json({
            error: 'Failed to send bulk notifications',
            requestId
        });
    }
}));
/**
 * Notification Function: Get Notification History
 * Retrieves notification history for authenticated users
 */
exports.getNotificationHistory = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate query parameters
        const validatedData = (0, validate_2.validateBody)(validate_1.getNotificationHistorySchema, req.query);
        const { limit, offset, type } = validatedData;
        logger.info("Notification history requested", {
            limit,
            offset,
            type,
            requestId
        });
        // TODO: Implement notification history retrieval
        // - Query user's notification history
        // - Apply filters and pagination
        // - Return formatted notification data
        // - Include read/unread status
        const notifications = [];
        res.status(200).json({
            success: true,
            message: "Notification history retrieved",
            data: { notifications },
            requestId
        });
    }
    catch (error) {
        if (error.name === 'BadRequest') {
            res.status(400).json({
                error: error.message,
                requestId
            });
            return;
        }
        logger.error('Get notification history error:', error, { requestId });
        res.status(500).json({
            error: 'Failed to get notification history',
            requestId
        });
    }
}));
