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
exports.cleanupExpiredQuarantines = exports.getLocationModerationStats = exports.reviewReportedPost = exports.reportPost = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const db = (0, firestore_1.getFirestore)();
// Configuration constants
const REPORT_THRESHOLD = 3; // Number of reports before quarantine
const QUARANTINE_DURATION_HOURS = 24; // How long to quarantine content
const MAX_REPORTS_PER_USER = 5; // Maximum reports per user per day
/**
 * Report a post for moderation
 * Callable function that users can call to report inappropriate content
 */
exports.reportPost = (0, https_1.onCall)({
    maxInstances: 10,
    timeoutSeconds: 30
}, async (request) => {
    try {
        // Verify authentication
        if (!request.auth) {
            throw new Error("Authentication required");
        }
        const { locationId, postId, reason, details } = request.data;
        const userId = request.auth.uid;
        // Validate input
        if (!locationId || !postId || !reason) {
            throw new Error("Missing required fields: locationId, postId, reason");
        }
        logger.info("Post report received", {
            locationId,
            postId,
            userId,
            reason
        });
        // Check if user has exceeded daily report limit
        const canReport = await checkUserReportLimit(userId);
        if (!canReport) {
            throw new Error("Daily report limit exceeded. Please try again tomorrow.");
        }
        // Create report document
        const reportRef = db.collection("moderationReports").doc();
        await reportRef.set({
            locationId,
            postId,
            reporterId: userId,
            reason,
            details: details || "",
            status: "pending",
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            reviewedAt: null,
            reviewedBy: null,
            action: null
        });
        // Increment post report count
        await incrementPostReportCount(locationId, postId);
        // Check if post should be quarantined
        await checkAndQuarantinePost(locationId, postId);
        // Create audit log
        const auditLogRef = db.collection("audit_logs").doc();
        await auditLogRef.set({
            action: "post_reported",
            locationId,
            postId,
            reporterId: userId,
            reason,
            timestamp: firestore_1.FieldValue.serverTimestamp()
        });
        logger.info("Post report processed successfully", {
            locationId,
            postId,
            userId,
            reportId: reportRef.id
        });
        return {
            success: true,
            message: "Report submitted successfully",
            reportId: reportRef.id
        };
    }
    catch (error) {
        logger.error("Error processing post report", {
            error: error instanceof Error ? error.message : String(error),
            data: request.data
        });
        throw new Error(error instanceof Error ? error.message : "Failed to submit report");
    }
});
/**
 * Check if user has exceeded daily report limit
 * @param userId User ID
 * @returns True if user can report
 */
async function checkUserReportLimit(userId) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reportsSnapshot = await db
            .collection("moderationReports")
            .where("reporterId", "==", userId)
            .where("createdAt", ">=", today)
            .get();
        return reportsSnapshot.docs.length < MAX_REPORTS_PER_USER;
    }
    catch (error) {
        logger.error("Error checking user report limit", {
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        // Default to allowing report if check fails
        return true;
    }
}
/**
 * Increment post report count
 * @param locationId Location ID
 * @param postId Post ID
 */
async function incrementPostReportCount(locationId, postId) {
    try {
        const postRef = db
            .collection("locations")
            .doc(locationId)
            .collection("threads")
            .doc(postId);
        await postRef.update({
            reportCount: firestore_1.FieldValue.increment(1),
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
        logger.info("Post report count incremented", { locationId, postId });
    }
    catch (error) {
        logger.error("Error incrementing post report count", {
            locationId,
            postId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Check if post should be quarantined based on report count
 * @param locationId Location ID
 * @param postId Post ID
 */
async function checkAndQuarantinePost(locationId, postId) {
    try {
        const postDoc = await db
            .collection("locations")
            .doc(locationId)
            .collection("threads")
            .doc(postId)
            .get();
        if (!postDoc.exists) {
            logger.warn("Post not found for quarantine check", { locationId, postId });
            return;
        }
        const postData = postDoc.data();
        const reportCount = postData.reportCount || 0;
        if (reportCount >= REPORT_THRESHOLD) {
            await quarantinePost(locationId, postId, postData);
        }
    }
    catch (error) {
        logger.error("Error checking post for quarantine", {
            locationId,
            postId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Quarantine a post due to excessive reports
 * @param locationId Location ID
 * @param postId Post ID
 * @param postData Post data
 */
async function quarantinePost(locationId, postId, postData) {
    try {
        const postRef = db
            .collection("locations")
            .doc(locationId)
            .collection("threads")
            .doc(postId);
        const quarantineUntil = new Date();
        quarantineUntil.setHours(quarantineUntil.getHours() + QUARANTINE_DURATION_HOURS);
        await postRef.update({
            quarantined: true,
            quarantinedAt: firestore_1.FieldValue.serverTimestamp(),
            quarantinedUntil: quarantineUntil,
            quarantineReason: "Excessive reports",
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
        // Create quarantine record
        const quarantineRef = db.collection("quarantinedPosts").doc();
        await quarantineRef.set({
            locationId,
            postId,
            authorId: postData.authorId,
            type: postData.type,
            quarantinedAt: firestore_1.FieldValue.serverTimestamp(),
            quarantinedUntil: quarantineUntil,
            reason: "Excessive reports",
            reportCount: postData.reportCount || 0,
            status: "quarantined"
        });
        // Notify moderators
        await notifyModerators(locationId, postId, postData);
        logger.info("Post quarantined", {
            locationId,
            postId,
            reportCount: postData.reportCount || 0
        });
    }
    catch (error) {
        logger.error("Error quarantining post", {
            locationId,
            postId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Notify location moderators about quarantined post
 * @param locationId Location ID
 * @param postId Post ID
 * @param postData Post data
 */
async function notifyModerators(locationId, postId, postData) {
    try {
        const locationDoc = await db.collection("locations").doc(locationId).get();
        if (!locationDoc.exists) {
            logger.warn("Location not found for moderator notification", { locationId });
            return;
        }
        const locationData = locationDoc.data();
        const moderators = locationData.moderators || [];
        if (moderators.length === 0) {
            logger.info("No moderators found for location", { locationId });
            return;
        }
        // Create notifications for all moderators
        const batch = db.batch();
        moderators.forEach(moderatorId => {
            const notificationRef = db.collection("notifications").doc();
            batch.set(notificationRef, {
                userId: moderatorId,
                title: "Post Quarantined - Action Required",
                message: `A post at ${locationData.name} has been quarantined due to excessive reports.`,
                type: "warning",
                read: false,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                metadata: {
                    action: "post_quarantined",
                    locationId,
                    postId,
                    postType: postData.type,
                    reportCount: postData.reportCount || 0
                }
            });
        });
        await batch.commit();
        logger.info("Moderator notifications sent", {
            locationId,
            postId,
            moderatorCount: moderators.length
        });
    }
    catch (error) {
        logger.error("Error notifying moderators", {
            locationId,
            postId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Review and take action on a reported post
 * Callable function for moderators to review reports
 */
exports.reviewReportedPost = (0, https_1.onCall)({
    maxInstances: 5,
    timeoutSeconds: 60
}, async (request) => {
    try {
        // Verify authentication
        if (!request.auth) {
            throw new Error("Authentication required");
        }
        const { reportId, action, notes } = request.data;
        const moderatorId = request.auth.uid;
        // Validate input
        if (!reportId || !action) {
            throw new Error("Missing required fields: reportId, action");
        }
        // Validate action
        const validActions = ["dismiss", "warn", "quarantine", "delete"];
        if (!validActions.includes(action)) {
            throw new Error("Invalid action. Must be one of: dismiss, warn, quarantine, delete");
        }
        logger.info("Post review action", {
            reportId,
            moderatorId,
            action
        });
        // Get report details
        const reportDoc = await db.collection("moderationReports").doc(reportId).get();
        if (!reportDoc.exists) {
            throw new Error("Report not found");
        }
        const reportData = reportDoc.data();
        const { locationId, postId } = reportData;
        // Update report status
        await db.collection("moderationReports").doc(reportId).update({
            status: "reviewed",
            reviewedAt: firestore_1.FieldValue.serverTimestamp(),
            reviewedBy: moderatorId,
            action,
            notes: notes || "",
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
        // Take action on the post
        await takeModeratorAction(locationId, postId, action, moderatorId, notes);
        // Create audit log
        const auditLogRef = db.collection("audit_logs").doc();
        await auditLogRef.set({
            action: "post_reviewed",
            locationId,
            postId,
            reportId,
            moderatorId,
            notes,
            timestamp: firestore_1.FieldValue.serverTimestamp()
        });
        logger.info("Post review completed", {
            locationId,
            postId,
            reportId,
            action
        });
        return {
            success: true,
            message: "Post review completed successfully",
            action
        };
    }
    catch (error) {
        logger.error("Error reviewing reported post", {
            error: error instanceof Error ? error.message : String(error),
            data: request.data
        });
        throw new Error(error instanceof Error ? error.message : "Failed to review post");
    }
});
/**
 * Take moderator action on a post
 * @param locationId Location ID
 * @param postId Post ID
 * @param action Action to take
 * @param moderatorId Moderator ID
 * @param notes Additional notes
 */
async function takeModeratorAction(locationId, postId, action, moderatorId, notes) {
    try {
        const postRef = db
            .collection("locations")
            .doc(locationId)
            .collection("threads")
            .doc(postId);
        const updateData = {
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            lastModeratedAt: firestore_1.FieldValue.serverTimestamp(),
            lastModeratedBy: moderatorId
        };
        switch (action) {
            case "dismiss":
                // Reset report count and remove quarantine
                updateData.reportCount = 0;
                updateData.quarantined = false;
                updateData.quarantinedAt = null;
                updateData.quarantinedUntil = null;
                updateData.quarantineReason = null;
                break;
            case "warn":
                // Add warning flag
                updateData.warned = true;
                updateData.warnedAt = firestore_1.FieldValue.serverTimestamp();
                updateData.warnedBy = moderatorId;
                updateData.warningNotes = notes;
                break;
            case "quarantine": {
                // Quarantine the post
                const quarantineUntil = new Date();
                quarantineUntil.setHours(quarantineUntil.getHours() + QUARANTINE_DURATION_HOURS);
                updateData.quarantined = true;
                updateData.quarantinedAt = firestore_1.FieldValue.serverTimestamp();
                updateData.quarantinedUntil = quarantineUntil;
                updateData.quarantineReason = notes || "Moderator decision";
                break;
            }
            case "delete":
                // Mark for deletion (actual deletion handled by cleanup function)
                updateData.deleted = true;
                updateData.deletedAt = firestore_1.FieldValue.serverTimestamp();
                updateData.deletedBy = moderatorId;
                updateData.deletionReason = notes || "Moderator decision";
                break;
        }
        await postRef.update(updateData);
        logger.info("Moderator action taken", {
            locationId,
            postId,
            action,
            moderatorId
        });
    }
    catch (error) {
        logger.error("Error taking moderator action", {
            locationId,
            postId,
            action,
            moderatorId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Get moderation statistics for a location
 * @param locationId Location ID
 * @returns Moderation statistics
 */
async function getLocationModerationStats(locationId) {
    try {
        // Get post counts
        const postsSnapshot = await db
            .collection("locations")
            .doc(locationId)
            .collection("threads")
            .get();
        const posts = postsSnapshot.docs.map(doc => doc.data());
        // Get pending reports
        const pendingReportsSnapshot = await db
            .collection("moderationReports")
            .where("locationId", "==", locationId)
            .where("status", "==", "pending")
            .get();
        return {
            totalPosts: posts.length,
            reportedPosts: posts.filter(p => (p.reportCount || 0) > 0).length,
            quarantinedPosts: posts.filter(p => p.quarantined).length,
            deletedPosts: posts.filter(p => p.deleted).length,
            pendingReports: pendingReportsSnapshot.docs.length
        };
    }
    catch (error) {
        logger.error("Error getting location moderation stats", {
            locationId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
exports.getLocationModerationStats = getLocationModerationStats;
/**
 * Clean up expired quarantines
 * Scheduled function to automatically unquarantine posts
 */
exports.cleanupExpiredQuarantines = (0, https_1.onCall)({
    maxInstances: 1,
    timeoutSeconds: 300
}, async (request) => {
    try {
        logger.info("Starting cleanup of expired quarantines");
        const now = new Date();
        // Find all quarantined posts that have expired
        const expiredQuarantinesSnapshot = await db
            .collection("quarantinedPosts")
            .where("quarantinedUntil", "<", now)
            .where("status", "==", "quarantined")
            .get();
        if (expiredQuarantinesSnapshot.empty) {
            logger.info("No expired quarantines found");
            return { success: true, message: "No expired quarantines found" };
        }
        const batch = db.batch();
        let processedCount = 0;
        for (const doc of expiredQuarantinesSnapshot.docs) {
            const quarantineData = doc.data();
            const { locationId, postId } = quarantineData;
            try {
                // Update post status
                const postRef = db
                    .collection("locations")
                    .doc(locationId)
                    .collection("threads")
                    .doc(postId);
                batch.update(postRef, {
                    quarantined: false,
                    quarantinedAt: null,
                    quarantinedUntil: null,
                    quarantineReason: null,
                    updatedAt: firestore_1.FieldValue.serverTimestamp()
                });
                // Update quarantine record
                batch.update(doc.ref, {
                    status: "expired",
                    expiredAt: firestore_1.FieldValue.serverTimestamp()
                });
                processedCount++;
            }
            catch (error) {
                logger.error("Error processing expired quarantine", {
                    locationId,
                    postId,
                    error: error instanceof Error ? error.message : String(error)
                });
                // Continue with other quarantines
            }
        }
        await batch.commit();
        logger.info("Expired quarantines cleanup completed", {
            processedCount,
            totalFound: expiredQuarantinesSnapshot.docs.length
        });
        return {
            success: true,
            message: `Processed ${processedCount} expired quarantines`,
            processedCount
        };
    }
    catch (error) {
        logger.error("Error cleaning up expired quarantines", {
            error: error instanceof Error ? error.message : String(error)
        });
        throw new Error("Failed to cleanup expired quarantines");
    }
});
