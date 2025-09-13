import type { Stripe } from "stripe";

// Stripe event types for webhook handling
export type StripeWebhookEvent = 
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "checkout.session.completed"
  | "checkout.session.expired"
  | "payout.paid"
  | "payout.failed"
  | "customer.created"
  | "customer.updated";

// Tip transaction data structure
export interface TipTransaction {
  id: string;
  amount: number; // Amount in cents
  currency: string;
  fromUserId: string;
  toUserId: string;
  paymentIntentId: string;
  checkoutSessionId: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  metadata?: {
    message?: string;
    anonymous?: boolean;
    category?: string;
  };
}

// Creator profile with Stripe integration
export interface CreatorProfile {
  id: string;
  userId: string;
  verified: boolean;
  stripeCustomerId?: string;
  tipEarnings: number; // Total earnings in cents
  totalTips: number; // Number of tips received
  averageTip: number; // Average tip amount in cents
  lastTipAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Stripe checkout session request
export interface CreateCheckoutSessionRequest {
  amount: number; // Amount in cents
  currency: string;
  toUserId: string; // Creator receiving the tip
  message?: string;
  anonymous?: boolean;
  successUrl: string;
  cancelUrl: string;
}

// Stripe checkout session response
export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
  amount: number;
  currency: string;
}

// Webhook event data
export interface WebhookEventData {
  event: Stripe.Event;
  eventType: StripeWebhookEvent;
  timestamp: number;
  processed: boolean;
}

// Payment intent data
export interface PaymentIntentData {
  id: string;
  amount: number;
  currency: string;
  status: Stripe.PaymentIntent.Status;
  customerId?: string;
  metadata: {
    fromUserId?: string;
    toUserId?: string;
    tipId?: string;
  };
}

// Checkout session data
export interface CheckoutSessionData {
  id: string;
  amount_total: number;
  currency: string;
  payment_status: Stripe.Checkout.Session.PaymentStatus;
  customer?: string;
  metadata: {
    fromUserId?: string;
    toUserId?: string;
    tipId?: string;
    message?: string;
    anonymous?: string;
  };
}

// Payout data
export interface PayoutData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrival_date: number;
  metadata: {
    userId?: string;
    creatorId?: string;
  };
}

// Error response structure
export interface StripeErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Success response structure
export interface StripeSuccessResponse<T = any> {
  success: true;
  data: T;
}

// Webhook signature verification result
export interface WebhookVerificationResult {
  isValid: boolean;
  event?: Stripe.Event;
  error?: string;
}

// Tip statistics
export interface TipStatistics {
  totalEarnings: number;
  totalTips: number;
  averageTip: number;
  monthlyEarnings: number;
  topTippers: Array<{
    userId: string;
    totalAmount: number;
    tipCount: number;
  }>;
}

// Creator earnings summary
export interface CreatorEarnings {
  creatorId: string;
  totalEarnings: number;
  monthlyEarnings: number;
  tipCount: number;
  averageTip: number;
  lastPayout?: {
    amount: number;
    date: FirebaseFirestore.Timestamp;
  };
}

// Stripe configuration
export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  currency: string;
  minimumTip: number;
  maximumTip: number;
}

// Environment variables validation
export interface StripeEnvironment {
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_CURRENCY: string;
  STRIPE_MINIMUM_TIP: string;
  STRIPE_MAXIMUM_TIP: string;
}

// Firebase Functions callable request context
export interface CallableRequestContext {
  auth?: {
    uid: string;
    token: {
      email?: string;
      email_verified?: boolean;
      admin?: boolean;
    };
  };
}

// Tip creation request
export interface CreateTipRequest {
  amount: number;
  toUserId: string;
  message?: string;
  anonymous?: boolean;
}

// Tip response
export interface TipResponse {
  tipId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  expiresAt: number;
}

// Tip status update
export interface TipStatusUpdate {
  tipId: string;
  status: TipTransaction["status"];
  paymentIntentId?: string;
  errorMessage?: string;
}

// Creator verification request
export interface CreatorVerificationRequest {
  userId: string;
  verificationData: {
    legalName: string;
    dateOfBirth: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    ssnLast4?: string;
    businessType?: string;
    businessName?: string;
  };
}

// Payout request
export interface PayoutRequest {
  userId: string;
  amount: number;
  currency: string;
  destination: {
    type: "bank_account" | "card";
    accountId?: string;
    cardId?: string;
  };
}

// Payout response
export interface PayoutResponse {
  payoutId: string;
  amount: number;
  currency: string;
  status: string;
  arrivalDate: number;
}

// Webhook processing result
export interface WebhookProcessingResult {
  success: boolean;
  eventId: string;
  eventType: StripeWebhookEvent;
  processed: boolean;
  error?: string;
  actions: string[];
}

// Idempotency key management
export interface IdempotencyKey {
  key: string;
  eventId: string;
  processed: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
}

// Rate limiting configuration
export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxTipAmountPerDay: number;
  maxTipsPerDay: number;
}

// User rate limiting data
export interface UserRateLimit {
  userId: string;
  requestsThisMinute: number;
  requestsThisHour: number;
  tipsToday: number;
  tipAmountToday: number;
  lastRequestAt: FirebaseFirestore.Timestamp;
  resetAt: FirebaseFirestore.Timestamp;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: FirebaseFirestore.Timestamp;
}

// All types are already exported individually above 