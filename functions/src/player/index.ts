import {onCall} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {AuthContext, CallableContextV2, isAuthContext} from "../types";
import { ValidationMiddleware, Schemas } from "../utils/validation";
import { adminMemoryClient } from "../memory/client";
import { z } from "zod";

const db = getFirestore();
const memoryClient = adminMemoryClient();

// Helper function to validate user authentication
const validateAuth = async (context: any): Promise<AuthContext> => {
  if (!context || !context.auth || !isAuthContext(context.auth)) {
    throw new Error("Unauthorized: User not authenticated");
  }
  return context.auth;
};

/**
 * Player Function: Create Player Profile
 * Creates a new player profile with basic information
 */
export const createPlayerProfile = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    
    // Validate input using Zod schema
    const createPlayerSchema = z.object({
      playerData: Schemas.CreatePlayer
    });
    
    const validation = ValidationMiddleware.validateResponse(createPlayerSchema, data);
    if (!validation.success) {
      return {
        success: false,
        message: "Invalid player data",
        data: null,
        errors: validation.errors?.errors.map(err => ({
          field: err.path.join("."),
          message: err.message
        }))
      };
    }

    const {playerData} = validation.data || {};

    logger.info("Player profile creation requested", {
      uid: auth.uid,
      playerName: playerData?.firstName,
    });

    // TODO: Implement player profile creation
    // - Validate player data (name, age, contact info)
    // - Check for duplicate profiles
    // - Create player document in Firestore
    // - Initialize player statistics and achievements
    // - Send welcome notification
    // - Log creation activity

    const playerProfile = {
      id: `player_${Date.now()}_${auth.uid}`,
      ...playerData,
      createdBy: auth.uid,
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

    // Create audit log
    await db.collection("townStaffAuditLogs").add({
      action: "player_profile_created",
      playerId: playerProfile.id,
      requestedBy: auth.uid,
      timestamp: new Date(),
      data: playerData,
    });

    const result = {
      success: true,
      message: "Player profile created successfully",
      data: {playerId: playerProfile.id},
    };
    
    // Capture successful player profile creation
    try {
      await memoryClient.captureFunctionResult(
        auth.uid,
        'createPlayerProfile',
        {
          playerId: playerProfile.id,
          playerName: (playerProfile.firstName || '') + ' ' + (playerProfile.lastName || ''),
          dateOfBirth: playerProfile.dateOfBirth,
          position: playerProfile.position
        }
      );
    } catch (memoryError) {
      logger.warn('Failed to capture memory for player profile creation:', memoryError);
    }
    
    // Validate response before sending
    const responseValidation = ValidationMiddleware.validateResponse(
      Schemas.ApiResponse,
      result
    );
    
    return responseValidation.success ? responseValidation.data : {
      success: false,
      message: "Response validation failed",
      data: null
    };
  } catch (err) {
    logger.error("Player profile creation error", err);
    
    // Capture function error
    try {
      const authContext = context as any;
      await memoryClient.captureFunctionError(
        authContext.auth?.uid || 'unknown',
        'createPlayerProfile',
        err as Error
      );
    } catch (memoryError) {
      logger.warn('Failed to capture memory for player profile creation error:', memoryError);
    }
    
    return {success: false, message: "Player profile creation failed", error: err};
  }
});

/**
 * Player Function: Update Player Profile
 * Updates an existing player profile with new information
 */
export const updatePlayerProfile = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    
    // Validate input using Zod schema
    const updatePlayerSchema = z.object({
      playerId: z.string().uuid("Invalid player ID format"),
      updates: Schemas.UpdatePlayer
    });
    
    const validation = ValidationMiddleware.validateResponse(updatePlayerSchema, data);
    if (!validation.success) {
      return {
        success: false,
        message: "Invalid player update data",
        data: null,
        errors: validation.errors?.errors.map(err => ({
          field: err.path.join("."),
          message: err.message
        }))
      };
    }

    const {playerId, updates} = validation.data || {};

    if (!playerId) {
      return {
        success: false,
        message: "Player ID is required",
        data: null,
      };
    }

    logger.info("Player profile update requested", {
      uid: auth.uid,
      playerId,
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
      updatedBy: auth.uid,
      updatedAt: new Date(),
    });

    // Create audit log
    await db.collection("townStaffAuditLogs").add({
      action: "player_profile_updated",
      playerId,
      requestedBy: auth.uid,
      timestamp: new Date(),
      changes: updates,
    });

    const result = {
      success: true,
      message: "Player profile updated successfully",
    };
    
    // Validate response before sending
    const responseValidation = ValidationMiddleware.validateResponse(
      Schemas.ApiResponse,
      result
    );
    
    return responseValidation.success ? responseValidation.data : {
      success: false,
      message: "Response validation failed",
      data: null
    };
  } catch (err) {
    logger.error("Player profile update error", err);
    return {success: false, message: "Player profile update failed", error: err};
  }
});

/**
 * Player Function: Get Player Statistics
 * Retrieves comprehensive statistics for a player
 */
export const getPlayerStatistics = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {playerId, timeRange} = data.data;

    logger.info("Player statistics requested", {
      uid: auth.uid,
      playerId,
      timeRange,
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

    return {
      success: true,
      message: "Player statistics retrieved",
      data: {statistics},
    };
  } catch (err) {
    logger.error("Player statistics retrieval error", err);
    return {success: false, message: "Player statistics retrieval failed", error: err};
  }
});

/**
 * Player Function: Get Player Achievements
 * Retrieves achievements and badges for a player
 */
export const getPlayerAchievements = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {playerId} = data.data;

    logger.info("Player achievements requested", {
      uid: auth.uid,
      playerId,
    });

    // TODO: Implement player achievements retrieval
    // - Query player's achievement history
    // - Calculate progress towards next achievements
    // - Include achievement descriptions and criteria
    // - Return formatted achievement data

    const achievementsSnapshot = await db.collection("achievements")
      .where("playerId", "==", playerId)
      .orderBy("earnedAt", "desc")
      .get();

    const achievements = achievementsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      message: "Player achievements retrieved",
      data: {achievements},
    };
  } catch (err) {
    logger.error("Player achievements retrieval error", err);
    return {success: false, message: "Player achievements retrieval failed", error: err};
  }
});

/**
 * Player Function: Award Achievement
 * Awards an achievement to a player (Admin only)
 */
export const awardAchievement = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {playerId, achievement} = data.data;

    logger.info("Achievement award requested", {
      requestedBy: auth.uid,
      playerId,
      achievementType: achievement.type,
    });

    // TODO: Implement achievement awarding
    // - Validate achievement type and criteria
    // - Check if player already has achievement
    // - Award achievement and update player stats
    // - Send notification to player
    // - Log achievement award

    const achievementDoc = {
      id: `achievement_${Date.now()}_${playerId}`,
      playerId,
      type: achievement.type,
      reason: achievement.reason,
      awardedBy: auth.uid,
      awardedAt: new Date(),
      status: "active",
    };

    // Store achievement
    await db.collection("achievements").doc(achievementDoc.id).set(achievementDoc);

    // Update player stats
    await db.collection("players").doc(playerId).update({
      "stats.achievements": FieldValue.arrayUnion(achievementDoc.type),
      "updatedAt": new Date(),
    });

    // Create audit log
    await db.collection("townStaffAuditLogs").add({
      action: "achievement_awarded",
      playerId,
      achievementType: achievementDoc.type,
      requestedBy: auth.uid,
      timestamp: new Date(),
      reason: achievementDoc.reason,
    });

    return {
      success: true,
      message: "Achievement awarded successfully",
      data: {achievementId: achievementDoc.id},
    };
  } catch (err) {
    logger.error("Achievement award error", err);
    return {success: false, message: "Achievement award failed", error: err};
  }
});

/**
 * Player Function: Get Player Schedule
 * Retrieves upcoming games and practices for a player
 */
export const getPlayerSchedule = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {playerId} = data.data;

    logger.info("Player schedule requested", {
      uid: auth.uid,
      playerId,
    });

    // TODO: Implement player schedule retrieval
    // - Query player's team assignments
    // - Get upcoming games and practices
    // - Filter by date range
    // - Include venue and opponent information
    // - Return formatted schedule

    const scheduleSnapshot = await db.collection("schedule")
      .where("playerIds", "array-contains", playerId)
      .where("date", ">=", new Date())
      .where("date", "<=", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      .orderBy("date", "asc")
      .get();

    const schedule = scheduleSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      message: "Player schedule retrieved",
      data: {schedule},
    };
  } catch (err) {
    logger.error("Player schedule retrieval error", err);
    return {success: false, message: "Player schedule retrieval failed", error: err};
  }
});

/**
 * Player Function: Update Player Performance
 * Updates player performance data after a game or practice
 */
export const updatePlayerPerformance = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {playerId, performanceData} = data.data;

    logger.info("Player performance update requested", {
      uid: auth.uid,
      playerId,
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
      recordedBy: auth.uid,
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
      totalPoints: currentStats.totalPoints + (performanceData.points || 0),
      averagePerformance: ((currentStats.averagePerformance * currentStats.gamesPlayed) + performanceData.performance) / (currentStats.gamesPlayed + 1),
    };

    await playerRef.update({
      "stats": newStats,
      "updatedAt": new Date(),
    });

    return {
      success: true,
      message: "Player performance updated successfully",
    };
  } catch (err) {
    logger.error("Player performance update error", err);
    return {success: false, message: "Player performance update failed", error: err};
  }
});
