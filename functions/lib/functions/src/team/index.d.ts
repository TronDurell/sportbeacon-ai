/**
 * Team Function: Create Team
 * Creates a new team with basic information
 */
export declare const createTeam: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    message: string;
    success: boolean;
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
 * Team Function: Update Team
 * Updates team information and settings
 */
export declare const updateTeam: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    message: string;
    success: boolean;
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
 * Team Function: Get Team Roster
 * Retrieves the current roster for a team
 */
export declare const getTeamRoster: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        teamId: any;
        roster: any[];
        totalPlayers: number;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
/**
 * Team Function: Add Player to Team
 * Adds a player to a team roster
 */
export declare const addPlayerToTeam: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
}>, unknown>;
/**
 * Team Function: Remove Player from Team
 * Removes a player from a team roster
 */
export declare const removePlayerFromTeam: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
}>, unknown>;
/**
 * Team Function: Get Team Statistics
 * Retrieves comprehensive statistics for a team
 */
export declare const getTeamStatistics: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        statistics: {
            teamId: any;
            timeRange: any;
            gamesPlayed: any;
            wins: any;
            losses: any;
            ties: any;
            totalPoints: any;
            winPercentage: string | number;
            rosterSize: any;
            trends: {
                recentPerformance: string;
                teamCohesion: string;
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
 * Team Function: Get Team Schedule
 * Retrieves upcoming games and practices for a team
 */
export declare const getTeamSchedule: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
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
 * Team Function: Update Team Performance
 * Updates team performance data after a game
 */
export declare const updateTeamPerformance: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
}>, unknown>;
//# sourceMappingURL=index.d.ts.map