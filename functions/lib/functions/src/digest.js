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
exports.cleanupOldDigests = exports.markDigestAsRead = exports.getUserDigestHistory = exports.generateLocationDigest = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const ranking_1 = require("./ranking");
const db = (0, firestore_1.getFirestore)();
/**
 * Scheduled digest generation for users with "digest" notification preference
 * Runs nightly at 8 PM user local time (or 8 PM UTC as fallback)
 */
exports.generateLocationDigest = (0, scheduler_1.onSchedule)({
    schedule: "0 20 * * *",
    timeZone: "UTC",
    retryCount: 3
}, async (event) => {
    try {
        logger.info("Starting location digest generation", {
            timestamp: event.scheduleTime
        });
        // Get all users with digest notifications
        const digestUsersSnapshot = await db
            .collection("follows_locations")
            .where("notifications", "==", "digest")
            .get();
        if (digestUsersSnapshot.empty) {
            logger.info("No users with digest notifications found");
            return;
        }
        // Group follows by user
        const userFollows = new Map();
        digestUsersSnapshot.docs.forEach(doc => {
            const { userId, locationId } = doc.data();
            if (!userFollows.has(userId)) {
                userFollows.set(userId, []);
            }
            userFollows.get(userId).push(locationId);
        });
        logger.info("Processing digest for users", {
            userCount: userFollows.size
        });
        // Process each user's digest
        const digestPromises = Array.from(userFollows.entries()).map(([userId, locationIds]) => generateUserDigest(userId, locationIds));
        await Promise.allSettled(digestPromises);
        logger.info("Location digest generation completed", {
            userCount: userFollows.size,
            timestamp: event.scheduleTime
        });
    }
    catch (error) {
        logger.error("Error generating location digest", {
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
});
/**
 * Generate digest for a specific user
 * @param userId User ID
 * @param locationIds Array of followed location IDs
 */
async function generateUserDigest(userId, locationIds) {
    try {
        logger.info("Generating digest for user", { userId, locationCount: locationIds.length });
        const digestData = [];
        // Get top posts for each followed location
        for (const locationId of locationIds) {
            try {
                const locationData = await getLocationData(locationId);
                const topPosts = await getTopLocationPosts(locationId, 5); // Top 5 posts per location
                digestData.push({
                    locationId,
                    locationName: locationData.name,
                    topPosts,
                    totalPosts: locationData.stats.posts
                });
            }
            catch (error) {
                logger.warn("Error processing location for digest", {
                    userId,
                    locationId,
                    error: error instanceof Error ? error.message : String(error)
                });
                // Continue with other locations
            }
        }
        if (digestData.length === 0) {
            logger.info("No digest data generated for user", { userId });
            return;
        }
        // Create digest document
        const digestRef = db.collection("users").doc(userId).collection("digests").doc();
        await digestRef.set({
            userId,
            generatedAt: firestore_1.FieldValue.serverTimestamp(),
            locationCount: digestData.length,
            totalPosts: digestData.reduce((sum, loc) => sum + loc.totalPosts, 0),
            locations: digestData,
            read: false
        });
        // Send digest notification
        await sendDigestNotification(userId, digestData);
        logger.info("User digest generated successfully", {
            userId,
            locationCount: digestData.length
        });
    }
    catch (error) {
        logger.error("Error generating user digest", {
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Get location data for digest
 * @param locationId Location ID
 * @returns Location data
 */
async function getLocationData(locationId) {
    const locationDoc = await db.collection("locations").doc(locationId).get();
    if (!locationDoc.exists) {
        throw new Error("Location not found");
    }
    const data = locationDoc.data();
    return {
        name: data.name,
        stats: data.stats || { posts: 0 }
    };
}
/**
 * Get top posts for a location based on ranking
 * @param locationId Location ID
 * @param limit Maximum number of posts to return
 * @returns Array of top posts with ranking
 */
async function getTopLocationPosts(locationId, limit) {
    // Get recent posts from the location
    const postsSnapshot = await db
        .collection("locations")
        .doc(locationId)
        .collection("threads")
        .orderBy("createdAt", "desc")
        .limit(50) // Get more posts to rank from
        .get();
    if (postsSnapshot.empty) {
        return [];
    }
    const posts = postsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    // Calculate ranks for all posts
    const rankedPosts = posts.map(post => {
        const rankingParams = {
            createdAt: post.createdAt,
            likeCount: post.likeCount || 0,
            replyCount: post.replyCount || 0,
            reportCount: post.reportCount || 0,
            pinned: post.pinned || false,
            type: post.type
        };
        return Object.assign(Object.assign({}, post), { rank: (0, ranking_1.scorePost)(rankingParams) });
    });
    // Sort by rank and return top posts
    return rankedPosts
        .sort((a, b) => b.rank - a.rank)
        .slice(0, limit)
        .map(post => ({
        id: post.id,
        type: post.type,
        text: post.text,
        media: post.media,
        poll: post.poll,
        run: post.run,
        likeCount: post.likeCount || 0,
        replyCount: post.replyCount || 0,
        createdAt: post.createdAt,
        rank: post.rank
    }));
}
/**
 * Send digest notification to user
 * @param userId User ID
 * @param digestData Digest data
 */
async function sendDigestNotification(userId, digestData) {
    try {
        const notificationRef = db.collection("notifications").doc();
        const locationNames = digestData.map(loc => loc.locationName).join(", ");
        const totalPosts = digestData.reduce((sum, loc) => sum + loc.totalPosts, 0);
        await notificationRef.set({
            userId,
            title: "Your Daily Location Digest",
            message: `Top posts from ${digestData.length} locations you follow (${totalPosts} total posts)`,
            type: "info",
            read: false,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            metadata: {
                action: "digest_generated",
                locationCount: digestData.length,
                totalPosts,
                locations: digestData.map(loc => loc.locationId)
            }
        });
        logger.info("Digest notification sent", { userId });
    }
    catch (error) {
        logger.error("Error sending digest notification", {
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Get user's digest history
 * @param userId User ID
 * @param limit Maximum number of digests to return
 * @returns Array of digest documents
 */
async function getUserDigestHistory(userId, limit = 10) {
    try {
        const digestsSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("digests")
            .orderBy("generatedAt", "desc")
            .limit(limit)
            .get();
        return digestsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    }
    catch (error) {
        logger.error("Error getting user digest history", {
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
exports.getUserDigestHistory = getUserDigestHistory;
/**
 * Mark digest as read
 * @param userId User ID
 * @param digestId Digest ID
 */
async function markDigestAsRead(userId, digestId) {
    try {
        const digestRef = db
            .collection("users")
            .doc(userId)
            .collection("digests")
            .doc(digestId);
        await digestRef.update({
            read: true,
            readAt: firestore_1.FieldValue.serverTimestamp()
        });
        logger.info("Digest marked as read", { userId, digestId });
    }
    catch (error) {
        logger.error("Error marking digest as read", {
            userId,
            digestId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
exports.markDigestAsRead = markDigestAsRead;
/**
 * Clean up old digests (older than 30 days)
 * @param userId User ID (optional, if not provided cleans all users)
 */
async function cleanupOldDigests(userId) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (userId) {
            // Clean up for specific user
            await cleanupUserOldDigests(userId, thirtyDaysAgo);
        }
        else {
            // Clean up for all users (admin function)
            const usersSnapshot = await db.collection("users").get();
            const cleanupPromises = usersSnapshot.docs.map(doc => cleanupUserOldDigests(doc.id, thirtyDaysAgo));
            await Promise.allSettled(cleanupPromises);
        }
        logger.info("Old digests cleanup completed");
    }
    catch (error) {
        logger.error("Error cleaning up old digests", {
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
exports.cleanupOldDigests = cleanupOldDigests;
/**
 * Clean up old digests for a specific user
 * @param userId User ID
 * @param cutoffDate Cutoff date for deletion
 */
async function cleanupUserOldDigests(userId, cutoffDate) {
    try {
        const oldDigestsSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("digests")
            .where("generatedAt", "<", cutoffDate)
            .get();
        if (oldDigestsSnapshot.empty) {
            return;
        }
        const batch = db.batch();
        oldDigestsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        logger.info("Old digests cleaned up for user", {
            userId,
            deletedCount: oldDigestsSnapshot.docs.length
        });
    }
    catch (error) {
        logger.error("Error cleaning up old digests for user", {
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
//# sourceMappingURL=digest.js.map