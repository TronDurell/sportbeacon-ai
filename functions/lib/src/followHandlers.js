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
exports.isUserFollowingLocation = exports.getUserFollowedLocations = exports.onFollowLocationDeleted = exports.onFollowLocationCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const ranking_1 = require("./ranking");
/**
 * Handle when a user follows a location
 * - Backfill last 25 posts into user's home feed
 * - Increment location follower count
 * - Create audit log entry
 */
exports.onFollowLocationCreated = (0, firestore_1.onDocumentCreated)("follows_locations/{followId}", async (event) => {
    try {
        const db = (0, firestore_2.getFirestore)();
        const followId = event.params.followId;
        const followData = event.data?.data();
        if (!followData) {
            logger.error("No follow data found", { followId });
            return;
        }
        const { locationId, userId, notifications } = followData;
        logger.info("Location follow created", { followId, locationId, userId, notifications });
        // Start a batch write for atomic operations
        const batch = db.batch();
        // 1. Increment location follower count
        const locationRef = db.collection("locations").doc(locationId);
        batch.update(locationRef, {
            "stats.followers": firestore_2.FieldValue.increment(1),
            "updatedAt": firestore_2.FieldValue.serverTimestamp()
        });
        // 2. Backfill last 25 posts into user's home feed
        await backfillLocationPostsToFeed(locationId, userId, batch);
        // 3. Create audit log entry
        const auditLogRef = db.collection("audit_logs").doc();
        batch.set(auditLogRef, {
            action: "location_followed",
            userId,
            locationId,
            followId,
            timestamp: firestore_2.FieldValue.serverTimestamp(),
            metadata: {
                notifications,
                postsBackfilled: 25 // We'll update this with actual count
            }
        });
        // Commit all changes atomically
        await batch.commit();
        logger.info("Location follow processed successfully", {
            followId,
            locationId,
            userId
        });
    }
    catch (error) {
        logger.error("Error processing location follow creation", {
            followId: event.params.followId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
});
/**
 * Handle when a user unfollows a location
 * - Remove all feed items for that location
 * - Decrement location follower count
 * - Create audit log entry
 */
exports.onFollowLocationDeleted = (0, firestore_1.onDocumentDeleted)("follows_locations/{followId}", async (event) => {
    try {
        const db = (0, firestore_2.getFirestore)();
        const followId = event.params.followId;
        const followData = event.data?.data();
        if (!followData) {
            logger.error("No follow data found for deletion", { followId });
            return;
        }
        const { locationId, userId } = followData;
        logger.info("Location follow deleted", { followId, locationId, userId });
        // Start a batch write for atomic operations
        const batch = db.batch();
        // 1. Decrement location follower count
        const locationRef = db.collection("locations").doc(locationId);
        batch.update(locationRef, {
            "stats.followers": firestore_2.FieldValue.increment(-1),
            "updatedAt": firestore_2.FieldValue.serverTimestamp()
        });
        // 2. Remove all feed items for this location from user's home feed
        await removeLocationPostsFromFeed(locationId, userId, batch);
        // 3. Create audit log entry
        const auditLogRef = db.collection("audit_logs").doc();
        batch.set(auditLogRef, {
            action: "location_unfollowed",
            userId,
            locationId,
            followId,
            timestamp: firestore_2.FieldValue.serverTimestamp()
        });
        // Commit all changes atomically
        await batch.commit();
        logger.info("Location unfollow processed successfully", {
            followId,
            locationId,
            userId
        });
    }
    catch (error) {
        logger.error("Error processing location follow deletion", {
            followId: event.params.followId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
});
/**
 * Backfill recent location posts into user's home feed
 * @param locationId Location ID to backfill from
 * @param userId User ID to backfill to
 * @param batch Batch write to add operations to
 */
async function backfillLocationPostsToFeed(locationId, userId, batch) {
    try {
        const db = (0, firestore_2.getFirestore)();
        // Get last 25 posts from the location
        const postsSnapshot = await db
            .collection("locations")
            .doc(locationId)
            .collection("threads")
            .orderBy("createdAt", "desc")
            .limit(25)
            .get();
        if (postsSnapshot.empty) {
            logger.info("No posts found to backfill", { locationId, userId });
            return;
        }
        const posts = postsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Calculate ranks for each post
        const rankedPosts = posts.map(post => {
            const rankingParams = {
                createdAt: post.createdAt,
                likeCount: post.likeCount || 0,
                replyCount: post.replyCount || 0,
                reportCount: post.reportCount || 0,
                pinned: post.pinned || false,
                type: post.type
            };
            return {
                ...post,
                rank: (0, ranking_1.scorePost)(rankingParams)
            };
        });
        // Add posts to user's home feed
        const userFeedRef = db.collection("users").doc(userId).collection("home_location_feed");
        rankedPosts.forEach(post => {
            const feedItemId = `${post.id}_${userId}`;
            const feedItemRef = userFeedRef.doc(feedItemId);
            batch.set(feedItemRef, {
                source: {
                    kind: "location",
                    locationId
                },
                postRef: `locations/${locationId}/threads/${post.id}`,
                rank: post.rank,
                createdAt: post.createdAt
            });
        });
        logger.info("Posts backfilled to home feed", {
            locationId,
            userId,
            postCount: rankedPosts.length
        });
    }
    catch (error) {
        logger.error("Error backfilling posts to home feed", {
            locationId,
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Remove all location posts from user's home feed
 * @param locationId Location ID to remove posts for
 * @param userId User ID whose feed to clean
 * @param batch Batch write to add operations to
 */
async function removeLocationPostsFromFeed(locationId, userId, batch) {
    try {
        // Find all feed items for this location
        const db = (0, firestore_2.getFirestore)();
        const feedItemsSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("home_location_feed")
            .where("source.locationId", "==", locationId)
            .get();
        if (feedItemsSnapshot.empty) {
            logger.info("No feed items found to remove", { locationId, userId });
            return;
        }
        // Remove all feed items for this location
        feedItemsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        logger.info("Feed items removed from home feed", {
            locationId,
            userId,
            itemCount: feedItemsSnapshot.docs.length
        });
    }
    catch (error) {
        logger.error("Error removing posts from home feed", {
            locationId,
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
/**
 * Get user's followed locations
 * @param userId User ID
 * @returns Array of followed location IDs
 */
async function getUserFollowedLocations(userId) {
    try {
        const db = (0, firestore_2.getFirestore)();
        const followsSnapshot = await db
            .collection("follows_locations")
            .where("userId", "==", userId)
            .get();
        return followsSnapshot.docs.map(doc => doc.data().locationId);
    }
    catch (error) {
        logger.error("Error getting user followed locations", {
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
exports.getUserFollowedLocations = getUserFollowedLocations;
/**
 * Check if user is following a specific location
 * @param userId User ID
 * @param locationId Location ID
 * @returns True if user is following the location
 */
async function isUserFollowingLocation(userId, locationId) {
    try {
        const followId = `${userId}_${locationId}`;
        const db = (0, firestore_2.getFirestore)();
        const followDoc = await db
            .collection("follows_locations")
            .doc(followId)
            .get();
        return followDoc.exists;
    }
    catch (error) {
        logger.error("Error checking if user follows location", {
            userId,
            locationId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
exports.isUserFollowingLocation = isUserFollowingLocation;
