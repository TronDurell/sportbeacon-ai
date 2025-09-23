/* SportBeaconAI - Admin Dispute Resolution Function
   Secure server function for resolving athlete data disputes
*/

import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminMemoryClient } from '../memory/client';
import { withSecurityGuards } from '../lib/http';
import { Request, Response } from 'express';
import { resolveDisputeSchema } from '../lib/validate';
import { validateBody } from '../lib/validate';

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

export const resolveDispute = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(resolveDisputeSchema, req.body);
    const { disputeId, action, resolutionNotes } = validatedData;

    logger.info("Dispute resolution requested", {
      disputeId,
      action,
      requestId
    });

    // TODO: Implement dispute resolution
    // - Validate admin permissions
    // - Get dispute document
    // - Update dispute status
    // - Create resolution record
    // - Update admin queue
    // - Handle dispute-specific actions
    // - Memory SDK integration
    // - Notify stakeholders

    // Mock dispute resolution - replace with actual implementation
    const resolutionId = `resolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.status(200).json({
      success: true,
      message: "Dispute resolved successfully",
      data: { 
        disputeId,
        action,
        resolutionId
      },
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
    
    logger.error('Dispute resolution error:', error, { requestId });
    res.status(500).json({ 
      error: 'Failed to resolve dispute',
      requestId
    });
  }
}));

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
