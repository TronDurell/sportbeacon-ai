/**
 * Handle when a new location post is created
 * - Increment location stats
 * - Fan-out to all followers' feeds
 * - Send notifications based on preferences
 * - Create audit log entry
 */
export declare const onLocationPostCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    locationId: string;
    postId: string;
}>>;
/**
 * Get post engagement metrics
 * @param locationId Location ID
 * @param postId Post ID
 * @returns Post engagement data
 */
export declare function getPostEngagement(locationId: string, postId: string): Promise<{
    likeCount: number;
    replyCount: number;
    reportCount: number;
    viewCount?: number;
}>;
/**
 * Update post engagement metrics
 * @param locationId Location ID
 * @param postId Post ID
 * @param updates Engagement updates
 */
export declare function updatePostEngagement(locationId: string, postId: string, updates: {
    likeCount?: number;
    replyCount?: number;
    reportCount?: number;
    viewCount?: number;
}): Promise<void>;
//# sourceMappingURL=postFanout.d.ts.map