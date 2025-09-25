import {onCall, onRequest} from "firebase-functions/v2/https";
// Removed unused import
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {AuthContext, isAuthContext, CallableContextV2} from "../types";
// import { withSecurityGuards } from '../lib/http'; // TODO: Create security guards
import { Request, Response } from 'express';
import { ValidationMiddleware, Schemas } from '../utils/validation';
import { z } from 'zod';

// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = getFirestore();

// Voice-specific schemas
const generateVoiceTokenSchema = z.object({
  callType: z.string(),
  duration: z.number().optional(),
  permissions: z.array(z.string()).optional()
});

const revokeVoiceTokenSchema = z.object({
  tokenId: z.string()
});

const handleVoiceCallSchema = z.object({
  token: z.string(),
  callType: z.string()
});

const callStatusWebhookSchema = z.object({
  callId: z.string(),
  status: z.string(),
  duration: z.number().optional(),
  recordingUrl: z.string().optional()
});

const getCallHistorySchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional()
});

const generateAudioSchema = z.object({
  text: z.string(),
  voice: z.string().optional(),
  format: z.string().optional()
});

// Helper function to validate user authentication
const validateAuth = async (context: any): Promise<AuthContext> => {
  if (!context || !context.auth || !isAuthContext(context.auth)) {
    throw new Error("Unauthorized: User not authenticated");
  }
  return context.auth;
};

/**
 * Voice Function: Generate Voice Token
 * Generates authentication tokens for voice calls
 */
export const generateVoiceToken = onRequest(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validation = ValidationMiddleware.validateData(generateVoiceTokenSchema, req.body);
    if (!validation.success || !validation.data) {
      throw new Error('Invalid request data');
    }
    const { callType, duration, permissions } = validation.data;

    logger.info("Voice token generation requested", {
      callType,
      requestId
    });

    // TODO: Implement voice token generation
    // - Validate call type and permissions
    // - Generate secure token with expiration
    // - Store token in database
    // - Return token to client
    // - Log token generation

    const tokenData = {
      tokenId: `token_${Date.now()}`,
      callType,
      permissions,
      expiresAt: new Date(Date.now() + (duration || 3600000)), // Default 1 hour
      createdAt: new Date(),
    };

    // Store token
    await db.collection("voiceTokens").doc(tokenData.tokenId).set(tokenData);

    res.status(200).json({
      success: true,
      message: "Voice token generated",
      data: {
        token: tokenData.tokenId,
        expiresAt: tokenData.expiresAt,
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
    
    logger.error('Voice token generation error:', error, { requestId });
    res.status(500).json({ 
      error: 'Voice token generation failed',
      requestId
    });
  }
});

/**
 * Voice Function: Revoke Voice Token
 * Revokes active voice tokens
 */
export const revokeVoiceToken = onRequest(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validation = ValidationMiddleware.validateData(revokeVoiceTokenSchema, req.body);
    if (!validation.success || !validation.data) {
      throw new Error('Invalid request data');
    }
    const { tokenId } = validation.data;

    logger.info("Voice token revocation requested", {
      tokenId,
      requestId
    });

    // TODO: Implement token revocation
    // - Validate token ownership
    // - Mark token as revoked
    // - Update database
    // - Log revocation

    await db.collection("voiceTokens").doc(tokenId).update({
      revoked: true,
      revokedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Voice token revoked successfully",
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
    
    logger.error('Voice token revocation error:', error, { requestId });
    res.status(500).json({ 
      error: 'Voice token revocation failed',
      requestId
    });
  }
});

/**
 * Voice Function: Handle Voice Call
 * Processes incoming voice call requests
 */
export const handleVoiceCall = onRequest(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validation = ValidationMiddleware.validateData(handleVoiceCallSchema, req.body);
    if (!validation.success || !validation.data) {
      throw new Error('Invalid request data');
    }
    const { token, callType } = validation.data;

    logger.info("Voice call request received", {
      callType,
      hasToken: !!token,
      requestId
    });

    // TODO: Implement voice call handling
    // - Validate token
    // - Process call parameters
    // - Route call to appropriate handler
    // - Return call response
    // - Log call activity

    const callResponse = {
      callId: `call_${Date.now()}`,
      status: "initiated",
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: "Voice call handled",
      data: callResponse,
      requestId
    });
  } catch (err) {
    logger.error("Voice call handling error", err, { requestId });
    res.status(500).json({
      success: false,
      message: "Voice call handling failed",
      error: err,
      requestId
    });
  }
});

/**
 * Voice Function: Call Status Webhook
 * Handles webhooks from voice service providers
 */
export const callStatusWebhook = onRequest(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validation = ValidationMiddleware.validateData(callStatusWebhookSchema, req.body);
    if (!validation.success || !validation.data) {
      throw new Error('Invalid request data');
    }
    const { callId, status, duration, recordingUrl } = validation.data;

    logger.info("Call status webhook received", {
      callId,
      status,
      requestId
    });

    // TODO: Implement webhook processing
    // - Validate webhook signature
    // - Update call status in database
    // - Process call results
    // - Send notifications if needed
    // - Store call analytics

    await db.collection("voiceCalls").doc(callId).update({
      status,
      duration,
      recordingUrl,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Webhook processed successfully",
      requestId
    });
  } catch (err) {
    logger.error("Call status webhook error", err, { requestId });
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: err,
      requestId
    });
  }
});

/**
 * Voice Function: Get Call History
 * Retrieves voice call history for authenticated users
 */
export const getCallHistory = onRequest(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate query parameters
    const validation = ValidationMiddleware.validateData(getCallHistorySchema, req.query);
    if (!validation.success || !validation.data) {
      throw new Error('Invalid query parameters');
    }
    const { limit, offset } = validation.data;

    logger.info("Call history requested", {
      limit,
      offset,
      requestId
    });

    // TODO: Implement call history retrieval
    // - Query user's call history
    // - Apply pagination
    // - Filter by date range if specified
    // - Return formatted call data

    const calls: any[] = [];

    res.status(200).json({
      success: true,
      message: "Call history retrieved",
      data: { calls },
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
    
    logger.error('Call history retrieval error:', error, { requestId });
    res.status(500).json({ 
      error: 'Call history retrieval failed',
      requestId
    });
  }
});

/**
 * Voice Function: Generate Audio
 * Generates audio content for voice interactions
 */
export const generateAudio = onRequest(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validation = ValidationMiddleware.validateData(generateAudioSchema, req.body);
    if (!validation.success || !validation.data) {
      throw new Error('Invalid request data');
    }
    const { text, voice, format } = validation.data;

    logger.info("Audio generation requested", {
      textLength: text?.length,
      requestId
    });

    // TODO: Implement audio generation
    // - Validate text content
    // - Generate audio using TTS service
    // - Store audio file
    // - Return audio URL
    // - Log generation activity

    const audioData = {
      audioId: `audio_${Date.now()}`,
      text,
      voice,
      format,
      status: "processing",
      createdAt: new Date(),
    };

    // Store audio request
    await db.collection("audioGenerations").add(audioData);

    res.status(200).json({
      success: true,
      message: "Audio generation initiated",
      data: { audioId: audioData.audioId },
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
    
    logger.error('Audio generation error:', error, { requestId });
    res.status(500).json({ 
      error: 'Audio generation failed',
      requestId
    });
  }
});
