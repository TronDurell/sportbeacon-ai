import { useState, useEffect, useCallback, useMemo } from 'react';
import { onSnapshot, query, where, orderBy, limit, collection, doc } from 'firebase/firestore';
import { db } from '../firebase/init';
import { useAuth } from './useAuth';
import MonetizationService from '../services/monetizationService';
import type {
  EarningsSummary,
  EarningsBreakdown,
  PayoutInfo,
  TransactionAnalytics,
  RevenueSources,
  PayoutSettings,
  PayoutRequest,
  PayoutResponse,
  EarningsExportOptions,
  EarningsExport,
  UseMonetizationReturn
} from '../src/types/monetization';
import type { TipTransactionDocument } from '../firebase/types';

/**
 * Custom hook for monetization functionality
 */
export const useMonetization = (userId?: string): UseMonetizationReturn => {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  // State
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [breakdown, setBreakdown] = useState<EarningsBreakdown | null>(null);
  const [payouts, setPayouts] = useState<PayoutInfo[]>([]);
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);
  const [revenueSources, setRevenueSources] = useState<RevenueSources | null>(null);
  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time listeners
  useEffect(() => {
    if (!targetUserId) return;

    // Listen to tips in real-time
    const tipsQuery = query(
      collection(db, 'tips'),
      where('toUserId', '==', targetUserId),
      where('status', '==', 'succeeded'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeTips = onSnapshot(tipsQuery, (snapshot) => {
      // Update earnings when tips change
      refreshEarnings();
    }, (error) => {
      console.error('Error listening to tips:', error);
      setError('Failed to load real-time tip updates');
    });

    // Listen to payouts in real-time
    const payoutsQuery = query(
      collection(db, 'payouts'),
      where('userId', '==', targetUserId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribePayouts = onSnapshot(payoutsQuery, (snapshot) => {
      const payoutData = snapshot.docs.map(doc => doc.data() as PayoutInfo);
      setPayouts(payoutData);
    }, (error) => {
      console.error('Error listening to payouts:', error);
      setError('Failed to load real-time payout updates');
    });

    // Listen to creator profile changes
    const creatorDoc = doc(db, 'creatorProfiles', targetUserId);
    const unsubscribeCreator = onSnapshot(creatorDoc, (doc) => {
      if (doc.exists()) {
        // Refresh earnings when creator profile updates
        refreshEarnings();
      }
    }, (error) => {
      console.error('Error listening to creator profile:', error);
    });

    return () => {
      unsubscribeTips();
      unsubscribePayouts();
      unsubscribeCreator();
    };
  }, [targetUserId]);

  // Load initial data
  useEffect(() => {
    if (!targetUserId) return;

    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load all data in parallel
        const [
          earningsData,
          payoutsData,
          analyticsData,
          revenueData,
          settingsData
        ] = await Promise.all([
          MonetizationService.getEarningsSummary(targetUserId),
          MonetizationService.getPayoutHistory(targetUserId),
          MonetizationService.getTransactionAnalytics(targetUserId),
          MonetizationService.getRevenueSources(targetUserId),
          MonetizationService.getPayoutSettings(targetUserId)
        ]);

        setEarnings(earningsData);
        setPayouts(payoutsData);
        setAnalytics(analyticsData);
        setRevenueSources(revenueData);
        setSettings(settingsData);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load monetization data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [targetUserId]);

  /**
   * Request a payout
   */
  const requestPayout = useCallback(async (amount: number): Promise<PayoutResponse> => {
    if (!targetUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate payout amount
    const validation = MonetizationService.validatePayoutAmount(amount);
    if (!validation.isValid) {
      return { success: false, error: validation.error || 'Invalid payout amount' };
    }

    // Check if user has enough pending earnings
    if (earnings && amount > earnings.pendingEarnings) {
      return { 
        success: false, 
        error: `Insufficient pending earnings. Available: ${formatEarnings(earnings.pendingEarnings)}` 
      };
    }

    setError(null);

    try {
      const request: PayoutRequest = {
        userId: targetUserId,
        amount,
        currency: 'usd',
        method: 'stripe',
        notes: 'Payout request'
      };

      const response = await MonetizationService.requestPayout(request);
      
      if (response.success) {
        // Refresh earnings after successful payout request
        await refreshEarnings();
      }

      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payout request failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [targetUserId, earnings, settings]);

  /**
   * Update payout settings
   */
  const updatePayoutSettings = useCallback(async (
    newSettings: Partial<PayoutSettings>
  ): Promise<void> => {
    if (!targetUserId) {
      setError('User not authenticated');
      return;
    }

    setError(null);

    try {
      await MonetizationService.updatePayoutSettings(targetUserId, newSettings);
      
      // Update local settings
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payout settings';
      setError(errorMessage);
    }
  }, [targetUserId]);

  /**
   * Export earnings data
   */
  const exportEarnings = useCallback(async (
    options: EarningsExportOptions
  ): Promise<EarningsExport> => {
    if (!targetUserId) {
      throw new Error('User not authenticated');
    }

    setError(null);

    try {
      return await MonetizationService.exportEarnings(targetUserId, options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export earnings';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [targetUserId]);

  /**
   * Refresh earnings data
   */
  const refreshEarnings = useCallback(async (): Promise<void> => {
    if (!targetUserId) return;

    setError(null);

    try {
      const [earningsData, analyticsData, revenueData] = await Promise.all([
        MonetizationService.getEarningsSummary(targetUserId),
        MonetizationService.getTransactionAnalytics(targetUserId),
        MonetizationService.getRevenueSources(targetUserId)
      ]);

      setEarnings(earningsData);
      setAnalytics(analyticsData);
      setRevenueSources(revenueData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh earnings';
      setError(errorMessage);
    }
  }, [targetUserId]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Format earnings amount for display
   */
  const formatEarnings = useCallback((amount: number): string => {
    return MonetizationService.formatEarnings(amount);
  }, []);

  /**
   * Calculate growth percentage
   */
  const calculateGrowth = useCallback((current: number, previous: number): number => {
    return MonetizationService.calculateGrowth(current, previous);
  }, []);

  /**
   * Get earnings breakdown for a specific period
   */
  const getEarningsPeriod = useCallback(async (period: string): Promise<EarningsBreakdown | null> => {
    if (!targetUserId) return null;

    try {
      const breakdownData = await MonetizationService.getEarningsBreakdown(
        targetUserId,
        period as 'daily' | 'weekly' | 'monthly' | 'yearly'
      );
      setBreakdown(breakdownData);
      return breakdownData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get earnings breakdown';
      setError(errorMessage);
      return null;
    }
  }, [targetUserId]);

  // Memoized computed values
  const pendingEarnings = useMemo(() => {
    return earnings?.pendingEarnings || 0;
  }, [earnings]);

  const canRequestPayout = useMemo(() => {
    return pendingEarnings >= 1000; // $10.00 minimum
  }, [pendingEarnings]);

  const earningsGrowth = useMemo(() => {
    if (!earnings) return 0;
    // Calculate growth from previous period (simplified)
    return calculateGrowth(earnings.monthlyEarnings || 0, (earnings.monthlyEarnings || 0) * 0.9); // Mock previous period
  }, [earnings, calculateGrowth]);

  return {
    // State
    earnings,
    breakdown,
    payouts,
    analytics,
    revenueSources,
    settings,
    loading,
    error,
    
    // Actions
    requestPayout,
    updatePayoutSettings,
    exportEarnings,
    refreshEarnings,
    clearError,
    
    // Utilities
    formatEarnings,
    calculateGrowth,
    getEarningsPeriod: (period: string) => {
      // Mock implementation - replace with actual API call
      return {
        tipsTotal: 0,
        adShareTotal: 0,
        subsTotal: 0,
        currency: 'usd',
        period,
        breakdown: [],
        data: []
      } as EarningsBreakdown;
    },
    
    // Computed values
    pendingEarnings,
    canRequestPayout,
    earningsGrowth
  };
};

export default useMonetization; 