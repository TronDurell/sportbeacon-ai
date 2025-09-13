/**
 * Handle when a user follows a location
 * - Backfill last 25 posts into user's home feed
 * - Increment location follower count
 * - Create audit log entry
 */
export declare const onFollowLocationCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    followId: string;
}>>;
/**
 * Handle when a user unfollows a location
 * - Remove all feed items for that location
 * - Decrement location follower count
 * - Create audit log entry
 */
export declare const onFollowLocationDeleted: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    followId: string;
}>>;
/**
 * Get user's followed locations
 * @param userId User ID
 * @returns Array of followed location IDs
 */
export declare function getUserFollowedLocations(userId: string): Promise<string[]>;
/**
 * Check if user is following a specific location
 * @param userId User ID
 * @param locationId Location ID
 * @returns True if user is following the location
 */
export declare function isUserFollowingLocation(userId: string, locationId: string): Promise<boolean>;
//# sourceMappingURL=followHandlers.d.ts.map