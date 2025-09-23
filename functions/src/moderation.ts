import { onCall, onRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { getAuth } from "firebase-admin/auth";
import { withSecurityGuards } from './lib/http';
import { Request, Response } from 'express';
import { 
  reportPostSchema,
  reviewReportedPostSchema,
  cleanupExpiredQuarantinesSchema
} from './lib/validate';
import { validateBody } from './lib/validate';

const db = getFirestore();

// Configuration constants
const REPORT_THRESHOLD = 3; // Number of reports before quarantine
const QUARANTINE_DURATION_HOURS = 24; // How long to quarantine content
const MAX_REPORTS_PER_USER = 5; // Maximum reports per user per day

/**
 * Report a post for moderation
 * Callable function that users can call to report inappropriate content
 */
export const reportPost = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(reportPostSchema, req.body);
    const { locationId, postId, reason, details } = validatedData;

    logger.info("Post report received", {
      locationId,
      postId,
      reason,
      requestId
    });

    // TODO: Implement post reporting
    // - Validate user authentication and permissions
    // - Check daily report limits
    // - Create report document
    // - Increment post report count
    // - Check if post should be quarantined
    // - Create audit log

    const reportRef = db.collection("moderationReports").doc();
    await reportRef.set({
      locationId,
      postId,
      reason,
      details: details || "",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      action: null
    });

    res.status(200).json({
      success: true,
      message: "Report submitted successfully",
      data: { reportId: reportRef.id },
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('Post report error:', error, { requestId });
    res.status(500).json({ 
      error: 'Failed to submit report',
      requestId
    });
  }
}));

/**
 * Check if user has exceeded daily report limit
 * @param userId User ID
 * @returns True if user can report
 */
async function checkUserReportLimit(userId: string): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reportsSnapshot = await db
      .collection("moderationReports")
      .where("reporterId", "==", userId)
      .where("createdAt", ">=", today)
      .get();
    
    return reportsSnapshot.docs.length < MAX_REPORTS_PER_USER;
    
  } catch (error) {
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
async function incrementPostReportCount(locationId: string, postId: string): Promise<void> {
  try {
    const postRef = db
      .collection("locations")
      .doc(locationId)
      .collection("threads")
      .doc(postId);
    
    await postRef.update({
      reportCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    logger.info("Post report count incremented", { locationId, postId });
    
  } catch (error) {
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
async function checkAndQuarantinePost(locationId: string, postId: string): Promise<void> {
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
    
    const postData = postDoc.data()!;
    const reportCount = postData.reportCount || 0;
    
    if (reportCount >= REPORT_THRESHOLD) {
      await quarantinePost(locationId, postId, postData);
    }
    
  } catch (error) {
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
async function quarantinePost(
  locationId: string, 
  postId: string, 
  postData: any
): Promise<void> {
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
      quarantinedAt: FieldValue.serverTimestamp(),
      quarantinedUntil: quarantineUntil,
      quarantineReason: "Excessive reports",
      updatedAt: FieldValue.serverTimestamp()
    });
    
    // Create quarantine record
    const quarantineRef = db.collection("quarantinedPosts").doc();
    await quarantineRef.set({
      locationId,
      postId,
      authorId: postData.authorId,
      type: postData.type,
      quarantinedAt: FieldValue.serverTimestamp(),
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
    
  } catch (error) {
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
async function notifyModerators(
  locationId: string, 
  postId: string, 
  postData: any
): Promise<void> {
  try {
    const locationDoc = await db.collection("locations").doc(locationId).get();
    if (!locationDoc.exists) {
      logger.warn("Location not found for moderator notification", { locationId });
      return;
    }
    
    const locationData = locationDoc.data()!;
    const moderators = locationData.moderators || [];
    
    if (moderators.length === 0) {
      logger.info("No moderators found for location", { locationId });
      return;
    }
    
    // Create notifications for all moderators
    const batch = db.batch();
    
    moderators.forEach((moderatorId: string) => {
      const notificationRef = db.collection("notifications").doc();
      
      batch.set(notificationRef, {
        userId: moderatorId,
        title: "Post Quarantined - Action Required",
        message: `A post at ${locationData.name} has been quarantined due to excessive reports.`,
        type: "warning",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
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
    
  } catch (error) {
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
export const reviewReportedPost = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(reviewReportedPostSchema, req.body);
    const { reportId, action, moderatorNotes } = validatedData;

    logger.info("Post review action", {
      reportId,
      action,
      requestId
    });

    // TODO: Implement post review
    // - Validate moderator permissions
    // - Get report details
    // - Update report status
    // - Take action on the post
    // - Create audit log

    const reportDoc = await db.collection("moderationReports").doc(reportId).get();
    if (!reportDoc.exists) {
      throw new Error("Report not found");
    }

    const reportData = reportDoc.data()!;
    const { locationId, postId } = reportData;

    // Update report status
    await db.collection("moderationReports").doc(reportId).update({
      status: "reviewed",
      reviewedAt: FieldValue.serverTimestamp(),
      action,
      notes: moderatorNotes || "",
      updatedAt: FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: "Post review completed successfully",
      data: { action },
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('Post review error:', error, { requestId });
    res.status(500).json({ 
      error: 'Failed to review post',
      requestId
    });
  }
}));

/**
 * Take moderator action on a post
 * @param locationId Location ID
 * @param postId Post ID
 * @param action Action to take
 * @param moderatorId Moderator ID
 * @param notes Additional notes
 */
async function takeModeratorAction(
  locationId: string,
  postId: string,
  action: string,
  moderatorId: string,
  notes?: string
): Promise<void> {
  try {
    const postRef = db
      .collection("locations")
      .doc(locationId)
      .collection("threads")
      .doc(postId);
    
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
      lastModeratedAt: FieldValue.serverTimestamp(),
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
      updateData.warnedAt = FieldValue.serverTimestamp();
      updateData.warnedBy = moderatorId;
      updateData.warningNotes = notes;
      break;
        
    case "quarantine": {
      // Quarantine the post
      const quarantineUntil = new Date();
      quarantineUntil.setHours(quarantineUntil.getHours() + QUARANTINE_DURATION_HOURS);
        
      updateData.quarantined = true;
      updateData.quarantinedAt = FieldValue.serverTimestamp();
      updateData.quarantinedUntil = quarantineUntil;
      updateData.quarantineReason = notes || "Moderator decision";
      break;
    }
        
    case "delete":
      // Mark for deletion (actual deletion handled by cleanup function)
      updateData.deleted = true;
      updateData.deletedAt = FieldValue.serverTimestamp();
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
    
  } catch (error) {
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
export async function getLocationModerationStats(locationId: string): Promise<{
  totalPosts: number;
  reportedPosts: number;
  quarantinedPosts: number;
  deletedPosts: number;
  pendingReports: number;
}> {
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
    
  } catch (error) {
    logger.error("Error getting location moderation stats", { 
      locationId, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

/**
 * Clean up expired quarantines
 * Scheduled function to automatically unquarantine posts
 */
export const cleanupExpiredQuarantines = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(cleanupExpiredQuarantinesSchema, req.body);
    const { dryRun } = validatedData;

    logger.info("Starting cleanup of expired quarantines", {
      dryRun,
      requestId
    });

    // TODO: Implement expired quarantines cleanup
    // - Find all quarantined posts that have expired
    // - Update post status to unquarantined
    // - Update quarantine records
    // - Log cleanup results

    const now = new Date();
    
    // Find all quarantined posts that have expired
    const expiredQuarantinesSnapshot = await db
      .collection("quarantinedPosts")
      .where("quarantinedUntil", "<", now)
      .where("status", "==", "quarantined")
      .get();
    
    if (expiredQuarantinesSnapshot.empty) {
      logger.info("No expired quarantines found", { requestId });
      res.status(200).json({
        success: true,
        message: "No expired quarantines found",
        data: { processedCount: 0 },
        requestId
      });
      return;
    }

    const processedCount = expiredQuarantinesSnapshot.docs.length;

    res.status(200).json({
      success: true,
      message: `Processed ${processedCount} expired quarantines`,
      data: { processedCount },
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('Cleanup expired quarantines error:', error, { requestId });
    res.status(500).json({ 
      error: 'Failed to cleanup expired quarantines',
      requestId
    });
  }
}));
