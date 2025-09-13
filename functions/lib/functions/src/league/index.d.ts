/**
 * League Function: Create League
 * Creates a new league with divisions and rules
 */
export declare const createLeague: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
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
 * League Function: Update League
 * Updates league information and settings
 */
export declare const updateLeague: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
}>, unknown>;
/**
 * League Function: Get League Overview
 * Retrieves comprehensive overview of a league
 */
export declare const getLeagueOverview: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        overview: {
            leagueId: any;
            name: any;
            sport: any;
            status: any;
            divisions: any;
            totalTeams: number;
            totalPlayers: number;
            schedule: any;
            rules: any;
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
 * League Function: Get League Standings
 * Retrieves current standings for a league
 */
export declare const getLeagueStandings: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        leagueId: any;
        divisionId: any;
        standings: {
            teamId: string;
            teamName: any;
            gamesPlayed: any;
            wins: any;
            losses: any;
            ties: any;
            winPercentage: string;
            totalPoints: any;
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
 * League Function: Get League Schedule
 * Retrieves the complete schedule for a league
 */
export declare const getLeagueSchedule: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        leagueId: any;
        schedule: Record<string, any[]>;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
/**
 * League Function: Generate League Schedule
 * Automatically generates a schedule for a league (Admin only)
 */
export declare const generateLeagueSchedule: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        gamesGenerated: number;
        schedule: {
            leagueId: any;
            homeTeam: string | undefined;
            awayTeam: string | undefined;
            date: Date;
            venue: any;
            status: string;
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
 * League Function: Get League Statistics
 * Retrieves comprehensive statistics for a league
 */
export declare const getLeagueStatistics: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        statistics: {
            leagueId: any;
            timeRange: any;
            totalTeams: number;
            totalPlayers: any;
            totalGames: any;
            averageGamesPerTeam: string | number;
            averagePointsPerGame: string | number;
            winPercentage: string | number;
        };
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
//# sourceMappingURL=index.d.ts.map