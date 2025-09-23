import * as functions from "firebase-functions";
import { onCall, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

import Stripe from "stripe";
import {
  PayoutRequest,
  PayoutResponse,
  PayoutInfo,
  CreatorProfileDocument,
  CallableRequestContext
} from "../types";
import { withSecurityGuards } from '../lib/http';
import { Request, Response } from 'express';
import { 
  processPayoutSchema,
  getPayoutStatusSchema
} from '../lib/validate';
import { validateBody } from '../lib/validate';
import * as logger from "firebase-functions/logger";

// Initialize Stripe with secret key
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2023-10-16",
});

// Initialize Firestore
const db = admin.firestore();

/**
 * Process payout for a creator
 * This is a callable function that requires authentication
 */
export const processPayout = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(processPayoutSchema, req.body);
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
  } catch (error: any) {
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
async function calculatePendingEarnings(userId: string): Promise<{ pendingEarnings: number }> {
  try {
    // Get creator profile
    const creatorDoc = await db.collection("creatorProfiles").doc(userId).get();
    if (!creatorDoc.exists) {
      return { pendingEarnings: 0 };
    }

    const creatorData = creatorDoc.data() as CreatorProfileDocument;
    
    // Get total paid out amount
    const payoutsSnapshot = await db.collection("payouts")
      .where("userId", "==", userId)
      .where("status", "in", ["paid", "pending"])
      .get();
    const totalPaidOut = payoutsSnapshot.docs.reduce((sum, doc) => {
      const payout = doc.data() as PayoutInfo;
      return sum + payout.amount;
    }, 0);

    const pendingEarnings = Math.max(0, (creatorData as any).tipEarnings - totalPaidOut);
    
    return { pendingEarnings };

  } catch (error) {
    console.error("Error calculating pending earnings:", error);
    return { pendingEarnings: 0 };
  }
}

/**
 * Get payout settings for a user
 */
async function getPayoutSettings(userId: string): Promise<any | null> {
  try {
    const settingsDoc = await db.collection("payoutSettings").doc(userId).get();
    
    if (settingsDoc.exists) {
      return settingsDoc.data();
    }

    return null;

  } catch (error) {
    console.error("Error getting payout settings:", error);
    return null;
  }
}

/**
 * Update creator's earnings
 */
async function updateCreatorEarnings(userId: string, amountChange: number): Promise<void> {
  try {
    const creatorRef = db.collection("creatorProfiles").doc(userId);
    
    await creatorRef.update({
      tipEarnings: admin.firestore.FieldValue.increment(amountChange),
      updatedAt: admin.firestore.Timestamp.now()
    });

  } catch (error) {
    console.error("Error updating creator earnings:", error);
    throw error;
  }
}

/**
 * Log audit entry
 */
async function logAuditEntry(entry: {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
}): Promise<void> {
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
export const getPayoutStatus = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate query parameters
    const validatedData = validateBody(getPayoutStatusSchema, req.query);
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
  } catch (error: any) {
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