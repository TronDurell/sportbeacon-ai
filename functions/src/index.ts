import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Import agent functions
import { onStatSubmissionCreated } from '../agents/verificationAgent.js';
import { generateWeeklyReports, generateTeamReport } from '../agents/reportingAgent.js';

// Initialize Firebase Admin
initializeApp();

// Get Firestore instance
export const db = getFirestore();

// Health check endpoint
export const health = onRequest((req, res) => {
  res.status(200).send({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "sportbeacon-ai-functions"
  });
});

// Basic team creation function
export const createTeam = onCall(async (request) => {
  try {
    const { name, leagueId, coachId } = request.data;
    
    if (!name || !leagueId || !coachId) {
      throw new Error("Missing required fields: name, leagueId, coachId");
    }

    const teamRef = await db.collection("teams").add({
      name,
      leagueId,
      coachId,
      players: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      teamId: teamRef.id,
      message: "Team created successfully"
    };
  } catch (error) {
    logger.error("Error creating team:", error);
    throw new Error("Failed to create team");
  }
});

// Basic player creation function
export const createPlayer = onCall(async (request) => {
  try {
    const { name, teamId, age, position } = request.data;
    
    if (!name || !teamId || !age) {
      throw new Error("Missing required fields: name, teamId, age");
    }

    const playerRef = await db.collection("players").add({
      name,
      teamId,
      age,
      position: position || "general",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      playerId: playerRef.id,
      message: "Player created successfully"
    };
  } catch (error) {
    logger.error("Error creating player:", error);
    throw new Error("Failed to create player");
  }
});

// Basic stats recording function
export const recordStats = onCall(async (request) => {
  try {
    const { playerId, gameId, stats } = request.data;
    
    if (!playerId || !gameId || !stats) {
      throw new Error("Missing required fields: playerId, gameId, stats");
    }

    const statsRef = await db.collection("stats").add({
      playerId,
      gameId,
      stats,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      statsId: statsRef.id,
      message: "Stats recorded successfully"
    };
  } catch (error) {
    logger.error("Error recording stats:", error);
    throw new Error("Failed to record stats");
  }
});

// Memory event capture function
export const captureMemoryEvent = onCall(async (request) => {
  try {
    const { userId, eventType, payload, tenantId } = request.data;
    
    if (!userId || !eventType || !tenantId) {
      throw new Error("Missing required fields: userId, eventType, tenantId");
    }

    const memoryRef = await db.collection(`tenants/${tenantId}/memory/${userId}/events`).add({
      type: eventType,
      payload: payload || {},
      source: "client",
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      eventId: memoryRef.id,
      message: "Memory event captured successfully"
    };
  } catch (error) {
    logger.error("Error capturing memory event:", error);
    throw new Error("Failed to capture memory event");
  }
});

// Feedback submission function
export const submitFeedback = onCall(async (request) => {
  try {
    const { userId, feedbackType, content, tenantId } = request.data;
    
    if (!userId || !feedbackType || !content || !tenantId) {
      throw new Error("Missing required fields: userId, feedbackType, content, tenantId");
    }

    const feedbackRef = await db.collection(`tenants/${tenantId}/feedback`).add({
      userId,
      type: feedbackType,
      content,
      createdAt: new Date().toISOString(),
      status: "pending"
    });

    return {
      success: true,
      feedbackId: feedbackRef.id,
      message: "Feedback submitted successfully"
    };
  } catch (error) {
    logger.error("Error submitting feedback:", error);
    throw new Error("Failed to submit feedback");
  }
});

// Export agent functions
export { onStatSubmissionCreated, generateWeeklyReports, generateTeamReport };
