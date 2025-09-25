"use strict";
/* SportBeaconAI - Weekly Policy Deltas Function
   Applies learning-based policy updates based on memory feedback
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPolicyDeltas = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const db = (0, firestore_1.getFirestore)();
// Weekly policy update function
exports.applyPolicyDeltas = (0, scheduler_1.onSchedule)({
    schedule: '0 2 * * 1',
    timeZone: 'America/New_York',
    memory: '1GiB',
    timeoutSeconds: 540
}, async (event) => {
    firebase_functions_1.logger.info('Starting weekly policy deltas application...');
    try {
        // Get all tenant configurations
        const tenants = await db.collection('tenants').get();
        const results = [];
        for (const tenantDoc of tenants.docs) {
            const tenantId = tenantDoc.id;
            firebase_functions_1.logger.info(`Processing policy deltas for tenant: ${tenantId}`);
            const result = await processTenantPolicyDeltas(tenantId);
            results.push({ tenantId, ...result });
        }
        firebase_functions_1.logger.info('Weekly policy deltas completed successfully', { results });
    }
    catch (error) {
        firebase_functions_1.logger.error('Failed to apply policy deltas:', error);
        throw error;
    }
});
// Process policy deltas for a specific tenant
async function processTenantPolicyDeltas(tenantId) {
    try {
        // Load current policy configuration
        const currentConfig = await loadCurrentPolicyConfig(tenantId);
        // Analyze memory feedback to determine policy changes
        const policyDeltas = await analyzePolicyDeltas(tenantId);
        // Apply approved deltas
        const appliedDeltas = await applyApprovedDeltas(tenantId, policyDeltas);
        // Update runtime configuration
        await updateRuntimeConfig(tenantId, appliedDeltas);
        // Log policy changes
        await logPolicyChanges(tenantId, appliedDeltas);
        return {
            deltasAnalyzed: policyDeltas.length,
            deltasApplied: appliedDeltas.length,
            appliedDeltas
        };
    }
    catch (error) {
        firebase_functions_1.logger.error(`Failed to process policy deltas for tenant ${tenantId}:`, error);
        throw error;
    }
}
// Load current policy configuration
async function loadCurrentPolicyConfig(tenantId) {
    const configDoc = await db.collection('tenants').doc(tenantId).collection('config').doc('policy').get();
    if (!configDoc.exists) {
        // Return default configuration
        return {
            contentModeration: {
                spamThreshold: 0.8,
                harassmentThreshold: 0.7,
                inappropriateThreshold: 0.75,
                autoModerationEnabled: true
            },
            userBehavior: {
                maxPostsPerHour: 10,
                maxCommentsPerHour: 50,
                rateLimitWindow: 3600
            },
            featureUsage: {
                memorySDKEnabled: true,
                learningGatesEnabled: true,
                personalizationLevel: 'medium'
            },
            performance: {
                maxResponseTime: 500,
                minAccuracy: 0.8,
                maxErrorRate: 0.05
            }
        };
    }
    return configDoc.data();
}
// Analyze memory feedback to determine policy changes
async function analyzePolicyDeltas(tenantId) {
    const deltas = [];
    // Get recent feedback from memory
    const feedbackMemories = await db.collectionGroup('memories')
        .where('tenantId', '==', tenantId)
        .where('kind', '==', 'feedback')
        .where('score', '>', 0) // Only positive feedback
        .orderBy('score', 'desc')
        .orderBy('updatedAt', 'desc')
        .limit(100)
        .get();
    // Analyze content moderation feedback
    const moderationFeedback = feedbackMemories.docs.filter(doc => doc.data().tags?.includes('moderation') || doc.data().tags?.includes('triage'));
    if (moderationFeedback.length > 10) {
        const accuracy = moderationFeedback.filter(doc => doc.data().score > 0.5).length / moderationFeedback.length;
        if (accuracy > 0.9) {
            // High accuracy - can lower thresholds
            deltas.push({
                id: `delta-${Date.now()}-moderation-1`,
                type: 'content_moderation',
                field: 'spamThreshold',
                oldValue: 0.8,
                newValue: 0.75,
                confidence: 0.8,
                evidence: [`High moderation accuracy: ${(accuracy * 100).toFixed(1)}%`],
                appliedAt: new Date().toISOString(),
                appliedBy: 'system'
            });
        }
        else if (accuracy < 0.7) {
            // Low accuracy - should raise thresholds
            deltas.push({
                id: `delta-${Date.now()}-moderation-2`,
                type: 'content_moderation',
                field: 'spamThreshold',
                oldValue: 0.8,
                newValue: 0.85,
                confidence: 0.8,
                evidence: [`Low moderation accuracy: ${(accuracy * 100).toFixed(1)}%`],
                appliedAt: new Date().toISOString(),
                appliedBy: 'system'
            });
        }
    }
    // Analyze user behavior feedback
    const behaviorFeedback = feedbackMemories.docs.filter(doc => doc.data().tags?.includes('user-behavior') || doc.data().tags?.includes('rate-limit'));
    if (behaviorFeedback.length > 5) {
        const positiveFeedback = behaviorFeedback.filter(doc => doc.data().score > 0).length;
        const positiveRate = positiveFeedback / behaviorFeedback.length;
        if (positiveRate > 0.8) {
            // Users are happy with current limits
            deltas.push({
                id: `delta-${Date.now()}-behavior-1`,
                type: 'user_behavior',
                field: 'maxPostsPerHour',
                oldValue: 10,
                newValue: 12,
                confidence: 0.7,
                evidence: [`High user satisfaction: ${(positiveRate * 100).toFixed(1)}%`],
                appliedAt: new Date().toISOString(),
                appliedBy: 'system'
            });
        }
    }
    // Analyze performance feedback
    const performanceFeedback = feedbackMemories.docs.filter(doc => doc.data().tags?.includes('performance') || doc.data().tags?.includes('response-time'));
    if (performanceFeedback.length > 5) {
        const avgScore = performanceFeedback.reduce((sum, doc) => sum + doc.data().score, 0) / performanceFeedback.length;
        if (avgScore > 0.8) {
            // Good performance - can optimize further
            deltas.push({
                id: `delta-${Date.now()}-performance-1`,
                type: 'performance',
                field: 'maxResponseTime',
                oldValue: 500,
                newValue: 400,
                confidence: 0.75,
                evidence: [`Good performance feedback: ${(avgScore * 100).toFixed(1)}%`],
                appliedAt: new Date().toISOString(),
                appliedBy: 'system'
            });
        }
    }
    return deltas;
}
// Apply approved policy deltas
async function applyApprovedDeltas(tenantId, deltas) {
    const appliedDeltas = [];
    for (const delta of deltas) {
        // Only apply deltas with high confidence
        if (delta.confidence >= 0.7) {
            try {
                // Store the delta for audit trail
                await db.collection('tenants').doc(tenantId).collection('policy_deltas').doc(delta.id).set(delta);
                appliedDeltas.push(delta);
                firebase_functions_1.logger.info(`Applied policy delta: ${delta.id}`, delta);
            }
            catch (error) {
                firebase_functions_1.logger.error(`Failed to apply policy delta ${delta.id}:`, error);
            }
        }
    }
    return appliedDeltas;
}
// Update runtime configuration
async function updateRuntimeConfig(tenantId, deltas) {
    if (deltas.length === 0)
        return;
    // Load current config
    const currentConfig = await loadCurrentPolicyConfig(tenantId);
    // Apply deltas to configuration
    const updatedConfig = { ...currentConfig };
    for (const delta of deltas) {
        switch (delta.type) {
            case 'content_moderation':
                if (delta.field === 'spamThreshold') {
                    updatedConfig.contentModeration.spamThreshold = delta.newValue;
                }
                else if (delta.field === 'harassmentThreshold') {
                    updatedConfig.contentModeration.harassmentThreshold = delta.newValue;
                }
                else if (delta.field === 'inappropriateThreshold') {
                    updatedConfig.contentModeration.inappropriateThreshold = delta.newValue;
                }
                break;
            case 'user_behavior':
                if (delta.field === 'maxPostsPerHour') {
                    updatedConfig.userBehavior.maxPostsPerHour = delta.newValue;
                }
                else if (delta.field === 'maxCommentsPerHour') {
                    updatedConfig.userBehavior.maxCommentsPerHour = delta.newValue;
                }
                break;
            case 'performance':
                if (delta.field === 'maxResponseTime') {
                    updatedConfig.performance.maxResponseTime = delta.newValue;
                }
                break;
        }
    }
    // Save updated configuration
    await db.collection('tenants').doc(tenantId).collection('config').doc('policy').set(updatedConfig);
    firebase_functions_1.logger.info(`Updated runtime configuration for tenant ${tenantId}`, updatedConfig);
}
// Log policy changes for audit trail
async function logPolicyChanges(tenantId, deltas) {
    for (const delta of deltas) {
        await db.collection('tenants').doc(tenantId).collection('audit_logs').add({
            type: 'policy_change',
            deltaId: delta.id,
            field: delta.field,
            oldValue: delta.oldValue,
            newValue: delta.newValue,
            evidence: delta.evidence,
            appliedAt: delta.appliedAt,
            appliedBy: delta.appliedBy,
            tenantId,
            createdAt: new Date()
        });
    }
}
