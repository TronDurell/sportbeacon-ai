/**
 * Notification Function: Trigger Coach Notifications
 * Triggers notifications for coaches based on various events
 */
export declare const triggerCoachNotifications: import("firebase-functions/v2/https").HttpsFunction;
/**
 * Notification Function: Update User Activity
 * Updates user activity and triggers relevant notifications
 */
export declare const updateUserActivity: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
/**
 * Notification Function: Get User Notification Preferences
 * Retrieves notification preferences for authenticated users
 */
export declare const getUserNotificationPreferences: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        preferences: any;
    };
}>, unknown>;
/**
 * Notification Function: Update Notification Preferences
 * Updates notification preferences for authenticated users
 */
export declare const updateNotificationPreferences: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
/**
 * Notification Function: Send Bulk Notifications
 * Sends notifications to multiple users
 */
export declare const sendBulkNotifications: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        bulkId: string;
    };
}>, unknown>;
/**
 * Notification Function: Get Notification History
 * Retrieves notification history for authenticated users
 */
export declare const getNotificationHistory: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        notifications: {
            id: string;
        }[];
    };
}>, unknown>;
//# sourceMappingURL=index.d.ts.map