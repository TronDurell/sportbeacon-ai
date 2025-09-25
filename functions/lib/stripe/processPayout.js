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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayoutStatus = exports.processPayout = void 0;
const functions = __importStar(require("firebase-functions"));
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const http_1 = require("../lib/http");
const validate_1 = require("../lib/validate");
const validate_2 = require("../lib/validate");
const logger = __importStar(require("firebase-functions/logger"));
// Initialize Stripe with secret key
const stripe = new stripe_1.default(functions.config().stripe.secret_key, {
    apiVersion: "2023-10-16",
});
// Initialize Firestore
const db = admin.firestore();
/**
 * Process payout for a creator
 * This is a callable function that requires authentication
 */
exports.processPayout = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate request body
        const validatedData = (0, validate_2.validateBody)(validate_1.processPayoutSchema, req.body);
        const { creatorId, amount, currency } = validatedData;
        logger.info("Payout processing requested", {
            creatorId,
            amount,
            currency,
            requestId
        });
        // TODO: Implement payout processing
        // - Validate user permissions
        // - Check creator profile and verification
        // - Check pending earnings
        // - Create Stripe payout
        // - Create payout record
        // - Update creator earnings
        // - Log audit entry
        // Mock payout processing - replace with actual implementation
        const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        res.status(200).json({
            success: true,
            message: "Payout processed successfully",
            data: { payoutId },
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
        logger.error('Payout processing error:', error, { requestId });
        res.status(500).json({
            error: 'Failed to process payout',
            requestId
        });
    }
}));
/**
 * Calculate pending earnings for a creator
 */
async function calculatePendingEarnings(userId) {
    try {
        // Get creator profile
        const creatorDoc = await db.collection("creatorProfiles").doc(userId).get();
        if (!creatorDoc.exists) {
            return { pendingEarnings: 0 };
        }
        const creatorData = creatorDoc.data();
        // Get total paid out amount
        const payoutsSnapshot = await db.collection("payouts")
            .where("userId", "==", userId)
            .where("status", "in", ["paid", "pending"])
            .get();
        const totalPaidOut = payoutsSnapshot.docs.reduce((sum, doc) => {
            const payout = doc.data();
            return sum + payout.amount;
        }, 0);
        const pendingEarnings = Math.max(0, creatorData.tipEarnings - totalPaidOut);
        return { pendingEarnings };
    }
    catch (error) {
        console.error("Error calculating pending earnings:", error);
        return { pendingEarnings: 0 };
    }
}
/**
 * Get payout settings for a user
 */
async function getPayoutSettings(userId) {
    try {
        const settingsDoc = await db.collection("payoutSettings").doc(userId).get();
        if (settingsDoc.exists) {
            return settingsDoc.data();
        }
        return null;
    }
    catch (error) {
        console.error("Error getting payout settings:", error);
        return null;
    }
}
/**
 * Update creator's earnings
 */
async function updateCreatorEarnings(userId, amountChange) {
    try {
        const creatorRef = db.collection("creatorProfiles").doc(userId);
        await creatorRef.update({
            tipEarnings: admin.firestore.FieldValue.increment(amountChange),
            updatedAt: admin.firestore.Timestamp.now()
        });
    }
    catch (error) {
        console.error("Error updating creator earnings:", error);
        throw error;
    }
}
/**
 * Log audit entry
 */
async function logAuditEntry(entry) {
    const auditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...entry,
        timestamp: admin.firestore.Timestamp.now()
    };
    await db.collection("auditLogs").doc(auditEntry.id).set(auditEntry);
}
/**
 * Get payout status from Stripe
 */
exports.getPayoutStatus = (0, https_1.onRequest)((0, http_1.withSecurityGuards)(async (req, res) => {
    const requestId = res.locals.requestId;
    try {
        // Validate query parameters
        const validatedData = (0, validate_2.validateBody)(validate_1.getPayoutStatusSchema, req.query);
        const { payoutId } = validatedData;
        logger.info("Payout status requested", {
            payoutId,
            requestId
        });
        // TODO: Implement payout status retrieval
        // - Validate user permissions
        // - Get payout from Firestore
        // - Get updated status from Stripe
        // - Update Firestore with latest status
        // - Return formatted status
        // Mock payout status - replace with actual implementation
        const status = {
            status: "pending",
            amount: 0,
            currency: "usd",
            arrivalDate: null,
            failureReason: null
        };
        res.status(200).json({
            success: true,
            message: "Payout status retrieved",
            data: { status },
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
        logger.error('Payout status error:', error, { requestId });
        res.status(500).json({
            error: 'Failed to get payout status',
            requestId
        });
    }
}));
