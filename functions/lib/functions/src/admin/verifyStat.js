"use strict";
/* SportBeaconAI - Admin Stat Verification Function
   Secure server function for verifying athlete statistics
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVerificationStats = exports.getPendingStatsForAthlete = exports.getStatVerificationHistory = exports.verifyStat = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const mock_sdk_1 = require("../memory/mock-sdk");
// ============================================================================
// MAIN FUNCTION
// ============================================================================
exports.verifyStat = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 30
}, async (request) => {
    const { data, auth } = request;
    // ============================================================================
    // AUTHENTICATION & AUTHORIZATION
    // ============================================================================
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    }
    const adminId = auth.uid;
    // Verify admin role
    try {
        const userRecord = await (0, auth_1.getAuth)().getUser(adminId);
        const customClaims = userRecord.customClaims || {};
        if (!customClaims.roles?.includes('admin')) {
            throw new https_1.HttpsError('permission-denied', 'Admin privileges required');
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Failed to verify admin role:', error);
        throw new https_1.HttpsError('permission-denied', 'Failed to verify admin privileges');
    }
    // ============================================================================
    // INPUT VALIDATION
    // ============================================================================
    const { statId, athleteId, action, reason, clarificationMessage, metadata = {} } = data;
    if (!statId || !athleteId || !action) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields: statId, athleteId, action');
    }
    if (!['approve', 'reject', 'request_clarification'].includes(action)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid action. Must be: approve, reject, or request_clarification');
    }
    if (action === 'reject' && !reason) {
        throw new https_1.HttpsError('invalid-argument', 'Reason is required for rejection');
    }
    if (action === 'request_clarification' && !clarificationMessage) {
        throw new https_1.HttpsError('invalid-argument', 'Clarification message is required');
    }
    // ============================================================================
    // STAT VERIFICATION LOGIC
    // ============================================================================
    const db = (0, firestore_1.getFirestore)();
    const verificationId = `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();
    try {
        // Get the stat document
        const statRef = db.collection(`athletes/${athleteId}/statLines`).doc(statId);
        const statDoc = await statRef.get();
        if (!statDoc.exists) {
            throw new https_1.HttpsError('not-found', `Stat line ${statId} not found for athlete ${athleteId}`);
        }
        const statData = statDoc.data();
        const previousStatus = statData?.verificationStatus || 'unverified';
        // Update stat verification status
        let newStatus;
        let updateData = {
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
        const verificationRecord = {
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
        const memoryClient = (0, mock_sdk_1.adminMemoryClient)();
        try {
            // Capture verification event
            await memoryClient.captureFunctionResult(athleteId, 'verifyStat', {
                statId,
                action,
                verificationId,
                adminId,
                previousStatus,
                newStatus,
                timestamp: timestamp.toISOString()
            }, undefined, 'stat-verification');
            // Update athlete memory with verification pattern
            // TODO: Integrate with athlete memory store
            console.log('Memory SDK integration completed');
        }
        catch (memoryError) {
            firebase_functions_1.logger.error('Memory SDK integration failed:', memoryError);
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
            await memoryClient.captureFunctionResult(athleteId, 'analytics_stat_verified', {
                statId,
                sport: statData?.sport || 'unknown',
                statType: statData?.statType || 'unknown',
                verifiedBy: 'admin',
                verificationTime,
                resolution: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs_clarification'
            }, undefined, 'analytics-stat-verified');
        }
        catch (analyticsError) {
            firebase_functions_1.logger.error('Analytics integration failed:', analyticsError);
            // Don't fail the entire operation if analytics fails
        }
        // ============================================================================
        // RESPONSE
        // ============================================================================
        const response = {
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
        firebase_functions_1.logger.info('Stat verification completed:', {
            statId,
            athleteId,
            action,
            adminId,
            verificationId
        });
        return response;
    }
    catch (error) {
        firebase_functions_1.logger.error('Stat verification failed:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', `Failed to verify stat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
async function getStatVerificationHistory(statId, athleteId) {
    const db = (0, firestore_1.getFirestore)();
    const query = db.collection('adminLogs')
        .where('statId', '==', statId)
        .where('athleteId', '==', athleteId)
        .orderBy('verifiedAt', 'desc');
    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());
}
exports.getStatVerificationHistory = getStatVerificationHistory;
async function getPendingStatsForAthlete(athleteId) {
    const db = (0, firestore_1.getFirestore)();
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
exports.getPendingStatsForAthlete = getPendingStatsForAthlete;
async function getVerificationStats(timeRange) {
    const db = (0, firestore_1.getFirestore)();
    const query = db.collection('adminLogs')
        .where('verifiedAt', '>=', timeRange.start)
        .where('verifiedAt', '<=', timeRange.end);
    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => doc.data());
    return {
        total: records.length,
        approved: records.filter(r => r.action === 'approve').length,
        rejected: records.filter(r => r.action === 'reject').length,
        pending: records.filter(r => r.action === 'request_clarification').length,
        averageVerificationTime: 0 // TODO: Calculate from actual data
    };
}
exports.getVerificationStats = getVerificationStats;
//# sourceMappingURL=verifyStat.js.map