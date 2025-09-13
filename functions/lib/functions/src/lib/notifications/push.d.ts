/**
 * Mock push notification service for testing
 * In production, this would integrate with FCM or similar service
 */
export interface PushNotification {
    title: string;
    body: string;
    data?: Record<string, string>;
    badge?: number;
    sound?: string;
}
export declare function sendPushNotification(userId: string, notification: PushNotification): Promise<boolean>;
export declare function sendBatchedPushNotification(notifications: Array<{
    userId: string;
    notification: PushNotification;
}>): Promise<{
    success: number;
    failed: number;
}>;
export declare function getUserFCMTokens(userId: string): Promise<string[]>;
export declare function cleanupInvalidTokens(userId: string, invalidTokens: string[]): Promise<void>;
//# sourceMappingURL=push.d.ts.map