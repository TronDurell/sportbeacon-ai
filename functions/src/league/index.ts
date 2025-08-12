import {onCall} from "firebase-functions/v2/https";
// Removed unused import
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {AuthContext, isAuthContext, CallableContextV2} from "../types";
import { ValidationMiddleware, Schemas } from "../utils/validation";
import { z } from "zod";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Helper function to validate user authentication
const validateAuth = async (context: CallableContextV2): Promise<AuthContext> => {
  if (!context || !isAuthContext(context)) {
    throw new Error("Unauthorized: User not authenticated");
  }
  return context.auth;
};

// Helper function to validate Rec Director role
const validateRecDirector = async (context: any) => {
  if (!context.auth) {
    throw new Error("Unauthorized: User not authenticated");
  }

  const staffDoc = await db.collection("townStaff").doc(context.auth.uid).get();
  if (!staffDoc.exists || !staffDoc.data()?.isActive || staffDoc.data()?.role !== "RecDirector") {
    throw new Error("Unauthorized: User is not Rec Director");
  }

  return {auth: context.auth, staffData: staffDoc.data()};
};

/**
 * League Function: Create League
 * Creates a new league with divisions and rules
 */
export const createLeague = onCall(async (data, context) => {
  try {
    const {auth} = await validateRecDirector(context);
    
    // Validate input using Zod schema
    const createLeagueSchema = z.object({
      leagueData: Schemas.CreateLeague
    });
    
    const validation = ValidationMiddleware.validateResponse(createLeagueSchema, data);
    if (!validation.success) {
      return {
        success: false,
        message: "Invalid league data",
        data: null,
        errors: validation.errors?.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }

    const {leagueData} = validation.data || {};

    logger.info("League creation requested", {
      requestedBy: auth.uid,
      leagueName: leagueData?.name,
    });

    // TODO: Implement league creation
    // - Validate league data (name, sport, age groups)
    // - Check for duplicate league names
    // - Create league document in Firestore
    // - Initialize divisions and teams
    // - Set up league rules and schedules
    // - Send notifications to relevant staff
    // - Log creation activity

    const league = {
      id: `league_${Date.now()}_${auth.uid}`,
      ...leagueData,
      createdBy: auth.uid,
      createdAt: new Date(),
      status: "active",
      divisions: [],
      teams: [],
      rules: leagueData?.rules || {},
      schedule: {
        startDate: leagueData?.startDate,
        endDate: leagueData?.endDate,
        gameDays: leagueData?.gameDays || [],
      },
    };

    // Store league
    await db.collection("leagues").doc(league.id).set(league);

    // Create audit log
    await db.collection("townStaffAuditLogs").add({
      action: "league_created",
      leagueId: league.id,
      requestedBy: auth.uid,
      timestamp: new Date(),
      data: leagueData,
    });

    const result = {
      success: true,
      message: "League created successfully",
      data: {leagueId: league.id},
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
    logger.error("League creation error", err);
    return {success: false, message: "League creation failed", error: err};
  }
});

/**
 * League Function: Update League
 * Updates league information and settings
 */
export const updateLeague = onCall(async (data, context) => {
  try {
    const {auth} = await validateRecDirector(context);
    const {leagueId, updates} = data.data;

    logger.info("League update requested", {
      requestedBy: auth.uid,
      leagueId,
    });

    // TODO: Implement league updates
    // - Validate league ID and update data
    // - Update league document
    // - Handle division changes if specified
    // - Update related collections
    // - Send notifications for significant changes
    // - Log all changes

    const leagueRef = db.collection("leagues").doc(leagueId);
    const leagueDoc = await leagueRef.get();

    if (!leagueDoc.exists) {
      throw new Error("League not found");
    }

    await leagueRef.update({
      ...updates,
      updatedBy: auth.uid,
      updatedAt: new Date(),
    });

    // Create audit log
    await db.collection("townStaffAuditLogs").add({
      action: "league_updated",
      leagueId,
      requestedBy: auth.uid,
      timestamp: new Date(),
      changes: updates,
    });

    return {
      success: true,
      message: "League updated successfully",
    };
  } catch (err) {
    logger.error("League update error", err);
    return {success: false, message: "League update failed", error: err};
  }
});

/**
 * League Function: Get League Overview
 * Retrieves comprehensive overview of a league
 */
export const getLeagueOverview = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {leagueId} = data.data;

    logger.info("League overview requested", {
      uid: auth.uid,
      leagueId,
    });

    // TODO: Implement league overview retrieval
    // - Query league document
    // - Get division information
    // - Get team counts and statistics
    // - Include current standings
    // - Return formatted overview data

    const leagueRef = db.collection("leagues").doc(leagueId);
    const leagueDoc = await leagueRef.get();

    if (!leagueDoc.exists) {
      throw new Error("League not found");
    }

    const leagueData = leagueDoc.data();

    // Get teams in this league
    const teamsSnapshot = await db.collection("teams")
      .where("leagueId", "==", leagueId)
      .get();

    const teams = teamsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const overview = {
      leagueId,
      name: leagueData?.name,
      sport: leagueData?.sport,
      status: leagueData?.status,
      divisions: leagueData?.divisions || [],
      totalTeams: teams.length,
      totalPlayers: teams.reduce((sum, team) => sum + ((team as any).roster?.length || 0), 0),
      schedule: leagueData?.schedule,
      rules: leagueData?.rules,
    };

    return {
      success: true,
      message: "League overview retrieved",
      data: {overview},
    };
  } catch (err) {
    logger.error("League overview retrieval error", err);
    return {success: false, message: "League overview retrieval failed", error: err};
  }
});

/**
 * League Function: Get League Standings
 * Retrieves current standings for a league
 */
export const getLeagueStandings = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {leagueId, divisionId} = data.data;

    logger.info("League standings requested", {
      uid: auth.uid,
      leagueId,
      divisionId,
    });

    // TODO: Implement league standings retrieval
    // - Query teams in league/division
    // - Calculate standings based on wins/losses
    // - Sort by win percentage and tiebreakers
    // - Include recent form and statistics
    // - Return formatted standings

    let teamsQuery = db.collection("teams").where("leagueId", "==", leagueId);

    if (divisionId) {
      teamsQuery = teamsQuery.where("divisionId", "==", divisionId);
    }

    const teamsSnapshot = await teamsQuery.get();

    const teams = teamsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate standings
    const standings = teams
      .map((team) => {
        const teamData = team as any;
        return {
          teamId: team.id,
          teamName: teamData.name || "Unknown Team",
          gamesPlayed: teamData.stats?.gamesPlayed || 0,
          wins: teamData.stats?.wins || 0,
          losses: teamData.stats?.losses || 0,
          ties: teamData.stats?.ties || 0,
          winPercentage: teamData.stats?.gamesPlayed > 0 ?
            ((teamData.stats?.wins || 0) / teamData.stats?.gamesPlayed * 100).toFixed(1) :
            "0.0",
          totalPoints: teamData.stats?.totalPoints || 0,
        };
      })
      .sort((a, b) => {
        // Sort by win percentage, then by total points
        const aWinPct = parseFloat(a.winPercentage);
        const bWinPct = parseFloat(b.winPercentage);
        if (aWinPct !== bWinPct) return bWinPct - aWinPct;
        return b.totalPoints - a.totalPoints;
      });

    return {
      success: true,
      message: "League standings retrieved",
      data: {
        leagueId,
        divisionId,
        standings,
      },
    };
  } catch (err) {
    logger.error("League standings retrieval error", err);
    return {success: false, message: "League standings retrieval failed", error: err};
  }
});

/**
 * League Function: Get League Schedule
 * Retrieves the complete schedule for a league
 */
export const getLeagueSchedule = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {leagueId, startDate, endDate} = data.data;

    logger.info("League schedule requested", {
      uid: auth.uid,
      leagueId,
      startDate,
      endDate,
    });

    // TODO: Implement league schedule retrieval
    // - Query league's scheduled games
    // - Filter by date range
    // - Include team and venue information
    // - Group by date and division
    // - Return formatted schedule

    const scheduleSnapshot = await db.collection("schedule")
      .where("leagueId", "==", leagueId)
      .where("date", ">=", startDate || new Date())
      .where("date", "<=", endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
      .orderBy("date", "asc")
      .get();

    const schedule = scheduleSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Group by date
    const groupedSchedule = schedule.reduce((acc, game) => {
      const gameData = game as any;
      const date = gameData.date?.toDate?.() ? gameData.date.toDate().toDateString() : new Date().toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(game);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      success: true,
      message: "League schedule retrieved",
      data: {
        leagueId,
        schedule: groupedSchedule,
      },
    };
  } catch (err) {
    logger.error("League schedule retrieval error", err);
    return {success: false, message: "League schedule retrieval failed", error: err};
  }
});

/**
 * League Function: Generate League Schedule
 * Automatically generates a schedule for a league (Admin only)
 */
export const generateLeagueSchedule = onCall(async (data, context) => {
  try {
    const {auth} = await validateRecDirector(context);
    const {leagueId, scheduleConfig} = data.data;

    logger.info("League schedule generation requested", {
      requestedBy: auth.uid,
      leagueId,
    });

    // TODO: Implement league schedule generation
    // - Get all teams in the league
    // - Apply scheduling algorithm based on options
    // - Consider venue availability and constraints
    // - Generate balanced schedule
    // - Store generated schedule
    // - Send notifications to teams
    // - Log schedule generation

    const leagueRef = db.collection("leagues").doc(leagueId);
    const leagueDoc = await leagueRef.get();

    if (!leagueDoc.exists) {
      throw new Error("League not found");
    }

    // Get teams in league
    const teamsSnapshot = await db.collection("teams")
      .where("leagueId", "==", leagueId)
      .get();

    const teams = teamsSnapshot.docs.map((doc) => doc.id);

    if (teams.length < 2) {
      throw new Error("Need at least 2 teams to generate schedule");
    }

    // Generate round-robin schedule
    const generatedSchedule = [];
    const startDate = new Date(scheduleConfig?.startDate || Date.now());

    for (let i = 0; i < teams.length - 1; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const gameDate = new Date(startDate);
        gameDate.setDate(startDate.getDate() + generatedSchedule.length * 7); // Weekly games

        generatedSchedule.push({
          leagueId,
          homeTeam: teams[i],
          awayTeam: teams[j],
          date: gameDate,
          venue: scheduleConfig?.defaultVenue || "TBD",
          status: "scheduled",
        });
      }
    }

    // Store generated schedule
    const batch = db.batch();
    generatedSchedule.forEach((game) => {
      const gameRef = db.collection("schedule").doc();
      batch.set(gameRef, game);
    });
    await batch.commit();

    // Create audit log
    await db.collection("townStaffAuditLogs").add({
      action: "league_schedule_generated",
      leagueId,
      requestedBy: auth.uid,
      timestamp: new Date(),
      gamesGenerated: generatedSchedule.length,
      options: scheduleConfig,
    });

    return {
      success: true,
      message: "League schedule generated successfully",
      data: {
        gamesGenerated: generatedSchedule.length,
        schedule: generatedSchedule,
      },
    };
  } catch (err) {
    logger.error("League schedule generation error", err);
    return {success: false, message: "League schedule generation failed", error: err};
  }
});

/**
 * League Function: Get League Statistics
 * Retrieves comprehensive statistics for a league
 */
export const getLeagueStatistics = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {leagueId, timeRange} = data.data;

    logger.info("League statistics requested", {
      uid: auth.uid,
      leagueId,
      timeRange,
    });

    // TODO: Implement league statistics retrieval
    // - Query league's game history
    // - Calculate league-wide metrics
    // - Aggregate team and player statistics
    // - Include trend analysis
    // - Return formatted statistics

    const leagueRef = db.collection("leagues").doc(leagueId);
    const leagueDoc = await leagueRef.get();

    if (!leagueDoc.exists) {
      throw new Error("League not found");
    }

    // Get teams in league
    const teamsSnapshot = await db.collection("teams")
      .where("leagueId", "==", leagueId)
      .get();

    const teams = teamsSnapshot.docs.map((doc) => doc.data());

    // Calculate league statistics
    const leagueStats = teams.reduce((stats, team) => {
      const teamStats = team.stats || {};
      return {
        totalGames: stats.totalGames + (teamStats.gamesPlayed || 0),
        totalWins: stats.totalWins + (teamStats.wins || 0),
        totalLosses: stats.totalLosses + (teamStats.losses || 0),
        totalTies: stats.totalTies + (teamStats.ties || 0),
        totalPoints: stats.totalPoints + (teamStats.totalPoints || 0),
        totalPlayers: stats.totalPlayers + (team.roster?.length || 0),
      };
    }, {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalTies: 0,
      totalPoints: 0,
      totalPlayers: 0,
    });

    const statistics = {
      leagueId,
      timeRange,
      totalTeams: teams.length,
      totalPlayers: leagueStats.totalPlayers,
      totalGames: leagueStats.totalGames,
      averageGamesPerTeam: teams.length > 0 ? (leagueStats.totalGames / teams.length).toFixed(1) : 0,
      averagePointsPerGame: leagueStats.totalGames > 0 ? (leagueStats.totalPoints / leagueStats.totalGames).toFixed(1) : 0,
      winPercentage: leagueStats.totalGames > 0 ? ((leagueStats.totalWins / leagueStats.totalGames) * 100).toFixed(1) : 0,
    };

    return {
      success: true,
      message: "League statistics retrieved",
      data: {statistics},
    };
  } catch (err) {
    logger.error("League statistics retrieval error", err);
    return {success: false, message: "League statistics retrieval failed", error: err};
  }
});
