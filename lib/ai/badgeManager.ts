import { useState, useCallback, useMemo } from 'react';
import { firestore } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { analytics } from './shared/analytics';

export interface Badge {
  id?: string;
  uid: string;
  badgeType: 'achievement' | 'streak' | 'monetization' | 'community' | 'milestone';
  badgeId: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  monetaryReward?: number;
  unlockedAt: Date;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  metadata?: {
    sourceType?: string;
    sourceId?: string;
    streakDays?: number;
    tipAmount?: number;
    postCount?: number;
    followerCount?: number;
  };
}

export interface BadgeCriteria {
  badgeId: string;
  type: 'count' | 'streak' | 'amount' | 'composite';
  target: number;
  conditions: {
    postCount?: number;
    tipAmount?: number;
    streakDays?: number;
    followerCount?: number;
    engagementRate?: number;
    monetizationTier?: string;
  };
  rewards: {
    xp: number;
    monetary?: number;
    tierUpgrade?: boolean;
  };
}

export interface UserBadgeProgress {
  uid: string;
  badgeId: string;
  progress: number;
  maxProgress: number;
  lastUpdated: Date;
  isUnlocked: boolean;
}

export interface BadgeProgress {
  userId: string;
  badgeType: string;
  currentProgress: number;
  targetProgress: number;
  lastUpdated: Date;
  isCompleted: boolean;
}

export interface BadgeTier {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requiredBadges: number;
  requiredEarnings: number;
  benefits: string[];
  unlockedAt?: Date;
}

interface MonetizationEvent {
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

export const useMonetizationUtils = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<MonetizationEvent[]>([]);

  // Memoized utility functions for async-heavy logic
  const checkStreak = useCallback(async (userId: string): Promise<any> => {
    try {
      const badgesRef = collection(firestore, 'badges');
      const userBadgesQuery = query(
        badgesRef,
        where('userId', '==', userId),
        orderBy('unlockedAt', 'desc'),
        limit(30)
      );
      
      const snapshot = await getDocs(userBadgesQuery);
      const badges = snapshot.docs.map(doc => ({
        ...doc.data(),
        unlockedAt: doc.data().unlockedAt.toDate()
      }));

      // Calculate badge streak logic
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;

      for (let i = 0; i < badges.length - 1; i++) {
        const currentBadge = badges[i];
        const nextBadge = badges[i + 1];
        const dayDiff = Math.floor((currentBadge.unlockedAt.getTime() - nextBadge.unlockedAt.getTime()) / oneDay);

        if (dayDiff === 1) {
          tempStreak++;
          if (i === 0) currentStreak = tempStreak;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);

      const streakData = {
        userId,
        currentStreak,
        longestStreak,
        lastBadgeDate: badges[0]?.unlockedAt || now,
        streakType: 'daily'
      };

      // Log streak event
      await logMonetizationEvent({
        type: 'streak_achieved',
        userId,
        timestamp: now,
        data: streakData
      });

      return streakData;
    } catch (error) {
      console.error('Error checking badge streak:', error);
      throw error;
    }
  }, []);

  const triggerAutoBadge = useCallback(async (userId: string, badgeType: string): Promise<boolean> => {
    try {
      setIsProcessing(true);
      
      // Check if user already has this badge
      const badgesRef = collection(firestore, 'badges');
      const existingBadgeQuery = query(
        badgesRef,
        where('userId', '==', userId),
        where('badgeType', '==', badgeType)
      );
      
      const existingBadge = await getDocs(existingBadgeQuery);
      if (!existingBadge.empty) {
        return false; // Badge already exists
      }

      // Get badge template
      const badgeTemplate = await getBadgeTemplate(badgeType);
      if (!badgeTemplate) {
        throw new Error(`Badge template not found for type: ${badgeType}`);
      }

      // Create new badge
      const badgeData: Badge = {
        uid: userId,
        badgeType: badgeType,
        badgeId: badgeType,
        title: badgeTemplate.title,
        description: badgeTemplate.description,
        icon: badgeTemplate.icon,
        rarity: 'common',
        xpReward: badgeTemplate.rewards.xp,
        monetaryReward: badgeTemplate.rewards.monetary,
        unlockedAt: new Date(),
        progress: badgeTemplate.rewards.target,
        maxProgress: badgeTemplate.rewards.target,
        isUnlocked: true,
        metadata: {
          sourceType: 'automated',
          autoGenerated: true,
          streakDays: badgeTemplate.rewards.target,
          tipAmount: badgeTemplate.rewards.target,
          postCount: badgeTemplate.rewards.target,
          followerCount: badgeTemplate.rewards.target
        }
      };

      await addDoc(badgesRef, {
        ...badgeData,
        unlockedAt: Timestamp.fromDate(badgeData.unlockedAt)
      });

      // Log badge upgrade event
      await logMonetizationEvent({
        type: 'badge_upgrade',
        userId,
        timestamp: new Date(),
        data: { badgeType, autoGenerated: true, title: badgeTemplate.title }
      });

      // Track analytics
      await analytics.track('badge_auto_generated', {
        userId,
        badgeType,
        title: badgeTemplate.title,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error triggering auto badge:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const logPayoutEvent = useCallback(async (payoutData: any): Promise<void> => {
    try {
      // Log to Firestore
      const payoutsRef = collection(firestore, 'payouts');
      await addDoc(payoutsRef, {
        ...payoutData,
        timestamp: Timestamp.fromDate(payoutData.timestamp)
      });

      // Log monetization event
      await logMonetizationEvent({
        type: 'payout_request',
        userId: payoutData.creatorId,
        timestamp: payoutData.timestamp,
        data: {
          amount: payoutData.amount,
          status: payoutData.status,
          transactionId: payoutData.transactionId
        }
      });

      // Track analytics
      await analytics.track('payout_processed', {
        creatorId: payoutData.creatorId,
        amount: payoutData.amount,
        status: payoutData.status,
        timestamp: payoutData.timestamp.toISOString()
      });

      // Add to local events
      setEvents(prev => [...prev, {
        type: 'payout_request',
        userId: payoutData.creatorId,
        timestamp: payoutData.timestamp,
        data: payoutData
      }]);
    } catch (error) {
      console.error('Error logging payout event:', error);
      throw error;
    }
  }, []);

  const refundHandler = useCallback(async (refundData: any): Promise<boolean> => {
    try {
      setIsProcessing(true);

      // Update tip status
      const tipRef = doc(firestore, 'tips', refundData.tipId);
      await updateDoc(tipRef, {
        status: 'refunded',
        refundReason: refundData.reason,
        refundedAt: Timestamp.fromDate(refundData.timestamp)
      });

      // Log refund event
      await logMonetizationEvent({
        type: 'refund',
        userId: refundData.tipId, // This would be the tipper's ID
        timestamp: refundData.timestamp,
        data: {
          tipId: refundData.tipId,
          reason: refundData.reason,
          amount: refundData.amount
        }
      });

      // Track analytics
      await analytics.track('tip_refunded', {
        tipId: refundData.tipId,
        reason: refundData.reason,
        amount: refundData.amount,
        timestamp: refundData.timestamp.toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const logMonetizationEvent = useCallback(async (event: MonetizationEvent): Promise<void> => {
    try {
      // Log to Firestore
      const eventsRef = collection(firestore, 'monetization_events');
      await addDoc(eventsRef, {
        ...event,
        timestamp: Timestamp.fromDate(event.timestamp)
      });

      // Add to local state
      setEvents(prev => [...prev, event]);
    } catch (error) {
      console.error('Error logging monetization event:', error);
      throw error;
    }
  }, []);

  const getTierData = useCallback(async (userId: string): Promise<any> => {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Calculate tier based on badges and earnings
      const badgeCount = userData?.badgeCount || 0;
      const totalEarnings = userData?.totalEarnings || 0;

      let currentTier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
      if (totalEarnings >= 1000 && badgeCount >= 10) currentTier = 'platinum';
      else if (totalEarnings >= 500 && badgeCount >= 5) currentTier = 'gold';
      else if (totalEarnings >= 100 && badgeCount >= 2) currentTier = 'silver';

      return {
        userId,
        currentTier,
        totalEarnings,
        badgeCount,
        lastUpgradeDate: userData?.lastUpgradeDate?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting tier data:', error);
      throw error;
    }
  }, []);

  // Memoized computed values
  const monetizationStats = useMemo(() => {
    const totalEvents = events.length;
    const payoutEvents = events.filter(e => e.type === 'payout_request');
    const refundEvents = events.filter(e => e.type === 'refund');
    const badgeEvents = events.filter(e => e.type === 'badge_upgrade');

    return {
      totalEvents,
      payoutCount: payoutEvents.length,
      refundCount: refundEvents.length,
      badgeCount: badgeEvents.length,
      refundRate: totalEvents > 0 ? refundEvents.length / totalEvents : 0
    };
  }, [events]);

  return {
    // Utility functions
    checkStreak,
    triggerAutoBadge,
    logPayoutEvent,
    refundHandler,
    logMonetizationEvent,
    getTierData,
    
    // State
    isProcessing,
    events,
    monetizationStats
  };
};

// Badge template system
interface BadgeTemplate {
  type: string;
  title: string;
  description: string;
  icon: string;
  triggerValue?: number;
  requirements: {
    minTips?: number;
    minEarnings?: number;
    minStreak?: number;
  };
}

const BADGE_TEMPLATES: Record<string, BadgeTemplate> = {
  'first_tip': {
    type: 'first_tip',
    title: 'First Tip',
    description: 'Made your first tip to a creator',
    icon: '💰',
    triggerValue: 1,
    requirements: { minTips: 1 }
  },
  'tipping_streak_7': {
    type: 'tipping_streak_7',
    title: 'Week Warrior',
    description: 'Tipped for 7 consecutive days',
    icon: '🔥',
    triggerValue: 7,
    requirements: { minStreak: 7 }
  },
  'tipping_streak_30': {
    type: 'tipping_streak_30',
    title: 'Monthly Master',
    description: 'Tipped for 30 consecutive days',
    icon: '👑',
    triggerValue: 30,
    requirements: { minStreak: 30 }
  },
  'big_tipper': {
    type: 'big_tipper',
    title: 'Big Tipper',
    description: 'Tipped $100 or more in a single transaction',
    icon: '💎',
    triggerValue: 100,
    requirements: { minTips: 1 }
  },
  'creator_supporter': {
    type: 'creator_supporter',
    title: 'Creator Supporter',
    description: 'Supported 10 different creators',
    icon: '🤝',
    triggerValue: 10,
    requirements: { minTips: 10 }
  },
  'earnings_milestone_100': {
    type: 'earnings_milestone_100',
    title: 'Century Club',
    description: 'Earned $100 from tips',
    icon: '💯',
    triggerValue: 100,
    requirements: { minEarnings: 100 }
  },
  'earnings_milestone_1000': {
    type: 'earnings_milestone_1000',
    title: 'Grand Master',
    description: 'Earned $1,000 from tips',
    icon: '🏆',
    triggerValue: 1000,
    requirements: { minEarnings: 1000 }
  }
};

const getBadgeTemplate = async (badgeType: string): Promise<BadgeTemplate | null> => {
  return BADGE_TEMPLATES[badgeType] || null;
};

export class BadgeManager {
  private static instance: BadgeManager;
  private readonly WEEKLY_REVIEW_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MONETIZATION_ENABLED_THRESHOLD = 5; // Minimum badges for monetization

  static getInstance(): BadgeManager {
    if (!BadgeManager.instance) {
      BadgeManager.instance = new BadgeManager();
    }
    return BadgeManager.instance;
  }

  constructor() {
    this.initializeBadgeCriteria();
  }

  private initializeBadgeCriteria(): void {
    const criteria: BadgeCriteria[] = [
      {
        badgeId: 'first_post',
        type: 'count',
        target: 1,
        conditions: { postCount: 1 },
        rewards: { xp: 50, monetary: 5 }
      },
      {
        badgeId: 'tipping_streak_7',
        type: 'streak',
        target: 7,
        conditions: { streakDays: 7 },
        rewards: { xp: 200, monetary: 25 }
      },
      {
        badgeId: 'tipping_streak_30',
        type: 'streak',
        target: 30,
        conditions: { streakDays: 30 },
        rewards: { xp: 1000, monetary: 100, tierUpgrade: true }
      },
      {
        badgeId: 'monetization_master',
        type: 'amount',
        target: 1000,
        conditions: { tipAmount: 1000 },
        rewards: { xp: 500, monetary: 50 }
      },
      {
        badgeId: 'community_leader',
        type: 'composite',
        target: 100,
        conditions: { 
          followerCount: 100, 
          engagementRate: 0.05,
          postCount: 10 
        },
        rewards: { xp: 300, monetary: 30 }
      },
      {
        badgeId: 'viral_creator',
        type: 'count',
        target: 1,
        conditions: { engagementRate: 0.15 },
        rewards: { xp: 750, monetary: 75 }
      },
      {
        badgeId: 'tipping_champion',
        type: 'amount',
        target: 5000,
        conditions: { tipAmount: 5000 },
        rewards: { xp: 1500, monetary: 150, tierUpgrade: true }
      },
      {
        badgeId: 'consistency_king',
        type: 'streak',
        target: 90,
        conditions: { streakDays: 90 },
        rewards: { xp: 2000, monetary: 200 }
      }
    ];

    criteria.forEach(criterion => {
      this.badgeCriteria.set(criterion.badgeId, criterion);
    });
  }

  /**
   * Check and award badges based on user activity
   */
  async checkAndAwardBadges(uid: string, activityType: string, activityData: any): Promise<Badge[]> {
    try {
      const awardedBadges: Badge[] = [];
      const userStats = await this.getUserStats(uid);
      const userBadges = await this.getUserBadges(uid);
      const existingBadgeIds = new Set(userBadges.map(b => b.badgeId));

      // Get relevant criteria for this activity type
      const relevantCriteria = this.getRelevantCriteria(activityType, activityData);

      for (const criterion of relevantCriteria) {
        if (existingBadgeIds.has(criterion.badgeId)) {
          continue; // Badge already awarded
        }

        const shouldAward = await this.evaluateBadgeCriteria(uid, criterion, userStats, activityData);
        
        if (shouldAward) {
          const badge = await this.awardBadge(uid, criterion, activityData);
          if (badge) {
            awardedBadges.push(badge);
          }
        }
      }

      // Track analytics
      if (awardedBadges.length > 0) {
        await analytics.track('badges_awarded', {
          userId: uid,
          badgeCount: awardedBadges.length,
          badgeIds: awardedBadges.map(b => b.badgeId),
          activityType,
          timestamp: new Date().toISOString()
        });
      }

      return awardedBadges;

    } catch (error) {
      console.error('Failed to check and award badges:', error);
      return [];
    }
  }

  /**
   * Get relevant badge criteria for activity type
   */
  private getRelevantCriteria(activityType: string, activityData: any): BadgeCriteria[] {
    const relevant: BadgeCriteria[] = [];

    for (const [badgeId, criterion] of this.badgeCriteria) {
      let isRelevant = false;

      switch (activityType) {
        case 'post_created':
          isRelevant = criterion.conditions.postCount !== undefined;
          break;
        case 'tip_received':
          isRelevant = criterion.conditions.tipAmount !== undefined || 
                      criterion.conditions.streakDays !== undefined;
          break;
        case 'follower_gained':
          isRelevant = criterion.conditions.followerCount !== undefined;
          break;
        case 'engagement_achieved':
          isRelevant = criterion.conditions.engagementRate !== undefined;
          break;
        case 'streak_updated':
          isRelevant = criterion.conditions.streakDays !== undefined;
          break;
      }

      if (isRelevant) {
        relevant.push(criterion);
      }
    }

    return relevant;
  }

  /**
   * Evaluate if user meets badge criteria
   */
  private async evaluateBadgeCriteria(
    uid: string, 
    criterion: BadgeCriteria, 
    userStats: any, 
    activityData: any
  ): Promise<boolean> {
    try {
      switch (criterion.type) {
        case 'count':
          return this.evaluateCountCriteria(criterion, userStats, activityData);
        
        case 'streak':
          return await this.evaluateStreakCriteria(uid, criterion, userStats);
        
        case 'amount':
          return this.evaluateAmountCriteria(criterion, userStats, activityData);
        
        case 'composite':
          return this.evaluateCompositeCriteria(criterion, userStats, activityData);
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to evaluate badge criteria:', error);
      return false;
    }
  }

  private evaluateCountCriteria(criterion: BadgeCriteria, userStats: any, activityData: any): boolean {
    if (criterion.conditions.postCount && userStats.postCount >= criterion.target) {
      return true;
    }
    if (criterion.conditions.followerCount && userStats.followerCount >= criterion.target) {
      return true;
    }
    return false;
  }

  private async evaluateStreakCriteria(uid: string, criterion: BadgeCriteria, userStats: any): Promise<boolean> {
    if (!criterion.conditions.streakDays) return false;

    const streakData = await this.getUserStreak(uid);
    return streakData.currentStreak >= criterion.target;
  }

  private evaluateAmountCriteria(criterion: BadgeCriteria, userStats: any, activityData: any): boolean {
    if (criterion.conditions.tipAmount && userStats.totalTipsReceived >= criterion.target) {
      return true;
    }
    return false;
  }

  private evaluateCompositeCriteria(criterion: BadgeCriteria, userStats: any, activityData: any): boolean {
    const conditions = criterion.conditions;
    
    if (conditions.followerCount && userStats.followerCount < conditions.followerCount) {
      return false;
    }
    
    if (conditions.engagementRate && userStats.engagementRate < conditions.engagementRate) {
      return false;
    }
    
    if (conditions.postCount && userStats.postCount < conditions.postCount) {
      return false;
    }
    
    return true;
  }

  /**
   * Award badge to user
   */
  private async awardBadge(uid: string, criterion: BadgeCriteria, activityData: any): Promise<Badge | null> {
    try {
      const badgeData: Omit<Badge, 'id'> = {
        uid,
        badgeType: this.getBadgeType(criterion.badgeId),
        badgeId: criterion.badgeId,
        title: this.getBadgeTitle(criterion.badgeId),
        description: this.getBadgeDescription(criterion.badgeId),
        icon: this.getBadgeIcon(criterion.badgeId),
        rarity: this.getBadgeRarity(criterion.badgeId),
        xpReward: criterion.rewards.xp,
        monetaryReward: criterion.rewards.monetary,
        unlockedAt: new Date(),
        progress: criterion.target,
        maxProgress: criterion.target,
        isUnlocked: true,
        metadata: {
          sourceType: activityData.type,
          sourceId: activityData.id,
          streakDays: activityData.streakDays,
          tipAmount: activityData.tipAmount,
          postCount: activityData.postCount,
          followerCount: activityData.followerCount
        }
      };

      const badgesRef = collection(firestore, 'users', uid, 'badges');
      const docRef = await addDoc(badgesRef, badgeData);

      // Award XP and monetary rewards
      await this.awardRewards(uid, criterion.rewards);

      // Update user stats
      await this.updateUserBadgeStats(uid, criterion.badgeId);

      // Trigger automation if needed
      await this.triggerBadgeAutomation(uid, badgeData);

      return { ...badgeData, id: docRef.id };

    } catch (error) {
      console.error('Failed to award badge:', error);
      return null;
    }
  }

  /**
   * Award XP and monetary rewards
   */
  private async awardRewards(uid: string, rewards: any): Promise<void> {
    try {
      const userStatsRef = doc(firestore, 'users', uid, 'stats', 'userStats');
      const userStatsDoc = await getDoc(userStatsRef);

      let userStats: any;
      if (userStatsDoc.exists()) {
        userStats = userStatsDoc.data();
        userStats.totalXP += rewards.xp;
        userStats.badgesUnlocked = (userStats.badgesUnlocked || 0) + 1;
        if (rewards.monetary) {
          userStats.totalEarnings = (userStats.totalEarnings || 0) + rewards.monetary;
        }
      } else {
        userStats = {
          uid,
          totalXP: rewards.xp,
          badgesUnlocked: 1,
          totalEarnings: rewards.monetary || 0,
          lastUpdated: new Date()
        };
      }

      await setDoc(userStatsRef, userStats);

      // Track reward analytics
      await analytics.track('badge_rewards_awarded', {
        userId: uid,
        xpAwarded: rewards.xp,
        monetaryAwarded: rewards.monetary || 0,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to award rewards:', error);
    }
  }

  /**
   * Update user badge statistics
   */
  private async updateUserBadgeStats(uid: string, badgeId: string): Promise<void> {
    try {
      const statsRef = doc(firestore, 'users', uid, 'badge_stats', badgeId);
      await setDoc(statsRef, {
        unlockedAt: new Date(),
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Failed to update badge stats:', error);
    }
  }

  /**
   * Trigger automation for badge unlocks
   */
  private async triggerBadgeAutomation(uid: string, badge: Badge): Promise<void> {
    try {
      // Send Slack notification for rare/legendary badges
      if (badge.rarity === 'rare' || badge.rarity === 'legendary') {
        await this.sendSlackNotification(uid, badge);
      }

      // Add to leaderboard for monetization badges
      if (badge.badgeType === 'monetization') {
        await this.addToLeaderboard(uid, badge);
      }

      // Trigger tier upgrade if applicable
      if (badge.metadata?.streakDays && badge.metadata.streakDays >= 30) {
        await this.triggerTierUpgrade(uid);
      }

    } catch (error) {
      console.error('Failed to trigger badge automation:', error);
    }
  }

  /**
   * Send Slack notification for badge unlock
   */
  private async sendSlackNotification(uid: string, badge: Badge): Promise<void> {
    try {
      const automationRef = collection(firestore, 'automations');
      await addDoc(automationRef, {
        type: 'slack_notification',
        channel: '/marketing',
        message: `🎉 Creator ${uid} unlocked ${badge.rarity} badge: ${badge.title}!`,
        badgeId: badge.badgeId,
        userId: uid,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  /**
   * Add user to leaderboard
   */
  private async addToLeaderboard(uid: string, badge: Badge): Promise<void> {
    try {
      const leaderboardRef = collection(firestore, 'leaderboard');
      await addDoc(leaderboardRef, {
        uid,
        badgeId: badge.badgeId,
        badgeTitle: badge.title,
        rarity: badge.rarity,
        unlockedAt: badge.unlockedAt,
        score: this.calculateLeaderboardScore(badge),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to add to leaderboard:', error);
    }
  }

  /**
   * Trigger tier upgrade
   */
  private async triggerTierUpgrade(uid: string): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', uid);
      await updateDoc(userRef, {
        tier: 'premium',
        tierUpgradedAt: new Date()
      });

      // Track tier upgrade
      await analytics.track('tier_upgraded', {
        userId: uid,
        newTier: 'premium',
        reason: 'badge_achievement',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to trigger tier upgrade:', error);
    }
  }

  /**
   * Calculate leaderboard score for badge
   */
  private calculateLeaderboardScore(badge: Badge): number {
    const rarityMultipliers = {
      common: 1,
      rare: 2,
      epic: 5,
      legendary: 10
    };

    const baseScore = badge.xpReward;
    const rarityMultiplier = rarityMultipliers[badge.rarity] || 1;
    
    return baseScore * rarityMultiplier;
  }

  /**
   * Get user badges
   */
  async getUserBadges(uid: string): Promise<Badge[]> {
    try {
      const badgesRef = collection(firestore, 'users', uid, 'badges');
      const q = query(badgesRef, orderBy('unlockedAt', 'desc'));
      const snapshot = await getDocs(q);

      const badges: Badge[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        badges.push({
          id: doc.id,
          uid: data.uid,
          badgeType: data.badgeType,
          badgeId: data.badgeId,
          title: data.title,
          description: data.description,
          icon: data.icon,
          rarity: data.rarity,
          xpReward: data.xpReward,
          monetaryReward: data.monetaryReward,
          unlockedAt: data.unlockedAt.toDate(),
          progress: data.progress,
          maxProgress: data.maxProgress,
          isUnlocked: data.isUnlocked,
          metadata: data.metadata
        });
      });

      return badges;
    } catch (error) {
      console.error('Failed to get user badges:', error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(uid: string): Promise<any> {
    try {
      const statsRef = doc(firestore, 'users', uid, 'stats', 'userStats');
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        return statsDoc.data();
      }

      return {
        postCount: 0,
        followerCount: 0,
        totalTipsReceived: 0,
        engagementRate: 0,
        badgesUnlocked: 0,
        totalXP: 0
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {};
    }
  }

  /**
   * Get user streak data
   */
  async getUserStreak(uid: string): Promise<any> {
    try {
      const streakRef = doc(firestore, 'users', uid, 'streaks', 'tipping');
      const streakDoc = await getDoc(streakRef);

      if (streakDoc.exists()) {
        return streakDoc.data();
      }

      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: null
      };
    } catch (error) {
      console.error('Failed to get user streak:', error);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }

  // Helper methods for badge metadata
  private getBadgeType(badgeId: string): Badge['badgeType'] {
    const typeMap: Record<string, Badge['badgeType']> = {
      first_post: 'milestone',
      tipping_streak_7: 'streak',
      tipping_streak_30: 'streak',
      monetization_master: 'monetization',
      community_leader: 'community',
      viral_creator: 'achievement',
      tipping_champion: 'monetization',
      consistency_king: 'streak'
    };
    return typeMap[badgeId] || 'achievement';
  }

  private getBadgeTitle(badgeId: string): string {
    const titleMap: Record<string, string> = {
      first_post: 'First Post',
      tipping_streak_7: 'Week Warrior',
      tipping_streak_30: 'Monthly Master',
      monetization_master: 'Monetization Master',
      community_leader: 'Community Leader',
      viral_creator: 'Viral Creator',
      tipping_champion: 'Tipping Champion',
      consistency_king: 'Consistency King'
    };
    return titleMap[badgeId] || 'Achievement';
  }

  private getBadgeDescription(badgeId: string): string {
    const descMap: Record<string, string> = {
      first_post: 'Created your first post',
      tipping_streak_7: 'Received tips for 7 consecutive days',
      tipping_streak_30: 'Received tips for 30 consecutive days',
      monetization_master: 'Earned $1000+ in tips',
      community_leader: 'Built a community of 100+ followers',
      viral_creator: 'Achieved 15%+ engagement rate',
      tipping_champion: 'Earned $5000+ in tips',
      consistency_king: 'Maintained activity for 90+ days'
    };
    return descMap[badgeId] || 'Achievement unlocked';
  }

  private getBadgeIcon(badgeId: string): string {
    const iconMap: Record<string, string> = {
      first_post: '🎯',
      tipping_streak_7: '🔥',
      tipping_streak_30: '👑',
      monetization_master: '💰',
      community_leader: '🌟',
      viral_creator: '🚀',
      tipping_champion: '🏆',
      consistency_king: '⚡'
    };
    return iconMap[badgeId] || '🏅';
  }

  private getBadgeRarity(badgeId: string): Badge['rarity'] {
    const rarityMap: Record<string, Badge['rarity']> = {
      first_post: 'common',
      tipping_streak_7: 'rare',
      tipping_streak_30: 'epic',
      monetization_master: 'rare',
      community_leader: 'epic',
      viral_creator: 'legendary',
      tipping_champion: 'legendary',
      consistency_king: 'epic'
    };
    return rarityMap[badgeId] || 'common';
  }
}

// Export singleton instance
export const badgeManager = BadgeManager.getInstance(); 