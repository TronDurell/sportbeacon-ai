"use strict";
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
exports.updateTeamPerformance = exports.getTeamSchedule = exports.getTeamStatistics = exports.removePlayerFromTeam = exports.addPlayerToTeam = exports.getTeamRoster = exports.updateTeam = exports.createTeam = void 0;
const https_1 = require("firebase-functions/v2/https");
// Removed unused import
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const types_1 = require("../types");
const client_1 = require("../memory/client");
const http_1 = require("../lib/http");
const validate_1 = require("../lib/validate");
const validate_2 = require("../lib/validate");
// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = (0, firestore_1.getFirestore)();
const memoryClient = (0, client_1.adminMemoryClient)();
// Helper function to validate user authentication
const validateAuth = async (context) => {
    if (!context || !context.auth || !(0, types_1.isAuthContext)(context.auth)) {
        throw new Error("Unauthorized: User not authenticated");
    }
    return context.auth;
};
// Helper function to validate Rec Director role
const validateRecDirector = async (context) => {
    if (!context.auth) {
        throw new Error("Unauthorized: User not authenticated");
    }
    const staffDoc = await db.collection("townStaff").doc(context.auth.uid).get();
    if (!staffDoc.exists || !staffDoc.data()?.isActive || staffDoc.data()?.role !== "RecDirector") {
        throw new Error("Unauthorized: User is not Rec Director");
    }
    return { auth: context.auth, staffData: staffDoc.data() };
};
/**
 * Team Function: Create Team
 * Creates a new team with basic information
 */
exports.createTeam = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.createTeamSchema, req.body);
        const { teamData } = validatedData;
        logger.info("Team creation requested", {
            teamName: teamData?.name,
            requestId
        });
        // TODO: Implement team creation
        // - Validate team data (name, league, age group)
        // - Check for duplicate team names
        // - Create team document in Firestore
        // - Initialize team roster and statistics
        // - Assign coach if specified
        // - Send notifications to relevant staff
        // - Log creation activity
        const team = {
            id: `team_${Date.now()}`,
            ...teamData,
            createdAt: new Date(),
            status: "active",
            roster: [],
            stats: {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                ties: 0,
                totalPoints: 0,
            },
        };
        // Store team
        await db.collection("teams").doc(team.id).set(team);
        res.status(200).json({
            success: true,
            message: "Team created successfully",
            data: { teamId: team.id },
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
        logger.error('Team creation error:', error, { requestId });
        res.status(500).json({
            error: 'Team creation failed',
            requestId
        });
    }
}));
/**
 * Team Function: Update Team
 * Updates team information and settings
 */
exports.updateTeam = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.updateTeamSchema, req.body);
        const { teamId, updates } = validatedData;
        logger.info("Team update requested", {
            teamId,
            requestId
        });
        // TODO: Implement team updates
        // - Validate team ID and update data
        // - Update team document
        // - Handle roster changes if specified
        // - Update related collections
        // - Send notifications for significant changes
        // - Log all changes
        const teamRef = db.collection("teams").doc(teamId);
        const teamDoc = await teamRef.get();
        if (!teamDoc.exists) {
            throw new Error("Team not found");
        }
        await teamRef.update({
            ...updates,
            updatedAt: new Date(),
        });
        res.status(200).json({
            success: true,
            message: "Team updated successfully",
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
        logger.error('Team update error:', error, { requestId });
        res.status(500).json({
            error: 'Team update failed',
            requestId
        });
    }
}));
/**
 * Team Function: Get Team Roster
 * Retrieves the current roster for a team
 */
exports.getTeamRoster = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate query parameters
        const validatedData = (0, validate_2.validateBody)(validate_1.getTeamRosterSchema, req.query);
        const { teamId } = validatedData;
        logger.info("Team roster requested", {
            teamId,
            requestId
        });
        // TODO: Implement team roster retrieval
        // - Query team document
        // - Get player details for each roster member
        // - Include player statistics and status
        // - Return formatted roster data
        const teamRef = db.collection("teams").doc(teamId);
        const teamDoc = await teamRef.get();
        if (!teamDoc.exists) {
            throw new Error("Team not found");
        }
        const teamData = teamDoc.data();
        const roster = [];
        res.status(200).json({
            success: true,
            message: "Team roster retrieved",
            data: {
                teamId,
                roster,
                totalPlayers: roster.length,
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
        logger.error('Team roster retrieval error:', error, { requestId });
        res.status(500).json({
            error: 'Team roster retrieval failed',
            requestId
        });
    }
}));
/**
 * Team Function: Add Player to Team
 * Adds a player to a team roster
 */
exports.addPlayerToTeam = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.addPlayerToTeamSchema, req.body);
        const { teamId, playerId, position } = validatedData;
        logger.info("Add player to team requested", {
            teamId,
            playerId,
            requestId
        });
        // TODO: Implement add player to team
        // - Validate team and player IDs
        // - Check if player is already on team
        // - Check team roster size limits
        // - Add player to team roster
        // - Update player's team assignment
        // - Send notification to player and coach
        // - Log roster change
        const teamRef = db.collection("teams").doc(teamId);
        const teamDoc = await teamRef.get();
        if (!teamDoc.exists) {
            throw new Error("Team not found");
        }
        res.status(200).json({
            success: true,
            message: "Player added to team successfully",
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
        logger.error('Add player to team error:', error, { requestId });
        res.status(500).json({
            error: 'Add player to team failed',
            requestId
        });
    }
}));
/**
 * Team Function: Remove Player from Team
 * Removes a player from a team roster
 */
exports.removePlayerFromTeam = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.removePlayerFromTeamSchema, req.body);
        const { teamId, playerId, reason } = validatedData;
        logger.info("Remove player from team requested", {
            teamId,
            playerId,
            requestId
        });
        // TODO: Implement remove player from team
        // - Validate team and player IDs
        // - Check if player is on team
        // - Remove player from team roster
        // - Update player's team assignment
        // - Handle waitlist if applicable
        // - Send notification to player and coach
        // - Log roster change
        const teamRef = db.collection("teams").doc(teamId);
        const teamDoc = await teamRef.get();
        if (!teamDoc.exists) {
            throw new Error("Team not found");
        }
        res.status(200).json({
            success: true,
            message: "Player removed from team successfully",
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
        logger.error('Remove player from team error:', error, { requestId });
        res.status(500).json({
            error: 'Remove player from team failed',
            requestId
        });
    }
}));
/**
 * Team Function: Get Team Statistics
 * Retrieves comprehensive statistics for a team
 */
exports.getTeamStatistics = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate query parameters
        const validatedData = (0, validate_2.validateBody)(validate_1.getTeamStatisticsSchema, req.query);
        const { teamId, timeRange } = validatedData;
        logger.info("Team statistics requested", {
            teamId,
            timeRange,
            requestId
        });
        // TODO: Implement team statistics retrieval
        // - Query team's game history
        // - Calculate team performance metrics
        // - Aggregate player statistics
        // - Include trend analysis
        // - Return formatted statistics
        const teamRef = db.collection("teams").doc(teamId);
        const teamDoc = await teamRef.get();
        if (!teamDoc.exists) {
            throw new Error("Team not found");
        }
        const teamData = teamDoc.data();
        // Mock statistics - replace with actual calculation
        const statistics = {
            teamId,
            timeRange,
            gamesPlayed: teamData?.stats?.gamesPlayed || 0,
            wins: teamData?.stats?.wins || 0,
            losses: teamData?.stats?.losses || 0,
            ties: teamData?.stats?.ties || 0,
            totalPoints: teamData?.stats?.totalPoints || 0,
            winPercentage: teamData?.stats?.gamesPlayed > 0 ?
                ((teamData?.stats?.wins || 0) / teamData?.stats?.gamesPlayed * 100).toFixed(1) :
                0,
            rosterSize: teamData?.roster?.length || 0,
            trends: {
                recentPerformance: "improving",
                teamCohesion: "high",
                areasForImprovement: ["defense", "communication"],
            },
        };
        res.status(200).json({
            success: true,
            message: "Team statistics retrieved",
            data: { statistics },
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
        logger.error('Team statistics retrieval error:', error, { requestId });
        res.status(500).json({
            error: 'Team statistics retrieval failed',
            requestId
        });
    }
}));
/**
 * Team Function: Get Team Schedule
 * Retrieves upcoming games and practices for a team
 */
exports.getTeamSchedule = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate query parameters
        const validatedData = (0, validate_2.validateBody)(validate_1.getTeamScheduleSchema, req.query);
        const { teamId, startDate, endDate } = validatedData;
        logger.info("Team schedule requested", {
            teamId,
            startDate,
            endDate,
            requestId
        });
        // TODO: Implement team schedule retrieval
        // - Query team's scheduled events
        // - Get upcoming games and practices
        // - Filter by date range
        // - Include opponent and venue information
        // - Return formatted schedule
        const schedule = [];
        res.status(200).json({
            success: true,
            message: "Team schedule retrieved",
            data: { schedule },
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
        logger.error('Team schedule retrieval error:', error, { requestId });
        res.status(500).json({
            error: 'Team schedule retrieval failed',
            requestId
        });
    }
}));
/**
 * Team Function: Update Team Performance
 * Updates team performance data after a game
 */
exports.updateTeamPerformance = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.updateTeamPerformanceSchema, req.body);
        const { teamId, performanceData } = validatedData;
        logger.info("Team performance update requested", {
            teamId,
            requestId
        });
        // TODO: Implement team performance updates
        // - Validate performance data
        // - Update team statistics
        // - Update individual player stats
        // - Check for achievement triggers
        // - Send performance summary to team
        // - Log performance data
        const teamRef = db.collection("teams").doc(teamId);
        const teamDoc = await teamRef.get();
        if (!teamDoc.exists) {
            throw new Error("Team not found");
        }
        const currentStats = teamDoc.data()?.stats || {};
        const { result, score } = performanceData;
        const newStats = {
            gamesPlayed: currentStats.gamesPlayed + 1,
            wins: currentStats.wins + (result === "win" ? 1 : 0),
            losses: currentStats.losses + (result === "loss" ? 1 : 0),
            ties: currentStats.ties + (result === "tie" ? 1 : 0),
            totalPoints: currentStats.totalPoints + score,
        };
        await teamRef.update({
            "stats": newStats,
            "updatedAt": new Date(),
        });
        // Store game performance
        await db.collection("teamPerformances").add({
            teamId,
            ...performanceData,
            recordedAt: new Date(),
        });
        res.status(200).json({
            success: true,
            message: "Team performance updated successfully",
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
        logger.error('Team performance update error:', error, { requestId });
        res.status(500).json({
            error: 'Team performance update failed',
            requestId
        });
    }
}));
