/**
 * Send Notification Tool
 * Send notification to user or group
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ToolResult, SendNotificationParams, AuthContext } from '../types.js';
import { hasResourceAccess } from '../auth.js';

const db = getFirestore();

// Validation schema
const SendNotificationSchema = z.object({
  target: z.object({
    userId: z.string().optional(),
    group: z.string().optional()
  }).refine(data => data.userId || data.group, {
    message: 'Either userId or group must be specified'
  }),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long')
});

/**
 * Send notification to user or group
 */
export async function sendNotification(
  params: any,
  auth: AuthContext
): Promise<ToolResult<{ delivered: boolean }>> {
  try {
    // Validate input parameters
    const validatedParams = SendNotificationSchema.parse(params);
    const { target, message } = validatedParams;

    // Check authorization
    if (!['coach', 'admin', 'agent-service'].includes(auth.role)) {
      return {
        ok: false,
        error: 'Insufficient permissions to send notifications'
      };
    }

    let delivered = false;
    const notificationIds: string[] = [];

    if (target.userId) {
      // Send to specific user
      const result = await sendToUser(target.userId, message, auth);
      delivered = result.delivered;
      if (result.notificationId) {
        notificationIds.push(result.notificationId);
      }
    } else if (target.group) {
      // Send to group
      const result = await sendToGroup(target.group, message, auth);
      delivered = result.delivered;
      notificationIds.push(...result.notificationIds);
    }

    // Log notification for audit
    await logNotification({
      sentBy: auth.uid,
      sentByRole: auth.role,
      target,
      message,
      delivered,
      notificationIds,
      timestamp: new Date()
    });

    return {
      ok: true,
      data: { delivered }
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }

    console.error('Error in sendNotification:', error);
    return {
      ok: false,
      error: 'Failed to send notification'
    };
  }
}

/**
 * Send notification to a specific user
 */
async function sendToUser(userId: string, message: string, auth: AuthContext): Promise<{ delivered: boolean; notificationId?: string }> {
  try {
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return { delivered: false };
    }

    const userData = userDoc.data()!;

    // Check authorization for sending to this user
    if (auth.role === 'coach' && !hasResourceAccess(auth, 'team', userData.teamId)) {
      throw new Error('Insufficient permissions to send notification to this user');
    }

    // Create notification document
    const notificationData = {
      userId,
      message,
      type: 'system',
      priority: 'normal',
      sentBy: auth.uid,
      sentByRole: auth.role,
      sentAt: FieldValue.serverTimestamp(),
      read: false,
      readAt: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    const notificationRef = await db.collection('notifications').add(notificationData);

    // Update user's notification count
    await db.collection('users').doc(userId).update({
      unreadNotifications: FieldValue.increment(1),
      lastNotificationAt: FieldValue.serverTimestamp()
    });

    // In a real implementation, you would also:
    // 1. Send push notification via FCM
    // 2. Send email notification
    // 3. Send SMS if configured
    // 4. Update user's notification preferences

    console.log(`Notification sent to user ${userId}: ${message}`);

    return { delivered: true, notificationId: notificationRef.id };

  } catch (error) {
    console.error('Error sending notification to user:', error);
    return { delivered: false };
  }
}

/**
 * Send notification to a group
 */
async function sendToGroup(group: string, message: string, auth: AuthContext): Promise<{ delivered: boolean; notificationIds: string[] }> {
  const notificationIds: string[] = [];
  let delivered = false;

  try {
    let userIds: string[] = [];

    if (group.startsWith('coach_')) {
      // Send to coaches of a specific team
      const teamId = group.replace('coach_', '');
      
      if (auth.role === 'coach' && !hasResourceAccess(auth, 'team', teamId)) {
        throw new Error('Insufficient permissions to send notification to this team');
      }

      const coachesSnapshot = await db
        .collection('users')
        .where('teamId', '==', teamId)
        .where('role', '==', 'coach')
        .get();

      userIds = coachesSnapshot.docs.map(doc => doc.id);

    } else if (group.startsWith('team_')) {
      // Send to all members of a team
      const teamId = group.replace('team_', '');
      
      if (auth.role === 'coach' && !hasResourceAccess(auth, 'team', teamId)) {
        throw new Error('Insufficient permissions to send notification to this team');
      }

      const teamMembersSnapshot = await db
        .collection('users')
        .where('teamId', '==', teamId)
        .get();

      userIds = teamMembersSnapshot.docs.map(doc => doc.id);

    } else if (group === 'all_admins') {
      // Send to all admins
      if (auth.role !== 'admin' && auth.role !== 'agent-service') {
        throw new Error('Only admins can send notifications to all admins');
      }

      const adminsSnapshot = await db
        .collection('users')
        .where('isAdmin', '==', true)
        .get();

      userIds = adminsSnapshot.docs.map(doc => doc.id);

    } else {
      throw new Error(`Unknown group: ${group}`);
    }

    // Send notification to each user
    for (const userId of userIds) {
      const result = await sendToUser(userId, message, auth);
      if (result.delivered && result.notificationId) {
        notificationIds.push(result.notificationId);
        delivered = true;
      }
    }

    console.log(`Notification sent to group ${group} (${userIds.length} users): ${message}`);

  } catch (error) {
    console.error('Error sending notification to group:', error);
  }

  return { delivered, notificationIds };
}

/**
 * Log notification for audit purposes
 */
async function logNotification(notificationLog: {
  sentBy: string;
  sentByRole: string;
  target: any;
  message: string;
  delivered: boolean;
  notificationIds: string[];
  timestamp: Date;
}): Promise<void> {
  try {
    await db.collection('notification_logs').add({
      ...notificationLog,
      messageHash: hashMessage(notificationLog.message) // Don't store full message for privacy
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

/**
 * Hash message for privacy in logs
 */
function hashMessage(message: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(message).digest('hex').substring(0, 16);
}

/**
 * Get notification delivery status
 */
export async function getNotificationStatus(notificationId: string, auth: AuthContext): Promise<ToolResult<{ status: string; read: boolean; readAt?: string }>> {
  try {
    const notificationDoc = await db.collection('notifications').doc(notificationId).get();
    
    if (!notificationDoc.exists) {
      return {
        ok: false,
        error: 'Notification not found'
      };
    }

    const notificationData = notificationDoc.data()!;

    // Check authorization
    if (auth.uid !== notificationData.userId && auth.role !== 'admin' && auth.role !== 'agent-service') {
      return {
        ok: false,
        error: 'Insufficient permissions to view this notification'
      };
    }

    return {
      ok: true,
      data: {
        status: notificationData.read ? 'read' : 'unread',
        read: notificationData.read,
        readAt: notificationData.readAt?.toDate().toISOString()
      }
    };

  } catch (error) {
    console.error('Error getting notification status:', error);
    return {
      ok: false,
      error: 'Failed to get notification status'
    };
  }
}
