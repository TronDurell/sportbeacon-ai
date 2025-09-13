import { logger } from "firebase-functions";

/**
 * Mock push notification service for testing
 * In production, this would integrate with FCM or similar service
 */

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
}

export async function sendPushNotification(
  userId: string,
  notification: PushNotification
): Promise<boolean> {
  try {
    logger.info("Sending push notification", {
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
      logger.info("Mock push notification sent", { userId, notification });
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
  } catch (error) {
    logger.error("Failed to send push notification", {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

export async function sendBatchedPushNotification(
  notifications: Array<{ userId: string; notification: PushNotification }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const { userId, notification } of notifications) {
    const result = await sendPushNotification(userId, notification);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

export async function getUserFCMTokens(userId: string): Promise<string[]> {
  // Mock implementation - in production this would query Firestore
  // for the user's FCM tokens
  logger.info("Getting FCM tokens for user", { userId });
  return [`mock-token-${userId}`];
}

export async function cleanupInvalidTokens(
  userId: string,
  invalidTokens: string[]
): Promise<void> {
  // Mock implementation - in production this would remove
  // invalid tokens from the user's document in Firestore
  logger.info("Cleaning up invalid FCM tokens", { userId, invalidTokens });
}

