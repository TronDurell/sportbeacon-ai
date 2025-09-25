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
exports.submitFeedback = exports.captureMemoryEvent = exports.recordStats = exports.createPlayer = exports.createTeam = exports.health = exports.db = exports.vitals = exports.authLogin = exports.getPlayer = exports.videoAnalyze = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const http_1 = require("./lib/http");
const validate_1 = require("./lib/validate");
const validate_2 = require("./lib/validate");
// Import agent functions - REMOVED: agents directory no longer exists
// Import secured handlers
var videoAnalyze_1 = require("./handlers/videoAnalyze");
Object.defineProperty(exports, "videoAnalyze", { enumerable: true, get: function () { return videoAnalyze_1.videoAnalyze; } });
var getPlayer_1 = require("./handlers/getPlayer");
Object.defineProperty(exports, "getPlayer", { enumerable: true, get: function () { return getPlayer_1.getPlayer; } });
var authLogin_1 = require("./handlers/authLogin");
Object.defineProperty(exports, "authLogin", { enumerable: true, get: function () { return authLogin_1.authLogin; } });
var vitals_1 = require("./handlers/vitals");
Object.defineProperty(exports, "vitals", { enumerable: true, get: function () { return vitals_1.vitals; } });
// Initialize Firebase Admin
(0, app_1.initializeApp)();
// Get Firestore instance
exports.db = (0, firestore_1.getFirestore)();
// Health check endpoint
exports.health = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "sportbeacon-ai-functions",
        requestId
    });
}));
// Team creation function with security
exports.createTeam = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.teamCreateSchema, req.body);
        const { name, leagueId, coachId, description } = validatedData;
        const teamRef = await exports.db.collection("teams").add({
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
    }
    catch (error) {
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
exports.createPlayer = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.playerCreateSchema, req.body);
        const { name, teamId, age, position, jerseyNumber } = validatedData;
        const playerRef = await exports.db.collection("players").add({
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
    }
    catch (error) {
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
exports.recordStats = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.statsRecordSchema, req.body);
        const { playerId, gameId, stats, gameDate } = validatedData;
        const statsRef = await exports.db.collection("stats").add({
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
    }
    catch (error) {
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
exports.captureMemoryEvent = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.memoryEventSchema, req.body);
        const { userId, eventType, payload, tenantId, source } = validatedData;
        const memoryRef = await exports.db.collection(`tenants/${tenantId}/memory/${userId}/events`).add({
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
    }
    catch (error) {
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
exports.submitFeedback = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.feedbackSchema, req.body);
        const { userId, feedbackType, content, tenantId, priority } = validatedData;
        const feedbackRef = await exports.db.collection(`tenants/${tenantId}/feedback`).add({
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
    }
    catch (error) {
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
