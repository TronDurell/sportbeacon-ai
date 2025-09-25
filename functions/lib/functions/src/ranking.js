"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRankingConfig = exports.explainRanking = exports.rankPosts = exports.scorePost = exports.DEFAULT_RANKING_CONFIG = void 0;
const firestore_1 = require("firebase-admin/firestore");
/**
 * Default ranking configuration
 */
exports.DEFAULT_RANKING_CONFIG = {
    halfLifeHours: 6,
    likeWeight: 1.0,
    replyWeight: 2.0,
    reportPenalty: -5,
    pinnedBonus: 100,
    typeBonuses: {
        "alert": 50,
        "run": 30,
        "poll": 20,
        "clip": 15,
        "note": 0 // Regular notes are baseline
    }
};
/**
 * Calculate post rank based on recency and engagement
 * @param params Post parameters for ranking
 * @param config Ranking configuration (uses default if not provided)
 * @returns Rank score (higher = more prominent)
 */
function scorePost(params, config = exports.DEFAULT_RANKING_CONFIG) {
    const now = firestore_1.Timestamp.now();
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
exports.scorePost = scorePost;
/**
 * Calculate recency score using exponential decay
 * @param ageHours Age of post in hours
 * @param halfLifeHours Half-life in hours
 * @returns Recency score (higher for newer posts)
 */
function calculateRecencyScore(ageHours, halfLifeHours) {
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
function calculateEngagementScore(params, config) {
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
function rankPosts(posts, config = exports.DEFAULT_RANKING_CONFIG) {
    return posts
        .map(post => ({
        ...post,
        rank: scorePost(post, config)
    }))
        .sort((a, b) => b.rank - a.rank);
}
exports.rankPosts = rankPosts;
/**
 * Get ranking explanation for debugging
 * @param params Post parameters
 * @param config Ranking configuration
 * @returns Detailed breakdown of ranking calculation
 */
function explainRanking(params, config = exports.DEFAULT_RANKING_CONFIG) {
    const now = firestore_1.Timestamp.now();
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
exports.explainRanking = explainRanking;
/**
 * Validate ranking configuration
 * @param config Configuration to validate
 * @returns Validation result with errors if any
 */
function validateRankingConfig(config) {
    const errors = [];
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
exports.validateRankingConfig = validateRankingConfig;
//# sourceMappingURL=ranking.js.map