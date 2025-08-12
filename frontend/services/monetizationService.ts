import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/init';
import type {
  EarningsSummary,
  EarningsBreakdown,
  PayoutInfo,
  TransactionAnalytics,
  RevenueSources,
  PayoutSettings,
  TaxInfo,
  EarningsMilestone,
  PayoutRequest,
  PayoutResponse,
  EarningsExportOptions,
  EarningsExport,
  TipTransactionDocument,
  CreatorProfileDocument
} from '../firebase/types';
import type {
  EarningsSummary as MonetizationEarningsSummary,
  PayoutInfo as MonetizationPayoutInfo,
  PayoutSettings as MonetizationPayoutSettings,
  TransactionAnalytics as MonetizationTransactionAnalytics,
  RevenueSources as MonetizationRevenueSources,
  TaxInfo as MonetizationTaxInfo,
  EarningsMilestone as MonetizationEarningsMilestone,
  PayoutRequest as MonetizationPayoutRequest,
  PayoutResponse as MonetizationPayoutResponse,
  EarningsExportOptions as MonetizationEarningsExportOptions,
  EarningsExport as MonetizationEarningsExport
} from '../types/monetization';

/**
 * Monetization service for earnings management and analytics
 */
export class MonetizationService {
  private static readonly MINIMUM_PAYOUT = 1000; // $10.00 in cents
  private static readonly DEFAULT_CURRENCY = 'usd';

  /**
   * Get earnings summary for a creator
   */
  static async getEarningsSummary(userId: string): Promise<EarningsSummary> {
    try {
      // Get creator profile for basic earnings data
      const creatorDoc = await getDoc(doc(db, 'creatorProfiles', userId));
      if (!creatorDoc.exists()) {
        throw new Error('Creator profile not found');
      }

      const creatorData = creatorDoc.data() as CreatorProfileDocument;
      
      // Get recent tips for detailed calculations
      const tipsQuery = query(
        collection(db, 'tips'),
        where('toUserId', '==', userId),
        where('status', '==', 'succeeded'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const tipsSnapshot = await getDocs(tipsQuery);
      const tips = tipsSnapshot.docs.map(doc => doc.data() as TipTransactionDocument);

      // Calculate time-based earnings
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const dailyEarnings = tips
        .filter(tip => tip.createdAt.toDate() >= today)
        .reduce((sum, tip) => sum + tip.amount, 0);

      const weeklyEarnings = tips
        .filter(tip => tip.createdAt.toDate() >= weekStart)
        .reduce((sum, tip) => sum + tip.amount, 0);

      const monthlyEarnings = tips
        .filter(tip => tip.createdAt.toDate() >= monthStart)
        .reduce((sum, tip) => sum + tip.amount, 0);

      // Get latest payout
      const payoutsQuery = query(
        collection(db, 'payouts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const payoutsSnapshot = await getDocs(payoutsQuery);
      const lastPayout = payoutsSnapshot.docs[0]?.data() as PayoutInfo | undefined;

      // Calculate pending earnings (earnings not yet paid out)
      const pendingEarnings = Math.max(0, creatorData.tipEarnings - (lastPayout?.amount || 0));

      const summary: EarningsSummary = {
        totalEarnings: creatorData.tipEarnings,
        totalTips: creatorData.totalTips,
        averageTip: creatorData.averageTip,
        monthlyEarnings,
        weeklyEarnings,
        dailyEarnings,
        pendingEarnings,
        lastPayout: lastPayout ? {
          amount: lastPayout.amount,
          date: lastPayout.createdAt,
          status: lastPayout.status
        } : undefined
      };

      return summary;

    } catch (error) {
      console.error('Error getting earnings summary:', error);
      throw new Error('Failed to get earnings summary');
    }
  }

  /**
   * Get earnings breakdown by time period
   */
  static async getEarningsBreakdown(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Promise<EarningsBreakdown> {
    try {
      const tipsQuery = query(
        collection(db, 'tips'),
        where('toUserId', '==', userId),
        where('status', '==', 'succeeded'),
        orderBy('createdAt', 'desc'),
        limit(1000)
      );

      const tipsSnapshot = await getDocs(tipsQuery);
      const tips = tipsSnapshot.docs.map(doc => doc.data() as TipTransactionDocument);

      // Group tips by period
      const groupedData = new Map<string, { earnings: number; tipCount: number }>();

      tips.forEach(tip => {
        const date = tip.createdAt.toDate();
        let key: string;

        switch (period) {
          case 'daily':
            key = date.toISOString().split('T')[0];
            break;
          case 'weekly':
            const weekStart = new Date(date.getTime() - (date.getDay() * 24 * 60 * 60 * 1000));
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'monthly':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'yearly':
            key = date.getFullYear().toString();
            break;
        }

        const existing = groupedData.get(key) || { earnings: 0, tipCount: 0 };
        groupedData.set(key, {
          earnings: existing.earnings + tip.amount,
          tipCount: existing.tipCount + 1
        });
      });

      // Convert to array and sort
      const data = Array.from(groupedData.entries())
        .map(([date, stats]) => ({
          date,
          earnings: stats.earnings,
          tipCount: stats.tipCount,
          averageTip: stats.tipCount > 0 ? stats.earnings / stats.tipCount : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        period,
        data
      };

    } catch (error) {
      console.error('Error getting earnings breakdown:', error);
      throw new Error('Failed to get earnings breakdown');
    }
  }

  /**
   * Get payout history for a user
   */
  static async getPayoutHistory(userId: string, limitCount: number = 50): Promise<PayoutInfo[]> {
    try {
      const payoutsQuery = query(
        collection(db, 'payouts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const payoutsSnapshot = await getDocs(payoutsQuery);
      return payoutsSnapshot.docs.map(doc => doc.data() as PayoutInfo);

    } catch (error) {
      console.error('Error getting payout history:', error);
      throw new Error('Failed to get payout history');
    }
  }

  /**
   * Get transaction analytics
   */
  static async getTransactionAnalytics(userId: string): Promise<TransactionAnalytics> {
    try {
      const tipsQuery = query(
        collection(db, 'tips'),
        where('toUserId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1000)
      );

      const tipsSnapshot = await getDocs(tipsQuery);
      const tips = tipsSnapshot.docs.map(doc => doc.data() as TipTransactionDocument);

      // Calculate basic statistics
      const totalTransactions = tips.length;
      const successfulTransactions = tips.filter(tip => tip.status === 'succeeded').length;
      const failedTransactions = tips.filter(tip => tip.status === 'failed').length;
      const refundedTransactions = tips.filter(tip => tip.status === 'refunded').length;
      const averageTransactionValue = totalTransactions > 0 
        ? tips.reduce((sum, tip) => sum + tip.amount, 0) / totalTransactions 
        : 0;

      // Get top tippers
      const tipperMap = new Map<string, { totalAmount: number; tipCount: number; lastTipAt: Timestamp }>();
      
      tips.forEach(tip => {
        if (tip.status === 'succeeded') {
          const existing = tipperMap.get(tip.fromUserId) || { 
            totalAmount: 0, 
            tipCount: 0, 
            lastTipAt: tip.createdAt 
          };
          
          tipperMap.set(tip.fromUserId, {
            totalAmount: existing.totalAmount + tip.amount,
            tipCount: existing.tipCount + 1,
            lastTipAt: tip.createdAt > existing.lastTipAt ? tip.createdAt : existing.lastTipAt
          });
        }
      });

      const topTippers = Array.from(tipperMap.entries())
        .map(([userId, stats]) => ({
          userId,
          displayName: `User ${userId.substring(0, 8)}`, // Would need to fetch user profiles
          totalAmount: stats.totalAmount,
          tipCount: stats.tipCount,
          lastTipAt: stats.lastTipAt
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10);

      // Calculate trends (simplified - would need more sophisticated analysis)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentTips = tips.filter(tip => tip.createdAt.toDate() >= thirtyDaysAgo);
      const previousTips = tips.filter(tip => 
        tip.createdAt.toDate() >= sixtyDaysAgo && tip.createdAt.toDate() < thirtyDaysAgo
      );

      const recentAmount = recentTips.reduce((sum, tip) => sum + tip.amount, 0);
      const previousAmount = previousTips.reduce((sum, tip) => sum + tip.amount, 0);
      const growth = previousAmount > 0 ? ((recentAmount - previousAmount) / previousAmount) * 100 : 0;

      const transactionTrends = [
        {
          period: 'Last 30 days',
          count: recentTips.length,
          amount: recentAmount,
          growth
        }
      ];

      return {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        refundedTransactions,
        averageTransactionValue,
        topTippers,
        transactionTrends
      };

    } catch (error) {
      console.error('Error getting transaction analytics:', error);
      throw new Error('Failed to get transaction analytics');
    }
  }

  /**
   * Get revenue sources breakdown
   */
  static async getRevenueSources(userId: string): Promise<RevenueSources> {
    try {
      const tipsQuery = query(
        collection(db, 'tips'),
        where('toUserId', '==', userId),
        where('status', '==', 'succeeded')
      );

      const tipsSnapshot = await getDocs(tipsQuery);
      const tips = tipsSnapshot.docs.map(doc => doc.data() as TipTransactionDocument);

      const tipsTotal = tips.reduce((sum, tip) => sum + tip.amount, 0);
      const totalRevenue = tipsTotal; // For now, only tips. Would include subscriptions, purchases, etc.

      return {
        tips: {
          total: tipsTotal,
          count: tips.length,
          percentage: totalRevenue > 0 ? (tipsTotal / totalRevenue) * 100 : 0
        }
        // Add other revenue sources as they're implemented
      };

    } catch (error) {
      console.error('Error getting revenue sources:', error);
      throw new Error('Failed to get revenue sources');
    }
  }

  /**
   * Get payout settings for a user
   */
  static async getPayoutSettings(userId: string): Promise<PayoutSettings | null> {
    try {
      const settingsDoc = await getDoc(doc(db, 'payoutSettings', userId));
      
      if (settingsDoc.exists()) {
        return settingsDoc.data() as PayoutSettings;
      }

      return null;

    } catch (error) {
      console.error('Error getting payout settings:', error);
      throw new Error('Failed to get payout settings');
    }
  }

  /**
   * Request a payout
   */
  static async requestPayout(request: PayoutRequest): Promise<PayoutResponse> {
    try {
      const processPayout = httpsCallable(functions, 'processPayout');
      
      const result = await processPayout(request);
      const response = result.data as any;
      
      if (response.success) {
        return {
          success: true,
          payoutId: response.payoutId,
          estimatedArrival: response.estimatedArrival
        };
      } else {
        return {
          success: false,
          error: response.error || 'Payout request failed'
        };
      }

    } catch (error) {
      console.error('Error requesting payout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payout request failed'
      };
    }
  }

  /**
   * Update payout settings
   */
  static async updatePayoutSettings(
    userId: string,
    settings: Partial<PayoutSettings>
  ): Promise<void> {
    try {
      const settingsRef = doc(db, 'payoutSettings', userId);
      
      await setDoc(settingsRef, {
        userId,
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (error) {
      console.error('Error updating payout settings:', error);
      throw new Error('Failed to update payout settings');
    }
  }

  /**
   * Export earnings data
   */
  static async exportEarnings(
    userId: string,
    options: EarningsExportOptions
  ): Promise<EarningsExport> {
    try {
      const exportEarnings = httpsCallable(functions, 'exportEarnings');
      
      const result = await exportEarnings({ userId, ...options });
      const response = result.data as any;
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Export failed');
      }

    } catch (error) {
      console.error('Error exporting earnings:', error);
      throw new Error('Failed to export earnings');
    }
  }

  /**
   * Get tax information
   */
  static async getTaxInfo(userId: string, year: number): Promise<TaxInfo | null> {
    try {
      const taxDoc = await getDoc(doc(db, 'taxInfo', `${userId}_${year}`));
      
      if (taxDoc.exists()) {
        return taxDoc.data() as TaxInfo;
      }

      return null;

    } catch (error) {
      console.error('Error getting tax info:', error);
      throw new Error('Failed to get tax information');
    }
  }

  /**
   * Get earnings milestones
   */
  static async getMilestones(userId: string): Promise<EarningsMilestone[]> {
    try {
      const milestonesQuery = query(
        collection(db, 'earningsMilestones'),
        where('userId', '==', userId),
        orderBy('value', 'asc')
      );

      const milestonesSnapshot = await getDocs(milestonesQuery);
      return milestonesSnapshot.docs.map(doc => doc.data() as EarningsMilestone);

    } catch (error) {
      console.error('Error getting milestones:', error);
      throw new Error('Failed to get milestones');
    }
  }

  /**
   * Format earnings amount for display
   */
  static formatEarnings(amount: number, currency: string = 'usd'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    });

    return formatter.format(amount / 100);
  }

  /**
   * Calculate growth percentage
   */
  static calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Validate payout amount
   */
  static validatePayoutAmount(amount: number): { isValid: boolean; error?: string } {
    if (amount < this.MINIMUM_PAYOUT) {
      return {
        isValid: false,
        error: `Minimum payout amount is ${this.formatEarnings(this.MINIMUM_PAYOUT)}`
      };
    }

    return { isValid: true };
  }
}

export default MonetizationService; 