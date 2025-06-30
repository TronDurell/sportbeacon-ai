import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { analytics } from '../../lib/ai/shared/analytics';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

interface UserSession {
  uid: string;
  avgScore: number;
  totalShots: number;
  drillType: string;
  date: admin.firestore.Timestamp;
  feedback: string[];
}

interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  fcmToken?: string;
  preferences?: {
    notifications: boolean;
    coachTips: boolean;
    inactivityAlerts: boolean;
  };
  lastActive: admin.firestore.Timestamp;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface CoachTip {
  id: string;
  category: 'accuracy' | 'consistency' | 'speed' | 'fundamentals' | 'motivation';
  title: string;
  message: string;
  drillSuggestion?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  conditions: {
    minScore?: number;
    maxScore?: number;
    inactivityDays?: number;
    skillLevel?: string[];
  };
}

/**
 * Scheduled function that runs every 24 hours to check for inactive users
 * and send personalized coach notifications
 */
export const checkInactiveUsers = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      console.log('Starting inactive user check...');
      
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Get users who haven't been active in 3+ days
      const usersRef = db.collection('users');
      const inactiveUsersQuery = usersRef
        .where('lastActive', '<', admin.firestore.Timestamp.fromDate(threeDaysAgo))
        .where('preferences.notifications', '==', true)
        .where('preferences.inactivityAlerts', '==', true);

      const inactiveUsersSnapshot = await inactiveUsersQuery.get();
      
      console.log(`Found ${inactiveUsersSnapshot.size} inactive users`);

      const notificationPromises = inactiveUsersSnapshot.docs.map(async (userDoc) => {
        const userProfile = userDoc.data() as UserProfile;
        
        if (!userProfile.fcmToken) {
          console.log(`No FCM token for user ${userProfile.uid}`);
          return;
        }

        try {
          // Get user's last performance data
          const lastSession = await getLastUserSession(userProfile.uid);
          
          // Generate personalized coach tip
          const coachTip = await generatePersonalizedTip(userProfile, lastSession);
          
          // Send push notification
          await sendCoachNotification(userProfile, coachTip);
          
          // Track analytics
          await analytics.track('coach_notification_sent', {
            userId: userProfile.uid,
            tipCategory: coachTip.category,
            inactivityDays: Math.floor((Date.now() - userProfile.lastActive.toMillis()) / (1000 * 60 * 60 * 24)),
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error(`Failed to process notification for user ${userProfile.uid}:`, error);
        }
      });

      await Promise.all(notificationPromises);
      console.log('Completed inactive user check');

    } catch (error) {
      console.error('Error in checkInactiveUsers:', error);
      throw error;
    }
  });

/**
 * Get user's last training session
 */
async function getLastUserSession(uid: string): Promise<UserSession | null> {
  try {
    const sessionsRef = db.collection('range_sessions');
    const lastSessionQuery = sessionsRef
      .where('uid', '==', uid)
      .orderBy('date', 'desc')
      .limit(1);

    const lastSessionSnapshot = await lastSessionQuery.get();
    
    if (lastSessionSnapshot.empty) {
      return null;
    }

    const sessionDoc = lastSessionSnapshot.docs[0];
    return sessionDoc.data() as UserSession;
  } catch (error) {
    console.error('Failed to get last user session:', error);
    return null;
  }
}

/**
 * Generate personalized coach tip based on user profile and last session
 */
async function generatePersonalizedTip(userProfile: UserProfile, lastSession: UserSession | null): Promise<CoachTip> {
  // Define coach tips based on different scenarios
  const coachTips: CoachTip[] = [
    {
      id: 'accuracy_focus',
      category: 'accuracy',
      title: 'Focus on Accuracy',
      message: 'Coach says: Your last session showed some inconsistency. Try focusing on sight alignment and trigger control. Retry the 5x5 precision drill today?',
      drillSuggestion: '5x5 Precision Drill',
      difficulty: 'intermediate',
      conditions: {
        maxScore: 80,
        skillLevel: ['beginner', 'intermediate']
      }
    },
    {
      id: 'consistency_build',
      category: 'consistency',
      title: 'Build Consistency',
      message: 'Coach says: Great accuracy, but let\'s work on consistency. Practice the same drill multiple times to build muscle memory.',
      drillSuggestion: 'Controlled Pair Drill',
      difficulty: 'intermediate',
      conditions: {
        minScore: 85,
        maxScore: 95,
        skillLevel: ['intermediate', 'advanced']
      }
    },
    {
      id: 'speed_improvement',
      category: 'speed',
      title: 'Improve Speed',
      message: 'Coach says: Your accuracy is solid! Now let\'s work on speed. Try the draw and fire drill to improve reaction time.',
      drillSuggestion: 'Draw & Fire 1',
      difficulty: 'advanced',
      conditions: {
        minScore: 90,
        skillLevel: ['advanced']
      }
    },
    {
      id: 'fundamentals_refresh',
      category: 'fundamentals',
      title: 'Refresh Fundamentals',
      message: 'Coach says: Let\'s go back to basics. Focus on proper grip, stance, and breathing. Try the slow fire practice drill.',
      drillSuggestion: 'Slow Fire Practice',
      difficulty: 'beginner',
      conditions: {
        maxScore: 70,
        skillLevel: ['beginner']
      }
    },
    {
      id: 'motivation_boost',
      category: 'motivation',
      title: 'Stay Motivated',
      message: 'Coach says: Consistency is key to improvement! Even 15 minutes of focused practice can make a difference. Ready for today\'s session?',
      drillSuggestion: 'Quick 5x5',
      difficulty: 'beginner',
      conditions: {
        inactivityDays: 3,
        skillLevel: ['beginner', 'intermediate', 'advanced']
      }
    },
    {
      id: 'advanced_challenge',
      category: 'accuracy',
      title: 'Advanced Challenge',
      message: 'Coach says: You\'re ready for a challenge! Try the moving target drill to test your skills under pressure.',
      drillSuggestion: 'Moving Target Drill',
      difficulty: 'advanced',
      conditions: {
        minScore: 95,
        skillLevel: ['advanced']
      }
    }
  ];

  // Filter tips based on user's situation
  const applicableTips = coachTips.filter(tip => {
    // Check inactivity days
    if (tip.conditions.inactivityDays) {
      const inactivityDays = Math.floor((Date.now() - userProfile.lastActive.toMillis()) / (1000 * 60 * 60 * 24));
      if (inactivityDays < tip.conditions.inactivityDays) {
        return false;
      }
    }

    // Check skill level
    if (tip.conditions.skillLevel && !tip.conditions.skillLevel.includes(userProfile.skillLevel)) {
      return false;
    }

    // Check score conditions
    if (lastSession) {
      if (tip.conditions.minScore && lastSession.avgScore < tip.conditions.minScore) {
        return false;
      }
      if (tip.conditions.maxScore && lastSession.avgScore > tip.conditions.maxScore) {
        return false;
      }
    }

    return true;
  });

  // Select the most appropriate tip
  if (applicableTips.length > 0) {
    // Prioritize based on user's situation
    const inactivityDays = Math.floor((Date.now() - userProfile.lastActive.toMillis()) / (1000 * 60 * 60 * 24));
    
    if (inactivityDays > 7) {
      // Long inactivity - prioritize motivation
      const motivationTip = applicableTips.find(tip => tip.category === 'motivation');
      if (motivationTip) return motivationTip;
    }

    if (lastSession && lastSession.avgScore < 70) {
      // Low performance - prioritize fundamentals
      const fundamentalsTip = applicableTips.find(tip => tip.category === 'fundamentals');
      if (fundamentalsTip) return fundamentalsTip;
    }

    // Return first applicable tip
    return applicableTips[0];
  }

  // Default tip if no specific conditions match
  return {
    id: 'default_encouragement',
    category: 'motivation',
    title: 'Keep Training',
    message: 'Coach says: Every session counts! Ready to improve your skills today?',
    drillSuggestion: '5x5 Precision Drill',
    difficulty: 'intermediate',
    conditions: {}
  };
}

/**
 * Send coach notification to user
 */
async function sendCoachNotification(userProfile: UserProfile, coachTip: CoachTip): Promise<void> {
  try {
    const message = {
      token: userProfile.fcmToken!,
      notification: {
        title: coachTip.title,
        body: coachTip.message
      },
      data: {
        type: 'coach_tip',
        tipId: coachTip.id,
        category: coachTip.category,
        drillSuggestion: coachTip.drillSuggestion || '',
        difficulty: coachTip.difficulty,
        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        notification: {
          channelId: 'coach_tips',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            category: 'coach_tip'
          }
        }
      }
    };

    const response = await messaging.send(message);
    console.log(`Successfully sent notification to user ${userProfile.uid}:`, response);

    // Log notification to Firestore
    await db.collection('users').doc(userProfile.uid).collection('notifications').add({
      type: 'coach_tip',
      title: coachTip.title,
      message: coachTip.message,
      tipId: coachTip.id,
      category: coachTip.category,
      drillSuggestion: coachTip.drillSuggestion,
      difficulty: coachTip.difficulty,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });

  } catch (error) {
    console.error(`Failed to send notification to user ${userProfile.uid}:`, error);
    
    // If FCM token is invalid, remove it
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      await db.collection('users').doc(userProfile.uid).update({
        fcmToken: admin.firestore.FieldValue.delete()
      });
    }
  }
}

/**
 * HTTP function to manually trigger coach notifications (for testing)
 */
export const triggerCoachNotifications = functions.https.onRequest(async (req, res) => {
  try {
    // Verify admin access
    if (req.headers.authorization !== `Bearer ${functions.config().admin.key}`) {
      res.status(403).send('Unauthorized');
      return;
    }

    const { uid } = req.query;
    
    if (uid) {
      // Send notification to specific user
      const userDoc = await db.collection('users').doc(uid as string).get();
      if (!userDoc.exists) {
        res.status(404).send('User not found');
        return;
      }

      const userProfile = userDoc.data() as UserProfile;
      const lastSession = await getLastUserSession(uid as string);
      const coachTip = await generatePersonalizedTip(userProfile, lastSession);
      
      if (userProfile.fcmToken) {
        await sendCoachNotification(userProfile, coachTip);
        res.json({ success: true, message: 'Notification sent', tip: coachTip });
      } else {
        res.status(400).send('User has no FCM token');
      }
    } else {
      // Send notifications to all inactive users
      await checkInactiveUsers();
      res.json({ success: true, message: 'Inactive user check completed' });
    }

  } catch (error) {
    console.error('Error in triggerCoachNotifications:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * Function to update user's last active timestamp
 */
export const updateUserActivity = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const uid = context.auth.uid;
    
    await db.collection('users').doc(uid).update({
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user activity:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update activity');
  }
});

/**
 * Function to get user's notification preferences
 */
export const getUserNotificationPreferences = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const uid = context.auth.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    return {
      notifications: userData?.preferences?.notifications ?? true,
      coachTips: userData?.preferences?.coachTips ?? true,
      inactivityAlerts: userData?.preferences?.inactivityAlerts ?? true
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get preferences');
  }
});

/**
 * Function to update user's notification preferences
 */
export const updateNotificationPreferences = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const uid = context.auth.uid;
    const { notifications, coachTips, inactivityAlerts } = data;

    await db.collection('users').doc(uid).update({
      'preferences.notifications': notifications,
      'preferences.coachTips': coachTips,
      'preferences.inactivityAlerts': inactivityAlerts
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update preferences');
  }
}); 