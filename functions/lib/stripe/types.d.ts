import type { Stripe } from "stripe";
export type StripeWebhookEvent = "payment_intent.succeeded" | "payment_intent.payment_failed" | "checkout.session.completed" | "checkout.session.expired" | "payout.paid" | "payout.failed" | "customer.created" | "customer.updated";
export interface TipTransaction {
    id: string;
    amount: number;
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
export interface CreatorProfile {
    id: string;
    userId: string;
    verified: boolean;
    stripeCustomerId?: string;
    tipEarnings: number;
    totalTips: number;
    averageTip: number;
    lastTipAt?: FirebaseFirestore.Timestamp;
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
}
export interface CreateCheckoutSessionRequest {
    amount: number;
    currency: string;
    toUserId: string;
    message?: string;
    anonymous?: boolean;
    successUrl: string;
    cancelUrl: string;
}
export interface CreateCheckoutSessionResponse {
    sessionId: string;
    url: string;
    amount: number;
    currency: string;
}
export interface WebhookEventData {
    event: Stripe.Event;
    eventType: StripeWebhookEvent;
    timestamp: number;
    processed: boolean;
}
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
export interface StripeErrorResponse {
    error: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface StripeSuccessResponse<T = any> {
    success: true;
    data: T;
}
export interface WebhookVerificationResult {
    isValid: boolean;
    event?: Stripe.Event;
    error?: string;
}
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
export interface StripeConfig {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    currency: string;
    minimumTip: number;
    maximumTip: number;
}
export interface StripeEnvironment {
    STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    STRIPE_CURRENCY: string;
    STRIPE_MINIMUM_TIP: string;
    STRIPE_MAXIMUM_TIP: string;
}
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
export interface CreateTipRequest {
    amount: number;
    toUserId: string;
    message?: string;
    anonymous?: boolean;
}
export interface TipResponse {
    tipId: string;
    checkoutUrl: string;
    amount: number;
    currency: string;
    expiresAt: number;
}
export interface TipStatusUpdate {
    tipId: string;
    status: TipTransaction["status"];
    paymentIntentId?: string;
    errorMessage?: string;
}
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
export interface PayoutResponse {
    payoutId: string;
    amount: number;
    currency: string;
    status: string;
    arrivalDate: number;
}
export interface WebhookProcessingResult {
    success: boolean;
    eventId: string;
    eventType: StripeWebhookEvent;
    processed: boolean;
    error?: string;
    actions: string[];
}
export interface IdempotencyKey {
    key: string;
    eventId: string;
    processed: boolean;
    createdAt: FirebaseFirestore.Timestamp;
    expiresAt: FirebaseFirestore.Timestamp;
}
export interface RateLimitConfig {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxTipAmountPerDay: number;
    maxTipsPerDay: number;
}
export interface UserRateLimit {
    userId: string;
    requestsThisMinute: number;
    requestsThisHour: number;
    tipsToday: number;
    tipAmountToday: number;
    lastRequestAt: FirebaseFirestore.Timestamp;
    resetAt: FirebaseFirestore.Timestamp;
}
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
//# sourceMappingURL=types.d.ts.map