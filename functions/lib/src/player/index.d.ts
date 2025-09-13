/**
 * Player Function: Create Player Profile
 * Creates a new player profile with basic information
 */
export declare const createPlayerProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: any;
} | {
    success: boolean;
    message: string;
    data: null;
    errors: {
        field: string;
        message: string;
    }[] | undefined;
} | undefined>, unknown>;
/**
 * Player Function: Update Player Profile
 * Updates an existing player profile with new information
 */
export declare const updatePlayerProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: any;
} | {
    success: boolean;
    message: string;
    data: null;
    errors: {
        field: string;
        message: string;
    }[] | undefined;
} | undefined>, unknown>;
/**
 * Player Function: Get Player Statistics
 * Retrieves comprehensive statistics for a player
 */
export declare const getPlayerStatistics: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        statistics: {
            playerId: any;
            timeRange: any;
            gamesPlayed: any;
            totalPoints: any;
            averagePerformance: any;
            achievements: any;
            trends: {
                recentPerformance: string;
                consistency: string;
                areasForImprovement: string[];
            };
        };
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
/**
 * Player Function: Get Player Achievements
 * Retrieves achievements and badges for a player
 */
export declare const getPlayerAchievements: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        achievements: {
            id: string;
        }[];
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
/**
 * Player Function: Award Achievement
 * Awards an achievement to a player (Admin only)
 */
export declare const awardAchievement: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        achievementId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
/**
 * Player Function: Get Player Schedule
 * Retrieves upcoming games and practices for a player
 */
export declare const getPlayerSchedule: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        schedule: {
            id: string;
        }[];
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
/**
 * Player Function: Update Player Performance
 * Updates player performance data after a game or practice
 */
export declare const updatePlayerPerformance: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
}>, unknown>;
//# sourceMappingURL=index.d.ts.map