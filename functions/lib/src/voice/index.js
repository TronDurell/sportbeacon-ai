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
exports.generateAudio = exports.getCallHistory = exports.callStatusWebhook = exports.handleVoiceCall = exports.revokeVoiceToken = exports.generateVoiceToken = void 0;
const https_1 = require("firebase-functions/v2/https");
// Removed unused import
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const types_1 = require("../types");
// Get Firestore instance (Firebase Admin already initialized in main index.ts)
const db = (0, firestore_1.getFirestore)();
// Helper function to validate user authentication
const validateAuth = async (context) => {
    if (!context || !(0, types_1.isAuthContext)(context)) {
        throw new Error("Unauthorized: User not authenticated");
    }
    return context.auth;
};
exports.generateVoiceToken = (0, https_1.onCall)(async (data, context) => {
    try {
        const auth = await validateAuth(context);
        const { callType, duration, permissions } = data.data;
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
            expiresAt: new Date(Date.now() + (duration || 3600000)),
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
    }
    catch (err) {
        logger.error("Voice token generation error", err);
        return { success: false, message: "Voice token generation failed", error: err };
    }
});
exports.revokeVoiceToken = (0, https_1.onCall)(async (data, context) => {
    try {
        const auth = await validateAuth(context);
        const { tokenId } = data.data;
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
    }
    catch (err) {
        logger.error("Voice token revocation error", err);
        return { success: false, message: "Voice token revocation failed", error: err };
    }
});
/**
 * Voice Function: Handle Voice Call
 * Processes incoming voice call requests
 */
exports.handleVoiceCall = (0, https_1.onRequest)(async (req, res) => {
    try {
        const { token, callType } = req.body;
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
    }
    catch (err) {
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
exports.callStatusWebhook = (0, https_1.onRequest)(async (req, res) => {
    try {
        const { callId, status, duration, recordingUrl } = req.body;
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
    }
    catch (err) {
        logger.error("Call status webhook error", err);
        res.status(500).json({
            success: false,
            message: "Webhook processing failed",
            error: err,
        });
    }
});
exports.getCallHistory = (0, https_1.onCall)(async (data, context) => {
    try {
        const auth = await validateAuth(context);
        const { limit = 50, offset = 0 } = data.data;
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
            data: { calls },
        };
    }
    catch (err) {
        logger.error("Call history retrieval error", err);
        return { success: false, message: "Call history retrieval failed", error: err };
    }
});
/**
 * Voice Function: Generate Audio
 * Generates audio content for voice interactions
 */
exports.generateAudio = (0, https_1.onCall)(async (data, context) => {
    try {
        const auth = await validateAuth(context);
        const { text, voice, format } = data.data;
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
            data: { audioId: audioData.audioId },
        };
    }
    catch (err) {
        logger.error("Audio generation error", err);
        return { success: false, message: "Audio generation failed", error: err };
    }
});
