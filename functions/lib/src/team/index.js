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
const validation_1 = require("../utils/validation");
const client_1 = require("../memory/client");
const zod_1 = require("zod");
// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = (0, firestore_1.getFirestore)();
const memoryClient = (0, client_1.adminMemoryClient)();
// Helper function to validate user authentication
const validateAuth = async (context) => {
    if (!context || !(0, types_1.isAuthContext)(context)) {
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
exports.createTeam = (0, https_1.onCall)(async (data, context) => {
    try {
        const { auth } = await validateRecDirector(context);
        // Validate input using Zod schema
        const createTeamSchema = zod_1.z.object({
            teamData: validation_1.Schemas.CreateTeam
        });
        const validation = validation_1.ValidationMiddleware.validateResponse(createTeamSchema, data);
        if (!validation.success) {
            return {
                success: false,
                message: "Invalid team data",
                data: null,
                errors: validation.errors?.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            };
        }
        const { teamData } = validation.data || {};
        logger.info("Team creation requested", {
            requestedBy: auth.uid,
            teamName: teamData?.name,
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
            id: `team_${Date.now()}_${auth.uid}`,
            ...teamData,
            createdBy: auth.uid,
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
        // Create audit log
        await db.collection("townStaffAuditLogs").add({
            action: "team_created",
            teamId: team.id,
            requestedBy: auth.uid,
            timestamp: new Date(),
            data: teamData,
        });
        const result = {
            success: true,
            message: "Team created successfully",
            data: { teamId: team.id },
        };
        // Capture successful team creation
        try {
            await memoryClient.captureFunctionResult(auth.uid, 'createTeam', {
                teamId: team.id,
                teamName: team.name,
                leagueId: teamData.leagueId || 'unknown'
            }, undefined, 'team-creation');
        }
        catch (memoryError) {
            logger.warn('Failed to capture memory for team creation:', memoryError);
        }
        // Validate response before sending
        const responseValidation = validation_1.ValidationMiddleware.validateResponse(validation_1.Schemas.ApiResponse, result);
        return responseValidation.success ? responseValidation.data : {
            success: false,
            message: "Response validation failed",
            data: null
        };
    }
    catch (err) {
        logger.error("Team creation error", err);
        return { success: false, message: "Team creation failed", error: err };
    }
});
/**
 * Team Function: Update Team
 * Updates team information and settings
 */
exports.updateTeam = (0, https_1.onCall)(async (data, context) => {
    try {
        const { auth } = await validateRecDirector(context);
        // Validate input using Zod schema
        const updateTeamSchema = zod_1.z.object({
            teamId: zod_1.z.string().uuid("Invalid team ID format"),
            updates: validation_1.Schemas.UpdateTeam
        });
        const validation = validation_1.ValidationMiddleware.validateResponse(updateTeamSchema, data);
        if (!validation.success) {
            return {
                success: false,
                message: "Invalid team update data",
                data: null,
                errors: validation.errors?.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            };
        }
        const { teamId, updates } = validation.data || {};
        logger.info("Team update requested", {
            requestedBy: auth.uid,
            teamId,
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
            updatedBy: auth.uid,
            updatedAt: new Date(),
        });
        // Create audit log
        await db.collection("townStaffAuditLogs").add({
            action: "team_updated",
            teamId,
            requestedBy: auth.uid,
            timestamp: new Date(),
            changes: updates,
        });
        const result = {
            success: true,
            message: "Team updated successfully",
        };
        // Validate response before sending
        const responseValidation = validation_1.ValidationMiddleware.validateResponse(validation_1.Schemas.ApiResponse, result);
        return responseValidation.success ? responseValidation.data : {
            success: false,
            message: "Response validation failed",
            data: null
        };
    }
    catch (err) {
        logger.error("Team update error", err);
        return { success: false, message: "Team update failed", error: err };
    }
});
/**
 * Team Function: Get Team Roster
 * Retrieves the current roster for a team
 */
exports.getTeamRoster = (0, https_1.onCall)(async (data, context) => {
    try {
        const auth = await validateAuth(context);
        const { teamId } = data.data;
        logger.info("Team roster requested", {
            uid: auth.uid,
            teamId,
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
        const roster = teamData?.roster || [];
        // Get player details for roster members
        const playerDetails = await Promise.all(roster.map(async (playerId) => {
            const playerDoc = await db.collection("players").doc(playerId).get();
            return playerDoc.exists ? { id: playerId, ...playerDoc.data() } : null;
        }));
        const validPlayers = playerDetails.filter((player) => player !== null);
        return {
            success: true,
            message: "Team roster retrieved",
            data: {
                teamId,
                roster: validPlayers,
                totalPlayers: validPlayers.length,
            },
        };
    }
    catch (err) {
        logger.error("Team roster retrieval error", err);
        return { success: false, message: "Team roster retrieval failed", error: err };
    }
});
/**
 * Team Function: Add Player to Team
 * Adds a player to a team roster
 */
exports.addPlayerToTeam = (0, https_1.onCall)(async (data, context) => {
    try {
        const { auth } = await validateRecDirector(context);
        const { teamId, playerId, position } = data.data;
        logger.info("Add player to team requested", {
            requestedBy: auth.uid,
            teamId,
            playerId,
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
        const teamData = teamDoc.data();
        const currentRoster = teamData?.roster || [];
        if (currentRoster.includes(playerId)) {
            throw new Error("Player is already on this team");
        }
        // Add player to team roster
        await teamRef.update({
            roster: [...currentRoster, playerId],
            updatedBy: auth.uid,
            updatedAt: new Date(),
        });
        // Update player's team assignment
        await db.collection("players").doc(playerId).update({
            teamId,
            position,
            updatedAt: new Date(),
        });
        // Create audit log
        await db.collection("townStaffAuditLogs").add({
            action: "player_added_to_team",
            teamId,
            playerId,
            requestedBy: auth.uid,
            timestamp: new Date(),
            position,
        });
        return {
            success: true,
            message: "Player added to team successfully",
        };
    }
    catch (err) {
        logger.error("Add player to team error", err);
        return { success: false, message: "Add player to team failed", error: err };
    }
});
/**
 * Team Function: Remove Player from Team
 * Removes a player from a team roster
 */
exports.removePlayerFromTeam = (0, https_1.onCall)(async (data, context) => {
    try {
        const { auth } = await validateRecDirector(context);
        const { teamId, playerId, reason } = data.data;
        logger.info("Remove player from team requested", {
            requestedBy: auth.uid,
            teamId,
            playerId,
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
        const teamData = teamDoc.data();
        const currentRoster = teamData?.roster || [];
        if (!currentRoster.includes(playerId)) {
            throw new Error("Player is not on this team");
        }
        // Remove player from team roster
        await teamRef.update({
            roster: currentRoster.filter((id) => id !== playerId),
            updatedBy: auth.uid,
            updatedAt: new Date(),
        });
        // Update player's team assignment
        await db.collection("players").doc(playerId).update({
            teamId: null,
            position: null,
            updatedAt: new Date(),
        });
        // Create audit log
        await db.collection("townStaffAuditLogs").add({
            action: "player_removed_from_team",
            teamId,
            playerId,
            requestedBy: auth.uid,
            timestamp: new Date(),
            reason,
        });
        return {
            success: true,
            message: "Player removed from team successfully",
        };
    }
    catch (err) {
        logger.error("Remove player from team error", err);
        return { success: false, message: "Remove player from team failed", error: err };
    }
});
/**
 * Team Function: Get Team Statistics
 * Retrieves comprehensive statistics for a team
 */
exports.getTeamStatistics = (0, https_1.onCall)(async (data, context) => {
    try {
        const auth = await validateAuth(context);
        const { teamId, timeRange } = data.data;
        logger.info("Team statistics requested", {
            uid: auth.uid,
            teamId,
            timeRange,
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
        return {
            success: true,
            message: "Team statistics retrieved",
            data: { statistics },
        };
    }
    catch (err) {
        logger.error("Team statistics retrieval error", err);
        return { success: false, message: "Team statistics retrieval failed", error: err };
    }
});
/**
 * Team Function: Get Team Schedule
 * Retrieves upcoming games and practices for a team
 */
exports.getTeamSchedule = (0, https_1.onCall)(async (data, context) => {
    try {
        const auth = await validateAuth(context);
        const { teamId, startDate, endDate } = data.data;
        logger.info("Team schedule requested", {
            uid: auth.uid,
            teamId,
            startDate,
            endDate,
        });
        // TODO: Implement team schedule retrieval
        // - Query team's scheduled events
        // - Get upcoming games and practices
        // - Filter by date range
        // - Include opponent and venue information
        // - Return formatted schedule
        const scheduleSnapshot = await db.collection("schedule")
            .where("teamId", "==", teamId)
            .where("date", ">=", startDate || new Date())
            .where("date", "<=", endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
            .orderBy("date", "asc")
            .get();
        const schedule = scheduleSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return {
            success: true,
            message: "Team schedule retrieved",
            data: { schedule },
        };
    }
    catch (err) {
        logger.error("Team schedule retrieval error", err);
        return { success: false, message: "Team schedule retrieval failed", error: err };
    }
});
/**
 * Team Function: Update Team Performance
 * Updates team performance data after a game
 */
exports.updateTeamPerformance = (0, https_1.onCall)(async (data, context) => {
    try {
        const { auth } = await validateRecDirector(context);
        const { teamId, performanceData } = data.data;
        logger.info("Team performance update requested", {
            requestedBy: auth.uid,
            teamId,
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
            "updatedBy": auth.uid,
            "updatedAt": new Date(),
        });
        // Store game performance
        await db.collection("teamPerformances").add({
            teamId,
            ...performanceData,
            recordedBy: auth.uid,
            recordedAt: new Date(),
        });
        return {
            success: true,
            message: "Team performance updated successfully",
        };
    }
    catch (err) {
        logger.error("Team performance update error", err);
        return { success: false, message: "Team performance update failed", error: err };
    }
});
