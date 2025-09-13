/* SportBeaconAI - Admin Stat Verification Function
   Secure server function for verifying athlete statistics
*/

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { memoryClient } from '../memory/mock-sdk';
import { adminMemoryClient } from '../memory/mock-sdk';

// ============================================================================
// INTERFACES
// ============================================================================

interface VerifyStatRequest {
  statId: string;
  athleteId: string;
  action: 'approve' | 'reject' | 'request_clarification';
  reason?: string;
  clarificationMessage?: string;
  metadata?: Record<string, any>;
}

interface VerifyStatResponse {
  success: boolean;
  statId: string;
  athleteId: string;
  action: string;
  verificationId: string;
  timestamp: Date;
  message: string;
  metadata?: Record<string, any>;
}

interface StatVerificationRecord {
  id: string;
  statId: string;
  athleteId: string;
  action: 'approve' | 'reject' | 'request_clarification';
  reason?: string;
  clarificationMessage?: string;
  verifiedBy: string;
  verifiedAt: Date;
  previousStatus: string;
  newStatus: string;
  metadata: Record<string, any>;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export const verifyStat = onCall(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 30
  },
  async (request): Promise<VerifyStatResponse> => {
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
      statId,
      athleteId,
      action,
      reason,
      clarificationMessage,
      metadata = {}
    } = data as VerifyStatRequest;

    if (!statId || !athleteId || !action) {
      throw new HttpsError('invalid-argument', 'Missing required fields: statId, athleteId, action');
    }

    if (!['approve', 'reject', 'request_clarification'].includes(action)) {
      throw new HttpsError('invalid-argument', 'Invalid action. Must be: approve, reject, or request_clarification');
    }

    if (action === 'reject' && !reason) {
      throw new HttpsError('invalid-argument', 'Reason is required for rejection');
    }

    if (action === 'request_clarification' && !clarificationMessage) {
      throw new HttpsError('invalid-argument', 'Clarification message is required');
    }

    // ============================================================================
    // STAT VERIFICATION LOGIC
    // ============================================================================

    const db = getFirestore();
    const verificationId = `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    try {
      // Get the stat document
      const statRef = db.collection(`athletes/${athleteId}/statLines`).doc(statId);
      const statDoc = await statRef.get();

      if (!statDoc.exists) {
        throw new HttpsError('not-found', `Stat line ${statId} not found for athlete ${athleteId}`);
      }

      const statData = statDoc.data();
      const previousStatus = statData?.verificationStatus || 'unverified';

      // Update stat verification status
      let newStatus: string;
      let updateData: any = {
        updatedAt: timestamp,
        lastModifiedBy: adminId
      };

      switch (action) {
        case 'approve':
          newStatus = 'verified';
          updateData = {
            ...updateData,
            isVerified: true,
            verifiedBy: adminId,
            verifiedAt: timestamp,
            verificationStatus: 'verified'
          };
          break;

        case 'reject':
          newStatus = 'rejected';
          updateData = {
            ...updateData,
            isVerified: false,
            verificationStatus: 'rejected',
            rejectionReason: reason,
            rejectedBy: adminId,
            rejectedAt: timestamp
          };
          break;

        case 'request_clarification':
          newStatus = 'needs_clarification';
          updateData = {
            ...updateData,
            verificationStatus: 'needs_clarification',
            clarificationRequest: {
              message: clarificationMessage,
              requestedBy: adminId,
              requestedAt: timestamp
            }
          };
          break;
      }

      // Update the stat document
      await statRef.update(updateData);

      // ============================================================================
      // CREATE VERIFICATION RECORD
      // ============================================================================

      const verificationRecord: StatVerificationRecord = {
        id: verificationId,
        statId,
        athleteId,
        action,
        reason,
        clarificationMessage,
        verifiedBy: adminId,
        verifiedAt: timestamp,
        previousStatus,
        newStatus,
        metadata: {
          ...metadata,
          adminId,
          timestamp: timestamp.toISOString()
        }
      };

      // Store verification record
      await db.collection('adminLogs').doc(verificationId).set(verificationRecord);

      // ============================================================================
      // UPDATE ADMIN QUEUE
      // ============================================================================

      // Remove from admin queue if approved or rejected
      if (action === 'approve' || action === 'reject') {
        const queueQuery = db.collection('adminQueues/verification/items')
          .where('targetId', '==', statId)
          .where('status', '==', 'pending');

        const queueSnapshot = await queueQuery.get();
        
        for (const queueDoc of queueSnapshot.docs) {
          await queueDoc.ref.update({
            status: 'resolved',
            resolvedBy: adminId,
            resolvedAt: timestamp,
            resolution: action === 'approve' ? 'approved' : 'rejected',
            resolutionReason: reason
          });
        }
      }

      // ============================================================================
      // MEMORY SDK INTEGRATION
      // ============================================================================

      const memoryClient = adminMemoryClient();

      try {
        // Capture verification event
        await memoryClient.captureFunctionResult(
          athleteId,
          'verifyStat',
          {
            statId,
            action,
            verificationId,
            adminId,
            previousStatus,
            newStatus,
            timestamp: timestamp.toISOString()
          },
          undefined,
          'stat-verification'
        );

        // Update athlete memory with verification pattern
        // TODO: Integrate with athlete memory store
        console.log('Memory SDK integration completed');

      } catch (memoryError) {
        logger.error('Memory SDK integration failed:', memoryError);
        // Don't fail the entire operation if memory fails
      }

      // ============================================================================
      // ANALYTICS INTEGRATION
      // ============================================================================

      try {
        // Calculate verification time if this was an approval
        let verificationTime = 0;
        if (action === 'approve' && statData?.submittedAt) {
          verificationTime = timestamp.getTime() - statData.submittedAt.toDate().getTime();
        }

        // Emit analytics event
        await memoryClient.captureFunctionResult(
          athleteId,
          'analytics_stat_verified',
          {
            statId,
            sport: statData?.sport || 'unknown',
            statType: statData?.statType || 'unknown',
            verifiedBy: 'admin',
            verificationTime,
            resolution: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs_clarification'
          },
          undefined,
          'analytics-stat-verified'
        );

      } catch (analyticsError) {
        logger.error('Analytics integration failed:', analyticsError);
        // Don't fail the entire operation if analytics fails
      }

      // ============================================================================
      // RESPONSE
      // ============================================================================

      const response: VerifyStatResponse = {
        success: true,
        statId,
        athleteId,
        action,
        verificationId,
        timestamp,
        message: `Stat ${action}ed successfully`,
        metadata: {
          previousStatus,
          newStatus,
          adminId,
          verificationTime: action === 'approve' ? Date.now() - (statData?.submittedAt?.toDate().getTime() || 0) : undefined
        }
      };

      logger.info('Stat verification completed:', {
        statId,
        athleteId,
        action,
        adminId,
        verificationId
      });

      return response;

    } catch (error) {
      logger.error('Stat verification failed:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to verify stat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function getStatVerificationHistory(
  statId: string,
  athleteId: string
): Promise<StatVerificationRecord[]> {
  const db = getFirestore();
  
  const query = db.collection('adminLogs')
    .where('statId', '==', statId)
    .where('athleteId', '==', athleteId)
    .orderBy('verifiedAt', 'desc');

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => doc.data() as StatVerificationRecord);
}

export async function getPendingStatsForAthlete(
  athleteId: string
): Promise<Array<{ statId: string; submittedAt: Date; sport: string; statType: string }>> {
  const db = getFirestore();
  
  const query = db.collection(`athletes/${athleteId}/statLines`)
    .where('verificationStatus', '==', 'pending')
    .orderBy('submittedAt', 'desc');

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      statId: doc.id,
      submittedAt: data.submittedAt?.toDate() || new Date(),
      sport: data.sport || 'unknown',
      statType: data.statType || 'unknown'
    };
  });
}

export async function getVerificationStats(
  timeRange: { start: Date; end: Date }
): Promise<{
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  averageVerificationTime: number;
}> {
  const db = getFirestore();
  
  const query = db.collection('adminLogs')
    .where('verifiedAt', '>=', timeRange.start)
    .where('verifiedAt', '<=', timeRange.end);

  const snapshot = await query.get();
  
  const records = snapshot.docs.map(doc => doc.data() as StatVerificationRecord);
  
  return {
    total: records.length,
    approved: records.filter(r => r.action === 'approve').length,
    rejected: records.filter(r => r.action === 'reject').length,
    pending: records.filter(r => r.action === 'request_clarification').length,
    averageVerificationTime: 0 // TODO: Calculate from actual data
  };
}
