import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  StripeErrorResponse,
  StripeSuccessResponse,
  TipTransaction,
  CreatorProfile,
  CallableRequestContext
} from './types';
import { ValidationMiddleware } from '../../../lib/middleware/validation';
import { z } from 'zod';

// Initialize Stripe with secret key
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

// Initialize Firestore
const db = admin.firestore();

/**
 * Create a Stripe checkout session for tipping
 * This is a callable function that requires authentication
 */
export const createStripeCheckoutSession = functions.https.onCall(
  async (
    data: CreateCheckoutSessionRequest,
    context: CallableRequestContext
  ): Promise<StripeSuccessResponse<CreateCheckoutSessionResponse> | StripeErrorResponse> => {
    try {
      // Validate authentication
      if (!context.auth) {
        return {
          error: {
            code: 'unauthenticated',
            message: 'User must be authenticated to create checkout session'
          }
        };
      }

      const fromUserId = context.auth.uid;
      
      // Validate input using Zod schema
      const checkoutSessionSchema = z.object({
        amount: z.number().min(50, 'Tip amount must be at least $0.50'),
        currency: z.string().default('usd'),
        toUserId: z.string().uuid('Invalid recipient user ID').refine(
          (val) => val !== fromUserId,
          'Cannot tip yourself'
        ),
        message: z.string().max(500, 'Message too long').optional(),
        anonymous: z.boolean().default(false),
        successUrl: z.string().url('Invalid success URL'),
        cancelUrl: z.string().url('Invalid cancel URL')
      });
      
      const validation = ValidationMiddleware.validateResponse(checkoutSessionSchema, data);
      if (!validation.success) {
        return {
          error: {
            code: 'validation-error',
            message: 'Invalid checkout session data',
            details: validation.errors?.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        };
      }

      const { amount, currency, toUserId, message, anonymous, successUrl, cancelUrl } = validation.data;

      // Check if recipient exists and is a creator
      const creatorDoc = await db.collection('creatorProfiles').doc(toUserId).get();
      if (!creatorDoc.exists) {
        return {
          error: {
            code: 'creator-not-found',
            message: 'Recipient is not a verified creator'
          }
        };
      }

      const creatorProfile = creatorDoc.data() as CreatorProfile;
      if (!creatorProfile.verified) {
        return {
          error: {
            code: 'creator-not-verified',
            message: 'Recipient is not a verified creator'
          }
        };
      }

      // Check rate limiting
      const rateLimitResult = await checkRateLimit(fromUserId, amount);
      if (!rateLimitResult.allowed) {
        return {
          error: {
            code: 'rate-limit-exceeded',
            message: rateLimitResult.message
          }
        };
      }

      // Generate unique tip ID
      const tipId = `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `Tip to ${anonymous ? 'Anonymous Creator' : 'Creator'}`,
                description: message || 'Thank you for your support!',
                images: ['https://sportbeacon-ai.com/logo.png'], // Replace with actual logo
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&tip_id=${tipId}`,
        cancel_url: cancelUrl,
        metadata: {
          tipId,
          fromUserId,
          toUserId,
          message: message || '',
          anonymous: anonymous ? 'true' : 'false',
          type: 'tip'
        },
        customer_email: context.auth.token.email,
        allow_promotion_codes: false,
        billing_address_collection: 'auto',
        shipping_address_collection: {
          allowed_countries: ['US', 'CA'], // Limit to supported countries
        },
      });

      // Create tip transaction record in Firestore
      const tipTransaction: Omit<TipTransaction, 'id'> = {
        amount,
        currency: currency.toLowerCase(),
        fromUserId,
        toUserId,
        paymentIntentId: '', // Will be updated when payment is completed
        checkoutSessionId: session.id,
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        metadata: {
          message,
          anonymous,
          category: 'tip'
        }
      };

      // Save tip transaction to Firestore
      await db.collection('tips').doc(tipId).set(tipTransaction);

      // Log audit entry
      await logAuditEntry({
        userId: fromUserId,
        action: 'create_tip',
        resource: 'tip',
        resourceId: tipId,
        details: {
          amount,
          currency,
          toUserId,
          sessionId: session.id,
          anonymous
        }
      });

      // Update rate limiting
      await updateRateLimit(fromUserId, amount);

      return {
        success: true,
        data: {
          sessionId: session.id,
          url: session.url!,
          amount,
          currency: currency.toLowerCase()
        }
      };

    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      // Log error for debugging
      await logAuditEntry({
        userId: context.auth?.uid || 'unknown',
        action: 'create_tip_error',
        resource: 'tip',
        resourceId: 'unknown',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          data
        }
      });

      return {
        error: {
          code: 'internal-error',
          message: 'Failed to create checkout session',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
);

/**
 * Check rate limiting for user
 */
async function checkRateLimit(userId: string, amount: number): Promise<{ allowed: boolean; message?: string }> {
  const now = admin.firestore.Timestamp.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = admin.firestore.Timestamp.fromDate(today);

  // Get user's rate limit data
  const rateLimitDoc = await db.collection('rateLimits').doc(userId).get();
  
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
    return { allowed: false, message: 'Too many requests per minute' };
  }

  if (rateLimit.requestsThisHour >= 100) {
    return { allowed: false, message: 'Too many requests per hour' };
  }

  if (rateLimit.tipsToday >= 50) {
    return { allowed: false, message: 'Daily tip limit exceeded' };
  }

  if (rateLimit.tipAmountToday + amount > 10000) { // $100 daily limit
    return { allowed: false, message: 'Daily tip amount limit exceeded' };
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

  await db.collection('rateLimits').doc(userId).set({
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

  await db.collection('auditLogs').doc(auditEntry.id).set(auditEntry);
}

/**
 * Get tip statistics for a creator
 */
export const getCreatorTipStats = functions.https.onCall(
  async (data: { creatorId: string }, context: CallableRequestContext) => {
    try {
      if (!context.auth) {
        return {
          error: {
            code: 'unauthenticated',
            message: 'User must be authenticated'
          }
        };
      }

      const { creatorId } = data;
      const userId = context.auth.uid;

      // Check if user is requesting their own stats or is admin
      if (creatorId !== userId && !context.auth.token.admin) {
        return {
          error: {
            code: 'permission-denied',
            message: 'Can only view own tip statistics'
          }
        };
      }

      // Get tip transactions for creator
      const tipsSnapshot = await db.collection('tips')
        .where('toUserId', '==', creatorId)
        .where('status', '==', 'succeeded')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();

      const tips = tipsSnapshot.docs.map(doc => doc.data() as TipTransaction);
      
      // Calculate statistics
      const totalEarnings = tips.reduce((sum, tip) => sum + tip.amount, 0);
      const totalTips = tips.length;
      const averageTip = totalTips > 0 ? totalEarnings / totalTips : 0;

      // Calculate monthly earnings
      const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      const monthlyTips = tips.filter(tip => tip.createdAt > thirtyDaysAgo);
      const monthlyEarnings = monthlyTips.reduce((sum, tip) => sum + tip.amount, 0);

      // Get top tippers
      const tipperMap = new Map<string, { totalAmount: number; tipCount: number }>();
      tips.forEach(tip => {
        const current = tipperMap.get(tip.fromUserId) || { totalAmount: 0, tipCount: 0 };
        tipperMap.set(tip.fromUserId, {
          totalAmount: current.totalAmount + tip.amount,
          tipCount: current.tipCount + 1
        });
      });

      const topTippers = Array.from(tipperMap.entries())
        .map(([userId, stats]) => ({ userId, ...stats }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10);

      return {
        success: true,
        data: {
          totalEarnings,
          totalTips,
          averageTip,
          monthlyEarnings,
          topTippers
        }
      };

    } catch (error) {
      console.error('Error getting tip statistics:', error);
      return {
        error: {
          code: 'internal-error',
          message: 'Failed to get tip statistics'
        }
      };
    }
  }
); 