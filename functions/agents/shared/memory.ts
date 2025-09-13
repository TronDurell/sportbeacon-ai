/**
 * Shared Memory Utilities for Agents
 * Provides common memory operations for background agents
 */

import { FieldValue } from 'firebase-admin/firestore';
import { adminMemoryClient, db } from '../../memory/client';
import * as logger from 'firebase-functions/logger';
const memoryClient = adminMemoryClient();

/**
 * Agent memory context
 */
export interface AgentMemoryContext {
  agentId: string;
  agentType: 'verification' | 'reporting' | 'notification';
  scope: 'player' | 'team' | 'system';
  key: string;
  value: any;
  metadata?: Record<string, any>;
}

/**
 * Store agent memory with standardized format
 */
export async function storeAgentMemory(context: AgentMemoryContext): Promise<void> {
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

  } catch (error) {
    logger.error('Error storing agent memory', {
      agentType: context.agentType,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Retrieve agent memory by pattern
 */
export async function retrieveAgentMemory(
  agentType: string,
  scope: string,
  keyPattern?: string,
  limit: number = 50
): Promise<any[]> {
  try {
    // This would use the memory client's recall functionality
    // For now, we'll implement a simple Firestore query
    const query = db.collection('memory')
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

  } catch (error) {
    logger.error('Error retrieving agent memory', {
      agentType,
      scope,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

/**
 * Update agent learning patterns
 */
export async function updateAgentLearning(
  agentType: string,
  action: string,
  success: boolean,
  metadata: Record<string, any> = {}
): Promise<void> {
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
      agentType: 'learning' as any,
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

  } catch (error) {
    logger.error('Error updating agent learning', {
      agentType,
      action,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get agent performance metrics
 */
export async function getAgentPerformance(agentType: string, timeRange: { from: Date; to: Date }): Promise<{
  totalActions: number;
  successfulActions: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
}> {
  try {
    const snapshot = await db
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

  } catch (error) {
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

/**
 * Clean up old agent memory entries
 */
export async function cleanupAgentMemory(olderThanDays: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const snapshot = await db
      .collection('memory')
      .where('scope', '==', 'system')
      .where('createdAt', '<', cutoffDate)
      .limit(1000)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    logger.info('Agent memory cleanup completed', {
      deletedCount: snapshot.docs.length,
      cutoffDate: cutoffDate.toISOString()
    });

    return snapshot.docs.length;

  } catch (error) {
    logger.error('Error cleaning up agent memory', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 0;
  }
}

/**
 * Store agent state for persistence
 */
export async function storeAgentState(
  agentId: string,
  state: Record<string, any>,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await db.collection('agent_states').doc(agentId).set({
      agentId,
      state,
      metadata: {
        ...metadata,
        lastUpdated: FieldValue.serverTimestamp(),
        version: '1.0'
      }
    });

    logger.info('Agent state stored', { agentId });

  } catch (error) {
    logger.error('Error storing agent state', {
      agentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Retrieve agent state
 */
export async function retrieveAgentState(agentId: string): Promise<Record<string, any> | null> {
  try {
    const doc = await db.collection('agent_states').doc(agentId).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return data.state;

  } catch (error) {
    logger.error('Error retrieving agent state', {
      agentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

/**
 * Log agent activity for monitoring
 */
export async function logAgentActivity(
  agentId: string,
  activity: string,
  details: Record<string, any> = {},
  success: boolean = true
): Promise<void> {
  try {
    await db.collection('agent_activities').add({
      agentId,
      activity,
      details,
      success,
      timestamp: FieldValue.serverTimestamp(),
      metadata: {
        version: '1.0'
      }
    });

    logger.info('Agent activity logged', {
      agentId,
      activity,
      success
    });

  } catch (error) {
    logger.error('Error logging agent activity', {
      agentId,
      activity,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
