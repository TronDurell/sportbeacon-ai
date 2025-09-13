/**
 * Get Player Stats Tool
 * Retrieves player statistics for a given date range
 */

import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ToolResult, GetPlayerStatsParams, AuthContext, Stat } from '../types.js';
import { hasResourceAccess } from '../auth.js';

const db = getFirestore();

// Validation schema
const GetPlayerStatsSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  range: z.object({
    from: z.string().datetime('Invalid from date'),
    to: z.string().datetime('Invalid to date')
  })
});

/**
 * Get player statistics for a date range
 */
export async function getPlayerStats(
  params: any,
  auth: AuthContext
): Promise<ToolResult<{ stats: Stat[] }>> {
  try {
    // Validate input parameters
    const validatedParams = GetPlayerStatsSchema.parse(params);
    const { playerId, range } = validatedParams;

    // Check authorization
    if (!hasResourceAccess(auth, 'player', playerId)) {
      return {
        ok: false,
        error: 'Insufficient permissions to access player data'
      };
    }

    // Convert date strings to Firestore timestamps
    const fromDate = new Date(range.from);
    const toDate = new Date(range.to);

    // Validate date range
    if (fromDate >= toDate) {
      return {
        ok: false,
        error: 'Invalid date range: from date must be before to date'
      };
    }

    // Check if date range is not too large (max 1 year)
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (toDate.getTime() - fromDate.getTime() > maxRangeMs) {
      return {
        ok: false,
        error: 'Date range too large: maximum 1 year allowed'
      };
    }

    // Query player stats from Firestore
    const statsSnapshot = await db
      .collection('players')
      .doc(playerId)
      .collection('stats')
      .where('timestamp', '>=', fromDate)
      .where('timestamp', '<=', toDate)
      .orderBy('timestamp', 'desc')
      .get();

    // Convert Firestore documents to Stat objects
    const stats: Stat[] = statsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        playerId,
        type: data.type,
        value: data.value,
        unit: data.unit,
        timestamp: data.timestamp.toDate().toISOString(),
        verified: data.verified || false,
        metadata: data.metadata || {}
      };
    });

    // Apply additional filtering based on user role
    let filteredStats = stats;
    
    if (auth.role === 'athlete' && auth.uid !== playerId) {
      // Athletes can only see their own stats
      return {
        ok: false,
        error: 'Athletes can only access their own statistics'
      };
    }

    if (auth.role === 'coach') {
      // Coaches can see all stats for their team players
      // Additional team membership check would be implemented here
    }

    return {
      ok: true,
      data: {
        stats: filteredStats
      }
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }

    console.error('Error in getPlayerStats:', error);
    return {
      ok: false,
      error: 'Failed to retrieve player statistics'
    };
  }
}
