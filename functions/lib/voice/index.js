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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAudio = exports.getCallHistory = exports.callStatusWebhook = exports.handleVoiceCall = exports.revokeVoiceToken = exports.generateVoiceToken = void 0;
const https_1 = require("firebase-functions/v2/https");
// Removed unused import
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const types_1 = require("../types");
const validation_1 = require("../utils/validation");
const zod_1 = require("zod");
// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = (0, firestore_1.getFirestore)();
// Voice-specific schemas
const generateVoiceTokenSchema = zod_1.z.object({
    callType: zod_1.z.string(),
    duration: zod_1.z.number().optional(),
    permissions: zod_1.z.array(zod_1.z.string()).optional()
});
const revokeVoiceTokenSchema = zod_1.z.object({
    tokenId: zod_1.z.string()
});
const handleVoiceCallSchema = zod_1.z.object({
    token: zod_1.z.string(),
    callType: zod_1.z.string()
});
const callStatusWebhookSchema = zod_1.z.object({
    callId: zod_1.z.string(),
    status: zod_1.z.string(),
    duration: zod_1.z.number().optional(),
    recordingUrl: zod_1.z.string().optional()
});
const getCallHistorySchema = zod_1.z.object({
    limit: zod_1.z.number().optional(),
    offset: zod_1.z.number().optional()
});
const generateAudioSchema = zod_1.z.object({
    text: zod_1.z.string(),
    voice: zod_1.z.string().optional(),
    format: zod_1.z.string().optional()
});
// Helper function to validate user authentication
const validateAuth = async (context) => {
    if (!context || !context.auth || !(0, types_1.isAuthContext)(context.auth)) {
        throw new Error("Unauthorized: User not authenticated");
    }
    return context.auth;
};
/**
 * Voice Function: Generate Voice Token
 * Generates authentication tokens for voice calls
 */
exports.generateVoiceToken = (0, https_1.onRequest)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validation = validation_1.ValidationMiddleware.validateData(generateVoiceTokenSchema, req.body);
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
    }
    catch (error) {
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
exports.revokeVoiceToken = (0, https_1.onRequest)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validation = validation_1.ValidationMiddleware.validateData(revokeVoiceTokenSchema, req.body);
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
    }
    catch (error) {
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
exports.handleVoiceCall = (0, https_1.onRequest)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validation = validation_1.ValidationMiddleware.validateData(handleVoiceCallSchema, req.body);
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
    }
    catch (err) {
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
exports.callStatusWebhook = (0, https_1.onRequest)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validation = validation_1.ValidationMiddleware.validateData(callStatusWebhookSchema, req.body);
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
    }
    catch (err) {
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
exports.getCallHistory = (0, https_1.onRequest)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate query parameters
        const validation = validation_1.ValidationMiddleware.validateData(getCallHistorySchema, req.query);
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
        const calls = [];
        res.status(200).json({
            success: true,
            message: "Call history retrieved",
            data: { calls },
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
exports.generateAudio = (0, https_1.onRequest)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validation = validation_1.ValidationMiddleware.validateData(generateAudioSchema, req.body);
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
    }
    catch (error) {
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
