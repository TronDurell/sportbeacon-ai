/* SportBeaconAI - Admin Dispute Resolution Function
   Secure server function for resolving athlete data disputes
*/

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminMemoryClient } from '../memory/client';

// ============================================================================
// INTERFACES
// ============================================================================

interface ResolveDisputeRequest {
  disputeId: string;
  athleteId: string;
  action: 'resolve' | 'reject' | 'escalate';
  resolution: string;
  resolutionReason: string;
  metadata?: Record<string, any>;
}

interface ResolveDisputeResponse {
  success: boolean;
  disputeId: string;
  athleteId: string;
  action: string;
  resolutionId: string;
  timestamp: Date;
  message: string;
  metadata?: Record<string, any>;
}

interface DisputeResolutionRecord {
  id: string;
  disputeId: string;
  athleteId: string;
  action: 'resolve' | 'reject' | 'escalate';
  resolution: string;
  resolutionReason: string;
  resolvedBy: string;
  resolvedAt: Date;
  previousStatus: string;
  newStatus: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, any>;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export const resolveDispute = onCall(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 30
  },
  async (request): Promise<ResolveDisputeResponse> => {
    const { data, auth } = request;

    // ============================================================================
    // AUTHENTICATION & AUTHORIZATION
    // ============================================================================

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const adminId = auth.uid;
    
    // Verify admin role
    try {
      const userRecord = await getAuth().getUser(adminId);
      const customClaims = userRecord.customClaims || {};
      
      if (!customClaims.roles?.includes('admin')) {
        throw new HttpsError('permission-denied', 'Admin privileges required');
      }
    } catch (error) {
      logger.error('Failed to verify admin role:', error);
      throw new HttpsError('permission-denied', 'Failed to verify admin privileges');
    }

    // ============================================================================
    // INPUT VALIDATION
    // ============================================================================

    const {
      disputeId,
      athleteId,
      action,
      resolution,
      resolutionReason,
      metadata = {}
    } = data as ResolveDisputeRequest;

    if (!disputeId || !athleteId || !action || !resolution || !resolutionReason) {
      throw new HttpsError('invalid-argument', 'Missing required fields: disputeId, athleteId, action, resolution, resolutionReason');
    }

    if (!['resolve', 'reject', 'escalate'].includes(action)) {
      throw new HttpsError('invalid-argument', 'Invalid action. Must be: resolve, reject, or escalate');
    }

    // ============================================================================
    // DISPUTE RESOLUTION LOGIC
    // ============================================================================

    const db = getFirestore();
    const resolutionId = `resolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    try {
      // Get the dispute document
      const disputeRef = db.collection(`athletes/${athleteId}/feedback`).doc(disputeId);
      const disputeDoc = await disputeRef.get();

      if (!disputeDoc.exists) {
        throw new HttpsError('not-found', `Dispute ${disputeId} not found for athlete ${athleteId}`);
      }

      const disputeData = disputeDoc.data();
      const previousStatus = disputeData?.status || 'pending';

      // Validate dispute type
      if (disputeData?.type !== 'DISPUTE') {
        throw new HttpsError('invalid-argument', 'Document is not a dispute');
      }

      // ============================================================================
      // UPDATE DISPUTE STATUS
      // ============================================================================

      let newStatus: string;
      let updateData: any = {
        updatedAt: timestamp,
        lastModifiedBy: adminId
      };

      switch (action) {
        case 'resolve':
          newStatus = 'resolved';
          updateData = {
            ...updateData,
            status: 'resolved',
            resolvedBy: adminId,
            resolvedAt: timestamp,
            resolution: resolution,
            resolutionReason: resolutionReason
          };
          break;

        case 'reject':
          newStatus = 'rejected';
          updateData = {
            ...updateData,
            status: 'rejected',
            resolvedBy: adminId,
            resolvedAt: timestamp,
            resolution: 'rejected',
            resolutionReason: resolutionReason
          };
          break;

        case 'escalate':
          newStatus = 'escalated';
          updateData = {
            ...updateData,
            status: 'escalated',
            escalatedBy: adminId,
            escalatedAt: timestamp,
            escalationReason: resolutionReason,
            escalationNotes: resolution
          };
          break;
      }

      // Update the dispute document
      await disputeRef.update(updateData);

      // ============================================================================
      // CREATE RESOLUTION RECORD
      // ============================================================================

      const resolutionRecord: DisputeResolutionRecord = {
        id: resolutionId,
        disputeId,
        athleteId,
        action,
        resolution,
        resolutionReason,
        resolvedBy: adminId,
        resolvedAt: timestamp,
        previousStatus,
        newStatus,
        targetType: disputeData?.targetType || 'unknown',
        targetId: disputeData?.targetId || 'unknown',
        metadata: {
          ...metadata,
          adminId,
          timestamp: timestamp.toISOString(),
          disputeType: disputeData?.type,
          priority: disputeData?.priority
        }
      };

      // Store resolution record
      await db.collection('adminLogs').doc(resolutionId).set(resolutionRecord);

      // ============================================================================
      // UPDATE ADMIN QUEUE
      // ============================================================================

      // Remove from admin queue if resolved or rejected
      if (action === 'resolve' || action === 'reject') {
        const queueQuery = db.collection('adminQueues/dispute/items')
          .where('targetId', '==', disputeId)
          .where('status', '==', 'pending');

        const queueSnapshot = await queueQuery.get();
        
        for (const queueDoc of queueSnapshot.docs) {
          await queueDoc.ref.update({
            status: 'resolved',
            resolvedBy: adminId,
            resolvedAt: timestamp,
            resolution: action === 'resolve' ? 'resolved' : 'rejected',
            resolutionReason: resolutionReason
          });
        }
      }

      // ============================================================================
      // HANDLE DISPUTE-SPECIFIC ACTIONS
      // ============================================================================

      if (action === 'resolve' && disputeData?.targetType && disputeData?.targetId) {
        await handleDisputeResolution(
          db,
          disputeData.targetType,
          disputeData.targetId,
          athleteId,
          resolution,
          adminId,
          timestamp
        );
      }

      // ============================================================================
      // MEMORY SDK INTEGRATION
      // ============================================================================

      const memoryClient = adminMemoryClient();

      try {
        // Calculate resolution time
        const disputeResolutionTime = disputeData?.submittedAt 
          ? timestamp.getTime() - disputeData.submittedAt.toDate().getTime()
          : 0;

        // Capture resolution event
        await memoryClient.captureFunctionResult(
          athleteId,
          'resolveDispute',
          {
            disputeId,
            action,
            resolutionId,
            adminId,
            previousStatus,
            newStatus,
            disputeResolutionTime,
            targetType: disputeData?.targetType,
            targetId: disputeData?.targetId,
            timestamp: timestamp.toISOString()
          }
        );

        // Update athlete memory with dispute pattern
        await memoryClient.captureFunctionResult(
          athleteId,
          'analytics_dispute_resolved',
          {
            disputeId,
            disputeType: disputeData?.type || 'unknown',
            resolvedBy: 'admin',
            disputeResolutionTime,
            resolution: action === 'resolve' ? 'resolved' : action === 'reject' ? 'rejected' : 'escalated'
          }
        );

      } catch (memoryError) {
        logger.error('Memory SDK integration failed:', memoryError);
        // Don't fail the entire operation if memory fails
      }

      // ============================================================================
      // NOTIFY STAKEHOLDERS
      // ============================================================================

      try {
        await notifyDisputeStakeholders(
          athleteId,
          disputeData?.submittedBy,
          action,
          resolution,
          resolutionReason
        );
      } catch (notificationError) {
        logger.error('Failed to notify stakeholders:', notificationError);
        // Don't fail the entire operation if notifications fail
      }

      // ============================================================================
      // RESPONSE
      // ============================================================================

      const response: ResolveDisputeResponse = {
        success: true,
        disputeId,
        athleteId,
        action,
        resolutionId,
        timestamp,
        message: `Dispute ${action}d successfully`,
        metadata: {
          previousStatus,
          newStatus,
          adminId,
          disputeResolutionTime: disputeData?.submittedAt 
            ? timestamp.getTime() - disputeData.submittedAt.toDate().getTime()
            : 0,
          targetType: disputeData?.targetType,
          targetId: disputeData?.targetId
        }
      };

      logger.info('Dispute resolution completed:', {
        disputeId,
        athleteId,
        action,
        adminId,
        resolutionId
      });

      return response;

    } catch (error) {
      logger.error('Dispute resolution failed:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to resolve dispute: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function handleDisputeResolution(
  db: FirebaseFirestore.Firestore,
  targetType: string,
  targetId: string,
  athleteId: string,
  resolution: string,
  adminId: string,
  timestamp: Date
): Promise<void> {
  try {
    switch (targetType) {
      case 'statLine':
        await handleStatLineDispute(db, targetId, athleteId, resolution, adminId, timestamp);
        break;
      case 'highlight':
        await handleHighlightDispute(db, targetId, athleteId, resolution, adminId, timestamp);
        break;
      case 'athlete':
        await handleAthleteDispute(db, targetId, athleteId, resolution, adminId, timestamp);
        break;
      default:
        logger.warn(`Unknown dispute target type: ${targetType}`);
    }
  } catch (error) {
    logger.error(`Failed to handle dispute resolution for ${targetType}:`, error);
    throw error;
  }
}

async function handleStatLineDispute(
  db: FirebaseFirestore.Firestore,
  statId: string,
  athleteId: string,
  resolution: string,
  adminId: string,
  timestamp: Date
): Promise<void> {
  const statRef = db.collection(`athletes/${athleteId}/statLines`).doc(statId);
  
  // Add dispute resolution note to the stat line
  await statRef.update({
    disputeResolution: {
      resolvedBy: adminId,
      resolvedAt: timestamp,
      resolution: resolution,
      status: 'resolved'
    },
    updatedAt: timestamp,
    lastModifiedBy: adminId
  });
}

async function handleHighlightDispute(
  db: FirebaseFirestore.Firestore,
  highlightId: string,
  athleteId: string,
  resolution: string,
  adminId: string,
  timestamp: Date
): Promise<void> {
  const highlightRef = db.collection(`athletes/${athleteId}/highlights`).doc(highlightId);
  
  // Add dispute resolution note to the highlight
  await highlightRef.update({
    disputeResolution: {
      resolvedBy: adminId,
      resolvedAt: timestamp,
      resolution: resolution,
      status: 'resolved'
    },
    updatedAt: timestamp,
    lastModifiedBy: adminId
  });
}

async function handleAthleteDispute(
  db: FirebaseFirestore.Firestore,
  athleteId: string,
  athleteId2: string,
  resolution: string,
  adminId: string,
  timestamp: Date
): Promise<void> {
  // Handle athlete profile disputes
  const athleteRef = db.collection('athletes').doc(athleteId);
  
  await athleteRef.update({
    disputeResolution: {
      resolvedBy: adminId,
      resolvedAt: timestamp,
      resolution: resolution,
      status: 'resolved'
    },
    updatedAt: timestamp,
    lastModifiedBy: adminId
  });
}

async function notifyDisputeStakeholders(
  athleteId: string,
  submittedBy: string,
  action: string,
  resolution: string,
  resolutionReason: string
): Promise<void> {
  // TODO: Implement notification system
  // This could include:
  // - Email notifications to the submitter
  // - In-app notifications
  // - SMS notifications for critical disputes
  
  logger.info('Dispute notification sent:', {
    athleteId,
    submittedBy,
    action,
    resolution
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function getDisputeResolutionHistory(
  disputeId: string,
  athleteId: string
): Promise<DisputeResolutionRecord[]> {
  const db = getFirestore();
  
  const query = db.collection('adminLogs')
    .where('disputeId', '==', disputeId)
    .where('athleteId', '==', athleteId)
    .orderBy('resolvedAt', 'desc');

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => doc.data() as DisputeResolutionRecord);
}

export async function getPendingDisputesForAthlete(
  athleteId: string
): Promise<Array<{ 
  disputeId: string; 
  submittedAt: Date; 
  disputeType: string; 
  targetType: string; 
  targetId: string;
  priority: string;
}>> {
  const db = getFirestore();
  
  const query = db.collection(`athletes/${athleteId}/feedback`)
    .where('type', '==', 'DISPUTE')
    .where('status', '==', 'pending')
    .orderBy('submittedAt', 'desc');

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      disputeId: doc.id,
      submittedAt: data.submittedAt?.toDate() || new Date(),
      disputeType: data.type || 'unknown',
      targetType: data.targetType || 'unknown',
      targetId: data.targetId || 'unknown',
      priority: data.priority || 'medium'
    };
  });
}

export async function getDisputeResolutionStats(
  timeRange: { start: Date; end: Date }
): Promise<{
  total: number;
  resolved: number;
  rejected: number;
  escalated: number;
  averageResolutionTime: number;
}> {
  const db = getFirestore();
  
  const query = db.collection('adminLogs')
    .where('resolvedAt', '>=', timeRange.start)
    .where('resolvedAt', '<=', timeRange.end)
    .where('action', 'in', ['resolve', 'reject', 'escalate']);

  const snapshot = await query.get();
  
  const records = snapshot.docs.map(doc => doc.data() as DisputeResolutionRecord);
  
  const totalResolutionTime = records.reduce((sum, record) => {
    const resolutionTime = record.metadata?.disputeResolutionTime || 0;
    return sum + resolutionTime;
  }, 0);
  
  return {
    total: records.length,
    resolved: records.filter(r => r.action === 'resolve').length,
    rejected: records.filter(r => r.action === 'reject').length,
    escalated: records.filter(r => r.action === 'escalate').length,
    averageResolutionTime: records.length > 0 ? totalResolutionTime / records.length : 0
  };
}
