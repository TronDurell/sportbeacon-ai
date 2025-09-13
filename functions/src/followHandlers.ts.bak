import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { scorePost, PostRankingParams } from "./ranking";

/**
 * Handle when a user follows a location
 * - Backfill last 25 posts into user's home feed
 * - Increment location follower count
 * - Create audit log entry
 */
export const onFollowLocationCreated = onDocumentCreated(
  "follows_locations/{followId}",
  async (event) => {
    try {
      const db = getFirestore();
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
        "stats.followers": FieldValue.increment(1),
        "updatedAt": FieldValue.serverTimestamp()
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
        timestamp: FieldValue.serverTimestamp(),
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
      
    } catch (error) {
      logger.error("Error processing location follow creation", { 
        followId: event.params.followId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
);

/**
 * Handle when a user unfollows a location
 * - Remove all feed items for that location
 * - Decrement location follower count
 * - Create audit log entry
 */
export const onFollowLocationDeleted = onDocumentDeleted(
  "follows_locations/{followId}",
  async (event) => {
    try {
      const db = getFirestore();
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
        "stats.followers": FieldValue.increment(-1),
        "updatedAt": FieldValue.serverTimestamp()
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
        timestamp: FieldValue.serverTimestamp()
      });
      
      // Commit all changes atomically
      await batch.commit();
      
      logger.info("Location unfollow processed successfully", { 
        followId, 
        locationId, 
        userId 
      });
      
    } catch (error) {
      logger.error("Error processing location follow deletion", { 
        followId: event.params.followId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
);

/**
 * Backfill recent location posts into user's home feed
 * @param locationId Location ID to backfill from
 * @param userId User ID to backfill to
 * @param batch Batch write to add operations to
 */
async function backfillLocationPostsToFeed(
  locationId: string, 
  userId: string, 
  batch: FirebaseFirestore.WriteBatch
): Promise<void> {
  try {
    const db = getFirestore();
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
    })) as any[];
    
    // Calculate ranks for each post
    const rankedPosts = posts.map(post => {
      const rankingParams: PostRankingParams = {
        createdAt: post.createdAt,
        likeCount: post.likeCount || 0,
        replyCount: post.replyCount || 0,
        reportCount: post.reportCount || 0,
        pinned: post.pinned || false,
        type: post.type
      };
      
      return {
        ...post,
        rank: scorePost(rankingParams)
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
    
  } catch (error) {
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
async function removeLocationPostsFromFeed(
  locationId: string, 
  userId: string, 
  batch: FirebaseFirestore.WriteBatch
): Promise<void> {
  try {
    // Find all feed items for this location
    const db = getFirestore();
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
    
  } catch (error) {
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
export async function getUserFollowedLocations(userId: string): Promise<string[]> {
  try {
    const db = getFirestore();
    const followsSnapshot = await db
      .collection("follows_locations")
      .where("userId", "==", userId)
      .get();
    
    return followsSnapshot.docs.map(doc => doc.data().locationId);
    
  } catch (error) {
    logger.error("Error getting user followed locations", { 
      userId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

/**
 * Check if user is following a specific location
 * @param userId User ID
 * @param locationId Location ID
 * @returns True if user is following the location
 */
export async function isUserFollowingLocation(
  userId: string, 
  locationId: string
): Promise<boolean> {
  try {
    const followId = `${userId}_${locationId}`;
    const db = getFirestore();
    const followDoc = await db
      .collection("follows_locations")
      .doc(followId)
      .get();
    
    return followDoc.exists;
    
  } catch (error) {
    logger.error("Error checking if user follows location", { 
      userId, 
      locationId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}
