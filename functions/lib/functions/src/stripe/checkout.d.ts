import * as functions from 'firebase-functions';
/**
 * Create a Stripe checkout session for tipping
 * This is a callable function that requires authentication
 */
export declare const createStripeCheckoutSession: functions.https.CallableFunction<any, any, unknown>;
/**
 * Get tip statistics for a creator
 */
export declare const getCreatorTipStats: functions.https.CallableFunction<any, any, unknown>;
//# sourceMappingURL=checkout.d.ts.map