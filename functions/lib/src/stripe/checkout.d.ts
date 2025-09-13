import * as functions from "firebase-functions";
import { CreateCheckoutSessionResponse, StripeErrorResponse, StripeSuccessResponse } from "./types";
/**
 * Create a Stripe checkout session for tipping
 * This is a callable function that requires authentication
 */
export declare const createStripeCheckoutSession: functions.https.CallableFunction<any, Promise<StripeErrorResponse | StripeSuccessResponse<CreateCheckoutSessionResponse>>, unknown>;
/**
 * Get tip statistics for a creator
 */
export declare const getCreatorTipStats: functions.https.CallableFunction<any, Promise<{
    error: {
        code: string;
        message: string;
    };
    success?: undefined;
    data?: undefined;
} | {
    success: boolean;
    data: {
        totalEarnings: number;
        totalTips: number;
        averageTip: number;
        monthlyEarnings: number;
        topTippers: {
            totalAmount: number;
            tipCount: number;
            userId: string;
        }[];
    };
    error?: undefined;
}>, unknown>;
//# sourceMappingURL=checkout.d.ts.map