/**
 * Shared KPI Utilities for Agents
 * Provides common KPI calculation and update functions
 */
/**
 * KPI calculation result
 */
export interface KPICalculationResult {
    playerId: string;
    teamId: string;
    statType: string;
    kpis: {
        current: number;
        average: number;
        best: number;
        trend: 'up' | 'down' | 'stable';
        change: number;
        consistency: number;
    };
    calculatedAt: Date;
}
/**
 * Calculate KPIs for a player's stat
 */
export declare function calculatePlayerStatKPIs(playerId: string, statType: string, timeRange: {
    from: Date;
    to: Date;
}): Promise<KPICalculationResult | null>;
/**
 * Calculate team KPIs
 */
export declare function calculateTeamKPIs(teamId: string, timeRange: {
    from: Date;
    to: Date;
}): Promise<{
    teamId: string;
    totalPlayers: number;
    activePlayers: number;
    participationRate: number;
    averageStats: Record<string, number>;
    topPerformers: Record<string, {
        playerId: string;
        value: number;
    }>;
    calculatedAt: Date;
} | null>;
/**
 * Update player KPIs in Firestore
 */
export declare function updatePlayerKPIs(playerId: string, statType: string, kpis: any): Promise<void>;
/**
 * Update team KPIs in Firestore
 */
export declare function updateTeamKPIs(teamId: string, kpis: any): Promise<void>;
/**
 * Get cached KPI calculation
 */
export declare function getCachedKPICalculation(playerId: string, statType: string, timeRange: {
    from: Date;
    to: Date;
}): Promise<KPICalculationResult | null>;
//# sourceMappingURL=kpi.d.ts.map