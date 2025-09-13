import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import TipService from '../services/tipService';
import type {
  TipResponse,
  TipStatistics
} from '../src/types/monetization';
import type {
  TipTransactionDocument,
  CreatorProfileDocument
} from '../firebase/types';

interface UseTippingReturn {
  // State
  isCreatingTip: boolean;
  tipResponse: TipResponse | null;
  creatorProfile: CreatorProfileDocument | null;
  tipStats: TipStatistics | null;
  userTips: TipTransactionDocument[];
  error: string | null;
  
  // Actions
  createTip: (toUserId: string, amount: number, message?: string, anonymous?: boolean) => Promise<void>;
  loadCreatorProfile: (creatorId: string) => Promise<void>;
  loadTipStats: (creatorId: string) => Promise<void>;
  loadUserTips: (userId: string, limit?: number) => Promise<void>;
  clearError: () => void;
  resetTipResponse: () => void;
  
  // Utilities
  validateTipAmount: (amount: number) => { isValid: boolean; error?: string };
  formatTipAmount: (amount: number, currency?: string) => string;
  getTipSuggestions: () => number[];
  getTipMessageSuggestions: () => string[];
}

/**
 * Custom hook for tipping functionality
 */
export const useTipping = (): UseTippingReturn => {
  const { user } = useAuth();
  const [isCreatingTip, setIsCreatingTip] = useState(false);
  const [tipResponse, setTipResponse] = useState<TipResponse | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileDocument | null>(null);
  const [tipStats, setTipStats] = useState<TipStatistics | null>(null);
  const [userTips, setUserTips] = useState<TipTransactionDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a tip for a creator
   */
  const createTip = useCallback(async (
    toUserId: string,
    amount: number,
    message?: string,
    anonymous: boolean = false
  ): Promise<void> => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }

    if (toUserId === user.uid) {
      setError('Cannot tip yourself');
      return;
    }

    // Validate tip amount
    const validation = TipService.validateTipAmount(amount);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid tip amount');
      return;
    }

    setIsCreatingTip(true);
    setError(null);

    try {
      const response = await TipService.createTip(toUserId, amount, message, anonymous);
      setTipResponse(response);
      
      // Redirect to Stripe checkout
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tip';
      setError(errorMessage);
    } finally {
      setIsCreatingTip(false);
    }
  }, [user?.uid]);

  /**
   * Load creator profile
   */
  const loadCreatorProfile = useCallback(async (creatorId: string): Promise<void> => {
    if (!creatorId) return;

    setError(null);
    try {
      const profile = await TipService.getCreatorProfile(creatorId);
      setCreatorProfile(profile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load creator profile';
      setError(errorMessage);
    }
  }, []);

  /**
   * Load tip statistics for a creator
   */
  const loadTipStats = useCallback(async (creatorId: string): Promise<void> => {
    if (!creatorId) return;

    setError(null);
    try {
      const stats = await TipService.getCreatorTipStats(creatorId);
      setTipStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tip statistics';
      setError(errorMessage);
    }
  }, []);

  /**
   * Load user's tip history
   */
  const loadUserTips = useCallback(async (userId: string, limit: number = 50): Promise<void> => {
    if (!userId) return;

    setError(null);
    try {
      const tips = await TipService.getUserTips(userId, limit);
      setUserTips(tips);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user tips';
      setError(errorMessage);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset tip response
   */
  const resetTipResponse = useCallback(() => {
    setTipResponse(null);
  }, []);

  /**
   * Validate tip amount
   */
  const validateTipAmount = useCallback((amount: number) => {
    return TipService.validateTipAmount(amount);
  }, []);

  /**
   * Format tip amount for display
   */
  const formatTipAmount = useCallback((amount: number, currency: string = 'usd') => {
    return TipService.formatTipAmount(amount, currency);
  }, []);

  /**
   * Get tip suggestions
   */
  const getTipSuggestions = useCallback(() => {
    return TipService.getTipSuggestions();
  }, []);

  /**
   * Get tip message suggestions
   */
  const getTipMessageSuggestions = useCallback(() => {
    return TipService.getTipMessageSuggestions();
  }, []);

  return {
    // State
    isCreatingTip,
    tipResponse,
    creatorProfile,
    tipStats,
    userTips,
    error,
    
    // Actions
    createTip,
    loadCreatorProfile,
    loadTipStats,
    loadUserTips,
    clearError,
    resetTipResponse,
    
    // Utilities
    validateTipAmount,
    formatTipAmount,
    getTipSuggestions,
    getTipMessageSuggestions
  };
};

export default useTipping; 