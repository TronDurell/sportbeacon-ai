/**
 * Unit Tests for Blended Ranking System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  timeDecay,
  blendedScore,
  rankPosts,
  computeResilienceScore,
  backfillResilienceScores
} from '../../../frontend/src/ranking/blend';

describe('timeDecay', () => {
  it('should return 1 for recent timestamps', () => {
    const now = Date.now();
    expect(timeDecay(now)).toBeCloseTo(1, 2);
  });

  it('should return 0.5 for 24-hour old timestamps', () => {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    expect(timeDecay(twentyFourHoursAgo)).toBeCloseTo(0.5, 2);
  });

  it('should return smaller values for older timestamps', () => {
    const oneHourAgo = Date.now() - (1 * 60 * 60 * 1000);
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
    const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);

    expect(timeDecay(oneHourAgo)).toBeGreaterThan(timeDecay(twelveHoursAgo));
    expect(timeDecay(twelveHoursAgo)).toBeGreaterThan(timeDecay(fortyEightHoursAgo));
  });
});

describe('blendedScore', () => {
  const mockPost = {
    engagementScore: 0.8,
    resilienceScore: 0.6,
    ts: Date.now()
  };

  const mockWeights = {
    sel: 0.4,
    engagement: 0.5,
    recency: 0.1
  };

  it('should calculate blended score correctly', () => {
    const result = blendedScore(mockPost, mockWeights);
    
    expect(result.score).toBeGreaterThan(0);
    expect(result.selContribution).toBeGreaterThanOrEqual(0);
    expect(result.selContribution).toBeLessThanOrEqual(1);
  });

  it('should handle null resilienceScore', () => {
    const postWithoutResilience = {
      ...mockPost,
      resilienceScore: undefined
    };
    
    const result = blendedScore(postWithoutResilience, mockWeights);
    
    expect(result.score).toBeGreaterThan(0);
    expect(result.selContribution).toBe(0);
  });

  it('should favor higher resilience when selWeight increases', () => {
    const lowSelWeights = { sel: 0.1, engagement: 0.8, recency: 0.1 };
    const highSelWeights = { sel: 0.7, engagement: 0.2, recency: 0.1 };
    
    const lowSelResult = blendedScore(mockPost, lowSelWeights);
    const highSelResult = blendedScore(mockPost, highSelWeights);
    
    expect(highSelResult.selContribution).toBeGreaterThan(lowSelResult.selContribution);
  });

  it('should handle zero weights gracefully', () => {
    const zeroWeights = { sel: 0, engagement: 0, recency: 0 };
    const result = blendedScore(mockPost, zeroWeights);
    
    expect(result.score).toBe(0);
    expect(result.selContribution).toBe(0);
  });
});

describe('rankPosts', () => {
  const mockPosts = [
    {
      id: '1',
      engagementScore: 0.9,
      resilienceScore: 0.3,
      ts: Date.now() - (1 * 60 * 60 * 1000) // 1 hour ago
    },
    {
      id: '2',
      engagementScore: 0.6,
      resilienceScore: 0.8,
      ts: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: '3',
      engagementScore: 0.7,
      resilienceScore: 0.5,
      ts: Date.now() - (3 * 60 * 60 * 1000) // 3 hours ago
    }
  ];

  const mockWeights = {
    sel: 0.4,
    engagement: 0.5,
    recency: 0.1
  };

  it('should rank posts by blended score in descending order', () => {
    const ranked = rankPosts(mockPosts, mockWeights);
    
    expect(ranked).toHaveLength(3);
    
    // First post should have highest score
    const firstScore = blendedScore(ranked[0], mockWeights).score;
    const secondScore = blendedScore(ranked[1], mockWeights).score;
    const thirdScore = blendedScore(ranked[2], mockWeights).score;
    
    expect(firstScore).toBeGreaterThanOrEqual(secondScore);
    expect(secondScore).toBeGreaterThanOrEqual(thirdScore);
  });

  it('should not modify original array', () => {
    const originalPosts = [...mockPosts];
    const ranked = rankPosts(mockPosts, mockWeights);
    
    expect(mockPosts).toEqual(originalPosts);
    expect(ranked).not.toBe(mockPosts);
  });

  it('should handle empty array', () => {
    const ranked = rankPosts([], mockWeights);
    expect(ranked).toEqual([]);
  });

  it('should handle single post', () => {
    const singlePost = [mockPosts[0]];
    const ranked = rankPosts(singlePost, mockWeights);
    
    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toEqual(mockPosts[0]);
  });
});

describe('computeResilienceScore', () => {
  it('should return base score for content without SEL keywords', () => {
    const post = {
      content: 'This is a regular sports post about basketball.',
      type: 'post'
    };
    
    const score = computeResilienceScore(post);
    expect(score).toBeGreaterThanOrEqual(0.2); // Base score
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('should boost score for content with SEL keywords', () => {
    const post = {
      content: 'This post is about resilience and growth mindset in sports.',
      type: 'tip'
    };
    
    const score = computeResilienceScore(post);
    expect(score).toBeGreaterThan(0.3); // Should be higher than base
  });

  it('should handle tags with SEL keywords', () => {
    const post = {
      content: 'Regular content',
      type: 'post',
      tags: ['teamwork', 'leadership', 'motivation']
    };
    
    const score = computeResilienceScore(post);
    expect(score).toBeGreaterThan(0.3); // Should be boosted by tags
  });

  it('should give higher scores to certain post types', () => {
    const regularPost = {
      content: 'Content about resilience',
      type: 'post'
    };
    
    const tipPost = {
      content: 'Content about resilience',
      type: 'tip'
    };
    
    const storyPost = {
      content: 'Content about resilience',
      type: 'story'
    };
    
    const regularScore = computeResilienceScore(regularPost);
    const tipScore = computeResilienceScore(tipPost);
    const storyScore = computeResilienceScore(storyPost);
    
    expect(tipScore).toBeGreaterThan(regularScore);
    expect(storyScore).toBeGreaterThan(regularScore);
  });

  it('should cap score at 1.0', () => {
    const post = {
      content: 'This post has resilience, growth, mindset, teamwork, leadership, motivation, determination, perseverance, and many other SEL keywords.',
      type: 'story',
      tags: ['resilience', 'growth', 'mindset', 'teamwork', 'leadership']
    };
    
    const score = computeResilienceScore(post);
    expect(score).toBeLessThanOrEqual(1.0);
  });
});

describe('backfillResilienceScores', () => {
  const mockPosts = [
    {
      id: '1',
      content: 'Regular post',
      resilienceScore: 0.5 // Already has score
    },
    {
      id: '2',
      content: 'Post about resilience and growth',
      resilienceScore: undefined // Needs backfill
    },
    {
      id: '3',
      content: 'Another post',
      resilienceScore: undefined // Needs backfill
    }
  ];

  it('should preserve existing resilience scores', () => {
    const backfilled = backfillResilienceScores(mockPosts);
    
    expect(backfilled[0].resilienceScore).toBe(0.5);
  });

  it('should add resilience scores to posts without them', () => {
    const backfilled = backfillResilienceScores(mockPosts);
    
    expect(backfilled[1].resilienceScore).toBeDefined();
    expect(backfilled[1].resilienceScore).toBeGreaterThanOrEqual(0);
    expect(backfilled[1].resilienceScore).toBeLessThanOrEqual(1);
    
    expect(backfilled[2].resilienceScore).toBeDefined();
    expect(backfilled[2].resilienceScore).toBeGreaterThanOrEqual(0);
    expect(backfilled[2].resilienceScore).toBeLessThanOrEqual(1);
  });

  it('should handle empty array', () => {
    const backfilled = backfillResilienceScores([]);
    expect(backfilled).toEqual([]);
  });

  it('should not modify original array', () => {
    const originalPosts = [...mockPosts];
    const backfilled = backfillResilienceScores(mockPosts);
    
    expect(mockPosts).toEqual(originalPosts);
    expect(backfilled).not.toBe(mockPosts);
  });
});
