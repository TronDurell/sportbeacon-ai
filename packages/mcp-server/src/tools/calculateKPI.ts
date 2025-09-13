/**
 * Calculate KPI Tool
 * Calculate KPIs for a player or team
 */

import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ToolResult, CalculateKPIParams, AuthContext, KPIMap } from '../types.js';
import { hasResourceAccess } from '../auth.js';

const db = getFirestore();

// Validation schema
const CalculateKPISchema = z.object({
  target: z.string().min(1, 'Target ID is required'),
  range: z.object({
    from: z.string().datetime('Invalid from date'),
    to: z.string().datetime('Invalid to date')
  })
});

/**
 * Calculate KPIs for a player or team
 */
export async function calculateKPI(
  params: any,
  auth: AuthContext
): Promise<ToolResult<{ kpis: KPIMap }>> {
  try {
    // Validate input parameters
    const validatedParams = CalculateKPISchema.parse(params);
    const { target, range } = validatedParams;

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

    // Determine if target is a player or team
    const isPlayer = await isPlayerId(target);
    const isTeam = await isTeamId(target);

    if (!isPlayer && !isTeam) {
      return {
        ok: false,
        error: 'Target ID not found (not a valid player or team)'
      };
    }

    // Check authorization
    if (isPlayer && !hasResourceAccess(auth, 'player', target)) {
      return {
        ok: false,
        error: 'Insufficient permissions to access player data'
      };
    }

    if (isTeam && !hasResourceAccess(auth, 'team', target)) {
      return {
        ok: false,
        error: 'Insufficient permissions to access team data'
      };
    }

    let kpis: KPIMap;

    if (isPlayer) {
      kpis = await calculatePlayerKPIs(target, fromDate, toDate);
    } else {
      kpis = await calculateTeamKPIs(target, fromDate, toDate);
    }

    // Cache the results for future use
    await cacheKPIResults(target, range, kpis, auth.uid);

    return {
      ok: true,
      data: { kpis }
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      };
    }

    console.error('Error in calculateKPI:', error);
    return {
      ok: false,
      error: 'Failed to calculate KPIs'
    };
  }
}

/**
 * Check if ID is a valid player
 */
async function isPlayerId(id: string): Promise<boolean> {
  try {
    const doc = await db.collection('players').doc(id).get();
    return doc.exists;
  } catch (error) {
    return false;
  }
}

/**
 * Check if ID is a valid team
 */
async function isTeamId(id: string): Promise<boolean> {
  try {
    const doc = await db.collection('teams').doc(id).get();
    return doc.exists;
  } catch (error) {
    return false;
  }
}

/**
 * Calculate KPIs for a specific player
 */
async function calculatePlayerKPIs(playerId: string, fromDate: Date, toDate: Date): Promise<KPIMap> {
  const kpis: KPIMap = {};

  try {
    // Get verified stats for the player in the date range
    const statsSnapshot = await db
      .collection('players')
      .doc(playerId)
      .collection('stats')
      .where('verified', '==', true)
      .where('timestamp', '>=', fromDate)
      .where('timestamp', '<=', toDate)
      .get();

    const stats = statsSnapshot.docs.map(doc => doc.data());

    // Group stats by type
    const statsByType = stats.reduce((acc, stat) => {
      if (!acc[stat.type]) {
        acc[stat.type] = [];
      }
      acc[stat.type].push(stat.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate KPIs for each stat type
    for (const [statType, values] of Object.entries(statsByType)) {
      if (!Array.isArray(values) || values.length === 0) continue;

      const sortedValues = [...values].sort((a, b) => a - b);
      const average = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
      const median = sortedValues[Math.floor(sortedValues.length / 2)];
      const min = sortedValues[0];
      const max = sortedValues[sortedValues.length - 1];

      // Calculate trend (compare with previous period)
      const previousPeriod = await getPreviousPeriodStats(playerId, statType, fromDate, toDate);
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let change = 0;

      if (previousPeriod.length > 0) {
        const previousAverage = previousPeriod.reduce((sum, val) => sum + val, 0) / previousPeriod.length;
        change = ((average - previousAverage) / previousAverage) * 100;
        
        if (change > 5) trend = 'up';
        else if (change < -5) trend = 'down';
        else trend = 'stable';
      }

      // Store KPI based on stat type
      if (statType.includes('time') || statType.includes('run')) {
        // For time-based stats, lower is better
        kpis[`${statType}_best`] = {
          value: min,
          trend: trend === 'up' ? 'down' : trend === 'down' ? 'up' : 'stable',
          change: -change,
          period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
        };
      } else {
        // For other stats, higher is better
        kpis[`${statType}_best`] = {
          value: max,
          trend,
          change,
          period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
        };
      }

      kpis[`${statType}_average`] = {
        value: average,
        trend,
        change,
        period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
      };

      kpis[`${statType}_consistency`] = {
        value: calculateConsistency(values),
        trend: 'stable',
        change: 0,
        period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
      };
    }

    // Calculate overall performance score
    kpis.overall_performance = {
      value: calculateOverallPerformanceScore(kpis),
      trend: 'stable',
      change: 0,
      period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
    };

  } catch (error) {
    console.error('Error calculating player KPIs:', error);
  }

  return kpis;
}

/**
 * Calculate KPIs for a team
 */
async function calculateTeamKPIs(teamId: string, fromDate: Date, toDate: Date): Promise<KPIMap> {
  const kpis: KPIMap = {};

  try {
    // Get all players in the team
    const playersSnapshot = await db
      .collection('players')
      .where('teamId', '==', teamId)
      .get();

    const playerIds = playersSnapshot.docs.map(doc => doc.id);
    
    if (playerIds.length === 0) {
      return kpis;
    }

    // Get all verified stats for team players in the date range
    const teamStats: any[] = [];
    
    for (const playerId of playerIds) {
      const statsSnapshot = await db
        .collection('players')
        .doc(playerId)
        .collection('stats')
        .where('verified', '==', true)
        .where('timestamp', '>=', fromDate)
        .where('timestamp', '<=', toDate)
        .get();

      teamStats.push(...statsSnapshot.docs.map(doc => ({ ...doc.data(), playerId })));
    }

    // Group stats by type
    const statsByType = teamStats.reduce((acc, stat) => {
      if (!acc[stat.type]) {
        acc[stat.type] = [];
      }
      acc[stat.type].push(stat.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate team KPIs
    for (const [statType, values] of Object.entries(statsByType)) {
      if (!Array.isArray(values) || values.length === 0) continue;

      const average = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
      const sortedValues = [...values].sort((a, b) => a - b);
      const median = sortedValues[Math.floor(sortedValues.length / 2)];

      kpis[`team_${statType}_average`] = {
        value: average,
        trend: 'stable',
        change: 0,
        period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
      };

      kpis[`team_${statType}_median`] = {
        value: median,
        trend: 'stable',
        change: 0,
        period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
      };
    }

    // Calculate team participation
    const activePlayers = new Set(teamStats.map(stat => stat.playerId)).size;
    kpis.team_participation = {
      value: (activePlayers / playerIds.length) * 100,
      trend: 'stable',
      change: 0,
      period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
    };

  } catch (error) {
    console.error('Error calculating team KPIs:', error);
  }

  return kpis;
}

/**
 * Get stats from previous period for trend calculation
 */
async function getPreviousPeriodStats(playerId: string, statType: string, fromDate: Date, toDate: Date): Promise<number[]> {
  try {
    const periodLength = toDate.getTime() - fromDate.getTime();
    const previousFromDate = new Date(fromDate.getTime() - periodLength);
    const previousToDate = new Date(fromDate.getTime());

    const statsSnapshot = await db
      .collection('players')
      .doc(playerId)
      .collection('stats')
      .where('type', '==', statType)
      .where('verified', '==', true)
      .where('timestamp', '>=', previousFromDate)
      .where('timestamp', '<=', previousToDate)
      .get();

    return statsSnapshot.docs.map(doc => doc.data().value);
  } catch (error) {
    console.error('Error getting previous period stats:', error);
    return [];
  }
}

/**
 * Calculate consistency score (lower coefficient of variation = more consistent)
 */
function calculateConsistency(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  if (mean === 0) return 0;
  
  const coefficientOfVariation = standardDeviation / mean;
  return Math.max(0, 100 - (coefficientOfVariation * 100));
}

/**
 * Calculate overall performance score
 */
function calculateOverallPerformanceScore(kpis: KPIMap): number {
  const performanceKPIs = Object.entries(kpis)
    .filter(([key]) => key.includes('_best') || key.includes('_average'))
    .map(([, kpi]) => kpi.value);

  if (performanceKPIs.length === 0) return 0;

  // Normalize and average the performance scores
  const normalizedScores = performanceKPIs.map(score => Math.min(100, Math.max(0, score)));
  return normalizedScores.reduce((sum, score) => sum + score, 0) / normalizedScores.length;
}

/**
 * Cache KPI results for future use
 */
async function cacheKPIResults(target: string, range: any, kpis: KPIMap, calculatedBy: string): Promise<void> {
  try {
    await db.collection('kpi_cache').add({
      target,
      range,
      kpis,
      calculatedAt: new Date(),
      calculatedBy,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
  } catch (error) {
    console.error('Error caching KPI results:', error);
  }
}
