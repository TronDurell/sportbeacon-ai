import {onCall, onRequest} from "firebase-functions/v2/https";
// Removed unused import
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {AuthContext, isAuthContext, CallableContextV2} from "../types";

// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = getFirestore();

// Helper function to validate user authentication
const validateAuth = async (context: any): Promise<AuthContext> => {
  if (!context || !context.auth || !isAuthContext(context.auth)) {
    throw new Error("Unauthorized: User not authenticated");
  }
  return context.auth;
};

/**
 * Notification Function: Trigger Coach Notifications
 * Triggers notifications for coaches based on various events
 */
export const triggerCoachNotifications = onRequest(async (req, res) => {
  try {
    const {eventType, coachId, data} = req.body;

    logger.info("Coach notification trigger received", {
      eventType,
      coachId,
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
      data: {notificationId: notificationData.notificationId},
    });
  } catch (err) {
    logger.error("Coach notification trigger error", err);
    res.status(500).json({
      success: false,
      message: "Coach notification trigger failed",
      error: err,
    });
  }
});

/**
 * Notification Function: Update User Activity
 * Updates user activity and triggers relevant notifications
 */
export const updateUserActivity = onCall(async (data, context) => {
  const auth = await validateAuth(context);
  const {activityType, activityData} = data.data;

  logger.info("User activity update requested", {
    uid: auth.uid,
    activityType,
  });

  // TODO: Implement user activity tracking
  // - Store activity in database
  // - Check for notification triggers
  // - Update user metrics
  // - Send relevant notifications
  // - Log activity for analytics

  const activityRecord = {
    userId: auth.uid,
    activityType,
    activityData,
    timestamp: new Date(),
  };

  // Store activity
  await db.collection("userActivities").add(activityRecord);

  return {
    success: true,
    message: "User activity updated successfully",
  };
});

/**
 * Notification Function: Get User Notification Preferences
 * Retrieves notification preferences for authenticated users
 */
export const getUserNotificationPreferences = onCall(async (data, context) => {
  const auth = await validateAuth(context);

  logger.info("Notification preferences requested", {
    uid: auth.uid,
  });

  // TODO: Implement preferences retrieval
  // - Query user preferences from database
  // - Return formatted preferences
  // - Include default preferences if none set

  const preferencesDoc = await db.collection("userPreferences")
    .doc(auth.uid)
    .get();

  const preferences = preferencesDoc.exists ?
    preferencesDoc.data()?.notifications || {} :
    {
      email: true,
      push: true,
      sms: false,
      weeklyReports: true,
      coachUpdates: true,
    };

  return {
    success: true,
    message: "Notification preferences retrieved",
    data: {preferences},
  };
});

/**
 * Notification Function: Update Notification Preferences
 * Updates notification preferences for authenticated users
 */
export const updateNotificationPreferences = onCall(async (data, context) => {
  const auth = await validateAuth(context);
  const {preferences} = data.data;

  logger.info("Notification preferences update requested", {
    uid: auth.uid,
    preferences,
  });

  // TODO: Implement preferences update
  // - Validate preference settings
  // - Update user preferences in database
  // - Apply changes immediately
  // - Log preference changes

  await db.collection("userPreferences").doc(auth.uid).set({
    notifications: preferences,
    updatedAt: new Date(),
  }, {merge: true});

  return {
    success: true,
    message: "Notification preferences updated successfully",
  };
});

/**
 * Notification Function: Send Bulk Notifications
 * Sends notifications to multiple users
 */
export const sendBulkNotifications = onCall(async (data, context) => {
  const auth = await validateAuth(context);
  const {userIds, notificationType, content, priority} = data.data;

  logger.info("Bulk notification requested", {
    requestedBy: auth.uid,
    count: userIds?.length,
    type: notificationType,
  });

  // TODO: Implement bulk notification sending
  // - Validate user IDs and content
  // - Check user preferences
  // - Send notifications via appropriate channels
  // - Track delivery status
  // - Log bulk operation

  const bulkNotification = {
    bulkId: `bulk_${Date.now()}`,
    requestedBy: auth.uid,
    userIds,
    notificationType,
    content,
    priority,
    status: "processing",
    createdAt: new Date(),
  };

  // Store bulk notification request
  await db.collection("bulkNotifications").add(bulkNotification);

  return {
    success: true,
    message: "Bulk notification initiated",
    data: {bulkId: bulkNotification.bulkId},
  };
});

/**
 * Notification Function: Get Notification History
 * Retrieves notification history for authenticated users
 */
export const getNotificationHistory = onCall(async (data, context) => {
  const auth = await validateAuth(context);
  const {limit = 50, offset = 0, type} = data.data;

  logger.info("Notification history requested", {
    uid: auth.uid,
    limit,
    offset,
    type,
  });

  // TODO: Implement notification history retrieval
  // - Query user's notification history
  // - Apply filters and pagination
  // - Return formatted notification data
  // - Include read/unread status

  let query = db.collection("notifications")
    .where("recipient", "==", auth.uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .offset(offset);

  if (type) {
    query = query.where("type", "==", type);
  }

  const notificationsSnapshot = await query.get();

  const notifications = notificationsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    success: true,
    message: "Notification history retrieved",
    data: {notifications},
  };
});
