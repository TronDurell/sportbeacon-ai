/**
 * Voice Function: Generate Voice Token
 * Generates authentication tokens for voice calls
 */
interface VoiceTokenRequest {
    callType: string;
    duration?: number;
    permissions?: string[];
}
export declare const generateVoiceToken: import("firebase-functions/v2/https").CallableFunction<VoiceTokenRequest, any, unknown>;
/**
 * Voice Function: Revoke Voice Token
 * Revokes active voice tokens
 */
interface RevokeTokenRequest {
    tokenId: string;
}
export declare const revokeVoiceToken: import("firebase-functions/v2/https").CallableFunction<RevokeTokenRequest, any, unknown>;
/**
 * Voice Function: Handle Voice Call
 * Processes incoming voice call requests
 */
export declare const handleVoiceCall: import("firebase-functions/v2/https").HttpsFunction;
/**
 * Voice Function: Call Status Webhook
 * Handles webhooks from voice service providers
 */
export declare const callStatusWebhook: import("firebase-functions/v2/https").HttpsFunction;
/**
 * Voice Function: Get Call History
 * Retrieves voice call history for authenticated users
 */
interface CallHistoryRequest {
    limit?: number;
    offset?: number;
}
export declare const getCallHistory: import("firebase-functions/v2/https").CallableFunction<CallHistoryRequest, any, unknown>;
/**
 * Voice Function: Generate Audio
 * Generates audio content for voice interactions
 */
export declare const generateAudio: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        audioId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: any;
    data?: undefined;
}>, unknown>;
export {};
//# sourceMappingURL=index.d.ts.map