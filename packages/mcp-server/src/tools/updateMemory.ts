/**
 * Update Memory Tool
 * Update memory context for learning and AI assistance
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ToolResult, UpdateMemoryParams, AuthContext } from '../types.js';
import { hasResourceAccess } from '../auth.js';

const db = getFirestore();

// Validation schema
const UpdateMemorySchema = z.object({
  context: z.object({
    scope: z.enum(['player', 'team', 'system'], { errorMap: () => ({ message: 'Scope must be player, team, or system' }) }),
    key: z.string().min(1, 'Key is required').max(100, 'Key too long'),
    value: z.any() // Allow any value type
  })
});

/**
 * Update memory context for learning
 */
export async function updateMemory(
  params: any,
  auth: AuthContext
): Promise<ToolResult<{ ok: true }>> {
  try {
    // Validate input parameters
    const validatedParams = UpdateMemorySchema.parse(params);
    const { context } = validatedParams;

    // Check authorization based on scope
    if (!await checkMemoryAccess(auth, context)) {
      return {
        ok: false,
        error: 'Insufficient permissions to update memory for this scope'
      };
    }

    // Determine the memory document path
    const memoryPath = getMemoryPath(context, auth);
    
    // Prepare memory data
    const memoryData = {
      key: context.key,
      value: context.value,
      scope: context.scope,
      updatedBy: auth.uid,
      updatedByRole: auth.role,
      updatedAt: FieldValue.serverTimestamp(),
      version: FieldValue.increment(1)
    };

    // Update or create memory document
    const memoryRef = db.collection('memory').doc(memoryPath);
    
    await memoryRef.set({
      ...memoryData,
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // Log memory update for audit
    await logMemoryUpdate({
      memoryPath,
      key: context.key,
      scope: context.scope,
      updatedBy: auth.uid,
      updatedByRole: auth.role,
      timestamp: new Date()
    });

    console.log(`Memory updated: ${context.scope}/${context.key} by ${auth.uid}`);

    return {
      ok: true,
      data: { ok: true }
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }

    console.error('Error in updateMemory:', error);
    return {
      ok: false,
      error: 'Failed to update memory'
    };
  }
}

/**
 * Check if user has permission to update memory for the given context
 */
async function checkMemoryAccess(auth: AuthContext, context: any): Promise<boolean> {
  switch (context.scope) {
    case 'player':
      // Check if user has access to the player
      if (context.key.includes(':')) {
        const playerId = context.key.split(':')[0];
        return hasResourceAccess(auth, 'player', playerId);
      }
      // If no player ID in key, check if user is accessing their own data
      return auth.role === 'athlete' || auth.role === 'coach' || auth.role === 'admin' || auth.role === 'agent-service';

    case 'team':
      // Check if user has access to the team
      if (context.key.includes(':')) {
        const teamId = context.key.split(':')[0];
        return hasResourceAccess(auth, 'team', teamId);
      }
      // If no team ID in key, check if user has team access
      return auth.role === 'coach' || auth.role === 'admin' || auth.role === 'agent-service';

    case 'system':
      // Only admins and agent-service can update system memory
      return auth.role === 'admin' || auth.role === 'agent-service';

    default:
      return false;
  }
}

/**
 * Get the Firestore document path for memory storage
 */
function getMemoryPath(context: any, auth: AuthContext): string {
  const basePath = `memory/${context.scope}`;
  
  switch (context.scope) {
    case 'player':
      if (context.key.includes(':')) {
        const [playerId, ...keyParts] = context.key.split(':');
        return `${basePath}/${playerId}/${keyParts.join(':')}`;
      } else {
        return `${basePath}/${auth.uid}/${context.key}`;
      }

    case 'team':
      if (context.key.includes(':')) {
        const [teamId, ...keyParts] = context.key.split(':');
        return `${basePath}/${teamId}/${keyParts.join(':')}`;
      } else {
        return `${basePath}/${auth.teamId || 'default'}/${context.key}`;
      }

    case 'system':
      return `${basePath}/${context.key}`;

    default:
      throw new Error(`Invalid memory scope: ${context.scope}`);
  }
}

/**
 * Log memory update for audit purposes
 */
async function logMemoryUpdate(logData: {
  memoryPath: string;
  key: string;
  scope: string;
  updatedBy: string;
  updatedByRole: string;
  timestamp: Date;
}): Promise<void> {
  try {
    await db.collection('memory_logs').add({
      ...logData,
      action: 'update'
    });
  } catch (error) {
    console.error('Error logging memory update:', error);
  }
}

/**
 * Get memory value
 */
export async function getMemory(
  scope: string,
  key: string,
  auth: AuthContext
): Promise<ToolResult<{ value: any; version: number; updatedAt: string }>> {
  try {
    // Check authorization
    const context = { scope, key };
    if (!await checkMemoryAccess(auth, context)) {
      return {
        ok: false,
        error: 'Insufficient permissions to access memory for this scope'
      };
    }

    // Get memory document
    const memoryPath = getMemoryPath(context, auth);
    const memoryDoc = await db.collection('memory').doc(memoryPath).get();

    if (!memoryDoc.exists) {
      return {
        ok: false,
        error: 'Memory not found'
      };
    }

    const memoryData = memoryDoc.data()!;

    return {
      ok: true,
      data: {
        value: memoryData.value,
        version: memoryData.version || 1,
        updatedAt: memoryData.updatedAt.toDate().toISOString()
      }
    };

  } catch (error) {
    console.error('Error in getMemory:', error);
    return {
      ok: false,
      error: 'Failed to retrieve memory'
    };
  }
}

/**
 * Delete memory entry
 */
export async function deleteMemory(
  scope: string,
  key: string,
  auth: AuthContext
): Promise<ToolResult<{ ok: true }>> {
  try {
    // Check authorization
    const context = { scope, key };
    if (!await checkMemoryAccess(auth, context)) {
      return {
        ok: false,
        error: 'Insufficient permissions to delete memory for this scope'
      };
    }

    // Only admins and agent-service can delete memory
    if (auth.role !== 'admin' && auth.role !== 'agent-service') {
      return {
        ok: false,
        error: 'Only admins and agents can delete memory entries'
      };
    }

    // Delete memory document
    const memoryPath = getMemoryPath(context, auth);
    await db.collection('memory').doc(memoryPath).delete();

    // Log memory deletion
    await logMemoryUpdate({
      memoryPath,
      key,
      scope,
      updatedBy: auth.uid,
      updatedByRole: auth.role,
      timestamp: new Date()
    });

    console.log(`Memory deleted: ${scope}/${key} by ${auth.uid}`);

    return {
      ok: true,
      data: { ok: true }
    };

  } catch (error) {
    console.error('Error in deleteMemory:', error);
    return {
      ok: false,
      error: 'Failed to delete memory'
    };
  }
}

/**
 * List memory entries for a scope
 */
export async function listMemory(
  scope: string,
  auth: AuthContext,
  limit: number = 50
): Promise<ToolResult<{ entries: Array<{ key: string; value: any; updatedAt: string }> }>> {
  try {
    // Check authorization
    if (scope === 'system' && auth.role !== 'admin' && auth.role !== 'agent-service') {
      return {
        ok: false,
        error: 'Insufficient permissions to list system memory'
      };
    }

    // Build query based on scope and user access
    let query = db.collection('memory').where('scope', '==', scope);

    if (scope === 'player' && auth.role === 'athlete') {
      // Athletes can only see their own memory
      query = query.where('updatedBy', '==', auth.uid);
    } else if (scope === 'team' && auth.role === 'coach') {
      // Coaches can only see their team's memory
      query = query.where('updatedBy', 'in', [auth.uid, 'agent-service']);
    }

    const snapshot = await query
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();

    const entries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        key: data.key,
        value: data.value,
        updatedAt: data.updatedAt.toDate().toISOString()
      };
    });

    return {
      ok: true,
      data: { entries }
    };

  } catch (error) {
    console.error('Error in listMemory:', error);
    return {
      ok: false,
      error: 'Failed to list memory entries'
    };
  }
}
