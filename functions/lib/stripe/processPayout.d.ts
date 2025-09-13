import * as functions from "firebase-functions";
import { PayoutResponse } from "../types";
/**
 * Process payout for a creator
 * This is a callable function that requires authentication
 */
export declare const processPayout: functions.https.CallableFunction<any, Promise<PayoutResponse>, unknown>;
/**
 * Get payout status from Stripe
 */
export declare const getPayoutStatus: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    error: string;
    data?: undefined;
} | {
    success: boolean;
    data: {
        status: string;
        amount: number;
        currency: string;
        arrivalDate: number;
        failureReason: any;
    };
    error?: undefined;
} | {
    success: boolean;
    data: {
        status: string;
        amount: number;
        currency: string;
        arrivalDate: any;
        failureReason: string;
    };
    error?: undefined;
}>, unknown>;
//# sourceMappingURL=processPayout.d.ts.map