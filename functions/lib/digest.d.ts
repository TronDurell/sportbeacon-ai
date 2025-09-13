/**
 * Scheduled digest generation for users with "digest" notification preference
 * Runs nightly at 8 PM user local time (or 8 PM UTC as fallback)
 */
export declare const generateLocationDigest: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * Get user's digest history
 * @param userId User ID
 * @param limit Maximum number of digests to return
 * @returns Array of digest documents
 */
export declare function getUserDigestHistory(userId: string, limit?: number): Promise<any[]>;
/**
 * Mark digest as read
 * @param userId User ID
 * @param digestId Digest ID
 */
export declare function markDigestAsRead(userId: string, digestId: string): Promise<void>;
/**
 * Clean up old digests (older than 30 days)
 * @param userId User ID (optional, if not provided cleans all users)
 */
export declare function cleanupOldDigests(userId?: string): Promise<void>;
//# sourceMappingURL=digest.d.ts.map