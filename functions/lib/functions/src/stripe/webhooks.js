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
exports.stripeWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
// Initialize Stripe with secret key
const stripe = new stripe_1.default(functions.config().stripe.secret_key, {
    apiVersion: "2023-10-16",
});
// Initialize Firestore
const db = admin.firestore();
/**
 * Handle Stripe webhook events
 * This function processes webhook events from Stripe with signature verification
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    try {
        const sig = req.headers["stripe-signature"];
        const webhookSecret = functions.config().stripe.webhook_secret;
        const payload = req.rawBody;
        if (!sig || !payload) {
            console.error("Missing signature or payload");
            res.status(400).send("Missing signature or payload");
            return;
        }
        // Verify webhook signature
        const verificationResult = await verifyWebhookSignature(payload, sig, webhookSecret);
        if (!verificationResult.isValid) {
            console.error("Invalid webhook signature:", verificationResult.error);
            res.status(400).send("Invalid signature");
            return;
        }
        const event = verificationResult.event;
        const eventId = event.id;
        const eventType = event.type;
        // Check idempotency to prevent duplicate processing
        const idempotencyResult = await checkIdempotency(eventId);
        if (!idempotencyResult.shouldProcess) {
            console.log(`Event ${eventId} already processed, skipping`);
            res.status(200).send("Event already processed");
            return;
        }
        // Process the webhook event
        const processingResult = await processWebhookEvent(event, eventType);
        // Mark event as processed
        await markEventProcessed(eventId, processingResult);
        // Send response
        if (processingResult.success) {
            res.status(200).send("Webhook processed successfully");
        }
        else {
            res.status(500).send("Webhook processing failed");
        }
    }
    catch (error) {
        console.error("Webhook processing error:", error);
        res.status(500).send("Webhook processing error");
    }
});
/**
 * Verify webhook signature
 */
async function verifyWebhookSignature(payload, signature, secret) {
    try {
        const event = stripe.webhooks.constructEvent(payload, signature, secret);
        return {
            isValid: true,
            event
        };
    }
    catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}
/**
 * Check if event has already been processed (idempotency)
 */
async function checkIdempotency(eventId) {
    const idempotencyDoc = await db.collection("idempotencyKeys").doc(eventId).get();
    if (idempotencyDoc.exists) {
        return { shouldProcess: false };
    }
    return { shouldProcess: true };
}
/**
 * Mark event as processed
 */
async function markEventProcessed(eventId, result) {
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    );
    const idempotencyKey = {
        key: eventId,
        eventId,
        processed: result.processed,
        createdAt: now,
        expiresAt
    };
    await db.collection("idempotencyKeys").doc(eventId).set(idempotencyKey);
}
/**
 * Process webhook event based on type
 */
async function processWebhookEvent(event, eventType) {
    const actions = [];
    let processed = false;
    let error;
    try {
        switch (eventType) {
            case "checkout.session.completed":
                processed = await handleCheckoutSessionCompleted(event.data.object);
                actions.push("checkout_session_completed");
                break;
            case "payment_intent.succeeded":
                processed = await handlePaymentIntentSucceeded(event.data.object);
                actions.push("payment_intent_succeeded");
                break;
            case "payment_intent.payment_failed":
                processed = await handlePaymentIntentFailed(event.data.object);
                actions.push("payment_intent_failed");
                break;
            case "payout.paid":
                processed = await handlePayoutPaid(event.data.object);
                actions.push("payout_paid");
                break;
            case "payout.failed":
                processed = await handlePayoutFailed(event.data.object);
                actions.push("payout_failed");
                break;
            default:
                console.log(`Unhandled event type: ${eventType}`);
                processed = true; // Mark as processed to avoid reprocessing
                actions.push("unhandled_event");
        }
    }
    catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error processing ${eventType}:`, error);
    }
    return {
        success: !error,
        eventId: event.id,
        eventType,
        processed,
        error,
        actions
    };
}
/**
 * Handle checkout session completed event
 */
async function handleCheckoutSessionCompleted(session) {
    try {
        const { tipId, fromUserId, toUserId } = session.metadata;
        if (!tipId || !fromUserId || !toUserId) {
            console.error("Missing required metadata in checkout session");
            return false;
        }
        // Update tip transaction status
        const tipRef = db.collection("tips").doc(tipId);
        await tipRef.update({
            status: "succeeded",
            paymentIntentId: session.payment_intent,
            updatedAt: admin.firestore.Timestamp.now()
        });
        // Update creator's earnings
        await updateCreatorEarnings(toUserId, session.amount_total);
        // Send notification to creator (if implemented)
        await sendTipNotification(toUserId, fromUserId, session.amount_total);
        console.log(`Tip ${tipId} completed successfully`);
        return true;
    }
    catch (error) {
        console.error("Error handling checkout session completed:", error);
        return false;
    }
}
/**
 * Handle payment intent succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    try {
        const { tipId } = paymentIntent.metadata;
        if (!tipId) {
            console.log("Payment intent not associated with a tip");
            return true; // Not an error, just not a tip
        }
        // Update tip transaction with payment intent ID
        const tipRef = db.collection("tips").doc(tipId);
        await tipRef.update({
            paymentIntentId: paymentIntent.id,
            updatedAt: admin.firestore.Timestamp.now()
        });
        console.log(`Payment intent ${paymentIntent.id} succeeded for tip ${tipId}`);
        return true;
    }
    catch (error) {
        console.error("Error handling payment intent succeeded:", error);
        return false;
    }
}
/**
 * Handle payment intent failed event
 */
async function handlePaymentIntentFailed(paymentIntent) {
    try {
        const { tipId } = paymentIntent.metadata;
        if (!tipId) {
            console.log("Payment intent not associated with a tip");
            return true; // Not an error, just not a tip
        }
        // Update tip transaction status
        const tipRef = db.collection("tips").doc(tipId);
        await tipRef.update({
            status: "failed",
            updatedAt: admin.firestore.Timestamp.now()
        });
        console.log(`Payment intent ${paymentIntent.id} failed for tip ${tipId}`);
        return true;
    }
    catch (error) {
        console.error("Error handling payment intent failed:", error);
        return false;
    }
}
/**
 * Handle payout paid event
 */
async function handlePayoutPaid(payout) {
    try {
        const { userId } = payout.metadata;
        if (!userId) {
            console.log("Payout not associated with a user");
            return true;
        }
        // Update creator's payout record
        await db.collection("payouts").doc(payout.id).set({
            id: payout.id,
            userId,
            amount: payout.amount,
            currency: payout.currency,
            status: payout.status,
            arrivalDate: admin.firestore.Timestamp.fromMillis(payout.arrival_date * 1000),
            createdAt: admin.firestore.Timestamp.now()
        });
        console.log(`Payout ${payout.id} paid to user ${userId}`);
        return true;
    }
    catch (error) {
        console.error("Error handling payout paid:", error);
        return false;
    }
}
/**
 * Handle payout failed event
 */
async function handlePayoutFailed(payout) {
    try {
        const { userId } = payout.metadata;
        if (!userId) {
            console.log("Payout not associated with a user");
            return true;
        }
        // Update creator's payout record
        await db.collection("payouts").doc(payout.id).set({
            id: payout.id,
            userId,
            amount: payout.amount,
            currency: payout.currency,
            status: payout.status,
            createdAt: admin.firestore.Timestamp.now()
        });
        // Send notification to creator about failed payout
        await sendPayoutFailedNotification(userId, payout.amount);
        console.log(`Payout ${payout.id} failed for user ${userId}`);
        return true;
    }
    catch (error) {
        console.error("Error handling payout failed:", error);
        return false;
    }
}
/**
 * Update creator's earnings
 */
async function updateCreatorEarnings(creatorId, amount) {
    const creatorRef = db.collection("creatorProfiles").doc(creatorId);
    await creatorRef.update({
        tipEarnings: admin.firestore.FieldValue.increment(amount),
        totalTips: admin.firestore.FieldValue.increment(1),
        lastTipAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
    });
    // Recalculate average tip
    const creatorDoc = await creatorRef.get();
    const creatorData = creatorDoc.data();
    const averageTip = creatorData.totalTips > 0 ? creatorData.tipEarnings / creatorData.totalTips : 0;
    await creatorRef.update({
        averageTip
    });
}
/**
 * Send tip notification to creator
 */
async function sendTipNotification(creatorId, fromUserId, amount) {
    try {
        // Create notification in Firestore
        await db.collection("notifications").add({
            userId: creatorId,
            type: "tip_received",
            title: "New Tip Received!",
            message: `You received a $${(amount / 100).toFixed(2)} tip`,
            data: {
                fromUserId,
                amount,
                timestamp: admin.firestore.Timestamp.now()
            },
            read: false,
            createdAt: admin.firestore.Timestamp.now()
        });
        // TODO: Send push notification if implemented
        console.log(`Tip notification sent to creator ${creatorId}`);
    }
    catch (error) {
        console.error("Error sending tip notification:", error);
    }
}
/**
 * Send payout failed notification to creator
 */
async function sendPayoutFailedNotification(userId, amount) {
    try {
        // Create notification in Firestore
        await db.collection("notifications").add({
            userId,
            type: "payout_failed",
            title: "Payout Failed",
            message: `Your payout of $${(amount / 100).toFixed(2)} failed. Please check your payment details.`,
            data: {
                amount,
                timestamp: admin.firestore.Timestamp.now()
            },
            read: false,
            createdAt: admin.firestore.Timestamp.now()
        });
        console.log(`Payout failed notification sent to user ${userId}`);
    }
    catch (error) {
        console.error("Error sending payout failed notification:", error);
    }
}
//# sourceMappingURL=webhooks.js.map