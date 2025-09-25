"use strict";
/**
 * Shared Memory Utilities for Agents
 * Provides common memory operations for background agents
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAgentActivity = exports.retrieveAgentState = exports.storeAgentState = exports.cleanupAgentMemory = exports.getAgentPerformance = exports.updateAgentLearning = exports.retrieveAgentMemory = exports.storeAgentMemory = void 0;
const firestore_1 = require("firebase-admin/firestore");
const client_1 = require("../../memory/client");
const logger = __importStar(require("firebase-functions/logger"));
const memoryClient = (0, client_1.adminMemoryClient)();
/**
 * Store agent memory with standardized format
 */
async function storeAgentMemory(context) {
    try {
        const memoryKey = `${context.agentType}_${context.scope}_${context.key}_${Date.now()}`;
        await memoryClient.remember({
            scope: 'system',
            key: memoryKey,
            value: {
                agentId: context.agentId,
                agentType: context.agentType,
                scope: context.scope,
                key: context.key,
                value: context.value,
                metadata: {
                    ...context.metadata,
                    timestamp: new Date().toISOString(),
                    version: '1.0'
                }
            }
        });
        logger.info('Agent memory stored', {
            agentType: context.agentType,
            scope: context.scope,
            key: context.key
        });
    }
    catch (error) {
        logger.error('Error storing agent memory', {
            agentType: context.agentType,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
exports.storeAgentMemory = storeAgentMemory;
/**
 * Retrieve agent memory by pattern
 */
async function retrieveAgentMemory(agentType, scope, keyPattern, limit = 50) {
    try {
        // This would use the memory client's recall functionality
        // For now, we'll implement a simple Firestore query
        const query = client_1.db.collection('memory')
            .where('scope', '==', 'system')
            .where('key', '>=', `${agentType}_${scope}_`)
            .where('key', '<=', `${agentType}_${scope}_\uf8ff`)
            .orderBy('key', 'desc')
            .limit(limit);
        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                retrievedAt: new Date().toISOString()
            };
        });
    }
    catch (error) {
        logger.error('Error retrieving agent memory', {
            agentType,
            scope,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return [];
    }
}
exports.retrieveAgentMemory = retrieveAgentMemory;
/**
 * Update agent learning patterns
 */
async function updateAgentLearning(agentType, action, success, metadata = {}) {
    try {
        const learningKey = `learning_${agentType}_${action}`;
        // Get existing learning data
        const existingData = await retrieveAgentMemory('learning', 'system', learningKey, 1);
        let learningData = existingData[0]?.value || {
            totalAttempts: 0,
            successfulAttempts: 0,
            successRate: 0,
            lastUpdated: new Date().toISOString()
        };
        // Update learning metrics
        learningData.totalAttempts += 1;
        if (success) {
            learningData.successfulAttempts += 1;
        }
        learningData.successRate = (learningData.successfulAttempts / learningData.totalAttempts) * 100;
        learningData.lastUpdated = new Date().toISOString();
        learningData.lastAction = {
            action,
            success,
            metadata,
            timestamp: new Date().toISOString()
        };
        // Store updated learning data
        await storeAgentMemory({
            agentId: `learning-${agentType}`,
            agentType: 'learning',
            scope: 'system',
            key: learningKey,
            value: learningData,
            metadata: {
                action,
                success,
                ...metadata
            }
        });
        logger.info('Agent learning updated', {
            agentType,
            action,
            success,
            successRate: learningData.successRate
        });
    }
    catch (error) {
        logger.error('Error updating agent learning', {
            agentType,
            action,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
exports.updateAgentLearning = updateAgentLearning;
/**
 * Get agent performance metrics
 */
async function getAgentPerformance(agentType, timeRange) {
    try {
        const snapshot = await client_1.db
            .collection('agent_audit')
            .where('method', '==', agentType)
            .where('timestamp', '>=', timeRange.from.toISOString())
            .where('timestamp', '<=', timeRange.to.toISOString())
            .get();
        const actions = snapshot.docs.map(doc => doc.data());
        const totalActions = actions.length;
        const successfulActions = actions.filter(action => action.success).length;
        const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;
        const totalDuration = actions.reduce((sum, action) => sum + (action.duration || 0), 0);
        const averageResponseTime = totalActions > 0 ? totalDuration / totalActions : 0;
        const errorRate = 100 - successRate;
        return {
            totalActions,
            successfulActions,
            successRate,
            averageResponseTime,
            errorRate
        };
    }
    catch (error) {
        logger.error('Error getting agent performance', {
            agentType,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            totalActions: 0,
            successfulActions: 0,
            successRate: 0,
            averageResponseTime: 0,
            errorRate: 0
        };
    }
}
exports.getAgentPerformance = getAgentPerformance;
/**
 * Clean up old agent memory entries
 */
async function cleanupAgentMemory(olderThanDays = 30) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const snapshot = await client_1.db
            .collection('memory')
            .where('scope', '==', 'system')
            .where('createdAt', '<', cutoffDate)
            .limit(1000)
            .get();
        if (snapshot.empty) {
            return 0;
        }
        const batch = client_1.db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        logger.info('Agent memory cleanup completed', {
            deletedCount: snapshot.docs.length,
            cutoffDate: cutoffDate.toISOString()
        });
        return snapshot.docs.length;
    }
    catch (error) {
        logger.error('Error cleaning up agent memory', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return 0;
    }
}
exports.cleanupAgentMemory = cleanupAgentMemory;
/**
 * Store agent state for persistence
 */
async function storeAgentState(agentId, state, metadata = {}) {
    try {
        await client_1.db.collection('agent_states').doc(agentId).set({
            agentId,
            state,
            metadata: {
                ...metadata,
                lastUpdated: firestore_1.FieldValue.serverTimestamp(),
                version: '1.0'
            }
        });
        logger.info('Agent state stored', { agentId });
    }
    catch (error) {
        logger.error('Error storing agent state', {
            agentId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
exports.storeAgentState = storeAgentState;
/**
 * Retrieve agent state
 */
async function retrieveAgentState(agentId) {
    try {
        const doc = await client_1.db.collection('agent_states').doc(agentId).get();
        if (!doc.exists) {
            return null;
        }
        const data = doc.data();
        return data.state;
    }
    catch (error) {
        logger.error('Error retrieving agent state', {
            agentId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
    }
}
exports.retrieveAgentState = retrieveAgentState;
/**
 * Log agent activity for monitoring
 */
async function logAgentActivity(agentId, activity, details = {}, success = true) {
    try {
        await client_1.db.collection('agent_activities').add({
            agentId,
            activity,
            details,
            success,
            timestamp: firestore_1.FieldValue.serverTimestamp(),
            metadata: {
                version: '1.0'
            }
        });
        logger.info('Agent activity logged', {
            agentId,
            activity,
            success
        });
    }
    catch (error) {
        logger.error('Error logging agent activity', {
            agentId,
            activity,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
exports.logAgentActivity = logAgentActivity;
//# sourceMappingURL=memory.js.map