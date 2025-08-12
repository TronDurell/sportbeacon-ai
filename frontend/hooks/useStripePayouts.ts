import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import StripePayoutService from '../services/stripePayoutService';
import type {
  CreatorPayout,
  PayoutAccount,
  PayoutSchedule,
  PayoutSettings,
  PayoutAnalytics,
  PayoutLimits,
  StripeConnectAccount,
  PayoutFormData,
  PayoutFilters,
  PayoutSummary,
  PayoutError,
  PayoutResponse
} from '../types/stripePayout';

/**
 * Custom hook for Stripe payout management
 * Provides comprehensive payout operations, real-time updates, and error handling
 */
export const useStripePayouts = () => {
  const { user } = useAuth();
  const creatorId = user?.uid;
  const payoutService = StripePayoutService.getInstance();

  // Refs for cleanup
  const listeners = useRef<{ [key: string]: () => void }>({});

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      Object.values(listeners.current).forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Creator Account Management
  const useCreatorAccount = (accountId?: string) => {
    const [account, setAccount] = useState<StripeConnectAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PayoutError | null>(null);

    useEffect(() => {
      if (!accountId) {
        setAccount(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const loadAccount = async () => {
        try {
          const accountData = await payoutService.getCreatorAccount(accountId);
          setAccount(accountData);
        } catch (err) {
          const payoutError: PayoutError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch creator account',
            type: 'api_error'
          };
          setError(payoutError);
        } finally {
          setLoading(false);
        }
      };

      loadAccount();
    }, [accountId]);

    const createAccount = useCallback(async (accountData: {
      email: string;
      country: string;
      businessType: 'individual' | 'company';
      firstName?: string;
      lastName?: string;
      companyName?: string;
    }) => {
      try {
        const newAccount = await payoutService.createCreatorAccount(accountData);
        setAccount(newAccount);
        return newAccount;
      } catch (err) {
        const payoutError: PayoutError = {
          code: 'CREATE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to create creator account',
          type: 'api_error'
        };
        setError(payoutError);
        throw err;
      }
    }, []);

    const createOnboardingLink = useCallback(async (returnUrl: string) => {
      if (!accountId) return null;

      try {
        const onboardingUrl = await payoutService.createOnboardingLink(accountId, returnUrl);
        return onboardingUrl;
      } catch (err) {
        const payoutError: PayoutError = {
          code: 'ONBOARDING_ERROR',
          message: err instanceof Error ? err.message : 'Failed to create onboarding link',
          type: 'api_error'
        };
        setError(payoutError);
        throw err;
      }
    }, [accountId]);

    return {
      account,
      loading,
      error,
      createAccount,
      createOnboardingLink
    };
  };

  // Payout Accounts Management
  const usePayoutAccounts = () => {
    const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PayoutError | null>(null);

    useEffect(() => {
      if (!creatorId) {
        setAccounts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const loadAccounts = async () => {
        try {
          const accountsData = await payoutService.getPayoutAccounts(creatorId);
          setAccounts(accountsData);
        } catch (err) {
          const payoutError: PayoutError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch payout accounts',
            type: 'api_error'
          };
          setError(payoutError);
        } finally {
          setLoading(false);
        }
      };

      loadAccounts();
    }, [creatorId]);

    const addAccount = useCallback(async (accountData: {
      type: 'bank_account' | 'debit_card';
      country: string;
      currency: string;
      accountNumber?: string;
      routingNumber?: string;
      accountHolderName?: string;
      cardToken?: string;
    }) => {
      if (!creatorId) return;

      try {
        const newAccount = await payoutService.addPayoutAccount(creatorId, accountData);
        setAccounts(prev => [...prev, newAccount]);
        return newAccount;
      } catch (err) {
        const payoutError: PayoutError = {
          code: 'ADD_ERROR',
          message: err instanceof Error ? err.message : 'Failed to add payout account',
          type: 'api_error'
        };
        setError(payoutError);
        throw err;
      }
    }, [creatorId]);

    const removeAccount = useCallback(async (accountId: string) => {
      if (!creatorId) return;

      try {
        await payoutService.removePayoutAccount(creatorId, accountId);
        setAccounts(prev => prev.filter(account => account.id !== accountId));
      } catch (err) {
        const payoutError: PayoutError = {
          code: 'REMOVE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to remove payout account',
          type: 'api_error'
        };
        setError(payoutError);
        throw err;
      }
    }, [creatorId]);

    return {
      accounts,
      loading,
      error,
      addAccount,
      removeAccount
    };
  };

  // Payouts Management
  const usePayouts = (filters?: PayoutFilters) => {
    const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PayoutError | null>(null);

    useEffect(() => {
      if (!creatorId) {
        setPayouts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const loadPayouts = async () => {
        try {
          const payoutsData = await payoutService.getPayouts(creatorId, filters);
          setPayouts(payoutsData);
        } catch (err) {
          const payoutError: PayoutError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch payouts',
            type: 'api_error'
          };
          setError(payoutError);
        } finally {
          setLoading(false);
        }
      };

      loadPayouts();
    }, [creatorId, filters?.status, filters?.currency, filters?.limit]);

    const createPayout = useCallback(async (payoutData: PayoutFormData) => {
      if (!creatorId) return;

      try {
        const newPayout = await payoutService.createPayout(creatorId, payoutData);
        setPayouts(prev => [newPayout, ...prev]);
        return newPayout;
      } catch (err) {
        const payoutError: PayoutError = {
          code: 'CREATE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to create payout',
          type: 'api_error'
        };
        setError(payoutError);
        throw err;
      }
    }, [creatorId]);

    const cancelPayout = useCallback(async (payoutId: string) => {
      try {
        await payoutService.cancelPayout(payoutId);
        setPayouts(prev => prev.map(payout => 
          payout.id === payoutId 
            ? { ...payout, status: 'canceled' as const }
            : payout
        ));
      } catch (err) {
        const payoutError: PayoutError = {
          code: 'CANCEL_ERROR',
          message: err instanceof Error ? err.message : 'Failed to cancel payout',
          type: 'api_error'
        };
        setError(payoutError);
        throw err;
      }
    }, []);

    const retryPayout = useCallback(async (payoutId: string) => {
      try {
        const retriedPayout = await payoutService.retryFailedPayout(payoutId);
        setPayouts(prev => prev.map(payout => 
          payout.id === payoutId ? retriedPayout : payout
        ));
        return retriedPayout;
      } catch (err) {
        const payoutError: PayoutError = {
          code: 'RETRY_ERROR',
          message: err instanceof Error ? err.message : 'Failed to retry payout',
          type: 'api_error'
        };
        setError(payoutError);
        throw err;
      }
    }, []);

    return {
      payouts,
      loading,
      error,
      createPayout,
      cancelPayout,
      retryPayout
    };
  };

  // Payout Schedule Management
  const usePayoutSchedule = () => {
    const [schedule, setSchedule] = useState<PayoutSchedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PayoutError | null>(null);

    useEffect(() => {
      if (!creatorId) {
        setSchedule(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const loadSchedule = async () => {
        try {
          const scheduleData = await payoutService.getPayoutSchedule(creatorId);
          setSchedule(scheduleData);
        } catch (err) {
          const payoutError: PayoutError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch payout schedule',
            type: 'api_error'
          };
          setError(payoutError);
        } finally {
          setLoading(false);
        }
      };

      loadSchedule();
    }, [creatorId]);

    const updateSchedule = useCallback(async (scheduleData: {
      interval: 'manual' | 'daily' | 'weekly' | 'monthly';
      weeklyAnchor?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
      monthlyAnchor?: number;
      delayDays?: number;
    }) => {
      if (!creatorId) return;

      try {
        const updatedSchedule = await payoutService.updatePayoutSchedule(creatorId, scheduleData);
        setSchedule(updatedSchedule);
        return updatedSchedule;
      } catch (err) {
        const payoutError: PayoutError = {
          code: 'UPDATE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to update payout schedule',
          type: 'api_error'
        };
        setError(payoutError);
        throw err;
      }
    }, [creatorId]);

    return {
      schedule,
      loading,
      error,
      updateSchedule
    };
  };

  // Payout Settings Management
  const usePayoutSettings = () => {
    const [settings, setSettings] = useState<PayoutSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PayoutError | null>(null);

    useEffect(() => {
      if (!creatorId) {
        setSettings(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const loadSettings = async () => {
        try {
          const settingsData = await payoutService.getPayoutSettings(creatorId);
          setSettings(settingsData);
        } catch (err) {
          const payoutError: PayoutError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch payout settings',
            type: 'api_error'
          };
          setError(payoutError);
        } finally {
          setLoading(false);
        }
      };

      loadSettings();
    }, [creatorId]);

    const updateSettings = useCallback(async (settingsData: Partial<PayoutSettings>) => {
      if (!creatorId) return;

      try {
        const updatedSettings = await payoutService.updatePayoutSettings(creatorId, settingsData);
        setSettings(updatedSettings);
        return updatedSettings;
      } catch (err) {
        const payoutError: PayoutError = {
          code: 'UPDATE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to update payout settings',
          type: 'api_error'
        };
        setError(payoutError);
        throw err;
      }
    }, [creatorId]);

    return {
      settings,
      loading,
      error,
      updateSettings
    };
  };

  // Payout Analytics
  const usePayoutAnalytics = (period: 'week' | 'month' | 'year' = 'month') => {
    const [analytics, setAnalytics] = useState<{
      totalPayouts: number;
      totalAmount: number;
      averagePayout: number;
      successRate: number;
      failedPayouts: number;
      pendingAmount: number;
      currency: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PayoutError | null>(null);

    useEffect(() => {
      if (!creatorId) {
        setAnalytics(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const loadAnalytics = async () => {
        try {
          const analyticsData = await payoutService.getPayoutAnalytics(creatorId, period);
          setAnalytics(analyticsData);
        } catch (err) {
          const payoutError: PayoutError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch payout analytics',
            type: 'api_error'
          };
          setError(payoutError);
        } finally {
          setLoading(false);
        }
      };

      loadAnalytics();
    }, [creatorId, period]);

    return {
      analytics,
      loading,
      error
    };
  };

  // Payout Limits
  const usePayoutLimits = () => {
    const [limits, setLimits] = useState<{
      dailyLimit: number;
      monthlyLimit: number;
      minimumPayout: number;
      currency: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PayoutError | null>(null);

    useEffect(() => {
      if (!creatorId) {
        setLimits(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const loadLimits = async () => {
        try {
          const limitsData = await payoutService.getPayoutLimits(creatorId);
          setLimits(limitsData);
        } catch (err) {
          const payoutError: PayoutError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch payout limits',
            type: 'api_error'
          };
          setError(payoutError);
        } finally {
          setLoading(false);
        }
      };

      loadLimits();
    }, [creatorId]);

    return {
      limits,
      loading,
      error
    };
  };

  // Utility Functions
  const formatAmount = useCallback((amount: number, currency: string): string => {
    return payoutService.formatAmount(amount, currency);
  }, []);

  const parseAmount = useCallback((amount: string, currency: string): number => {
    return payoutService.parseAmount(amount, currency);
  }, []);

  const getPayoutStatusColor = useCallback((status: string): string => {
    return payoutService.getPayoutStatusColor(status);
  }, []);

  const getPayoutStatusIcon = useCallback((status: string): string => {
    return payoutService.getPayoutStatusIcon(status);
  }, []);

  return {
    useCreatorAccount,
    usePayoutAccounts,
    usePayouts,
    usePayoutSchedule,
    usePayoutSettings,
    usePayoutAnalytics,
    usePayoutLimits,
    formatAmount,
    parseAmount,
    getPayoutStatusColor,
    getPayoutStatusIcon
  };
};

export default useStripePayouts; 