/**
 * Feed Telemetry and Analytics
 * Tracks user engagement with different ranking variants and content types
 */
/**
 * Track feed mix metrics for A/B testing
 */
export function trackFeedMix(data) {
    const event = {
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
 * Track content engagement for analysis
 */
export function trackContentEngagement(data) {
    const event = {
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
export function trackRankingPerformance(data) {
    const event = {
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
export function trackExplainabilityInteraction(data) {
    const event = {
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
function sendTelemetryEvent(event) {
    // Send to multiple analytics providers
    // 1. Custom analytics endpoint
    if (typeof window !== 'undefined' && window.fetch) {
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
    userId;
    variant;
    startTime;
    postsViewed = new Set();
    postsInteracted = new Set();
    selPostsInteracted = new Set();
    dwellTimes = new Map();
    maxScrollDepth = 0;
    constructor(userId, variant) {
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
    trackPostView(postId, hasResilienceScore) {
        this.postsViewed.add(postId);
        this.dwellTimes.set(postId, Date.now());
    }
    trackPostLeave(postId) {
        const startTime = this.dwellTimes.get(postId);
        if (startTime) {
            const dwellTime = Date.now() - startTime;
            this.dwellTimes.set(postId, dwellTime);
        }
    }
    trackPostInteraction(postId, hasResilienceScore) {
        this.postsInteracted.add(postId);
        if (hasResilienceScore) {
            this.selPostsInteracted.add(postId);
        }
    }
    trackScrollDepth(depth) {
        this.maxScrollDepth = Math.max(this.maxScrollDepth, depth);
    }
    endSession() {
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
export function initializeFeedSession(userId, variant) {
    return new FeedSessionTracker(userId, variant);
}
