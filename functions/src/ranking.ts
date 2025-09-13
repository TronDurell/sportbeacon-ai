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
  // Time decay parameters
  halfLifeHours: number;
  // Engagement scoring parameters
  likeWeight: number;
  replyWeight: number;
  // Penalty for reports
  reportPenalty: number;
  // Bonus for pinned posts
  pinnedBonus: number;
  // Type-specific bonuses
  typeBonuses: Record<string, number>;
}

/**
 * Default ranking configuration
 */
export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  halfLifeHours: 6, // Posts lose half their recency score every 6 hours
  likeWeight: 1.0,  // Each like adds 1 point
  replyWeight: 2.0, // Each reply adds 2 points (more valuable than likes)
  reportPenalty: -5, // Each report subtracts 5 points
  pinnedBonus: 100,  // Pinned posts get significant bonus
  typeBonuses: {
    "alert": 50,    // Alerts are important
    "run": 30,      // Run invites are valuable
    "poll": 20,     // Polls encourage engagement
    "clip": 15,     // Video clips are engaging
    "note": 0       // Regular notes are baseline
  }
};

/**
 * Calculate post rank based on recency and engagement
 * @param params Post parameters for ranking
 * @param config Ranking configuration (uses default if not provided)
 * @returns Rank score (higher = more prominent)
 */
export function scorePost(
  params: PostRankingParams, 
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): number {
  const now = Timestamp.now();
  const ageHours = (now.toMillis() - params.createdAt.toMillis()) / (1000 * 60 * 60);
  
  // Recency score with exponential decay
  const recencyScore = calculateRecencyScore(ageHours, config.halfLifeHours);
  
  // Engagement score
  const engagementScore = calculateEngagementScore(params, config);
  
  // Report penalty
  const reportPenalty = params.reportCount * config.reportPenalty;
  
  // Pinned bonus
  const pinnedBonus = params.pinned ? config.pinnedBonus : 0;
  
  // Type bonus
  const typeBonus = config.typeBonuses[params.type] || 0;
  
  // Calculate final rank
  const rank = recencyScore + engagementScore + reportPenalty + pinnedBonus + typeBonus;
  
  return Math.max(0, rank); // Ensure non-negative rank
}

/**
 * Calculate recency score using exponential decay
 * @param ageHours Age of post in hours
 * @param halfLifeHours Half-life in hours
 * @returns Recency score (higher for newer posts)
 */
function calculateRecencyScore(ageHours: number, halfLifeHours: number): number {
  // Exponential decay: score = base * (0.5)^(age / halfLife)
  const baseScore = 100; // Base score for new posts
  const decayFactor = Math.pow(0.5, ageHours / halfLifeHours);
  return baseScore * decayFactor;
}

/**
 * Calculate engagement score based on likes and replies
 * @param params Post parameters
 * @param config Ranking configuration
 * @returns Engagement score
 */
function calculateEngagementScore(params: PostRankingParams, config: RankingConfig): number {
  // Use logarithmic scaling to prevent extremely popular posts from dominating
  const likeScore = Math.log(1 + params.likeCount) * config.likeWeight;
  const replyScore = Math.log(1 + params.replyCount) * config.replyWeight;
  
  return likeScore + replyScore;
}

/**
 * Batch rank multiple posts
 * @param posts Array of posts with ranking parameters
 * @param config Ranking configuration
 * @returns Posts sorted by rank (highest first)
 */
export function rankPosts<T extends PostRankingParams>(
  posts: T[], 
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): T[] {
  return posts
    .map(post => ({
      ...post,
      rank: scorePost(post, config)
    }))
    .sort((a, b) => (b as any).rank - (a as any).rank);
}

/**
 * Get ranking explanation for debugging
 * @param params Post parameters
 * @param config Ranking configuration
 * @returns Detailed breakdown of ranking calculation
 */
export function explainRanking(
  params: PostRankingParams, 
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): {
  totalRank: number;
  recencyScore: number;
  engagementScore: number;
  reportPenalty: number;
  pinnedBonus: number;
  typeBonus: number;
  breakdown: string;
} {
  const now = Timestamp.now();
  const ageHours = (now.toMillis() - params.createdAt.toMillis()) / (1000 * 60 * 60);
  
  const recencyScore = calculateRecencyScore(ageHours, config.halfLifeHours);
  const engagementScore = calculateEngagementScore(params, config);
  const reportPenalty = params.reportCount * config.reportPenalty;
  const pinnedBonus = params.pinned ? config.pinnedBonus : 0;
  const typeBonus = config.typeBonuses[params.type] || 0;
  
  const totalRank = recencyScore + engagementScore + reportPenalty + pinnedBonus + typeBonus;
  
  const breakdown = [
    `Recency (${ageHours.toFixed(1)}h old): ${recencyScore.toFixed(1)}`,
    `Engagement (${params.likeCount} likes, ${params.replyCount} replies): ${engagementScore.toFixed(1)}`,
    `Reports (${params.reportCount}): ${reportPenalty}`,
    `Pinned: ${pinnedBonus}`,
    `Type (${params.type}): ${typeBonus}`,
    `Total: ${totalRank.toFixed(1)}`
  ].join(" | ");
  
  return {
    totalRank: Math.max(0, totalRank),
    recencyScore,
    engagementScore,
    reportPenalty,
    pinnedBonus,
    typeBonus,
    breakdown
  };
}

/**
 * Validate ranking configuration
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
export function validateRankingConfig(config: RankingConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (config.halfLifeHours <= 0) {
    errors.push("halfLifeHours must be positive");
  }
  
  if (config.likeWeight < 0) {
    errors.push("likeWeight must be non-negative");
  }
  
  if (config.replyWeight < 0) {
    errors.push("replyWeight must be non-negative");
  }
  
  if (config.reportPenalty > 0) {
    errors.push("reportPenalty should be negative");
  }
  
  if (config.pinnedBonus < 0) {
    errors.push("pinnedBonus must be non-negative");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
