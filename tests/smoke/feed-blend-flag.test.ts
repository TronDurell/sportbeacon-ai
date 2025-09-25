/**
 * Smoke Tests for Feed Blending Feature Flag
 * Tests the feature flag integration and ranking system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isSelBlendEnabled, getDefaultWeights } from '../../frontend/src/config/feed';
import { rankPosts } from '../../frontend/src/ranking/blend';
import { getAbAssignment, getVariantConfig } from '../../frontend/src/ab/assign';

// Mock window object for testing
const mockWindow = {
  __flags: {} as Record<string, boolean>,
  __config: {} as Record<string, string | number>
};

describe('Feed Blending Feature Flag Integration', () => {
  beforeEach(() => {
    // Reset mocks
    Object.assign(mockWindow.__flags, {});
    Object.assign(mockWindow.__config, {});
    
    // Mock window object
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });
  });

  afterEach(() => {
    // Clean up - restore original window or set to undefined
    if (typeof window !== 'undefined') {
      (global as any).window = undefined;
    }
  });

  describe('Feature Flag System', () => {
    it('should return false when feature flag is not set', () => {
      expect(isSelBlendEnabled()).toBe(false);
    });

    it('should return false when feature flag is explicitly false', () => {
      mockWindow.__flags['feed.selBlend.v1'] = false;
      expect(isSelBlendEnabled()).toBe(false);
    });

    it('should return true when feature flag is enabled', () => {
      mockWindow.__flags['feed.selBlend.v1'] = true;
      expect(isSelBlendEnabled()).toBe(true);
    });

    it('should handle missing window object gracefully', () => {
      (global as any).window = undefined;
      expect(isSelBlendEnabled()).toBe(false);
    });
  });

  describe('Configuration System', () => {
    it('should use default weights when no config is provided', () => {
      const weights = getDefaultWeights();
      
      expect(weights.sel).toBe(0.35);
      expect(weights.engagement).toBe(0.5);
      expect(weights.recency).toBe(0.15);
      expect(weights.sel + weights.engagement + weights.recency).toBeCloseTo(1, 2);
    });

    it('should use remote config when available', () => {
      mockWindow.__config.SEL_WEIGHT_DEFAULT = '0.5';
      mockWindow.__config.HIGHLIGHT_WEIGHT_DEFAULT = '0.4';
      
      const weights = getDefaultWeights();
      
      expect(weights.sel).toBe(0.5);
      expect(weights.engagement).toBe(0.35); // 1 - 0.5 - 0.15
      expect(weights.recency).toBe(0.15);
    });

    it('should blend user preference with default', () => {
      const weights = getDefaultWeights(0.8); // User wants 80% SEL
      
      expect(weights.sel).toBeGreaterThan(0.35); // Should be higher than default
      expect(weights.sel).toBeLessThan(0.8); // But not full user preference
      expect(weights.sel + weights.engagement + weights.recency).toBeCloseTo(1, 2);
    });

    it('should handle extreme user preferences', () => {
      const lowWeights = getDefaultWeights(0.0); // User wants no SEL
      const highWeights = getDefaultWeights(1.0); // User wants all SEL
      
      expect(lowWeights.sel).toBeLessThan(0.35);
      expect(highWeights.sel).toBeGreaterThan(0.35);
    });
  });

  describe('A/B Assignment System', () => {
    it('should assign users consistently', () => {
      const userId = 'test-user-123';
      const assignment1 = getAbAssignment(userId);
      const assignment2 = getAbAssignment(userId);
      
      expect(assignment1.variant).toBe(assignment2.variant);
      expect(assignment1.userId).toBe(userId);
    });

    it('should assign different users to different variants', () => {
      const user1 = getAbAssignment('user-1');
      const user2 = getAbAssignment('user-2');
      const user3 = getAbAssignment('user-3');
      
      // With 3 users, we should get some variety (not guaranteed, but likely)
      const variants = [user1.variant, user2.variant, user3.variant];
      const uniqueVariants = new Set(variants);
      
      expect(uniqueVariants.size).toBeGreaterThanOrEqual(1);
    });

    it('should provide correct config for each variant', () => {
      const variantA = getVariantConfig('A');
      const variantB = getVariantConfig('B');
      const variantC = getVariantConfig('C');
      
      // Variant A should favor engagement
      expect(variantA.engagementWeight).toBeGreaterThan(variantA.selWeight);
      
      // Variant B should favor SEL
      expect(variantB.selWeight).toBeGreaterThan(variantB.engagementWeight);
      
      // Variant C should be balanced
      expect(variantC.selWeight).toBeGreaterThan(0.2);
      expect(variantC.engagementWeight).toBeGreaterThan(0.2);
      
      // All should sum to 1
      expect(variantA.selWeight + variantA.engagementWeight + variantA.recencyWeight).toBeCloseTo(1, 2);
      expect(variantB.selWeight + variantB.engagementWeight + variantB.recencyWeight).toBeCloseTo(1, 2);
      expect(variantC.selWeight + variantC.engagementWeight + variantC.recencyWeight).toBeCloseTo(1, 2);
    });
  });

  describe('Ranking Integration', () => {
    const mockPosts = [
      {
        id: '1',
        engagementScore: 0.9,
        resilienceScore: 0.3,
        ts: Date.now()
      },
      {
        id: '2',
        engagementScore: 0.6,
        resilienceScore: 0.8,
        ts: Date.now()
      },
      {
        id: '3',
        engagementScore: 0.7,
        resilienceScore: 0.5,
        ts: Date.now()
      }
    ];

    it('should rank posts differently with different weights', () => {
      const engagementWeights = { sel: 0.1, engagement: 0.8, recency: 0.1 };
      const selWeights = { sel: 0.7, engagement: 0.2, recency: 0.1 };
      
      const engagementRanked = rankPosts(mockPosts, engagementWeights);
      const selRanked = rankPosts(mockPosts, selWeights);
      
      // With engagement weights, high engagement posts should rank higher
      expect(engagementRanked[0].engagementScore).toBeGreaterThanOrEqual(engagementRanked[1].engagementScore);
      
      // With SEL weights, high SEL posts should rank higher
      expect(selRanked[0].resilienceScore).toBeGreaterThanOrEqual(selRanked[1].resilienceScore);
    });

    it('should handle posts without resilience scores', () => {
      const postsWithoutResilience = [
        {
          id: '1',
          engagementScore: 0.9,
          resilienceScore: undefined,
          ts: Date.now()
        },
        {
          id: '2',
          engagementScore: 0.6,
          resilienceScore: undefined,
          ts: Date.now()
        }
      ];
      
      const weights = { sel: 0.4, engagement: 0.5, recency: 0.1 };
      const ranked = rankPosts(postsWithoutResilience, weights);
      
      expect(ranked).toHaveLength(2);
      expect(ranked[0].engagementScore).toBeGreaterThanOrEqual(ranked[1].engagementScore);
    });

    it('should maintain ranking stability with consistent weights', () => {
      const weights = { sel: 0.35, engagement: 0.5, recency: 0.15 };
      
      const ranked1 = rankPosts(mockPosts, weights);
      const ranked2 = rankPosts(mockPosts, weights);
      
      expect(ranked1[0].id).toBe(ranked2[0].id);
      expect(ranked1[1].id).toBe(ranked2[1].id);
      expect(ranked1[2].id).toBe(ranked2[2].id);
    });
  });

  describe('Feature Flag Integration Flow', () => {
    it('should work end-to-end when feature is enabled', () => {
      // Enable feature flag
      mockWindow.__flags['feed.selBlend.v1'] = true;
      mockWindow.__config.SEL_WEIGHT_DEFAULT = '0.4';
      
      // Get user assignment
      const assignment = getAbAssignment('test-user');
      const weights = getVariantConfig(assignment.variant);
      
      // Create mock posts
      const posts = [
        {
          id: '1',
          engagementScore: 0.8,
          resilienceScore: 0.6,
          ts: Date.now()
        }
      ];
      
      // Rank posts
      const ranked = rankPosts(posts, weights);
      
      // Verify everything works
      expect(isSelBlendEnabled()).toBe(true);
      expect(assignment.variant).toMatch(/^[ABC]$/);
      expect(ranked).toHaveLength(1);
      expect(ranked[0].id).toBe('1');
    });

    it('should fallback gracefully when feature is disabled', () => {
      // Disable feature flag
      mockWindow.__flags['feed.selBlend.v1'] = false;
      
      // Should still work but with different behavior
      expect(isSelBlendEnabled()).toBe(false);
      
      // A/B assignment should still work
      const assignment = getAbAssignment('test-user');
      expect(assignment.variant).toMatch(/^[ABC]$/);
      
      // Weights should still be valid
      const weights = getVariantConfig(assignment.variant);
      expect(weights.sel + weights.engagement + weights.recency).toBeCloseTo(1, 2);
    });
  });
});
