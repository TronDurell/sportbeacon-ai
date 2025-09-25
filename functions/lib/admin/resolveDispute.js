"use strict";
/* SportBeaconAI - Admin Dispute Resolution Function
   Secure server function for resolving athlete data disputes
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDisputeResolutionStats = exports.getPendingDisputesForAthlete = exports.getDisputeResolutionHistory = exports.resolveDispute = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const http_1 = require("../lib/http");
const validate_1 = require("../lib/validate");
const validate_2 = require("../lib/validate");
// ============================================================================
// MAIN FUNCTION
// ============================================================================
exports.resolveDispute = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.resolveDisputeSchema, req.body);
        const { disputeId, action, resolutionNotes } = validatedData;
        firebase_functions_1.logger.info("Dispute resolution requested", {
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
    }
    catch (error) {
        if (error.name === 'BadRequest') {
            res.status(400).json({
                error: error.message,
                requestId
            });
            return;
        }
        firebase_functions_1.logger.error('Dispute resolution error:', error, { requestId });
        res.status(500).json({
            error: 'Failed to resolve dispute',
            requestId
        });
    }
}));
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
async function handleDisputeResolution(db, targetType, targetId, athleteId, resolution, adminId, timestamp) {
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
                firebase_functions_1.logger.warn(`Unknown dispute target type: ${targetType}`);
        }
    }
    catch (error) {
        firebase_functions_1.logger.error(`Failed to handle dispute resolution for ${targetType}:`, error);
        throw error;
    }
}
async function handleStatLineDispute(db, statId, athleteId, resolution, adminId, timestamp) {
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
async function handleHighlightDispute(db, highlightId, athleteId, resolution, adminId, timestamp) {
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
async function handleAthleteDispute(db, athleteId, athleteId2, resolution, adminId, timestamp) {
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
async function notifyDisputeStakeholders(athleteId, submittedBy, action, resolution, resolutionReason) {
    // TODO: Implement notification system
    // This could include:
    // - Email notifications to the submitter
    // - In-app notifications
    // - SMS notifications for critical disputes
    firebase_functions_1.logger.info('Dispute notification sent:', {
        athleteId,
        submittedBy,
        action,
        resolution
    });
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
async function getDisputeResolutionHistory(disputeId, athleteId) {
    const db = (0, firestore_1.getFirestore)();
    const query = db.collection('adminLogs')
        .where('disputeId', '==', disputeId)
        .where('athleteId', '==', athleteId)
        .orderBy('resolvedAt', 'desc');
    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());
}
exports.getDisputeResolutionHistory = getDisputeResolutionHistory;
async function getPendingDisputesForAthlete(athleteId) {
    const db = (0, firestore_1.getFirestore)();
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
exports.getPendingDisputesForAthlete = getPendingDisputesForAthlete;
async function getDisputeResolutionStats(timeRange) {
    const db = (0, firestore_1.getFirestore)();
    const query = db.collection('adminLogs')
        .where('resolvedAt', '>=', timeRange.start)
        .where('resolvedAt', '<=', timeRange.end)
        .where('action', 'in', ['resolve', 'reject', 'escalate']);
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => doc.data());
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
exports.getDisputeResolutionStats = getDisputeResolutionStats;
