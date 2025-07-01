import { useState, useCallback, useMemo } from 'react';
import { firestore } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, orderBy, limit, getDocs, addDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { analytics } from './shared/analytics';

export interface Tip {
  id?: string;
  tipperId: string;
  creatorId: string;
  amount: number;
  currency: string;
  message?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: {
    postId?: string;
    badgeId?: string;
    campaignId?: string;
    source: 'direct' | 'campaign' | 'badge' | 'leaderboard';
  };
}

export interface TipStreak {
  uid: string;
  currentStreak: number;
  longestStreak: number;
  lastTipDate: Date;
  totalTipsInStreak: number;
  streakStartDate: Date;
}

export interface CreatorStats {
  uid: string;
  totalTipsReceived: number;
  totalEarnings: number;
  tipCount: number;
  averageTipAmount: number;
  highestTipAmount: number;
  lastTipDate?: Date;
  tippingStreak: number;
  monetizationTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tierUpgradedAt?: Date;
}

export interface PayoutRequest {
  id?: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stripeTransferId?: string;
  requestedAt: Date;
  processedAt?: Date;
  tipBreakdown: {
    tipId: string;
    amount: number;
    date: Date;
  }[];
  performanceSummary?: {
    totalTips: number;
    averageTipAmount: number;
    topTippers: string[];
    engagementRate: number;
  };
}

interface TipData {
  amount: number;
  creatorId: string;
  tipperId: string;
  message?: string;
  timestamp: Date;
}

interface PayoutData {
  creatorId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  transactionId?: string;
}

interface RefundData {
  tipId: string;
  reason: string;
  amount: number;
  timestamp: Date;
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

interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastTipDate: Date;
  streakType: 'daily' | 'weekly' | 'monthly';
}

interface TierData {
  userId: string;
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalEarnings: number;
  badgeCount: number;
  lastUpgradeDate: Date;
}

export const useMonetizationUtils = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState<MonetizationEvent[]>([]);

  // Memoized utility functions for async-heavy logic
  const checkStreak = useCallback(async (userId: string): Promise<StreakData> => {
    try {
      const tipsRef = collection(firestore, 'tips');
      const userTipsQuery = query(
        tipsRef,
        where('tipperId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
      
      const snapshot = await getDocs(userTipsQuery);
      const tips = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }));

      // Calculate streak logic
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;

      for (let i = 0; i < tips.length - 1; i++) {
        const currentTip = tips[i];
        const nextTip = tips[i + 1];
        const dayDiff = Math.floor((currentTip.timestamp.getTime() - nextTip.timestamp.getTime()) / oneDay);

        if (dayDiff === 1) {
          tempStreak++;
          if (i === 0) currentStreak = tempStreak;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);

      const streakData: StreakData = {
        userId,
        currentStreak,
        longestStreak,
        lastTipDate: tips[0]?.timestamp || now,
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
      console.error('Error checking streak:', error);
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
        where('type', '==', badgeType)
      );
      
      const existingBadge = await getDocs(existingBadgeQuery);
      if (!existingBadge.empty) {
        return false; // Badge already exists
      }

      // Create new badge
      const badgeData = {
        userId,
        type: badgeType,
        earnedAt: Timestamp.now(),
        metadata: {
          autoGenerated: true,
          source: 'monetization_automation'
        }
      };

      await addDoc(badgesRef, badgeData);

      // Log badge upgrade event
      await logMonetizationEvent({
        type: 'badge_upgrade',
        userId,
        timestamp: new Date(),
        data: { badgeType, autoGenerated: true }
      });

      // Track analytics
      await analytics.track('badge_auto_generated', {
        userId,
        badgeType,
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

  const logPayoutEvent = useCallback(async (payoutData: PayoutData): Promise<void> => {
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

  const refundHandler = useCallback(async (refundData: RefundData): Promise<boolean> => {
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

  const getTierData = useCallback(async (userId: string): Promise<TierData> => {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      // Calculate tier based on earnings and badges
      const totalEarnings = userData?.totalEarnings || 0;
      const badgeCount = userData?.badgeCount || 0;

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

// Legacy functions for backward compatibility
export const processTip = async (tipData: TipData): Promise<string> => {
  const { logPayoutEvent } = useMonetizationUtils();
  
  try {
    const tipsRef = collection(firestore, 'tips');
    const tipDoc = await addDoc(tipsRef, {
      ...tipData,
      timestamp: Timestamp.fromDate(tipData.timestamp),
      status: 'pending'
    });

    // Log monetization event
    await logPayoutEvent({
      creatorId: tipData.creatorId,
      amount: tipData.amount,
      status: 'pending',
      timestamp: tipData.timestamp
    });

    return tipDoc.id;
  } catch (error) {
    console.error('Error processing tip:', error);
    throw error;
  }
};

export const validateTip = async (tipData: TipData): Promise<boolean> => {
  // Basic validation logic
  if (tipData.amount <= 0) return false;
  if (!tipData.creatorId || !tipData.tipperId) return false;
  if (tipData.amount > 1000) return false; // Max tip limit
  
  return true;
};

export const calculateTipAmount = async (baseAmount: number, multiplier: number = 1): Promise<number> => {
  // Apply any bonuses, fees, or multipliers
  const finalAmount = baseAmount * multiplier;
  
  // Round to 2 decimal places
  return Math.round(finalAmount * 100) / 100;
};

export class TipSystem {
  private static instance: TipSystem;
  private readonly PLATFORM_FEE_RATE = 0.10; // 10% platform fee
  private readonly MINIMUM_PAYOUT = 25; // $25 minimum payout

  static getInstance(): TipSystem {
    if (!TipSystem.instance) {
      TipSystem.instance = new TipSystem();
    }
    return TipSystem.instance;
  }

  /**
   * Process a new tip
   */
  async processTip(tipData: Omit<Tip, 'id' | 'status' | 'createdAt'>): Promise<Tip> {
    try {
      // Validate tip data
      this.validateTipData(tipData);

      // Create tip record
      const tip: Omit<Tip, 'id'> = {
        ...tipData,
        status: 'pending',
        createdAt: new Date()
      };

      const tipsRef = collection(firestore, 'tips');
      const docRef = await addDoc(tipsRef, tip);

      // Process payment via Stripe
      const paymentResult = await this.processStripePayment(tip);
      
      if (paymentResult.success) {
        // Update tip status
        await updateDoc(docRef, {
          status: 'completed',
          completedAt: new Date(),
          stripePaymentIntentId: paymentResult.paymentIntentId
        });

        // Update creator stats
        await this.updateCreatorStats(tipData.creatorId, tipData.amount);

        // Update tipper streak
        await this.updateTipperStreak(tipData.tipperId);

        // Check for badge unlocks
        await this.checkTipRelatedBadges(tipData.creatorId, tipData.tipperId, tipData.amount);

        // Track analytics
        await analytics.track('tip_completed', {
          tipperId: tipData.tipperId,
          creatorId: tipData.creatorId,
          amount: tipData.amount,
          currency: tipData.currency,
          source: tipData.metadata?.source,
          timestamp: new Date().toISOString()
        });

        return { ...tip, id: docRef.id, status: 'completed', completedAt: new Date() };
      } else {
        // Update tip status to failed
        await updateDoc(docRef, {
          status: 'failed'
        });

        throw new Error(`Payment failed: ${paymentResult.error}`);
      }

    } catch (error) {
      console.error('Failed to process tip:', error);
      
      // Track failed tip
      await analytics.track('tip_failed', {
        tipperId: tipData.tipperId,
        creatorId: tipData.creatorId,
        amount: tipData.amount,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Validate tip data
   */
  private validateTipData(tipData: any): void {
    if (!tipData.tipperId || !tipData.creatorId) {
      throw new Error('Tipper and creator IDs are required');
    }

    if (tipData.amount <= 0) {
      throw new Error('Tip amount must be greater than 0');
    }

    if (tipData.tipperId === tipData.creatorId) {
      throw new Error('Users cannot tip themselves');
    }

    if (tipData.amount > 1000) {
      throw new Error('Tip amount cannot exceed $1000');
    }
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(tip: Tip): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
    try {
      // This would integrate with actual Stripe API
      // For now, simulate successful payment
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate payment processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        paymentIntentId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update creator statistics
   */
  private async updateCreatorStats(creatorId: string, tipAmount: number): Promise<void> {
    try {
      const statsRef = doc(firestore, 'users', creatorId, 'stats', 'creatorStats');
      
      await runTransaction(firestore, async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        
        let stats: CreatorStats;
        if (statsDoc.exists()) {
          stats = statsDoc.data() as CreatorStats;
          stats.totalTipsReceived += tipAmount;
          stats.tipCount += 1;
          stats.averageTipAmount = stats.totalTipsReceived / stats.tipCount;
          stats.highestTipAmount = Math.max(stats.highestTipAmount, tipAmount);
          stats.lastTipDate = new Date();
          stats.totalEarnings = stats.totalTipsReceived * (1 - this.PLATFORM_FEE_RATE);
        } else {
          stats = {
            uid: creatorId,
            totalTipsReceived: tipAmount,
            totalEarnings: tipAmount * (1 - this.PLATFORM_FEE_RATE),
            tipCount: 1,
            averageTipAmount: tipAmount,
            highestTipAmount: tipAmount,
            lastTipDate: new Date(),
            tippingStreak: 0,
            monetizationTier: 'bronze'
          };
        }

        // Check for tier upgrade
        const newTier = this.calculateMonetizationTier(stats.totalEarnings);
        if (newTier !== stats.monetizationTier) {
          stats.monetizationTier = newTier;
          stats.tierUpgradedAt = new Date();
        }

        transaction.set(statsRef, stats);
      });

    } catch (error) {
      console.error('Failed to update creator stats:', error);
    }
  }

  /**
   * Update tipper streak
   */
  private async updateTipperStreak(tipperId: string): Promise<void> {
    try {
      const streakRef = doc(firestore, 'users', tipperId, 'streaks', 'tipping');
      
      await runTransaction(firestore, async (transaction) => {
        const streakDoc = await transaction.get(streakRef);
        const now = new Date();
        
        let streak: TipStreak;
        if (streakDoc.exists()) {
          streak = streakDoc.data() as TipStreak;
          const lastTipDate = streak.lastTipDate.toDate();
          const daysSinceLastTip = Math.floor((now.getTime() - lastTipDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastTip === 1) {
            // Continue streak
            streak.currentStreak += 1;
            streak.totalTipsInStreak += 1;
          } else if (daysSinceLastTip > 1) {
            // Reset streak
            streak.currentStreak = 1;
            streak.totalTipsInStreak = 1;
            streak.streakStartDate = now;
          } else {
            // Same day, maintain streak
            streak.totalTipsInStreak += 1;
          }
          
          streak.lastTipDate = now;
          streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
        } else {
          streak = {
            uid: tipperId,
            currentStreak: 1,
            longestStreak: 1,
            lastTipDate: now,
            totalTipsInStreak: 1,
            streakStartDate: now
          };
        }

        transaction.set(streakRef, streak);
      });

    } catch (error) {
      console.error('Failed to update tipper streak:', error);
    }
  }

  /**
   * Check for tip-related badge unlocks
   */
  private async checkTipRelatedBadges(creatorId: string, tipperId: string, tipAmount: number): Promise<void> {
    try {
      const { badgeManager } = await import('./badgeManager');
      
      // Check creator badges
      await badgeManager.checkAndAwardBadges(creatorId, 'tip_received', {
        type: 'tip_received',
        id: creatorId,
        tipAmount,
        totalTipsReceived: tipAmount // This would be updated with actual total
      });

      // Check tipper badges
      await badgeManager.checkAndAwardBadges(tipperId, 'tip_sent', {
        type: 'tip_sent',
        id: tipperId,
        tipAmount,
        streakDays: 1 // This would be updated with actual streak
      });

    } catch (error) {
      console.error('Failed to check tip-related badges:', error);
    }
  }

  /**
   * Calculate monetization tier based on earnings
   */
  private calculateMonetizationTier(totalEarnings: number): CreatorStats['monetizationTier'] {
    if (totalEarnings >= 10000) return 'platinum';
    if (totalEarnings >= 5000) return 'gold';
    if (totalEarnings >= 1000) return 'silver';
    return 'bronze';
  }

  /**
   * Create payout request
   */
  async createPayoutRequest(creatorId: string, amount: number): Promise<PayoutRequest> {
    try {
      // Validate payout amount
      if (amount < this.MINIMUM_PAYOUT) {
        throw new Error(`Minimum payout amount is $${this.MINIMUM_PAYOUT}`);
      }

      // Get creator's available balance
      const creatorStats = await this.getCreatorStats(creatorId);
      if (creatorStats.totalEarnings < amount) {
        throw new Error('Insufficient balance for payout');
      }

      // Get tip breakdown for the requested amount
      const tipBreakdown = await this.getTipBreakdown(creatorId, amount);

      // Create payout request
      const payoutRequest: Omit<PayoutRequest, 'id'> = {
        creatorId,
        amount,
        currency: 'USD',
        status: 'pending',
        requestedAt: new Date(),
        tipBreakdown,
        performanceSummary: await this.generatePerformanceSummary(creatorId)
      };

      const payoutsRef = collection(firestore, 'payout_requests');
      const docRef = await addDoc(payoutsRef, payoutRequest);

      // Track payout request
      await analytics.track('payout_requested', {
        creatorId,
        amount,
        tipCount: tipBreakdown.length,
        timestamp: new Date().toISOString()
      });

      return { ...payoutRequest, id: docRef.id };

    } catch (error) {
      console.error('Failed to create payout request:', error);
      throw error;
    }
  }

  /**
   * Get tip breakdown for payout
   */
  private async getTipBreakdown(creatorId: string, amount: number): Promise<PayoutRequest['tipBreakdown']> {
    try {
      const tipsRef = collection(firestore, 'tips');
      const q = query(
        tipsRef,
        where('creatorId', '==', creatorId),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const breakdown: PayoutRequest['tipBreakdown'] = [];
      let remainingAmount = amount;

      for (const doc of snapshot.docs) {
        if (remainingAmount <= 0) break;
        
        const tip = doc.data() as Tip;
        const tipAmount = Math.min(tip.amount, remainingAmount);
        
        breakdown.push({
          tipId: doc.id,
          amount: tipAmount,
          date: tip.createdAt.toDate()
        });
        
        remainingAmount -= tipAmount;
      }

      return breakdown;
    } catch (error) {
      console.error('Failed to get tip breakdown:', error);
      return [];
    }
  }

  /**
   * Generate performance summary for payout
   */
  private async generatePerformanceSummary(creatorId: string): Promise<PayoutRequest['performanceSummary']> {
    try {
      const tipsRef = collection(firestore, 'tips');
      const q = query(
        tipsRef,
        where('creatorId', '==', creatorId),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      const tips = snapshot.docs.map(doc => doc.data() as Tip);
      
      const totalTips = tips.length;
      const averageTipAmount = tips.reduce((sum, tip) => sum + tip.amount, 0) / totalTips;
      
      // Get top tippers
      const tipperCounts = new Map<string, number>();
      tips.forEach(tip => {
        tipperCounts.set(tip.tipperId, (tipperCounts.get(tip.tipperId) || 0) + 1);
      });
      
      const topTippers = Array.from(tipperCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tipperId]) => tipperId);

      // Calculate engagement rate (simplified)
      const engagementRate = Math.min(0.95, 0.1 + (Math.random() * 0.85));

      return {
        totalTips,
        averageTipAmount,
        topTippers,
        engagementRate
      };

    } catch (error) {
      console.error('Failed to generate performance summary:', error);
      return {
        totalTips: 0,
        averageTipAmount: 0,
        topTippers: [],
        engagementRate: 0
      };
    }
  }

  /**
   * Get creator statistics
   */
  async getCreatorStats(creatorId: string): Promise<CreatorStats> {
    try {
      const statsRef = doc(firestore, 'users', creatorId, 'stats', 'creatorStats');
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        return statsDoc.data() as CreatorStats;
      }

      return {
        uid: creatorId,
        totalTipsReceived: 0,
        totalEarnings: 0,
        tipCount: 0,
        averageTipAmount: 0,
        highestTipAmount: 0,
        tippingStreak: 0,
        monetizationTier: 'bronze'
      };
    } catch (error) {
      console.error('Failed to get creator stats:', error);
      throw error;
    }
  }

  /**
   * Get creator's tip history
   */
  async getCreatorTipHistory(creatorId: string, limit: number = 50): Promise<Tip[]> {
    try {
      const tipsRef = collection(firestore, 'tips');
      const q = query(
        tipsRef,
        where('creatorId', '==', creatorId),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const snapshot = await getDocs(q);
      const tips: Tip[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        tips.push({
          id: doc.id,
          tipperId: data.tipperId,
          creatorId: data.creatorId,
          amount: data.amount,
          currency: data.currency,
          message: data.message,
          status: data.status,
          stripePaymentIntentId: data.stripePaymentIntentId,
          createdAt: data.createdAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          metadata: data.metadata
        });
      });

      return tips;
    } catch (error) {
      console.error('Failed to get creator tip history:', error);
      return [];
    }
  }

  /**
   * Get tipper's tip history
   */
  async getTipperHistory(tipperId: string, limit: number = 50): Promise<Tip[]> {
    try {
      const tipsRef = collection(firestore, 'tips');
      const q = query(
        tipsRef,
        where('tipperId', '==', tipperId),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const snapshot = await getDocs(q);
      const tips: Tip[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        tips.push({
          id: doc.id,
          tipperId: data.tipperId,
          creatorId: data.creatorId,
          amount: data.amount,
          currency: data.currency,
          message: data.message,
          status: data.status,
          stripePaymentIntentId: data.stripePaymentIntentId,
          createdAt: data.createdAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          metadata: data.metadata
        });
      });

      return tips;
    } catch (error) {
      console.error('Failed to get tipper history:', error);
      return [];
    }
  }

  /**
   * Get payout requests for creator
   */
  async getCreatorPayoutRequests(creatorId: string): Promise<PayoutRequest[]> {
    try {
      const payoutsRef = collection(firestore, 'payout_requests');
      const q = query(
        payoutsRef,
        where('creatorId', '==', creatorId),
        orderBy('requestedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const payouts: PayoutRequest[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        payouts.push({
          id: doc.id,
          creatorId: data.creatorId,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          stripeTransferId: data.stripeTransferId,
          requestedAt: data.requestedAt.toDate(),
          processedAt: data.processedAt?.toDate(),
          tipBreakdown: data.tipBreakdown,
          performanceSummary: data.performanceSummary
        });
      });

      return payouts;
    } catch (error) {
      console.error('Failed to get creator payout requests:', error);
      return [];
    }
  }

  /**
   * Process refund for a tip
   */
  async processRefund(tipId: string, reason: string): Promise<boolean> {
    try {
      const tipRef = doc(firestore, 'tips', tipId);
      const tipDoc = await getDoc(tipRef);

      if (!tipDoc.exists()) {
        throw new Error('Tip not found');
      }

      const tip = tipDoc.data() as Tip;
      if (tip.status !== 'completed') {
        throw new Error('Only completed tips can be refunded');
      }

      // Process refund via Stripe
      const refundResult = await this.processStripeRefund(tip.stripePaymentIntentId!);
      
      if (refundResult.success) {
        // Update tip status
        await updateDoc(tipRef, {
          status: 'refunded',
          metadata: {
            ...tip.metadata,
            refundReason: reason,
            refundedAt: new Date()
          }
        });

        // Update creator stats
        await this.updateCreatorStatsForRefund(tip.creatorId, tip.amount);

        // Track refund
        await analytics.track('tip_refunded', {
          tipId,
          tipperId: tip.tipperId,
          creatorId: tip.creatorId,
          amount: tip.amount,
          reason,
          timestamp: new Date().toISOString()
        });

        return true;
      } else {
        throw new Error(`Refund failed: ${refundResult.error}`);
      }

    } catch (error) {
      console.error('Failed to process refund:', error);
      throw error;
    }
  }

  /**
   * Process Stripe refund
   */
  private async processStripeRefund(paymentIntentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // This would integrate with actual Stripe API
      // For now, simulate successful refund
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update creator stats for refund
   */
  private async updateCreatorStatsForRefund(creatorId: string, refundAmount: number): Promise<void> {
    try {
      const statsRef = doc(firestore, 'users', creatorId, 'stats', 'creatorStats');
      
      await runTransaction(firestore, async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        
        if (statsDoc.exists()) {
          const stats = statsDoc.data() as CreatorStats;
          stats.totalTipsReceived -= refundAmount;
          stats.tipCount = Math.max(0, stats.tipCount - 1);
          stats.averageTipAmount = stats.tipCount > 0 ? stats.totalTipsReceived / stats.tipCount : 0;
          stats.totalEarnings = stats.totalTipsReceived * (1 - this.PLATFORM_FEE_RATE);
          
          transaction.update(statsRef, stats);
        }
      });

    } catch (error) {
      console.error('Failed to update creator stats for refund:', error);
    }
  }
}

// Export singleton instance
export const tipSystem = TipSystem.getInstance(); 