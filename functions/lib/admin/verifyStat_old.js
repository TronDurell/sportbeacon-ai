"use strict";
/* SportBeaconAI - Admin Stat Verification Function
   Secure server function for verifying athlete statistics
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVerificationStats = exports.getPendingStatsForAthlete = exports.getStatVerificationHistory = exports.verifyStat = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const mock_sdk_1 = require("../memory/mock-sdk");
const http_1 = require("../lib/http");
const validate_1 = require("../lib/validate");
const validate_2 = require("../lib/validate");
// ============================================================================
// MAIN FUNCTION
// ============================================================================
exports.verifyStat = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.verifyStatSchema, req.body);
        const { statId, verificationStatus, verificationNotes } = validatedData;
        firebase_functions_1.logger.info("Stat verification requested", {
            statId,
            verificationStatus,
            requestId
        });
        // TODO: Implement stat verification
        // - Validate admin permissions
        // - Get stat document
        // - Update stat status
        // - Create verification record
        // - Update admin queue
        // - Handle stat-specific actions
        // - Memory SDK integration
        // - Notify stakeholders
        // Mock stat verification - replace with actual implementation
        const verificationId = `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        res.status(200).json({
            success: true,
            message: "Stat verification completed successfully",
            data: {
                statId,
                verificationStatus,
                verificationId
            },
            requestId
        });
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
        // Mock stat verification - replace with actual implementation
        const verificationId = `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        res.status(200).json({
            success: true,
            message: "Stat verification completed successfully",
            data: {
                statId,
                verificationStatus,
                verificationId
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
        firebase_functions_1.logger.error('Stat verification error:', error, { requestId });
        res.status(500).json({
            error: 'Failed to verify stat',
            requestId
        });
    }
}));
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
