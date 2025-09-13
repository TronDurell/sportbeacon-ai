/**
 * Report a post for moderation
 * Callable function that users can call to report inappropriate content
 */
export declare const reportPost: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    reportId: string;
}>, unknown>;
/**
 * Review and take action on a reported post
 * Callable function for moderators to review reports
 */
export declare const reviewReportedPost: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    action: any;
}>, unknown>;
/**
 * Get moderation statistics for a location
 * @param locationId Location ID
 * @returns Moderation statistics
 */
export declare function getLocationModerationStats(locationId: string): Promise<{
    totalPosts: number;
    reportedPosts: number;
    quarantinedPosts: number;
    deletedPosts: number;
    pendingReports: number;
}>;
/**
 * Clean up expired quarantines
 * Scheduled function to automatically unquarantine posts
 */
export declare const cleanupExpiredQuarantines: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    processedCount?: undefined;
} | {
    success: boolean;
    message: string;
    processedCount: number;
}>, unknown>;
//# sourceMappingURL=moderation.d.ts.map