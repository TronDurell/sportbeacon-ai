import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Types
interface TownRecRequest {
  type: 'WAITLIST' | 'AGE_OVERRIDE' | 'SIBLING_PAIRING';
  childId: string;
  leagueId: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  adminNote?: string;
  timestamp: FirebaseFirestore.Timestamp;
}

interface TownRecPolicy {
  minAge: number;
  maxAge: number;
  autoAcceptSiblings: boolean;
  waitlistAutoFill: boolean;
  overrideEmailTo?: string;
}

// Helper: log to audit trail
const logAudit = async (action: string, data: any) => {
  await admin.firestore().collection('admin').doc('auditTrail').collection('logs').add({
    action,
    data,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Trigger: When a new age override request is created
 * Updates user's rec history and sends notifications
 */
export const onAgeOverrideCreated = functions.firestore
  .document('ageOverrides/{overrideId}')
  .onCreate(async (snap, context) => {
    try {
      const overrideData = snap.data();
      const overrideId = context.params.overrideId;


      // Add to user's rec history
      await db.collection('users').doc(overrideData.requestedBy).collection('recHistory').doc(overrideId).set({
        type: 'age_override_requested',
        description: `Age override requested for ${overrideData.childName}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
          childName: overrideData.childName,
          requestedLeague: overrideData.requestedLeague,
          reason: overrideData.reason,
          status: overrideData.status
        },
        relatedDocument: `ageOverrides/${overrideId}`
      });

      // Send notification to director if manual approval required
      if (overrideData.status === 'pending') {
        await sendDirectorNotification({
          type: 'age_override_pending',
          title: 'Age Override Requires Approval',
          description: `Age override request for ${overrideData.childName} requires director approval`,
          priority: 'medium',
          data: {
            overrideId,
            childName: overrideData.childName,
            requestedLeague: overrideData.requestedLeague,
            reason: overrideData.reason
          }
        });
      }

      // Update analytics
      await updateAnalytics('ageOverrides', 'created', 1);

    } catch (error) {
      throw error;
    }
  });

/**
 * Trigger: When an age override is updated
 * Updates user's rec history and sends notifications
 */
export const onAgeOverrideUpdated = functions.firestore
  .document('ageOverrides/{overrideId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const overrideId = context.params.overrideId;


      // Only process if status changed
      if (beforeData.status !== afterData.status) {
        // Update user's rec history
        await db.collection('users').doc(afterData.requestedBy).collection('recHistory').doc(overrideId).update({
          type: `age_override_${afterData.status}`,
          description: `Age override ${afterData.status} for ${afterData.childName}`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: {
            ...afterData,
            previousStatus: beforeData.status,
            directorNotes: afterData.directorNotes
          }
        });

        // Send notification to parent
        await sendParentNotification({
          recipient: afterData.parentEmail,
          type: 'age_override_processed',
          title: `Age Override ${afterData.status.charAt(0).toUpperCase() + afterData.status.slice(1)}`,
          description: `Your age override request for ${afterData.childName} has been ${afterData.status}`,
          data: {
            childName: afterData.childName,
            status: afterData.status,
            directorNotes: afterData.directorNotes
          }
        });

        // If approved, check for waitlist promotion
        if (afterData.status === 'approved') {
          await checkWaitlistPromotion(afterData.childName, afterData.requestedLeague);
        }
      }

    } catch (error) {
      throw error;
    }
  });

/**
 * Trigger: When a new waitlist entry is created
 * Updates user's rec history and checks for auto-promotion
 */
export const onWaitlistEntryCreated = functions.firestore
  .document('waitlists/{entryId}')
  .onCreate(async (snap, context) => {
    try {
      const waitlistData = snap.data();
      const entryId = context.params.entryId;


      // Add to user's rec history
      await db.collection('users').doc(waitlistData.parentEmail).collection('recHistory').doc(entryId).set({
        type: 'waitlist_entry_created',
        description: `${waitlistData.childName} added to waitlist for ${waitlistData.league}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
          childName: waitlistData.childName,
          league: waitlistData.league,
          position: waitlistData.waitlistPosition,
          priority: waitlistData.priority
        },
        relatedDocument: `waitlists/${entryId}`
      });

      // Update league capacity
      await updateLeagueCapacity(waitlistData.league, 'waitlist', 1);

      // Check for auto-promotion
      await checkAutoPromotion(waitlistData.league);

      // Update analytics
      await updateAnalytics('waitlists', 'created', 1);

    } catch (error) {
      throw error;
    }
  });

/**
 * Trigger: When a waitlist entry is updated
 * Updates user's rec history and handles promotions
 */
export const onWaitlistEntryUpdated = functions.firestore
  .document('waitlists/{entryId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const entryId = context.params.entryId;


      // Handle status changes
      if (beforeData.status !== afterData.status) {
        // Update user's rec history
        await db.collection('users').doc(afterData.parentEmail).collection('recHistory').doc(entryId).update({
          type: `waitlist_${afterData.status}`,
          description: `${afterData.childName} ${afterData.status} from waitlist`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: {
            childName: afterData.childName,
            league: afterData.league,
            previousStatus: beforeData.status,
            newStatus: afterData.status
          }
        });

        // Handle promotion
        if (afterData.status === 'promoted') {
          // Create registration
          await createRegistrationFromWaitlist(afterData);
          
          // Update league capacity
          await updateLeagueCapacity(afterData.league, 'registration', 1);
          await updateLeagueCapacity(afterData.league, 'waitlist', -1);

          // Send notification to parent
          await sendParentNotification({
            recipient: afterData.parentEmail,
            type: 'waitlist_promoted',
            title: 'Spot Available - You\'ve Been Promoted!',
            description: `${afterData.childName} has been promoted from the waitlist for ${afterData.league}`,
            data: {
              childName: afterData.childName,
              league: afterData.league,
              team: afterData.team
            }
          });

          // Reorder remaining waitlist
          await reorderWaitlist(afterData.league);
        }

        // Handle declined promotion
        if (afterData.status === 'declined') {
          await updateLeagueCapacity(afterData.league, 'waitlist', -1);
          await reorderWaitlist(afterData.league);
        }
      }

    } catch (error) {
      throw error;
    }
  });

/**
 * Trigger: When a waitlist entry is deleted
 * Updates user's rec history and league capacity
 */
export const onWaitlistEntryDeleted = functions.firestore
  .document('waitlists/{entryId}')
  .onDelete(async (snap, context) => {
    try {
      const waitlistData = snap.data();
      const entryId = context.params.entryId;


      // Update user's rec history
      await db.collection('users').doc(waitlistData.parentEmail).collection('recHistory').doc(entryId).set({
        type: 'waitlist_entry_removed',
        description: `${waitlistData.childName} removed from waitlist for ${waitlistData.league}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
          childName: waitlistData.childName,
          league: waitlistData.league,
          reason: 'manual_removal'
        }
      });

      // Update league capacity
      await updateLeagueCapacity(waitlistData.league, 'waitlist', -1);

      // Reorder remaining waitlist
      await reorderWaitlist(waitlistData.league);

    } catch (error) {
      throw error;
    }
  });

/**
 * Trigger: When a sibling pairing is created
 * Updates user's rec history and checks for conflicts
 */
export const onSiblingPairingCreated = functions.firestore
  .document('siblingPairings/{pairingId}')
  .onCreate(async (snap, context) => {
    try {
      const pairingData = snap.data();
      const pairingId = context.params.pairingId;


      // Add to user's rec history
      await db.collection('users').doc(pairingData.parentEmail).collection('recHistory').doc(pairingId).set({
        type: 'sibling_pairing_created',
        description: `Sibling pairing request for ${pairingData.children.length} children`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
          children: pairingData.children.map((child: any) => child.name),
          requestedLeague: pairingData.requestedLeague,
          status: pairingData.status
        },
        relatedDocument: `siblingPairings/${pairingId}`
      });

      // Check for conflicts
      if (pairingData.status === 'conflict') {
        await sendDirectorNotification({
          type: 'sibling_pairing_conflict',
          title: 'Sibling Pairing Conflict Detected',
          description: `Sibling pairing for ${pairingData.parentName} has conflicts requiring manual review`,
          priority: 'high',
          data: {
            pairingId,
            parentName: pairingData.parentName,
            conflicts: pairingData.conflicts
          }
        });
      }

      // Update analytics
      await updateAnalytics('siblingPairings', 'created', 1);

    } catch (error) {
      throw error;
    }
  });

/**
 * Trigger: When a sibling pairing is updated
 * Updates user's rec history and handles resolutions
 */
export const onSiblingPairingUpdated = functions.firestore
  .document('siblingPairings/{pairingId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const pairingId = context.params.pairingId;


      // Only process if status changed
      if (beforeData.status !== afterData.status) {
        // Update user's rec history
        await db.collection('users').doc(afterData.parentEmail).collection('recHistory').doc(pairingId).update({
          type: `sibling_pairing_${afterData.status}`,
          description: `Sibling pairing ${afterData.status} for ${afterData.children.length} children`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: {
            children: afterData.children.map((child: any) => child.name),
            previousStatus: beforeData.status,
            newStatus: afterData.status,
            resolvedBy: afterData.resolvedBy,
            notes: afterData.notes
          }
        });

        // Handle successful pairing
        if (afterData.status === 'paired') {
          // Send notification to parent
          await sendParentNotification({
            recipient: afterData.parentEmail,
            type: 'sibling_pairing_confirmed',
            title: 'Sibling Pairing Confirmed',
            description: `Your children have been successfully paired in the same team`,
            data: {
              children: afterData.children.map((child: any) => child.name),
              team: afterData.children[0]?.team
            }
          });
        }

        // Handle manual review
        if (afterData.status === 'manual_review') {
          await sendDirectorNotification({
            type: 'sibling_pairing_review',
            title: 'Sibling Pairing Requires Manual Review',
            description: `Sibling pairing for ${afterData.parentName} requires manual review`,
            priority: 'medium',
            data: {
              pairingId,
              parentName: afterData.parentName,
              conflicts: afterData.conflicts
            }
          });
        }
      }

    } catch (error) {
      throw error;
    }
  });

/**
 * Trigger: When a registration is created
 * Updates user's rec history and checks for sibling pairing
 */
export const onRegistrationCreated = functions.firestore
  .document('registrations/{registrationId}')
  .onCreate(async (snap, context) => {
    try {
      const registrationData = snap.data();
      const registrationId = context.params.registrationId;


      // Add to user's rec history
      await db.collection('users').doc(registrationData.parentEmail).collection('recHistory').doc(registrationId).set({
        type: 'registration_created',
        description: `${registrationData.childName} registered for ${registrationData.league}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
          childName: registrationData.childName,
          league: registrationData.league,
          team: registrationData.team,
          ageOverride: registrationData.ageOverride
        },
        relatedDocument: `registrations/${registrationId}`
      });

      // Update league capacity
      await updateLeagueCapacity(registrationData.league, 'registration', 1);

      // Check for sibling pairing opportunities
      await checkSiblingPairing(registrationData);

      // Update analytics
      await updateAnalytics('registrations', 'created', 1);

    } catch (error) {
      throw error;
    }
  });

// Helper functions

/**
 * Send notification to director
 */
async function sendDirectorNotification(notification: {
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
}) {
  try {
    await db.collection('notifications').add({
      ...notification,
      recipient: 'rec.director@cary.gov', // TODO: Get from config
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      category: 'admin'
    });
  } catch (error) {
    }
}

/**
 * Send notification to parent
 */
async function sendParentNotification(notification: {
  recipient: string;
  type: string;
  title: string;
  description: string;
  data: any;
}) {
  try {
    await db.collection('notifications').add({
      ...notification,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      category: 'parent'
    });
  } catch (error) {
    }
}

/**
 * Update league capacity
 */
async function updateLeagueCapacity(leagueId: string, field: 'registration' | 'waitlist', change: number) {
  try {
    const leagueRef = db.collection('leagueCapacities').doc(leagueId);
    const updateData: any = {};
    
    if (field === 'registration') {
      updateData.currentRegistrations = admin.firestore.FieldValue.increment(change);
    } else {
      updateData.waitlistCount = admin.firestore.FieldValue.increment(change);
    }

    await leagueRef.update(updateData);
  } catch (error) {
    }
}

/**
 * Check for auto-promotion opportunities
 */
async function checkAutoPromotion(leagueId: string) {
  try {
    const leagueRef = db.collection('leagueCapacities').doc(leagueId);
    const leagueSnap = await leagueRef.get();
    
    if (!leagueSnap.exists) return;

    const leagueData = leagueSnap.data();
    const availableSpots = leagueData!.maxCapacity - leagueData!.currentRegistrations;
    
    if (availableSpots > 0) {
      // Get next waitlist entry
      const waitlistQuery = db.collection('waitlists')
        .where('league', '==', leagueId)
        .where('status', '==', 'waiting')
        .orderBy('priority', 'desc')
        .orderBy('waitlistPosition', 'asc')
        .limit(availableSpots);

      const waitlistSnap = await waitlistQuery.get();
      
      for (const doc of waitlistSnap.docs) {
        await doc.ref.update({
          status: 'promoted',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    }
}

/**
 * Check for waitlist promotion after age override approval
 */
async function checkWaitlistPromotion(childName: string, league: string) {
  try {
    const waitlistQuery = db.collection('waitlists')
      .where('childName', '==', childName)
      .where('league', '==', league)
      .where('status', '==', 'waiting');

    const waitlistSnap = await waitlistQuery.get();
    
    if (!waitlistSnap.empty) {
      const entry = waitlistSnap.docs[0];
      await entry.ref.update({
        status: 'promoted',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    }
}

/**
 * Create registration from waitlist entry
 */
async function createRegistrationFromWaitlist(waitlistData: any) {
  try {
    await db.collection('registrations').add({
      childName: waitlistData.childName,
      parentName: waitlistData.parentName,
      parentEmail: waitlistData.parentEmail,
      league: waitlistData.league,
      registrationDate: admin.firestore.FieldValue.serverTimestamp(),
      waitlistPromoted: true,
      originalWaitlistId: waitlistData.id,
      status: 'active'
    });
  } catch (error) {
    }
}

/**
 * Reorder waitlist after changes
 */
async function reorderWaitlist(leagueId: string) {
  try {
    const waitlistQuery = db.collection('waitlists')
      .where('league', '==', leagueId)
      .where('status', 'in', ['waiting', 'notified'])
      .orderBy('priority', 'desc')
      .orderBy('waitlistPosition', 'asc');

    const waitlistSnap = await waitlistQuery.get();
    const batch = db.batch();

    waitlistSnap.docs.forEach((doc, index) => {
      batch.update(doc.ref, {
        waitlistPosition: index + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  } catch (error) {
    }
}

/**
 * Check for sibling pairing opportunities
 */
async function checkSiblingPairing(registrationData: any) {
  try {
    // Check if parent has other children registered
    const siblingQuery = db.collection('registrations')
      .where('parentEmail', '==', registrationData.parentEmail)
      .where('league', '==', registrationData.league);

    const siblingSnap = await siblingQuery.get();
    
    if (siblingSnap.size > 1) {
      // Create or update sibling pairing
      const existingPairingQuery = db.collection('siblingPairings')
        .where('parentEmail', '==', registrationData.parentEmail)
        .where('status', 'in', ['pending', 'paired']);

      const existingPairingSnap = await existingPairingQuery.get();
      
      if (existingPairingSnap.empty) {
        // Create new pairing
        const children = siblingSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().childName,
          league: doc.data().league,
          team: doc.data().team
        }));

        await db.collection('siblingPairings').add({
          familyId: `family_${Date.now()}`,
          parentName: registrationData.parentName,
          parentEmail: registrationData.parentEmail,
          children,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    }
}

/**
 * Update analytics
 */
async function updateAnalytics(category: string, action: string, count: number) {
  try {
    const analyticsRef = db.collection('analytics').doc('townRec');
    await analyticsRef.update({
      [`${category}.${action}`]: admin.firestore.FieldValue.increment(count),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    }
}

// Export all triggers
export const townRecTriggers = {
  onAgeOverrideCreated,
  onAgeOverrideUpdated,
  onWaitlistEntryCreated,
  onWaitlistEntryUpdated,
  onWaitlistEntryDeleted,
  onSiblingPairingCreated,
  onSiblingPairingUpdated,
  onRegistrationCreated
}; 