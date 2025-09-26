/**
 * Feed Telemetry and Analytics
 * Tracks user engagement with different ranking variants and content types
 */

export interface FeedTelemetryEvent {
  event: string;
  userId: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface FeedMixData {
  userId: string;
  selWeight: number;
  engagementWeight: number;
  recencyWeight: number;
  postCount: number;
  avgSelScore: number;
  avgEngagementScore: number;
  variant: string;
}

export interface ContentEngagementData {
  userId: string;
  postId: string;
  contentType: string;
  hasResilienceScore: boolean;
  selContribution: number;
  engagementContribution: number;
  dwellTimeMs: number;
  interactionType: 'view' | 'like' | 'share' | 'comment' | 'save';
  timestamp: number;
}

/**
 * Track feed mix metrics for A/B testing
 */
export function trackFeedMix(data: FeedMixData): void {
  const event: FeedTelemetryEvent = {
    event: 'feed_mix',
    userId: data.userId || 'anonymous',
    timestamp: Date.now(),
    data: {
      selWeight: data.selWeight,
      engagementWeight: data.engagementWeight,
      recencyWeight: data.recencyWeight,
      postCount: data.postCount,
      avgSelScore: data.avgSelScore,
      avgEngagementScore: data.avgEngagementScore,
      variant: data.variant,
      experiment: 'feed_ranking_v1'
    }
  };
  
  sendTelemetryEvent(event);
}

/**
 * Track feed score breakdown for A/B cohorts
 */
export function trackFeedScoreBreakdown(data: {
  userId: string;
  postId: string;
  variant: 'A' | 'B' | 'C';
  breakdown: {
    sel: number;
    engagement: number;
    recency: number;
    final: number;
  };
  postType: string;
  hasResilienceScore: boolean;
}): void {
  const event: FeedTelemetryEvent = {
    event: 'feed_score_breakdown',
    userId: data.userId,
    timestamp: Date.now(),
    data: {
      postId: data.postId,
      variant: data.variant,
      selScore: data.breakdown.sel,
      engagementScore: data.breakdown.engagement,
      recencyScore: data.breakdown.recency,
      finalScore: data.breakdown.final,
      postType: data.postType,
      hasResilienceScore: data.hasResilienceScore,
      experiment: 'feed_ranking_v1'
    }
  };
  
  sendTelemetryEvent(event);
}

/**
 * Track content engagement for analysis
 */
export function trackContentEngagement(data: ContentEngagementData): void {
  const event: FeedTelemetryEvent = {
    event: 'content_engagement',
    userId: data.userId || 'anonymous',
    timestamp: data.timestamp,
    data: {
      postId: data.postId,
      contentType: data.contentType,
      hasResilienceScore: data.hasResilienceScore,
      selContribution: data.selContribution,
      engagementContribution: data.engagementContribution,
      dwellTimeMs: data.dwellTimeMs,
      interactionType: data.interactionType
    }
  };
  
  sendTelemetryEvent(event);
}

/**
 * Track ranking performance metrics
 */
export function trackRankingPerformance(data: {
  userId: string;
  variant: string;
  sessionDuration: number;
  postsViewed: number;
  postsInteracted: number;
  selPostsInteracted: number;
  avgDwellTime: number;
  scrollDepth: number;
}): void {
  const event: FeedTelemetryEvent = {
    event: 'ranking_performance',
    userId: data.userId,
    timestamp: Date.now(),
    data: {
      variant: data.variant,
      sessionDuration: data.sessionDuration,
      postsViewed: data.postsViewed,
      postsInteracted: data.postsInteracted,
      selPostsInteracted: data.selPostsInteracted,
      avgDwellTime: data.avgDwellTime,
      scrollDepth: data.scrollDepth,
      interactionRate: data.postsInteracted / Math.max(data.postsViewed, 1),
      selEngagementRate: data.selPostsInteracted / Math.max(data.postsViewed, 1),
      experiment: 'feed_ranking_v1'
    }
  };
  
  sendTelemetryEvent(event);
}

/**
 * Track explainability chip interactions
 */
export function trackExplainabilityInteraction(data: {
  userId: string;
  postId: string;
  reason: string;
  contribution: number;
  action: 'hover' | 'click' | 'dismiss';
}): void {
  const event: FeedTelemetryEvent = {
    event: 'explainability_interaction',
    userId: data.userId,
    timestamp: Date.now(),
    data: {
      postId: data.postId,
      reason: data.reason,
      contribution: data.contribution,
      action: data.action
    }
  };
  
  sendTelemetryEvent(event);
}

/**
 * Send telemetry event to analytics service
 */
function sendTelemetryEvent(event: FeedTelemetryEvent): void {
  // Send to multiple analytics providers
  
  // 1. Custom analytics endpoint
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    fetch('/api/analytics/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    }).catch(error => {
      console.warn('Failed to send telemetry to custom endpoint:', error);
    });
  }
  
  // 2. Google Analytics (if available)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event.event, {
      custom_parameter_1: event.data.variant,
      custom_parameter_2: event.data.selWeight,
      custom_parameter_3: event.data.postCount,
      user_id: event.userId
    });
  }
  
  // 3. Console logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Telemetry]', event);
  }
}

/**
 * Session tracking for feed engagement
 */
export class FeedSessionTracker {
  private userId: string;
  private variant: string;
  private startTime: number;
  private postsViewed: Set<string> = new Set();
  private postsInteracted: Set<string> = new Set();
  private selPostsInteracted: Set<string> = new Set();
  private dwellTimes: Map<string, number> = new Map();
  private maxScrollDepth: number = 0;
  
  constructor(userId: string, variant: string) {
    this.userId = userId;
    this.variant = variant;
    this.startTime = Date.now();
    
    // Track page unload to send final metrics
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.endSession();
      });
    }
  }
  
  trackPostView(postId: string, hasResilienceScore: boolean): void {
    this.postsViewed.add(postId);
    this.dwellTimes.set(postId, Date.now());
  }
  
  trackPostLeave(postId: string): void {
    const startTime = this.dwellTimes.get(postId);
    if (startTime) {
      const dwellTime = Date.now() - startTime;
      this.dwellTimes.set(postId, dwellTime);
    }
  }
  
  trackPostInteraction(postId: string, hasResilienceScore: boolean): void {
    this.postsInteracted.add(postId);
    if (hasResilienceScore) {
      this.selPostsInteracted.add(postId);
    }
  }
  
  trackScrollDepth(depth: number): void {
    this.maxScrollDepth = Math.max(this.maxScrollDepth, depth);
  }
  
  endSession(): void {
    const sessionDuration = Date.now() - this.startTime;
    const avgDwellTime = Array.from(this.dwellTimes.values()).reduce((a, b) => a + b, 0) / this.dwellTimes.size || 0;
    
    trackRankingPerformance({
      userId: this.userId,
      variant: this.variant,
      sessionDuration,
      postsViewed: this.postsViewed.size,
      postsInteracted: this.postsInteracted.size,
      selPostsInteracted: this.selPostsInteracted.size,
      avgDwellTime,
      scrollDepth: this.maxScrollDepth
    });
  }
}

/**
 * Initialize feed session tracking
 */
export function initializeFeedSession(userId: string, variant: string): FeedSessionTracker {
  return new FeedSessionTracker(userId, variant);
}

// Global analytics interface
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    analytics?: {
      track: (event: string, properties: Record<string, any>) => void;
    };
  }
}
