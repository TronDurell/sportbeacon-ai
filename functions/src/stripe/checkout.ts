import * as functions from "firebase-functions";
import { onCall, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  StripeErrorResponse,
  StripeSuccessResponse,
  TipTransaction,
  CreatorProfile,
  CallableRequestContext
} from "./types";
import { ValidationMiddleware } from "../utils/validation";
import { z } from "zod";
import { withSecurityGuards } from '../lib/http';
import { Request, Response } from 'express';
import { 
  createStripeCheckoutSessionSchema,
  getCreatorTipStatsSchema
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
 * Create a Stripe checkout session for tipping
 * This is a callable function that requires authentication
 */
export const createStripeCheckoutSession = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(createStripeCheckoutSessionSchema, req.body);
    const { amount, currency, creatorId, tipMessage } = validatedData;

    logger.info("Stripe checkout session creation requested", {
      amount,
      currency,
      creatorId,
      requestId
    });

    // TODO: Implement Stripe checkout session creation
    // - Validate user authentication and permissions
    // - Check if creator exists and is verified
    // - Check rate limiting
    // - Create Stripe checkout session
    // - Save tip transaction record
    // - Log audit entry

    // Mock checkout session creation - replace with actual implementation
    const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;

    res.status(200).json({
      success: true,
      message: "Checkout session created successfully",
      data: {
        sessionId,
        url: checkoutUrl,
        amount,
        currency
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
    
    logger.error('Stripe checkout session creation error:', error, { requestId });
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      requestId
    });
  }
}));

/**
 * Check rate limiting for user
 */
async function checkRateLimit(userId: string, amount: number): Promise<{ allowed: boolean; message?: string }> {
  const now = admin.firestore.Timestamp.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = admin.firestore.Timestamp.fromDate(today);

  // Get user's rate limit data
  const rateLimitDoc = await db.collection("rateLimits").doc(userId).get();
  
  if (!rateLimitDoc.exists) {
    // First time user, allow
    return { allowed: true };
  }

  const rateLimit = rateLimitDoc.data()!;
  const lastRequest = rateLimit.lastRequestAt as admin.firestore.Timestamp;
  const minuteAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 1000));
  const hourAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));

  // Check if we need to reset counters
  if (lastRequest < minuteAgo) {
    rateLimit.requestsThisMinute = 0;
  }
  if (lastRequest < hourAgo) {
    rateLimit.requestsThisHour = 0;
  }
  if (rateLimit.resetAt < now) {
    rateLimit.tipsToday = 0;
    rateLimit.tipAmountToday = 0;
    rateLimit.resetAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  }

  // Check limits
  if (rateLimit.requestsThisMinute >= 10) {
    return { allowed: false, message: "Too many requests per minute" };
  }

  if (rateLimit.requestsThisHour >= 100) {
    return { allowed: false, message: "Too many requests per hour" };
  }

  if (rateLimit.tipsToday >= 50) {
    return { allowed: false, message: "Daily tip limit exceeded" };
  }

  if (rateLimit.tipAmountToday + amount > 10000) { // $100 daily limit
    return { allowed: false, message: "Daily tip amount limit exceeded" };
  }

  return { allowed: true };
}

/**
 * Update rate limiting for user
 */
async function updateRateLimit(userId: string, amount: number): Promise<void> {
  const now = admin.firestore.Timestamp.now();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const resetAt = admin.firestore.Timestamp.fromDate(tomorrow);

  await db.collection("rateLimits").doc(userId).set({
    userId,
    requestsThisMinute: admin.firestore.FieldValue.increment(1),
    requestsThisHour: admin.firestore.FieldValue.increment(1),
    tipsToday: admin.firestore.FieldValue.increment(1),
    tipAmountToday: admin.firestore.FieldValue.increment(amount),
    lastRequestAt: now,
    resetAt
  }, { merge: true });
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
 * Get tip statistics for a creator
 */
export const getCreatorTipStats = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate query parameters
    const validatedData = validateBody(getCreatorTipStatsSchema, req.query);
    const { creatorId, timeRange } = validatedData;

    logger.info("Creator tip stats requested", {
      creatorId,
      timeRange,
      requestId
    });

    // TODO: Implement creator tip statistics
    // - Validate user permissions
    // - Get tip transactions for creator
    // - Calculate statistics
    // - Return formatted statistics

    // Mock statistics - replace with actual calculation
    const stats = {
      totalEarnings: 0,
      totalTips: 0,
      averageTip: 0,
      monthlyEarnings: 0,
      topTippers: []
    };

    res.status(200).json({
      success: true,
      message: "Creator tip statistics retrieved",
      data: { stats },
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
    
    logger.error('Creator tip stats error:', error, { requestId });
    res.status(500).json({ 
      error: 'Failed to get tip statistics',
      requestId
    });
  }
})); 