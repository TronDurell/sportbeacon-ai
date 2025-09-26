/**
 * Blended Ranking System for SEL-Highlight Feed
 * Combines Social-Emotional Learning signals with engagement metrics
 */

import { SEL_CONFIG, calculateBlendedScore, logSELConfig } from '../lib/env'

export type Weights = { 
  sel: number; 
  engagement: number; 
  recency?: number; 
};

/**
 * Calculate time decay factor for recency scoring
 * Uses configurable half-life for recency decay
 */
export function timeDecay(ts: number): number {
  const hours = (Date.now() - ts) / 3_600_000;
  return Math.pow(0.5, hours / SEL_CONFIG.recencyHalfLifeHours);
}

/**
 * Calculate blended score for a post
 * Combines SEL resilience, engagement, and recency signals
 */
export function blendedScore(
  post: {
    engagementScore: number;
    resilienceScore?: number;
    ts: number;
  }, 
  weights?: Weights
): { score: number; selContribution: number; breakdown: { sel: number; engagement: number; recency: number } } {
  // Use environment config if no weights provided
  const effectiveWeights = weights || {
    sel: SEL_CONFIG.selWeight,
    engagement: SEL_CONFIG.engagementWeight,
    recency: 0.10
  };
  
  const hoursSincePost = (Date.now() - post.ts) / 3_600_000;
  
  // Use environment-gated calculation
  const result = calculateBlendedScore(
    post.resilienceScore ?? 0,
    post.engagementScore,
    hoursSincePost
  );
  
  // Calculate SEL contribution percentage for explainability
  const selContribution = result.finalScore > 0 ? result.breakdown.sel / result.finalScore : 0;
  
  return { 
    score: result.finalScore, 
    selContribution,
    breakdown: result.breakdown
  };
}

/**
 * Rank posts using blended scoring
 * Sorts posts by blended score in descending order
 */
export function rankPosts<T extends {
  engagementScore: number;
  resilienceScore?: number;
  ts: number;
}>(posts: T[], weights?: Weights): T[] {
  // Log configuration for debugging
  logSELConfig();
  
  return [...posts].sort((a, b) => {
    const scoreA = blendedScore(a, weights).score;
    const scoreB = blendedScore(b, weights).score;
    return scoreB - scoreA;
  });
}

/**
 * Compute resilience score from post content
 * Simple keyword-based approach (can be enhanced with ML later)
 */
export function computeResilienceScore(post: {
  content: string;
  type?: string;
  tags?: string[];
}): number {
  // SEL-related keywords and their weights
  const selKeywords = {
    // Resilience and growth mindset
    'resilient': 0.8,
    'growth': 0.7,
    'mindset': 0.7,
    'challenge': 0.6,
    'overcome': 0.8,
    'persevere': 0.8,
    'determination': 0.7,
    'motivation': 0.6,
    
    // Social skills and teamwork
    'teamwork': 0.7,
    'collaborate': 0.6,
    'support': 0.6,
    'encourage': 0.6,
    'mentor': 0.8,
    'leadership': 0.7,
    'community': 0.6,
    
    // Emotional regulation
    'emotion': 0.6,
    'calm': 0.6,
    'focus': 0.5,
    'mindful': 0.7,
    'meditation': 0.8,
    'stress': 0.5,
    'anxiety': 0.5,
    
    // Goal setting and achievement
    'goal': 0.6,
    'achieve': 0.6,
    'success': 0.5,
    'improve': 0.6,
    'progress': 0.6,
    'skill': 0.5,
    
    // Positive values
    'respect': 0.7,
    'integrity': 0.8,
    'honor': 0.7,
    'fair': 0.6,
    'kind': 0.7,
    'compassion': 0.8,
  };
  
  const content = post.content.toLowerCase();
  let score = 0;
  let keywordCount = 0;
  
  // Check for SEL keywords in content
  for (const [keyword, weight] of Object.entries(selKeywords)) {
    if (content.includes(keyword)) {
      score += weight;
      keywordCount++;
    }
  }
  
  // Check tags for additional SEL signals
  if (post.tags) {
    for (const tag of post.tags) {
      const tagLower = tag.toLowerCase();
      for (const [keyword, weight] of Object.entries(selKeywords)) {
        if (tagLower.includes(keyword)) {
          score += weight * 0.5; // Tags get half weight
          keywordCount++;
        }
      }
    }
  }
  
  // Normalize score to 0-1 range
  // Base score of 0.2 for any content, max of 1.0
  const normalizedScore = Math.min(0.2 + (score / Math.max(keywordCount, 1)), 1.0);
  
  // Boost score for certain post types
  const typeBoost = {
    'training': 0.1,
    'tip': 0.15,
    'story': 0.2,
    'achievement': 0.1,
  };
  
  const boost = typeBoost[post.type as keyof typeof typeBoost] ?? 0;
  
  return Math.min(normalizedScore + boost, 1.0);
}

/**
 * Backfill resilience scores for posts that don't have them
 */
export function backfillResilienceScores<T extends {
  content: string;
  type?: string;
  tags?: string[];
  resilienceScore?: number;
}>(posts: T[]): T[] {
  return posts.map(post => ({
    ...post,
    resilienceScore: post.resilienceScore ?? computeResilienceScore(post)
  }));
}
