import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { analytics } from '../../../lib/ai/shared/analytics';

export interface MonetizationEvent {
  type: 'badge_upgrade' | 'payout_request' | 'refund' | 'leaderboard_change' | 'streak_achieved';
  userId: string;
  timestamp: Date;
  data: any;
  metadata?: {
    sessionId?: string;
    deviceInfo?: string;
    location?: string;
  };
}

export interface CreatorStats {
  userId: string;
  totalEarnings: number;
  totalTips: number;
  averageTipAmount: number;
  badgeCount: number;
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tippingStreak: number;
  lastActivity: Date;
  monetizationEvents: MonetizationEvent[];
  performanceMetrics: {
    conversionRate: number;
    refundRate: number;
    engagementRate: number;
    growthRate: number;
  };
}

export const useCreatorStats = (userId: string) => {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatorStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user data
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      if (!userData) {
        throw new Error('User not found');
      }

      // Fetch monetization events
      const eventsRef = collection(firestore, 'monetization_events');
      const userEventsQuery = query(
        eventsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const eventsSnapshot = await getDocs(userEventsQuery);
      const monetizationEvents: MonetizationEvent[] = eventsSnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as MonetizationEvent[];

      // Fetch recent tips
      const tipsRef = collection(firestore, 'tips');
      const userTipsQuery = query(
        tipsRef,
        where('creatorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const tipsSnapshot = await getDocs(userTipsQuery);
      const tips = tipsSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      }));

      // Calculate performance metrics
      const totalTips = tips.length;
      const totalEarnings = tips.reduce((sum, tip) => sum + (tip.amount || 0), 0);
      const averageTipAmount = totalTips > 0 ? totalEarnings / totalTips : 0;
      
      const refundedTips = tips.filter(tip => tip.status === 'refunded');
      const refundRate = totalTips > 0 ? refundedTips.length / totalTips : 0;

      // Calculate conversion rate (tips per post/activity)
      const postsRef = collection(firestore, 'posts');
      const userPostsQuery = query(
        postsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const postsSnapshot = await getDocs(userPostsQuery);
      const posts = postsSnapshot.docs.length;
      const conversionRate = posts > 0 ? totalTips / posts : 0;

      // Calculate engagement rate
      const engagementEvents = monetizationEvents.filter(event => 
        event.type === 'badge_upgrade' || event.type === 'streak_achieved'
      );
      const engagementRate = monetizationEvents.length > 0 ? 
        engagementEvents.length / monetizationEvents.length : 0;

      // Calculate growth rate (comparing recent vs older periods)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentTips = tips.filter(tip => tip.createdAt >= thirtyDaysAgo);
      const recentEarnings = recentTips.reduce((sum, tip) => sum + (tip.amount || 0), 0);
      const olderEarnings = totalEarnings - recentEarnings;
      const growthRate = olderEarnings > 0 ? (recentEarnings - olderEarnings) / olderEarnings : 0;

      const creatorStats: CreatorStats = {
        userId,
        totalEarnings,
        totalTips,
        averageTipAmount,
        badgeCount: userData.badgeCount || 0,
        currentTier: userData.monetizationTier || 'bronze',
        tippingStreak: userData.tippingStreak || 0,
        lastActivity: userData.lastActivity?.toDate() || now,
        monetizationEvents,
        performanceMetrics: {
          conversionRate,
          refundRate,
          engagementRate,
          growthRate
        }
      };

      setStats(creatorStats);

      // Track analytics
      await analytics.track('creator_stats_fetched', {
        userId,
        totalEarnings,
        totalTips,
        badgeCount: creatorStats.badgeCount,
        currentTier: creatorStats.currentTier,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching creator stats:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const logMonetizationEvent = useCallback(async (event: Omit<MonetizationEvent, 'timestamp'>) => {
    try {
      const fullEvent: MonetizationEvent = {
        ...event,
        timestamp: new Date()
      };

      // Add to local state
      setStats(prev => prev ? {
        ...prev,
        monetizationEvents: [fullEvent, ...prev.monetizationEvents]
      } : null);

      // Log to Firestore
      const eventsRef = collection(firestore, 'monetization_events');
      await addDoc(eventsRef, {
        ...fullEvent,
        timestamp: Timestamp.fromDate(fullEvent.timestamp)
      });

      // Track analytics
      await analytics.track('monetization_event_logged', {
        userId: event.userId,
        eventType: event.type,
        timestamp: fullEvent.timestamp.toISOString()
      });

    } catch (err) {
      console.error('Error logging monetization event:', err);
    }
  }, []);

  const logBadgeUpgrade = useCallback(async (badgeType: string, badgeTitle: string) => {
    await logMonetizationEvent({
      type: 'badge_upgrade',
      userId,
      data: { badgeType, badgeTitle },
      metadata: {
        sessionId: `session_${Date.now()}`,
        deviceInfo: navigator.userAgent
      }
    });
  }, [userId, logMonetizationEvent]);

  const logPayoutRequest = useCallback(async (amount: number, status: string) => {
    await logMonetizationEvent({
      type: 'payout_request',
      userId,
      data: { amount, status },
      metadata: {
        sessionId: `session_${Date.now()}`,
        deviceInfo: navigator.userAgent
      }
    });
  }, [userId, logMonetizationEvent]);

  const logRefund = useCallback(async (tipId: string, reason: string, amount: number) => {
    await logMonetizationEvent({
      type: 'refund',
      userId,
      data: { tipId, reason, amount },
      metadata: {
        sessionId: `session_${Date.now()}`,
        deviceInfo: navigator.userAgent
      }
    });
  }, [userId, logMonetizationEvent]);

  const logLeaderboardChange = useCallback(async (oldPosition: number, newPosition: number) => {
    await logMonetizationEvent({
      type: 'leaderboard_change',
      userId,
      data: { oldPosition, newPosition },
      metadata: {
        sessionId: `session_${Date.now()}`,
        deviceInfo: navigator.userAgent
      }
    });
  }, [userId, logMonetizationEvent]);

  const logStreakAchieved = useCallback(async (streakType: string, streakCount: number) => {
    await logMonetizationEvent({
      type: 'streak_achieved',
      userId,
      data: { streakType, streakCount },
      metadata: {
        sessionId: `session_${Date.now()}`,
        deviceInfo: navigator.userAgent
      }
    });
  }, [userId, logMonetizationEvent]);

  useEffect(() => {
    if (userId) {
      fetchCreatorStats();
    }
  }, [userId, fetchCreatorStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchCreatorStats,
    logBadgeUpgrade,
    logPayoutRequest,
    logRefund,
    logLeaderboardChange,
    logStreakAchieved
  };
};

// Utility functions for external use
export const getCreatorPerformanceInsights = (stats: CreatorStats) => {
  const { performanceMetrics } = stats;
  
  const insights = {
    isHighPerformer: performanceMetrics.conversionRate > 0.1 && performanceMetrics.refundRate < 0.05,
    needsImprovement: performanceMetrics.conversionRate < 0.05 || performanceMetrics.refundRate > 0.1,
    isGrowing: performanceMetrics.growthRate > 0.1,
    isEngaged: performanceMetrics.engagementRate > 0.3
  };

  return insights;
};

export const getMonetizationRecommendations = (stats: CreatorStats) => {
  const recommendations = [];

  if (stats.performanceMetrics.conversionRate < 0.05) {
    recommendations.push({
      type: 'conversion',
      title: 'Improve Tip Conversion',
      description: 'Your content is great but not converting to tips. Try adding call-to-actions.',
      priority: 'high'
    });
  }

  if (stats.performanceMetrics.refundRate > 0.1) {
    recommendations.push({
      type: 'refund',
      title: 'Reduce Refunds',
      description: 'High refund rate detected. Review your content quality and delivery.',
      priority: 'high'
    });
  }

  if (stats.currentTier === 'bronze' && stats.badgeCount < 3) {
    recommendations.push({
      type: 'badge',
      title: 'Earn More Badges',
      description: 'Focus on earning badges to unlock higher monetization tiers.',
      priority: 'medium'
    });
  }

  if (stats.performanceMetrics.growthRate < 0) {
    recommendations.push({
      type: 'growth',
      title: 'Boost Growth',
      description: 'Your earnings are declining. Consider posting more frequently.',
      priority: 'medium'
    });
  }

  return recommendations;
}; 