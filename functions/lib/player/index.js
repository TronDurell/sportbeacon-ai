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
exports.updatePlayerPerformance = exports.getPlayerSchedule = exports.awardAchievement = exports.getPlayerAchievements = exports.getPlayerStatistics = exports.updatePlayerProfile = exports.createPlayerProfile = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const types_1 = require("../types");
const client_1 = require("../memory/client");
const http_1 = require("../lib/http");
const validate_1 = require("../lib/validate");
const validate_2 = require("../lib/validate");
const db = (0, firestore_1.getFirestore)();
const memoryClient = (0, client_1.adminMemoryClient)();
// Helper function to validate user authentication
const validateAuth = async (context) => {
    if (!context || !context.auth || !(0, types_1.isAuthContext)(context.auth)) {
        throw new Error("Unauthorized: User not authenticated");
    }
    return context.auth;
};
/**
 * Player Function: Create Player Profile
 * Creates a new player profile with basic information
 */
exports.createPlayerProfile = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.createPlayerProfileSchema, req.body);
        const { playerData } = validatedData;
        logger.info("Player profile creation requested", {
            playerName: playerData?.firstName,
            requestId
        });
        // TODO: Implement player profile creation
        // - Validate player data (name, age, contact info)
        // - Check for duplicate profiles
        // - Create player document in Firestore
        // - Initialize player statistics and achievements
        // - Send welcome notification
        // - Log creation activity
        const playerProfile = {
            id: `player_${Date.now()}`,
            ...playerData,
            createdAt: new Date(),
            status: "active",
            stats: {
                gamesPlayed: 0,
                totalPoints: 0,
                averagePerformance: 0,
                achievements: [],
            },
        };
        // Store player profile
        await db.collection("players").doc(playerProfile.id).set(playerProfile);
        res.status(200).json({
            success: true,
            message: "Player profile created successfully",
            data: { playerId: playerProfile.id },
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
        logger.error('Player profile creation error:', error, { requestId });
        res.status(500).json({
            error: 'Player profile creation failed',
            requestId
        });
    }
}));
/**
 * Player Function: Update Player Profile
 * Updates an existing player profile with new information
 */
exports.updatePlayerProfile = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.updatePlayerProfileSchema, req.body);
        const { playerId, updates } = validatedData;
        logger.info("Player profile update requested", {
            playerId,
            requestId
        });
        // TODO: Implement player profile updates
        // - Validate player ID and update data
        // - Check permissions (player can update own profile, staff can update any)
        // - Update player document
        // - Track changes for audit trail
        // - Send notification if significant changes
        // - Update related collections if needed
        const playerRef = db.collection("players").doc(playerId);
        const playerDoc = await playerRef.get();
        if (!playerDoc.exists) {
            throw new Error("Player profile not found");
        }
        await playerRef.update({
            ...updates,
            updatedAt: new Date(),
        });
        res.status(200).json({
            success: true,
            message: "Player profile updated successfully",
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
        logger.error('Player profile update error:', error, { requestId });
        res.status(500).json({
            error: 'Player profile update failed',
            requestId
        });
    }
}));
/**
 * Player Function: Get Player Statistics
 * Retrieves comprehensive statistics for a player
 */
exports.getPlayerStatistics = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate query parameters
        const validatedData = (0, validate_2.validateBody)(validate_1.getPlayerStatisticsSchema, req.query);
        const { playerId, timeRange } = validatedData;
        logger.info("Player statistics requested", {
            playerId,
            timeRange,
            requestId
        });
        // TODO: Implement player statistics retrieval
        // - Query player's game history
        // - Calculate performance metrics
        // - Aggregate statistics by time range
        // - Include trend analysis
        // - Return formatted statistics
        const playerRef = db.collection("players").doc(playerId);
        const playerDoc = await playerRef.get();
        if (!playerDoc.exists) {
            throw new Error("Player profile not found");
        }
        const playerData = playerDoc.data();
        // Mock statistics - replace with actual calculation
        const statistics = {
            playerId,
            timeRange,
            gamesPlayed: playerData?.stats?.gamesPlayed || 0,
            totalPoints: playerData?.stats?.totalPoints || 0,
            averagePerformance: playerData?.stats?.averagePerformance || 0,
            achievements: playerData?.stats?.achievements || [],
            trends: {
                recentPerformance: "improving",
                consistency: "high",
                areasForImprovement: ["speed", "accuracy"],
            },
        };
        res.status(200).json({
            success: true,
            message: "Player statistics retrieved",
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
        logger.error('Player statistics retrieval error:', error, { requestId });
        res.status(500).json({
            error: 'Player statistics retrieval failed',
            requestId
        });
    }
}));
/**
 * Player Function: Get Player Achievements
 * Retrieves achievements and badges for a player
 */
exports.getPlayerAchievements = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate query parameters
        const validatedData = (0, validate_2.validateBody)(validate_1.getPlayerAchievementsSchema, req.query);
        const { playerId } = validatedData;
        logger.info("Player achievements requested", {
            playerId,
            requestId
        });
        // TODO: Implement player achievements retrieval
        // - Query player's achievement history
        // - Calculate progress towards next achievements
        // - Include achievement descriptions and criteria
        // - Return formatted achievement data
        const achievements = [];
        res.status(200).json({
            success: true,
            message: "Player achievements retrieved",
            data: { achievements },
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
        logger.error('Player achievements retrieval error:', error, { requestId });
        res.status(500).json({
            error: 'Player achievements retrieval failed',
            requestId
        });
    }
}));
/**
 * Player Function: Award Achievement
 * Awards an achievement to a player (Admin only)
 */
exports.awardAchievement = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.awardAchievementSchema, req.body);
        const { playerId, achievementId, achievementData } = validatedData;
        logger.info("Achievement award requested", {
            playerId,
            achievementId,
            requestId
        });
        // TODO: Implement achievement awarding
        // - Validate achievement type and criteria
        // - Check if player already has achievement
        // - Award achievement and update player stats
        // - Send notification to player
        // - Log achievement award
        const achievementDoc = {
            id: achievementId,
            playerId,
            ...achievementData,
            awardedAt: new Date(),
            status: "active",
        };
        // Store achievement
        await db.collection("achievements").doc(achievementDoc.id).set(achievementDoc);
        // Update player stats
        await db.collection("players").doc(playerId).update({
            "stats.achievements": firestore_1.FieldValue.arrayUnion(achievementDoc.id),
            "updatedAt": new Date(),
        });
        res.status(200).json({
            success: true,
            message: "Achievement awarded successfully",
            data: { achievementId: achievementDoc.id },
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
        logger.error('Achievement award error:', error, { requestId });
        res.status(500).json({
            error: 'Achievement award failed',
            requestId
        });
    }
}));
/**
 * Player Function: Get Player Schedule
 * Retrieves upcoming games and practices for a player
 */
exports.getPlayerSchedule = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate query parameters
        const validatedData = (0, validate_2.validateBody)(validate_1.getPlayerScheduleSchema, req.query);
        const { playerId, startDate, endDate } = validatedData;
        logger.info("Player schedule requested", {
            playerId,
            startDate,
            endDate,
            requestId
        });
        // TODO: Implement player schedule retrieval
        // - Query player's team assignments
        // - Get upcoming games and practices
        // - Filter by date range
        // - Include venue and opponent information
        // - Return formatted schedule
        const schedule = [];
        res.status(200).json({
            success: true,
            message: "Player schedule retrieved",
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
        logger.error('Player schedule retrieval error:', error, { requestId });
        res.status(500).json({
            error: 'Player schedule retrieval failed',
            requestId
        });
    }
}));
/**
 * Player Function: Update Player Performance
 * Updates player performance data after a game or practice
 */
exports.updatePlayerPerformance = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.updatePlayerPerformanceSchema, req.body);
        const { playerId, performanceData } = validatedData;
        logger.info("Player performance update requested", {
            playerId,
            requestId
        });
        // TODO: Implement player performance updates
        // - Validate performance data
        // - Update player statistics
        // - Check for achievement triggers
        // - Calculate new averages and trends
        // - Send performance summary to player
        const performance = {
            id: `performance_${Date.now()}_${playerId}`,
            playerId,
            ...performanceData,
            recordedAt: new Date(),
        };
        // Store performance data
        await db.collection("playerPerformances").add(performance);
        // Update player stats
        const playerRef = db.collection("players").doc(playerId);
        const playerDoc = await playerRef.get();
        const currentStats = playerDoc.data()?.stats || {};
        const newStats = {
            gamesPlayed: currentStats.gamesPlayed + 1,
            totalPoints: currentStats.totalPoints + (performanceData.stats?.points || 0),
            averagePerformance: ((currentStats.averagePerformance * currentStats.gamesPlayed) + (performanceData.stats?.performance || 0)) / (currentStats.gamesPlayed + 1),
        };
        await playerRef.update({
            "stats": newStats,
            "updatedAt": new Date(),
        });
        res.status(200).json({
            success: true,
            message: "Player performance updated successfully",
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
        logger.error('Player performance update error:', error, { requestId });
        res.status(500).json({
            error: 'Player performance update failed',
            requestId
        });
    }
}));
