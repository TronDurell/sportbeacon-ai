import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Request, Response } from 'express';
import { withSecurityGuards } from './lib/http';
import { 
  teamCreateSchema, 
  playerCreateSchema, 
  statsRecordSchema, 
  memoryEventSchema, 
  feedbackSchema 
} from './lib/validate';
import { validateBody } from './lib/validate';

// Import agent functions - REMOVED: agents directory no longer exists

// Import secured handlers
export { videoAnalyze } from './handlers/videoAnalyze';
export { getPlayer } from './handlers/getPlayer';
export { authLogin } from './handlers/authLogin';
export { vitals } from './handlers/vitals';

// Initialize Firebase Admin
initializeApp();

// Get Firestore instance
export const db = getFirestore();

// Health check endpoint
export const health = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "sportbeacon-ai-functions",
    requestId
  });
}));

// Team creation function with security
export const createTeam = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(teamCreateSchema, req.body);
    const { name, leagueId, coachId, description } = validatedData;

    const teamRef = await db.collection("teams").add({
      name,
      leagueId,
      coachId,
      description: description || null,
      players: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    logger.info(`Team created successfully: ${teamRef.id}`, { requestId, teamId: teamRef.id });

    res.status(201).json({
      success: true,
      teamId: teamRef.id,
      message: "Team created successfully",
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
    
    logger.error("Error creating team:", error, { requestId });
    res.status(500).json({ 
      error: "Failed to create team",
      requestId
    });
  }
}));

// Player creation function with security
export const createPlayer = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(playerCreateSchema, req.body);
    const { name, teamId, age, position, jerseyNumber } = validatedData;

    const playerRef = await db.collection("players").add({
      name,
      teamId,
      age,
      position: position || "general",
      jerseyNumber: jerseyNumber || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    logger.info(`Player created successfully: ${playerRef.id}`, { requestId, playerId: playerRef.id });

    res.status(201).json({
      success: true,
      playerId: playerRef.id,
      message: "Player created successfully",
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
    
    logger.error("Error creating player:", error, { requestId });
    res.status(500).json({ 
      error: "Failed to create player",
      requestId
    });
  }
}));

// Stats recording function with security
export const recordStats = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(statsRecordSchema, req.body);
    const { playerId, gameId, stats, gameDate } = validatedData;

    const statsRef = await db.collection("stats").add({
      playerId,
      gameId,
      stats,
      gameDate: gameDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    logger.info(`Stats recorded successfully: ${statsRef.id}`, { requestId, statsId: statsRef.id });

    res.status(201).json({
      success: true,
      statsId: statsRef.id,
      message: "Stats recorded successfully",
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
    
    logger.error("Error recording stats:", error, { requestId });
    res.status(500).json({ 
      error: "Failed to record stats",
      requestId
    });
  }
}));

// Memory event capture function with security
export const captureMemoryEvent = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(memoryEventSchema, req.body);
    const { userId, eventType, payload, tenantId, source } = validatedData;

    const memoryRef = await db.collection(`tenants/${tenantId}/memory/${userId}/events`).add({
      type: eventType,
      payload: payload || {},
      source: source || "client",
      createdAt: new Date().toISOString()
    });

    logger.info(`Memory event captured successfully: ${memoryRef.id}`, { requestId, eventId: memoryRef.id });

    res.status(201).json({
      success: true,
      eventId: memoryRef.id,
      message: "Memory event captured successfully",
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
    
    logger.error("Error capturing memory event:", error, { requestId });
    res.status(500).json({ 
      error: "Failed to capture memory event",
      requestId
    });
  }
}));

// Feedback submission function with security
export const submitFeedback = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(feedbackSchema, req.body);
    const { userId, feedbackType, content, tenantId, priority } = validatedData;

    const feedbackRef = await db.collection(`tenants/${tenantId}/feedback`).add({
      userId,
      type: feedbackType,
      content,
      priority: priority || "medium",
      createdAt: new Date().toISOString(),
      status: "pending"
    });

    logger.info(`Feedback submitted successfully: ${feedbackRef.id}`, { requestId, feedbackId: feedbackRef.id });

    res.status(201).json({
      success: true,
      feedbackId: feedbackRef.id,
      message: "Feedback submitted successfully",
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
    
    logger.error("Error submitting feedback:", error, { requestId });
    res.status(500).json({ 
      error: "Failed to submit feedback",
      requestId
    });
  }
}));

// Export agent functions
// Removed agent exports - agents directory no longer exists
