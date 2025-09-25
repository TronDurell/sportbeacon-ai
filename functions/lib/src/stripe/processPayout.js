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
exports.processPayout = (0, https_1.onCall)(async (data, context) => {
    try {
        // Validate authentication
        if (!context.auth) {
            return {
                success: false,
                error: "User must be authenticated to request payout"
            };
        }
        const { userId, amount, currency, destination, reason, scheduledFor } = data;
        // Validate user permissions
        if (context.auth.uid !== userId && !context.auth.token.admin) {
            return {
                success: false,
                error: "Can only request payouts for your own account"
            };
        }
        // Validate input parameters
        if (!amount || amount < 1000) { // Minimum $10.00 payout
            return {
                success: false,
                error: "Payout amount must be at least $10.00"
            };
        }
        if (!currency || !["usd", "cad", "eur", "gbp"].includes(currency.toLowerCase())) {
            return {
                success: false,
                error: "Invalid currency. Supported: USD, CAD, EUR, GBP"
            };
        }
        if (!destination || !destination.type) {
            return {
                success: false,
                error: "Payout destination is required"
            };
        }
        // Check if creator profile exists and is verified
        const creatorDoc = await db.collection("creatorProfiles").doc(userId).get();
        if (!creatorDoc.exists) {
            return {
                success: false,
                error: "Creator profile not found"
            };
        }
        const creatorProfile = creatorDoc.data();
        if (!creatorProfile.verified) {
            return {
                success: false,
                error: "Creator must be verified to receive payouts"
            };
        }
        // Check if user has enough pending earnings
        const earningsSummary = await calculatePendingEarnings(userId);
        if (amount > earningsSummary.pendingEarnings) {
            return {
                success: false,
                error: `Insufficient pending earnings. Available: $${(earningsSummary.pendingEarnings / 100).toFixed(2)}`
            };
        }
        // Check payout settings
        const payoutSettings = await getPayoutSettings(userId);
        if (payoutSettings && payoutSettings.minimumPayout > amount) {
            return {
                success: false,
                error: `Payout amount must be at least $${(payoutSettings.minimumPayout / 100).toFixed(2)}`
            };
        }
        // Create Stripe payout
        const payoutData = {
            amount,
            currency: currency.toLowerCase(),
            metadata: {
                userId,
                reason: reason || "Creator payout",
                type: "creator_payout"
            }
        };
        // Add destination if specified
        if (destination.accountId) {
            payoutData.destination = destination.accountId;
        }
        // Schedule payout if requested
        if (scheduledFor) {
            payoutData.arrival_date = Math.floor(scheduledFor.toMillis() / 1000);
        }
        const payout = await stripe.payouts.create(payoutData);
        // Create payout record in Firestore
        const payoutRecord = {
            userId,
            amount,
            currency: currency.toLowerCase(),
            status: "pending",
            method: destination.type === "bank_account" ? "bank_account" : "card",
            destination: {
                type: destination.type,
                last4: destination.accountId ? destination.accountId.slice(-4) : undefined
            },
            createdAt: admin.firestore.Timestamp.now(),
            metadata: {
                reason,
                stripePayoutId: payout.id,
                scheduledFor: scheduledFor?.toMillis()
            }
        };
        const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.collection("payouts").doc(payoutId).set(payoutRecord);
        // Update creator's earnings (reduce pending amount)
        await updateCreatorEarnings(userId, -amount);
        // Log audit entry
        await logAuditEntry({
            userId,
            action: "request_payout",
            resource: "payout",
            resourceId: payoutId,
            details: {
                amount,
                currency,
                destination: destination.type,
                reason,
                scheduledFor: scheduledFor?.toMillis()
            }
        });
        // Calculate estimated arrival date
        const estimatedArrival = scheduledFor ||
            admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)); // 2 days
        return {
            success: true,
            payoutId,
            estimatedArrival
        };
    }
    catch (error) {
        console.error("Error processing payout:", error);
        // Log error for debugging
        await logAuditEntry({
            userId: context.auth?.uid || "unknown",
            action: "payout_error",
            resource: "payout",
            resourceId: "unknown",
            details: {
                error: error instanceof Error ? error.message : "Unknown error",
                data
            }
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Payout processing failed"
        };
    }
});
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
exports.getPayoutStatus = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            return {
                success: false,
                error: "User must be authenticated"
            };
        }
        const { payoutId } = data;
        // Get payout from Firestore
        const payoutDoc = await db.collection("payouts").doc(payoutId).get();
        if (!payoutDoc.exists) {
            return {
                success: false,
                error: "Payout not found"
            };
        }
        const payoutData = payoutDoc.data();
        // Check if user has permission to view this payout
        if (context.auth.uid !== payoutData.userId && !context.auth.token.admin) {
            return {
                success: false,
                error: "Access denied"
            };
        }
        // Get updated status from Stripe
        const stripePayoutId = payoutData.metadata?.stripePayoutId;
        if (stripePayoutId) {
            const stripePayout = await stripe.payouts.retrieve(stripePayoutId);
            // Update Firestore with latest status
            await payoutDoc.ref.update({
                status: stripePayout.status,
                processedAt: stripePayout.arrival_date ?
                    admin.firestore.Timestamp.fromMillis(stripePayout.arrival_date * 1000) :
                    undefined,
                failureReason: stripePayout.failure_reason || undefined,
                updatedAt: admin.firestore.Timestamp.now()
            });
            return {
                success: true,
                data: {
                    status: stripePayout.status,
                    amount: stripePayout.amount,
                    currency: stripePayout.currency,
                    arrivalDate: stripePayout.arrival_date,
                    failureReason: stripePayout.failure_reason
                }
            };
        }
        return {
            success: true,
            data: {
                status: payoutData.status,
                amount: payoutData.amount,
                currency: payoutData.currency,
                arrivalDate: payoutData.arrivalDate?.toMillis(),
                failureReason: payoutData.failureReason
            }
        };
    }
    catch (error) {
        console.error("Error getting payout status:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get payout status"
        };
    }
});
