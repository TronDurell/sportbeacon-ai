/**
 * Voice Function: Generate Voice Token
 * Generates authentication tokens for voice calls
 */
export declare const generateVoiceToken: import("firebase-functions/v2/https").HttpsFunction;
/**
 * Voice Function: Revoke Voice Token
 * Revokes active voice tokens
 */
export declare const revokeVoiceToken: import("firebase-functions/v2/https").HttpsFunction;
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
export declare const getCallHistory: import("firebase-functions/v2/https").HttpsFunction;
/**
 * Voice Function: Generate Audio
 * Generates audio content for voice interactions
 */
export declare const generateAudio: import("firebase-functions/v2/https").HttpsFunction;
