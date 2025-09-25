"use strict";
/**
 * Background Reporting Agent
 * Generates weekly performance reports for teams automatically
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
exports.generateTeamReport = exports.generateWeeklyReports = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const client_1 = require("../memory/client");
const kpi_js_1 = require("./shared/kpi.js");
const memory_js_1 = require("./shared/memory.js");
const memoryClient = (0, client_1.adminMemoryClient)();
/**
 * Scheduled function: Generate weekly reports every Sunday at 6 PM
 */
exports.generateWeeklyReports = (0, scheduler_1.onSchedule)({
    schedule: '0 18 * * 0',
    timeZone: 'America/New_York'
}, async (event) => {
    logger.info('Starting weekly report generation', {
        timestamp: new Date().toISOString()
    });
    try {
        // Get all active teams
        const teamsSnapshot = await client_1.db.collection('teams').get();
        if (teamsSnapshot.empty) {
            logger.info('No teams found for report generation');
            return;
        }
        const reportPromises = teamsSnapshot.docs.map(async (teamDoc) => {
            const teamId = teamDoc.id;
            const teamData = teamDoc.data();
            try {
                await generateTeamWeeklyReport(teamId, teamData);
            }
            catch (error) {
                logger.error('Error generating report for team', {
                    teamId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        await Promise.allSettled(reportPromises);
        logger.info('Weekly report generation completed', {
            teamCount: teamsSnapshot.size,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger.error('Error in weekly report generation', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Manual trigger: Generate report for specific team
 */
exports.generateTeamReport = (0, https_1.onCall)(async (request) => {
    try {
        const { teamId, weekRange } = request.data;
        if (!teamId) {
            throw new Error('Team ID is required');
        }
        // Get team data
        const teamDoc = await client_1.db.collection('teams').doc(teamId).get();
        if (!teamDoc.exists) {
            throw new Error('Team not found');
        }
        const teamData = teamDoc.data();
        // Generate report
        const reportResult = await generateTeamWeeklyReport(teamId, teamData, weekRange);
        return {
            success: true,
            reportId: reportResult.reportId,
            message: 'Report generated successfully'
        };
    }
    catch (error) {
        logger.error('Error in manual report generation', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw new Error('Failed to generate report');
    }
});
/**
 * Generate weekly report for a specific team
 */
async function generateTeamWeeklyReport(teamId, teamData, customWeekRange) {
    try {
        // Determine week range
        const weekRange = customWeekRange || getLastWeekRange();
        logger.info('Generating team weekly report', {
            teamId,
            teamName: teamData.name,
            weekRange: {
                from: weekRange.from.toISOString(),
                to: weekRange.to.toISOString()
            }
        });
        // 1. Process pending submissions
        await processPendingSubmissions(teamId, weekRange);
        // 2. Calculate team KPIs
        const teamKPIs = await (0, kpi_js_1.calculateTeamKPIs)(teamId, weekRange);
        // 3. Get player performance data
        const playerData = await getPlayerPerformanceData(teamId, weekRange);
        // 4. Generate report content
        const reportContent = await generateReportContent(teamId, teamData, teamKPIs, playerData, weekRange);
        // 5. Store report
        const reportId = await storeReport(teamId, reportContent, weekRange);
        // 6. Send notifications
        await sendReportNotifications(teamId, teamData, reportId);
        // 7. Update memory
        await updateReportMemory(teamId, reportId, teamKPIs, weekRange);
        // Log agent activity
        await (0, memory_js_1.logAgentActivity)('reporting-agent', 'weekly_report_generated', {
            teamId,
            reportId,
            weekRange,
            playerCount: playerData.length,
            kpiCount: teamKPIs ? Object.keys(teamKPIs.averageStats || {}).length : 0
        }, true);
        const reportUrl = `https://sportbeacon-ai.web.app/reports/${reportId}`;
        logger.info('Team weekly report generated successfully', {
            teamId,
            reportId,
            reportUrl
        });
        return { reportId, reportUrl };
    }
    catch (error) {
        logger.error('Error generating team weekly report', {
            teamId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
/**
 * Process pending submissions for the team
 */
async function processPendingSubmissions(teamId, weekRange) {
    try {
        const pendingSubmissions = await client_1.db
            .collection('stats_submissions')
            .where('teamId', '==', teamId)
            .where('status', '==', 'pending')
            .where('submittedAt', '>=', weekRange.from)
            .where('submittedAt', '<=', weekRange.to)
            .get();
        logger.info('Processing pending submissions', {
            teamId,
            pendingCount: pendingSubmissions.size
        });
        // Process each pending submission
        for (const submissionDoc of pendingSubmissions.docs) {
            const submissionData = submissionDoc.data();
            // Simulate verification (in real implementation, this would call the verification agent)
            await client_1.db.collection('stats_submissions').doc(submissionDoc.id).update({
                status: 'verified',
                verifiedAt: firestore_1.FieldValue.serverTimestamp(),
                verifiedBy: 'reporting-agent',
                verificationNotes: 'Auto-verified during report generation'
            });
        }
    }
    catch (error) {
        logger.error('Error processing pending submissions', {
            teamId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
/**
 * Get player performance data for the team
 */
async function getPlayerPerformanceData(teamId, weekRange) {
    try {
        // Get all players in the team
        const playersSnapshot = await client_1.db
            .collection('players')
            .where('teamId', '==', teamId)
            .get();
        const playerData = [];
        for (const playerDoc of playersSnapshot.docs) {
            const playerId = playerDoc.id;
            const playerInfo = playerDoc.data();
            // Get verified stats for the week
            const statsSnapshot = await client_1.db
                .collection('players')
                .doc(playerId)
                .collection('stats')
                .where('verified', '==', true)
                .where('timestamp', '>=', weekRange.from)
                .where('timestamp', '<=', weekRange.to)
                .get();
            const stats = statsSnapshot.docs.map(doc => {
                const statData = doc.data();
                return {
                    type: statData.type,
                    value: statData.value,
                    unit: statData.unit,
                    timestamp: statData.timestamp.toDate().toISOString()
                };
            });
            // Get player KPIs
            const kpiDoc = await client_1.db
                .collection('players')
                .doc(playerId)
                .collection('kpis')
                .doc('summary')
                .get();
            const kpis = kpiDoc.exists ? kpiDoc.data() : {};
            playerData.push({
                playerId,
                playerName: `${playerInfo.firstName || ''} ${playerInfo.lastName || ''}`.trim(),
                stats,
                kpis
            });
        }
        return playerData;
    }
    catch (error) {
        logger.error('Error getting player performance data', {
            teamId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return [];
    }
}
/**
 * Generate report content
 */
async function generateReportContent(teamId, teamData, teamKPIs, playerData, weekRange) {
    const weekStart = weekRange.from.toLocaleDateString();
    const weekEnd = weekRange.to.toLocaleDateString();
    const title = `Weekly Performance Report - ${teamData.name}`;
    const summary = `Performance report for ${teamData.name} covering ${weekStart} to ${weekEnd}. ` +
        `Team participation: ${teamKPIs?.participationRate?.toFixed(1) || 0}%. ` +
        `Total active players: ${playerData.length}.`;
    // Generate player highlights
    const playerHighlights = playerData
        .filter(player => player.stats.length > 0)
        .map(player => {
        const bestStat = player.stats.reduce((best, current) => {
            const isTimeStat = current.type.includes('time');
            if (isTimeStat) {
                return current.value < best.value ? current : best;
            }
            else {
                return current.value > best.value ? current : best;
            }
        }, player.stats[0]);
        return {
            playerName: player.playerName,
            highlight: `${bestStat.type}: ${bestStat.value} ${bestStat.unit}`,
            statCount: player.stats.length
        };
    })
        .slice(0, 5); // Top 5 highlights
    // Generate recommendations
    const recommendations = generateRecommendations(teamKPIs, playerData);
    return {
        title,
        summary,
        teamKPIs,
        playerHighlights,
        recommendations,
        generatedAt: new Date().toISOString()
    };
}
/**
 * Generate recommendations based on team performance
 */
function generateRecommendations(teamKPIs, playerData) {
    const recommendations = [];
    if (teamKPIs?.participationRate < 70) {
        recommendations.push('Consider implementing engagement strategies to improve team participation rates.');
    }
    const activePlayers = playerData.filter(player => player.stats.length > 0).length;
    if (activePlayers < playerData.length * 0.8) {
        recommendations.push('Some players may need additional motivation or support to submit their performance data.');
    }
    if (teamKPIs?.averageStats) {
        const timeStats = Object.keys(teamKPIs.averageStats).filter(stat => stat.includes('time'));
        if (timeStats.length > 0) {
            recommendations.push('Focus on speed and agility training to improve time-based performance metrics.');
        }
    }
    if (recommendations.length === 0) {
        recommendations.push('Great job this week! Continue maintaining consistent performance tracking.');
    }
    return recommendations;
}
/**
 * Store report in Firestore
 */
async function storeReport(teamId, reportContent, weekRange) {
    try {
        const reportData = {
            teamId,
            ...reportContent,
            weekRange: {
                from: weekRange.from.toISOString(),
                to: weekRange.to.toISOString()
            },
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            createdBy: 'reporting-agent',
            status: 'completed',
            type: 'weekly_performance'
        };
        const reportRef = await client_1.db.collection('team_reports').add(reportData);
        return reportRef.id;
    }
    catch (error) {
        logger.error('Error storing report', {
            teamId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
}
/**
 * Send report notifications
 */
async function sendReportNotifications(teamId, teamData, reportId) {
    try {
        // Notify coaches
        const coachesSnapshot = await client_1.db
            .collection('users')
            .where('teamId', '==', teamId)
            .where('role', '==', 'coach')
            .get();
        for (const coachDoc of coachesSnapshot.docs) {
            await client_1.db.collection('notifications').add({
                userId: coachDoc.id,
                message: `Weekly performance report for ${teamData.name} is ready!`,
                type: 'report_ready',
                data: { reportId, teamId },
                sentAt: firestore_1.FieldValue.serverTimestamp(),
                read: false
            });
        }
        // Store notification log
        await client_1.db.collection('notification_logs').add({
            type: 'weekly_report',
            teamId,
            reportId,
            recipientCount: coachesSnapshot.size,
            sentAt: firestore_1.FieldValue.serverTimestamp(),
            sentBy: 'reporting-agent'
        });
        logger.info('Report notifications sent', {
            teamId,
            reportId,
            coachCount: coachesSnapshot.size
        });
    }
    catch (error) {
        logger.error('Error sending report notifications', {
            teamId,
            reportId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
/**
 * Update memory with report data
 */
async function updateReportMemory(teamId, reportId, teamKPIs, weekRange) {
    try {
        await (0, memory_js_1.storeAgentMemory)({
            agentId: 'reporting-agent',
            agentType: 'reporting',
            scope: 'team',
            key: `weekly_report_${teamId}_${weekRange.from.toISOString().split('T')[0]}`,
            value: {
                reportId,
                teamId,
                weekRange,
                teamKPIs,
                generatedAt: new Date().toISOString()
            },
            metadata: {
                reportType: 'weekly_performance',
                agentVersion: '1.0'
            }
        });
        // Update team reporting history
        await memoryClient.remember({
            scope: 'team',
            key: `reporting_history_${teamId}`,
            value: {
                teamId,
                lastReportGenerated: new Date().toISOString(),
                reportId,
                weekRange,
                participationRate: teamKPIs?.participationRate || 0
            }
        });
    }
    catch (error) {
        logger.error('Error updating report memory', {
            teamId,
            reportId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
/**
 * Get last week's date range
 */
function getLastWeekRange() {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // Start of last week (Monday)
    const from = new Date(lastWeek);
    from.setDate(from.getDate() - from.getDay() + 1);
    from.setHours(0, 0, 0, 0);
    // End of last week (Sunday)
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    to.setHours(23, 59, 59, 999);
    return { from, to };
}
//# sourceMappingURL=reportingAgent.js.map