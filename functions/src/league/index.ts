import {onCall, onRequest} from "firebase-functions/v2/https";
// Removed unused import
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {AuthContext, isAuthContext, CallableContextV2} from "../types";
import { ValidationMiddleware, Schemas } from "../utils/validation";
import { z } from "zod";
import { withSecurityGuards } from '../lib/http';
import { Request, Response } from 'express';
import { 
  createLeagueSchema,
  updateLeagueSchema,
  getLeagueOverviewSchema,
  getLeagueStandingsSchema,
  getLeagueScheduleSchema,
  generateLeagueScheduleSchema,
  getLeagueStatisticsSchema
} from '../lib/validate';
import { validateBody } from '../lib/validate';

// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = getFirestore();

// Helper function to validate user authentication
const validateAuth = async (context: any): Promise<AuthContext> => {
  if (!context || !context.auth || !isAuthContext(context.auth)) {
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
export const createLeague = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(createLeagueSchema, req.body);
    const { leagueData } = validatedData;

    logger.info("League creation requested", {
      leagueName: leagueData?.name,
      requestId
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
      id: `league_${Date.now()}`,
      ...leagueData,
      createdAt: new Date(),
      status: "active",
      divisions: [],
      teams: [],
      rules: leagueData?.rules || {},
      schedule: {
        startDate: leagueData?.startDate,
        endDate: leagueData?.endDate,
        gameDays: [],
      },
    };

    // Store league
    await db.collection("leagues").doc(league.id).set(league);

    res.status(200).json({
      success: true,
      message: "League created successfully",
      data: { leagueId: league.id },
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('League creation error:', error, { requestId });
    res.status(500).json({ 
      error: 'League creation failed',
      requestId
    });
  }
}));

/**
 * League Function: Update League
 * Updates league information and settings
 */
export const updateLeague = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(updateLeagueSchema, req.body);
    const { leagueId, updates } = validatedData;

    logger.info("League update requested", {
      leagueId,
      requestId
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
      updatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "League updated successfully",
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('League update error:', error, { requestId });
    res.status(500).json({ 
      error: 'League update failed',
      requestId
    });
  }
}));

/**
 * League Function: Get League Overview
 * Retrieves comprehensive overview of a league
 */
export const getLeagueOverview = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate query parameters
    const validatedData = validateBody(getLeagueOverviewSchema, req.query);
    const { leagueId } = validatedData;

    logger.info("League overview requested", {
      leagueId,
      requestId
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
    const overview = {
      leagueId,
      name: leagueData?.name,
      sport: leagueData?.sport,
      status: leagueData?.status,
      divisions: leagueData?.divisions || [],
      totalTeams: 0,
      totalPlayers: 0,
      schedule: leagueData?.schedule,
      rules: leagueData?.rules,
    };

    res.status(200).json({
      success: true,
      message: "League overview retrieved",
      data: { overview },
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('League overview retrieval error:', error, { requestId });
    res.status(500).json({ 
      error: 'League overview retrieval failed',
      requestId
    });
  }
}));

/**
 * League Function: Get League Standings
 * Retrieves current standings for a league
 */
export const getLeagueStandings = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate query parameters
    const validatedData = validateBody(getLeagueStandingsSchema, req.query);
    const { leagueId, divisionId } = validatedData;

    logger.info("League standings requested", {
      leagueId,
      divisionId,
      requestId
    });

    // TODO: Implement league standings retrieval
    // - Query teams in league/division
    // - Calculate standings based on wins/losses
    // - Sort by win percentage and tiebreakers
    // - Include recent form and statistics
    // - Return formatted standings

    const standings: any[] = [];

    res.status(200).json({
      success: true,
      message: "League standings retrieved",
      data: {
        leagueId,
        divisionId,
        standings,
      },
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('League standings retrieval error:', error, { requestId });
    res.status(500).json({ 
      error: 'League standings retrieval failed',
      requestId
    });
  }
}));

/**
 * League Function: Get League Schedule
 * Retrieves the complete schedule for a league
 */
export const getLeagueSchedule = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate query parameters
    const validatedData = validateBody(getLeagueScheduleSchema, req.query);
    const { leagueId, startDate, endDate } = validatedData;

    logger.info("League schedule requested", {
      leagueId,
      startDate,
      endDate,
      requestId
    });

    // TODO: Implement league schedule retrieval
    // - Query league's scheduled games
    // - Filter by date range
    // - Include team and venue information
    // - Group by date and division
    // - Return formatted schedule

    const schedule: any[] = [];

    res.status(200).json({
      success: true,
      message: "League schedule retrieved",
      data: {
        leagueId,
        schedule,
      },
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('League schedule retrieval error:', error, { requestId });
    res.status(500).json({ 
      error: 'League schedule retrieval failed',
      requestId
    });
  }
}));

/**
 * League Function: Generate League Schedule
 * Automatically generates a schedule for a league (Admin only)
 */
export const generateLeagueSchedule = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(generateLeagueScheduleSchema, req.body);
    const { leagueId, scheduleConfig } = validatedData;

    logger.info("League schedule generation requested", {
      leagueId,
      requestId
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

    const generatedSchedule: any[] = [];

    res.status(200).json({
      success: true,
      message: "League schedule generated successfully",
      data: {
        gamesGenerated: generatedSchedule.length,
        schedule: generatedSchedule,
      },
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('League schedule generation error:', error, { requestId });
    res.status(500).json({ 
      error: 'League schedule generation failed',
      requestId
    });
  }
}));

/**
 * League Function: Get League Statistics
 * Retrieves comprehensive statistics for a league
 */
export const getLeagueStatistics = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate query parameters
    const validatedData = validateBody(getLeagueStatisticsSchema, req.query);
    const { leagueId, timeRange } = validatedData;

    logger.info("League statistics requested", {
      leagueId,
      timeRange,
      requestId
    });

    // TODO: Implement league statistics retrieval
    // - Query league's game history
    // - Calculate league-wide metrics
    // - Aggregate team and player statistics
    // - Include trend analysis
    // - Return formatted statistics

    const statistics = {
      leagueId,
      timeRange,
      totalTeams: 0,
      totalPlayers: 0,
      totalGames: 0,
      averageGamesPerTeam: 0,
      averagePointsPerGame: 0,
      winPercentage: 0,
    };

    res.status(200).json({
      success: true,
      message: "League statistics retrieved",
      data: { statistics },
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('League statistics retrieval error:', error, { requestId });
    res.status(500).json({ 
      error: 'League statistics retrieval failed',
      requestId
    });
  }
}));
