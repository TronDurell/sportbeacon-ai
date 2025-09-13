import { Timestamp } from "firebase-admin/firestore";
/**
 * Post ranking algorithm for Location Threads
 * Combines recency (time decay) with engagement (likes, replies)
 */
export interface PostRankingParams {
    createdAt: Timestamp;
    likeCount: number;
    replyCount: number;
    reportCount: number;
    pinned?: boolean;
    type: "note" | "run" | "clip" | "alert" | "poll";
}
export interface RankingConfig {
    halfLifeHours: number;
    likeWeight: number;
    replyWeight: number;
    reportPenalty: number;
    pinnedBonus: number;
    typeBonuses: Record<string, number>;
}
/**
 * Default ranking configuration
 */
export declare const DEFAULT_RANKING_CONFIG: RankingConfig;
/**
 * Calculate post rank based on recency and engagement
 * @param params Post parameters for ranking
 * @param config Ranking configuration (uses default if not provided)
 * @returns Rank score (higher = more prominent)
 */
export declare function scorePost(params: PostRankingParams, config?: RankingConfig): number;
/**
 * Batch rank multiple posts
 * @param posts Array of posts with ranking parameters
 * @param config Ranking configuration
 * @returns Posts sorted by rank (highest first)
 */
export declare function rankPosts<T extends PostRankingParams>(posts: T[], config?: RankingConfig): T[];
/**
 * Get ranking explanation for debugging
 * @param params Post parameters
 * @param config Ranking configuration
 * @returns Detailed breakdown of ranking calculation
 */
export declare function explainRanking(params: PostRankingParams, config?: RankingConfig): {
    totalRank: number;
    recencyScore: number;
    engagementScore: number;
    reportPenalty: number;
    pinnedBonus: number;
    typeBonus: number;
    breakdown: string;
};
/**
 * Validate ranking configuration
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
export declare function validateRankingConfig(config: RankingConfig): {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=ranking.d.ts.map