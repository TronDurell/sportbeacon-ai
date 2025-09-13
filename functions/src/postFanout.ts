import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { scorePost, PostRankingParams } from "./ranking";
import { db } from "./memory/client";

/**
 * Handle when a new location post is created
 * - Increment location stats
 * - Fan-out to all followers' feeds
 * - Send notifications based on preferences
 * - Create audit log entry
 */
export const onLocationPostCreated = onDocumentCreated(
  "locations/{locationId}/threads/{postId}",
  async (event) => {
    try {
      // db is imported from memory/client
      const { locationId, postId } = event.params;
      const postData = event.data?.data();
      
      if (!postData) {
        logger.error("No post data found", { locationId, postId });
        return;
      }
      
      logger.info("Location post created", { locationId, postId, type: postData.type });
      
      // Start a batch write for atomic operations
      const batch = db.batch();
      
      // 1. Update location stats
      const locationRef = db.collection("locations").doc(locationId);
      batch.update(locationRef, {
        "stats.posts": FieldValue.increment(1),
        "stats.lastPostAt": FieldValue.serverTimestamp(),
        "updatedAt": FieldValue.serverTimestamp()
      });
      
      // 2. Fan-out to all followers' feeds
      await fanOutPostToFollowers(locationId, postId, postData, batch);
      
      // 3. Create audit log entry
      const auditLogRef = db.collection("audit_logs").doc();
      batch.set(auditLogRef, {
        action: "location_post_created",
        locationId,
        postId,
        authorId: postData.authorId,
        type: postData.type,
        timestamp: FieldValue.serverTimestamp(),
        metadata: {
          visibility: postData.visibility,
          hasMedia: postData.media && postData.media.length > 0
        }
      });
      
      // Commit all changes atomically
      await batch.commit();
      
      logger.info("Location post fan-out completed", { 
        locationId, 
        postId, 
        type: postData.type 
      });
      
      // 4. Send notifications (async, don't block the main operation)
      sendPostNotifications(locationId, postId, postData).catch(error => {
        logger.error("Error sending post notifications", { 
          locationId, 
          postId, 
          error: error instanceof Error ? error.message : String(error) 
        });
      });
      
    } catch (error) {
      logger.error("Error processing location post creation", { 
        locationId: event.params.locationId, 
        postId: event.params.postId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
);

/**
 * Fan-out a new post to all location followers' feeds
 * @param locationId Location ID
 * @param postId Post ID
 * @param postData Post data
 * @param batch Batch write to add operations to
 */
async function fanOutPostToFollowers(
  locationId: string,
  postId: string,
  postData: any,
  batch: FirebaseFirestore.WriteBatch
): Promise<void> {
  try {
    // Get all followers for this location
    const followsSnapshot = await db
      .collection("follows_locations")
      .where("locationId", "==", locationId)
      .get();
    
    if (followsSnapshot.empty) {
      logger.info("No followers found for location", { locationId, postId });
      return;
    }
    
    const followers = followsSnapshot.docs.map(doc => ({
      userId: doc.data().userId,
      notifications: doc.data().notifications
    }));
    
    logger.info("Fanning out post to followers", { 
      locationId, 
      postId, 
      followerCount: followers.length 
    });
    
    // Calculate post rank
    const rankingParams: PostRankingParams = {
      createdAt: postData.createdAt,
      likeCount: postData.likeCount || 0,
      replyCount: postData.replyCount || 0,
      reportCount: postData.reportCount || 0,
      pinned: postData.pinned || false,
      type: postData.type
    };
    
    const rank = scorePost(rankingParams);
    
    // Add post to each follower's home feed
    followers.forEach(follower => {
      const feedItemId = `${postId}_${follower.userId}`;
      const userFeedRef = db
        .collection("users")
        .doc(follower.userId)
        .collection("home_location_feed")
        .doc(feedItemId);
      
      batch.set(userFeedRef, {
        source: {
          kind: "location",
          locationId
        },
        postRef: `locations/${locationId}/threads/${postId}`,
        rank,
        createdAt: postData.createdAt
      });
    });
    
    logger.info("Post fanned out to followers", { 
      locationId, 
      postId, 
      followerCount: followers.length 
    });
    
  } catch (error) {
    logger.error("Error fanning out post to followers", { 
      locationId, 
      postId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

/**
 * Send notifications for new post based on follower preferences
 * @param locationId Location ID
 * @param postId Post ID
 * @param postData Post data
 */
async function sendPostNotifications(
  locationId: string,
  postId: string,
  postData: any
): Promise<void> {
  try {
    const db = getFirestore();
    // Get location info for notification context
    const locationDoc = await db.collection("locations").doc(locationId).get();
    if (!locationDoc.exists) {
      logger.warn("Location not found for notifications", { locationId });
      return;
    }
    
    const locationData = locationDoc.data();
    
    // Get followers with "all" notification preference
    const allNotificationsSnapshot = await db
      .collection("follows_locations")
      .where("locationId", "==", locationId)
      .where("notifications", "==", "all")
      .get();
    
    if (allNotificationsSnapshot.empty) {
      logger.info("No followers with \"all\" notifications", { locationId, postId });
      return;
    }
    
    const allNotificationFollowers = allNotificationsSnapshot.docs.map(doc => doc.data().userId);
    
    // Create notification for each follower
    const batch = db.batch();
    
    allNotificationFollowers.forEach(userId => {
      const notificationRef = db.collection("notifications").doc();
      
      const notificationData = {
        userId,
        title: `New ${postData.type} at ${locationData?.name || "Location"}`,
        message: generateNotificationMessage(postData),
        type: "info",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        metadata: {
          action: "location_post_created",
          locationId,
          postId,
          postType: postData.type
        }
      };
      
      batch.set(notificationRef, notificationData);
    });
    
    await batch.commit();
    
    logger.info("Post notifications sent", { 
      locationId, 
      postId, 
      notificationCount: allNotificationFollowers.length 
    });
    
  } catch (error) {
    logger.error("Error sending post notifications", { 
      locationId, 
      postId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

/**
 * Generate notification message based on post type
 * @param postData Post data
 * @returns Notification message
 */
function generateNotificationMessage(postData: any): string {
  const locationName = "your followed location";
  
  switch (postData.type) {
  case "note":
    return postData.text 
      ? `"${postData.text.substring(0, 100)}${postData.text.length > 100 ? "..." : ""}"`
      : "Someone shared a note";
        
  case "run":
    if (postData.run?.startsAt) {
      const startTime = new Date(postData.run.startsAt.toMillis()).toLocaleTimeString();
      return `New run starting at ${startTime}`;
    }
    return "New run posted";
      
  case "alert":
    return postData.text || "New alert posted";
      
  case "poll":
    return postData.poll?.question 
      ? `"${postData.poll.question.substring(0, 100)}${postData.poll.question.length > 100 ? "..." : ""}"`
      : "New poll posted";
        
  case "clip":
    return "New video clip shared";
      
  default:
    return "New post at " + locationName;
  }
}

/**
 * Get post engagement metrics
 * @param locationId Location ID
 * @param postId Post ID
 * @returns Post engagement data
 */
export async function getPostEngagement(
  locationId: string, 
  postId: string
): Promise<{
  likeCount: number;
  replyCount: number;
  reportCount: number;
  viewCount?: number;
}> {
  try {
    const postDoc = await db
      .collection("locations")
      .doc(locationId)
      .collection("threads")
      .doc(postId)
      .get();
    
    if (!postDoc.exists) {
      throw new Error("Post not found");
    }
    
    const postData = postDoc.data();
    
    return {
      likeCount: postData?.likeCount || 0,
      replyCount: postData?.replyCount || 0,
      reportCount: postData?.reportCount || 0,
      viewCount: postData?.viewCount || 0
    };
    
  } catch (error) {
    logger.error("Error getting post engagement", { 
      locationId, 
      postId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

/**
 * Update post engagement metrics
 * @param locationId Location ID
 * @param postId Post ID
 * @param updates Engagement updates
 */
export async function updatePostEngagement(
  locationId: string,
  postId: string,
  updates: {
    likeCount?: number;
    replyCount?: number;
    reportCount?: number;
    viewCount?: number;
  }
): Promise<void> {
  try {
    const postRef = db
      .collection("locations")
      .doc(locationId)
      .collection("threads")
      .doc(postId);
    
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp()
    };
    
    if (updates.likeCount !== undefined) {
      updateData.likeCount = updates.likeCount;
    }
    
    if (updates.replyCount !== undefined) {
      updateData.replyCount = updates.replyCount;
    }
    
    if (updates.reportCount !== undefined) {
      updateData.reportCount = updates.reportCount;
    }
    
    if (updates.viewCount !== undefined) {
      updateData.viewCount = updates.viewCount;
    }
    
    await postRef.update(updateData);
    
    logger.info("Post engagement updated", { 
      locationId, 
      postId, 
      updates 
    });
    
  } catch (error) {
    logger.error("Error updating post engagement", { 
      locationId, 
      postId, 
      updates, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}
