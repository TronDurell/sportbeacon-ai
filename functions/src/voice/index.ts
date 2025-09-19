import {onCall, onRequest} from "firebase-functions/v2/https";
// Removed unused import
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {AuthContext, isAuthContext, CallableContextV2} from "../types";

// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = getFirestore();

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
interface VoiceTokenRequest {
  callType: string;
  duration?: number;
  permissions?: string[];
}

export const generateVoiceToken = onCall<VoiceTokenRequest>(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {callType, duration, permissions} = data.data;

    logger.info("Voice token generation requested", {
      uid: auth.uid,
      callType,
    });

    // TODO: Implement voice token generation
    // - Validate call type and permissions
    // - Generate secure token with expiration
    // - Store token in database
    // - Return token to client
    // - Log token generation

    const tokenData = {
      tokenId: `token_${Date.now()}_${auth.uid}`,
      userId: auth.uid,
      callType,
      permissions,
      expiresAt: new Date(Date.now() + (duration || 3600000)), // Default 1 hour
      createdAt: new Date(),
    };

    // Store token
    await db.collection("voiceTokens").doc(tokenData.tokenId).set(tokenData);

    return {
      success: true,
      message: "Voice token generated",
      data: {
        token: tokenData.tokenId,
        expiresAt: tokenData.expiresAt,
      },
    };
  } catch (err) {
    logger.error("Voice token generation error", err);
    return {success: false, message: "Voice token generation failed", error: err};
  }
});

/**
 * Voice Function: Revoke Voice Token
 * Revokes active voice tokens
 */
interface RevokeTokenRequest {
  tokenId: string;
}

export const revokeVoiceToken = onCall<RevokeTokenRequest>(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {tokenId} = data.data;

    logger.info("Voice token revocation requested", {
      uid: auth.uid,
      tokenId,
    });

    // TODO: Implement token revocation
    // - Validate token ownership
    // - Mark token as revoked
    // - Update database
    // - Log revocation

    await db.collection("voiceTokens").doc(tokenId).update({
      revoked: true,
      revokedAt: new Date(),
      revokedBy: auth.uid,
    });

    return {
      success: true,
      message: "Voice token revoked successfully",
    };
  } catch (err) {
    logger.error("Voice token revocation error", err);
    return {success: false, message: "Voice token revocation failed", error: err};
  }
});

/**
 * Voice Function: Handle Voice Call
 * Processes incoming voice call requests
 */
export const handleVoiceCall = onRequest(async (req, res) => {
  try {
    const {token, callType} = req.body;

    logger.info("Voice call request received", {
      callType,
      hasToken: !!token,
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
    });
  } catch (err) {
    logger.error("Voice call handling error", err);
    res.status(500).json({
      success: false,
      message: "Voice call handling failed",
      error: err,
    });
  }
});

/**
 * Voice Function: Call Status Webhook
 * Handles webhooks from voice service providers
 */
export const callStatusWebhook = onRequest(async (req, res) => {
  try {
    const {callId, status, duration, recordingUrl} = req.body;

    logger.info("Call status webhook received", {
      callId,
      status,
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
    });
  } catch (err) {
    logger.error("Call status webhook error", err);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: err,
    });
  }
});

/**
 * Voice Function: Get Call History
 * Retrieves voice call history for authenticated users
 */
interface CallHistoryRequest {
  limit?: number;
  offset?: number;
}

export const getCallHistory = onCall<CallHistoryRequest>(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {limit = 50, offset = 0} = data.data;

    logger.info("Call history requested", {
      uid: auth.uid,
      limit,
      offset,
    });

    // TODO: Implement call history retrieval
    // - Query user's call history
    // - Apply pagination
    // - Filter by date range if specified
    // - Return formatted call data

    const callsSnapshot = await db.collection("voiceCalls")
      .where("userId", "==", auth.uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    const calls = callsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      message: "Call history retrieved",
      data: {calls},
    };
  } catch (err) {
    logger.error("Call history retrieval error", err);
    return {success: false, message: "Call history retrieval failed", error: err};
  }
});

/**
 * Voice Function: Generate Audio
 * Generates audio content for voice interactions
 */
export const generateAudio = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    const {text, voice, format} = data.data as any;

    logger.info("Audio generation requested", {
      uid: auth.uid,
      textLength: text?.length,
    });

    // TODO: Implement audio generation
    // - Validate text content
    // - Generate audio using TTS service
    // - Store audio file
    // - Return audio URL
    // - Log generation activity

    const audioData = {
      audioId: `audio_${Date.now()}_${auth.uid}`,
      userId: auth.uid,
      text,
      voice,
      format,
      status: "processing",
      createdAt: new Date(),
    };

    // Store audio request
    await db.collection("audioGenerations").add(audioData);

    return {
      success: true,
      message: "Audio generation initiated",
      data: {audioId: audioData.audioId},
    };
  } catch (err) {
    logger.error("Audio generation error", err);
    return {success: false, message: "Audio generation failed", error: err};
  }
});
