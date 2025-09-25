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
exports.generateTeamReport = exports.generateWeeklyReports = exports.onStatSubmissionCreated = exports.submitFeedback = exports.captureMemoryEvent = exports.recordStats = exports.createPlayer = exports.createTeam = exports.health = exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const https_2 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
// Import agent functions
const verificationAgent_js_1 = require("../agents/verificationAgent.js");
Object.defineProperty(exports, "onStatSubmissionCreated", { enumerable: true, get: function () { return verificationAgent_js_1.onStatSubmissionCreated; } });
const reportingAgent_js_1 = require("../agents/reportingAgent.js");
Object.defineProperty(exports, "generateWeeklyReports", { enumerable: true, get: function () { return reportingAgent_js_1.generateWeeklyReports; } });
Object.defineProperty(exports, "generateTeamReport", { enumerable: true, get: function () { return reportingAgent_js_1.generateTeamReport; } });
// Initialize Firebase Admin
(0, app_1.initializeApp)();
// Get Firestore instance
exports.db = (0, firestore_1.getFirestore)();
// Health check endpoint
exports.health = (0, https_2.onRequest)((req, res) => {
    res.status(200).send({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "sportbeacon-ai-functions"
    });
});
// Basic team creation function
exports.createTeam = (0, https_1.onCall)(async (request) => {
    try {
        const { name, leagueId, coachId } = request.data;
        if (!name || !leagueId || !coachId) {
            throw new Error("Missing required fields: name, leagueId, coachId");
        }
        const teamRef = await exports.db.collection("teams").add({
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
    }
    catch (error) {
        logger.error("Error creating team:", error);
        throw new Error("Failed to create team");
    }
});
// Basic player creation function
exports.createPlayer = (0, https_1.onCall)(async (request) => {
    try {
        const { name, teamId, age, position } = request.data;
        if (!name || !teamId || !age) {
            throw new Error("Missing required fields: name, teamId, age");
        }
        const playerRef = await exports.db.collection("players").add({
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
    }
    catch (error) {
        logger.error("Error creating player:", error);
        throw new Error("Failed to create player");
    }
});
// Basic stats recording function
exports.recordStats = (0, https_1.onCall)(async (request) => {
    try {
        const { playerId, gameId, stats } = request.data;
        if (!playerId || !gameId || !stats) {
            throw new Error("Missing required fields: playerId, gameId, stats");
        }
        const statsRef = await exports.db.collection("stats").add({
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
    }
    catch (error) {
        logger.error("Error recording stats:", error);
        throw new Error("Failed to record stats");
    }
});
// Memory event capture function
exports.captureMemoryEvent = (0, https_1.onCall)(async (request) => {
    try {
        const { userId, eventType, payload, tenantId } = request.data;
        if (!userId || !eventType || !tenantId) {
            throw new Error("Missing required fields: userId, eventType, tenantId");
        }
        const memoryRef = await exports.db.collection(`tenants/${tenantId}/memory/${userId}/events`).add({
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
    }
    catch (error) {
        logger.error("Error capturing memory event:", error);
        throw new Error("Failed to capture memory event");
    }
});
// Feedback submission function
exports.submitFeedback = (0, https_1.onCall)(async (request) => {
    try {
        const { userId, feedbackType, content, tenantId } = request.data;
        if (!userId || !feedbackType || !content || !tenantId) {
            throw new Error("Missing required fields: userId, feedbackType, content, tenantId");
        }
        const feedbackRef = await exports.db.collection(`tenants/${tenantId}/feedback`).add({
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
    }
    catch (error) {
        logger.error("Error submitting feedback:", error);
        throw new Error("Failed to submit feedback");
    }
});
//# sourceMappingURL=index.js.map