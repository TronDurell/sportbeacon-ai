"use strict";
/**
 * Shared KPI Utilities for Agents
 * Provides common KPI calculation and update functions
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
exports.getCachedKPICalculation = exports.updateTeamKPIs = exports.updatePlayerKPIs = exports.calculateTeamKPIs = exports.calculatePlayerStatKPIs = void 0;
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const db = (0, firestore_1.getFirestore)();
/**
 * Calculate KPIs for a player's stat
 */
async function calculatePlayerStatKPIs(playerId, statType, timeRange) {
    try {
        // Get player and team information
        const playerDoc = await db.collection('players').doc(playerId).get();
        if (!playerDoc.exists) {
            logger.error('Player not found', { playerId });
            return null;
        }
        const playerData = playerDoc.data();
        const teamId = playerData.teamId;
        // Get verified stats for the time range
        const statsSnapshot = await db
            .collection('players')
            .doc(playerId)
            .collection('stats')
            .where('type', '==', statType)
            .where('verified', '==', true)
            .where('timestamp', '>=', timeRange.from)
            .where('timestamp', '<=', timeRange.to)
            .orderBy('timestamp', 'desc')
            .get();
        if (statsSnapshot.empty) {
            logger.warn('No verified stats found for KPI calculation', { playerId, statType });
            return null;
        }
        const stats = statsSnapshot.docs.map(doc => ({
            value: doc.data().value,
            timestamp: doc.data().timestamp.toDate()
        }));
        // Calculate KPIs
        const values = stats.map(stat => stat.value);
        const current = values[0]; // Most recent
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        const best = statType.includes('time') ? Math.min(...values) : Math.max(...values);
        // Calculate trend
        const trend = calculateTrend(values);
        const change = calculateChange(values);
        const consistency = calculateConsistency(values);
        const result = {
            playerId,
            teamId,
            statType,
            kpis: {
                current,
                average,
                best,
                trend,
                change,
                consistency
            },
            calculatedAt: new Date()
        };
        // Cache the result
        await cacheKPICalculation(result);
        logger.info('Player stat KPIs calculated', {
            playerId,
            statType,
            current,
            average,
            best,
            trend
        });
        return result;
    }
    catch (error) {
        logger.error('Error calculating player stat KPIs', {
            playerId,
            statType,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
    }
}
exports.calculatePlayerStatKPIs = calculatePlayerStatKPIs;
/**
 * Calculate team KPIs
 */
async function calculateTeamKPIs(teamId, timeRange) {
    try {
        // Get all players in the team
        const playersSnapshot = await db
            .collection('players')
            .where('teamId', '==', teamId)
            .get();
        if (playersSnapshot.empty) {
            logger.warn('No players found for team', { teamId });
            return null;
        }
        const playerIds = playersSnapshot.docs.map(doc => doc.id);
        const totalPlayers = playerIds.length;
        // Get stats for all players in the time range
        const teamStats = {};
        const playerStats = {};
        let activePlayers = 0;
        for (const playerId of playerIds) {
            const statsSnapshot = await db
                .collection('players')
                .doc(playerId)
                .collection('stats')
                .where('verified', '==', true)
                .where('timestamp', '>=', timeRange.from)
                .where('timestamp', '<=', timeRange.to)
                .get();
            if (!statsSnapshot.empty) {
                activePlayers++;
                playerStats[playerId] = {};
                statsSnapshot.docs.forEach(doc => {
                    const statData = doc.data();
                    const statType = statData.type;
                    const value = statData.value;
                    if (!teamStats[statType]) {
                        teamStats[statType] = [];
                    }
                    teamStats[statType].push(value);
                    playerStats[playerId][statType] = value;
                });
            }
        }
        // Calculate team averages
        const averageStats = {};
        Object.entries(teamStats).forEach(([statType, values]) => {
            averageStats[statType] = values.reduce((sum, val) => sum + val, 0) / values.length;
        });
        // Find top performers for each stat type
        const topPerformers = {};
        Object.entries(teamStats).forEach(([statType, values]) => {
            const isTimeStat = statType.includes('time');
            const bestValue = isTimeStat ? Math.min(...values) : Math.max(...values);
            // Find player with best value
            const topPlayer = Object.entries(playerStats).find(([, stats]) => stats[statType] === bestValue);
            if (topPlayer) {
                topPerformers[statType] = {
                    playerId: topPlayer[0],
                    value: bestValue
                };
            }
        });
        const participationRate = totalPlayers > 0 ? (activePlayers / totalPlayers) * 100 : 0;
        const result = {
            teamId,
            totalPlayers,
            activePlayers,
            participationRate,
            averageStats,
            topPerformers,
            calculatedAt: new Date()
        };
        // Cache the result
        await cacheTeamKPIs(result);
        logger.info('Team KPIs calculated', {
            teamId,
            totalPlayers,
            activePlayers,
            participationRate
        });
        return result;
    }
    catch (error) {
        logger.error('Error calculating team KPIs', {
            teamId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
    }
}
exports.calculateTeamKPIs = calculateTeamKPIs;
/**
 * Update player KPIs in Firestore
 */
async function updatePlayerKPIs(playerId, statType, kpis) {
    try {
        const kpiDoc = {
            playerId,
            statType,
            kpis,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            updatedBy: 'agent-system'
        };
        await db
            .collection('players')
            .doc(playerId)
            .collection('kpis')
            .doc(statType)
            .set(kpiDoc, { merge: true });
        // Update player's overall KPI summary
        await updatePlayerKPISummary(playerId);
        logger.info('Player KPIs updated', { playerId, statType });
    }
    catch (error) {
        logger.error('Error updating player KPIs', {
            playerId,
            statType,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
exports.updatePlayerKPIs = updatePlayerKPIs;
/**
 * Update team KPIs in Firestore
 */
async function updateTeamKPIs(teamId, kpis) {
    try {
        const kpiDoc = {
            teamId,
            kpis,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            updatedBy: 'agent-system'
        };
        await db
            .collection('teams')
            .doc(teamId)
            .collection('kpis')
            .doc('summary')
            .set(kpiDoc, { merge: true });
        logger.info('Team KPIs updated', { teamId });
    }
    catch (error) {
        logger.error('Error updating team KPIs', {
            teamId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
exports.updateTeamKPIs = updateTeamKPIs;
/**
 * Calculate trend from values array
 */
function calculateTrend(values) {
    if (values.length < 2)
        return 'stable';
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (change > 5)
        return 'up';
    if (change < -5)
        return 'down';
    return 'stable';
}
/**
 * Calculate percentage change
 */
function calculateChange(values) {
    if (values.length < 2)
        return 0;
    const first = values[values.length - 1]; // Oldest
    const last = values[0]; // Newest
    return ((last - first) / first) * 100;
}
/**
 * Calculate consistency score (lower coefficient of variation = more consistent)
 */
function calculateConsistency(values) {
    if (values.length === 0)
        return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    if (mean === 0)
        return 0;
    const coefficientOfVariation = standardDeviation / mean;
    return Math.max(0, 100 - (coefficientOfVariation * 100));
}
/**
 * Cache KPI calculation result
 */
async function cacheKPICalculation(result) {
    try {
        await db.collection('kpi_cache').add({
            ...result,
            cachedAt: firestore_1.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
    }
    catch (error) {
        logger.error('Error caching KPI calculation', { error });
    }
}
/**
 * Cache team KPIs
 */
async function cacheTeamKPIs(result) {
    try {
        await db.collection('team_kpi_cache').add({
            ...result,
            cachedAt: firestore_1.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
    }
    catch (error) {
        logger.error('Error caching team KPIs', { error });
    }
}
/**
 * Update player KPI summary
 */
async function updatePlayerKPISummary(playerId) {
    try {
        const kpisSnapshot = await db
            .collection('players')
            .doc(playerId)
            .collection('kpis')
            .get();
        const summary = {
            totalStats: kpisSnapshot.size,
            lastUpdated: firestore_1.FieldValue.serverTimestamp(),
            overallPerformance: 0 // This would be calculated based on all KPIs
        };
        await db
            .collection('players')
            .doc(playerId)
            .collection('kpis')
            .doc('summary')
            .set(summary, { merge: true });
    }
    catch (error) {
        logger.error('Error updating player KPI summary', { playerId, error });
    }
}
/**
 * Get cached KPI calculation
 */
async function getCachedKPICalculation(playerId, statType, timeRange) {
    try {
        const snapshot = await db
            .collection('kpi_cache')
            .where('playerId', '==', playerId)
            .where('statType', '==', statType)
            .where('calculatedAt', '>=', timeRange.from)
            .where('calculatedAt', '<=', timeRange.to)
            .orderBy('calculatedAt', 'desc')
            .limit(1)
            .get();
        if (snapshot.empty) {
            return null;
        }
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
            playerId: data.playerId,
            teamId: data.teamId,
            statType: data.statType,
            kpis: data.kpis,
            calculatedAt: data.calculatedAt.toDate()
        };
    }
    catch (error) {
        logger.error('Error getting cached KPI calculation', { playerId, statType, error });
        return null;
    }
}
exports.getCachedKPICalculation = getCachedKPICalculation;
//# sourceMappingURL=kpi.js.map