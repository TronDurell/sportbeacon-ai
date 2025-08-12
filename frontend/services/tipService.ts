import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/init';
import { useAuth } from '../hooks/useAuth';
import type {
  CreateTipRequest,
  TipResponse,
  TipTransactionDocument,
  CreatorProfileDocument,
  TipStatistics
} from '../firebase/types';

/**
 * Tip service for frontend operations
 * Handles tip creation, retrieval, and statistics
 */
export class TipService {
  private static readonly MINIMUM_TIP = 50; // $0.50 in cents
  private static readonly MAXIMUM_TIP = 1000000; // $10,000 in cents

  /**
   * Create a tip for a creator
   */
  static async createTip(
    toUserId: string,
    amount: number,
    message?: string,
    anonymous: boolean = false
  ): Promise<TipResponse> {
    try {
      // Validate tip amount
      if (amount < this.MINIMUM_TIP) {
        throw new Error(`Tip amount must be at least $${this.MINIMUM_TIP / 100}`);
      }

      if (amount > this.MAXIMUM_TIP) {
        throw new Error(`Tip amount cannot exceed $${this.MAXIMUM_TIP / 100}`);
      }

      // Create checkout session via Firebase Function
      const createCheckoutSession = httpsCallable(functions, 'createStripeCheckoutSession');
      
      const result = await createCheckoutSession({
        amount,
        currency: 'usd',
        toUserId,
        message,
        anonymous,
        successUrl: `${window.location.origin}/tip/success`,
        cancelUrl: `${window.location.origin}/tip/cancel`
      });

      const response = result.data as any;
      
      if (response.success) {
        return {
          tipId: response.data.sessionId,
          checkoutUrl: response.data.url,
          amount: response.data.amount,
          currency: response.data.currency,
          expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
        };
      } else {
        throw new Error(response.error?.message || 'Failed to create tip');
      }

    } catch (error) {
      console.error('Error creating tip:', error);
      throw error;
    }
  }

  /**
   * Get tip statistics for a creator
   */
  static async getCreatorTipStats(creatorId: string): Promise<TipStatistics> {
    try {
      const getTipStats = httpsCallable(functions, 'getCreatorTipStats');
      
      const result = await getTipStats({ creatorId });
      const response = result.data as any;
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get tip statistics');
      }

    } catch (error) {
      console.error('Error getting tip statistics:', error);
      throw error;
    }
  }

  /**
   * Get tip transactions for a user
   */
  static async getUserTips(userId: string, limit: number = 50): Promise<TipTransactionDocument[]> {
    try {
      // This would typically be a Firestore query, but for now we'll use a function
      const getUserTips = httpsCallable(functions, 'getUserTips');
      
      const result = await getUserTips({ userId, limit });
      const response = result.data as any;
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get user tips');
      }

    } catch (error) {
      console.error('Error getting user tips:', error);
      throw error;
    }
  }

  /**
   * Get creator profile
   */
  static async getCreatorProfile(creatorId: string): Promise<CreatorProfileDocument | null> {
    try {
      // This would typically be a Firestore query
      const getCreatorProfile = httpsCallable(functions, 'getCreatorProfile');
      
      const result = await getCreatorProfile({ creatorId });
      const response = result.data as any;
      
      if (response.success) {
        return response.data;
      } else {
        return null;
      }

    } catch (error) {
      console.error('Error getting creator profile:', error);
      return null;
    }
  }

  /**
   * Validate tip amount
   */
  static validateTipAmount(amount: number): { isValid: boolean; error?: string } {
    if (amount < this.MINIMUM_TIP) {
      return {
        isValid: false,
        error: `Tip amount must be at least $${this.MINIMUM_TIP / 100}`
      };
    }

    if (amount > this.MAXIMUM_TIP) {
      return {
        isValid: false,
        error: `Tip amount cannot exceed $${this.MAXIMUM_TIP / 100}`
      };
    }

    return { isValid: true };
  }

  /**
   * Format tip amount for display
   */
  static formatTipAmount(amount: number, currency: string = 'usd'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    });

    return formatter.format(amount / 100);
  }

  /**
   * Get tip suggestions based on amount
   */
  static getTipSuggestions(): number[] {
    return [
      100,   // $1.00
      250,   // $2.50
      500,   // $5.00
      1000,  // $10.00
      2500,  // $25.00
      5000   // $50.00
    ];
  }

  /**
   * Calculate tip percentage
   */
  static calculateTipPercentage(tipAmount: number, baseAmount: number): number {
    if (baseAmount === 0) return 0;
    return (tipAmount / baseAmount) * 100;
  }

  /**
   * Get tip message suggestions
   */
  static getTipMessageSuggestions(): string[] {
    return [
      'Great content!',
      'Keep up the amazing work!',
      'Thanks for the inspiration!',
      'You deserve this!',
      'Amazing job!',
      'Love your content!',
      'Keep creating!',
      'You rock!',
      'Thank you!',
      'Supporting great creators!'
    ];
  }
}

export default TipService; 