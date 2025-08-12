import { loadStripe } from '@stripe/stripe-js';
import type {
  PayoutAccount,
  PayoutSchedule,
  PayoutTransaction,
  CreatorPayout,
  PayoutSettings,
  StripeConnectAccount,
  PayoutWebhookEvent
} from '../types/stripePayout';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

/**
 * Comprehensive Stripe Payout Service for Creator Payouts
 * Handles Connect platform integration, payout processing, and account management
 */
export class StripePayoutService {
  private static instance: StripePayoutService;
  private stripe: any = null;

  private constructor() {
    this.initializeStripe();
  }

  static getInstance(): StripePayoutService {
    if (!StripePayoutService.instance) {
      StripePayoutService.instance = new StripePayoutService();
    }
    return StripePayoutService.instance;
  }

  private async initializeStripe() {
    try {
      this.stripe = await stripePromise;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw error;
    }
  }

  // Creator Account Management
  async createCreatorAccount(creatorData: {
    email: string;
    country: string;
    businessType: 'individual' | 'company';
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }): Promise<StripeConnectAccount> {
    try {
      const response = await fetch('/api/stripe/connect/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'express',
          country: creatorData.country,
          email: creatorData.email,
          business_type: creatorData.businessType,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: {
            url: 'https://sportbeacon.ai',
            mcc: '7997', // Sports and recreation
          },
          ...(creatorData.businessType === 'individual' && {
            individual: {
              first_name: creatorData.firstName,
              last_name: creatorData.lastName,
            },
          }),
          ...(creatorData.businessType === 'company' && {
            company: {
              name: creatorData.companyName,
            },
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create creator account: ${response.statusText}`);
      }

      const account = await response.json();
      return account;
    } catch (error) {
      console.error('Error creating creator account:', error);
      throw error;
    }
  }

  async getCreatorAccount(accountId: string): Promise<StripeConnectAccount> {
    try {
      const response = await fetch(`/api/stripe/connect/accounts/${accountId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch creator account: ${response.statusText}`);
      }

      const account = await response.json();
      return account;
    } catch (error) {
      console.error('Error fetching creator account:', error);
      throw error;
    }
  }

  async createOnboardingLink(accountId: string, returnUrl: string): Promise<string> {
    try {
      const response = await fetch('/api/stripe/connect/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: accountId,
          refresh_url: `${returnUrl}?refresh=true`,
          return_url: returnUrl,
          type: 'account_onboarding',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create onboarding link: ${response.statusText}`);
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      throw error;
    }
  }

  // Payout Account Management
  async getPayoutAccounts(creatorId: string): Promise<PayoutAccount[]> {
    try {
      const response = await fetch(`/api/stripe/payouts/accounts/${creatorId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payout accounts: ${response.statusText}`);
      }

      const accounts = await response.json();
      return accounts;
    } catch (error) {
      console.error('Error fetching payout accounts:', error);
      throw error;
    }
  }

  async addPayoutAccount(creatorId: string, accountData: {
    type: 'bank_account' | 'debit_card';
    country: string;
    currency: string;
    accountNumber?: string;
    routingNumber?: string;
    accountHolderName?: string;
    cardToken?: string;
  }): Promise<PayoutAccount> {
    try {
      const response = await fetch(`/api/stripe/payouts/accounts/${creatorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        throw new Error(`Failed to add payout account: ${response.statusText}`);
      }

      const account = await response.json();
      return account;
    } catch (error) {
      console.error('Error adding payout account:', error);
      throw error;
    }
  }

  async removePayoutAccount(creatorId: string, accountId: string): Promise<void> {
    try {
      const response = await fetch(`/api/stripe/payouts/accounts/${creatorId}/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove payout account: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing payout account:', error);
      throw error;
    }
  }

  // Payout Processing
  async createPayout(creatorId: string, payoutData: {
    amount: number;
    currency: string;
    destination: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<CreatorPayout> {
    try {
      const response = await fetch('/api/stripe/payouts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          ...payoutData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create payout: ${response.statusText}`);
      }

      const payout = await response.json();
      return payout;
    } catch (error) {
      console.error('Error creating payout:', error);
      throw error;
    }
  }

  async getPayouts(creatorId: string, filters?: {
    status?: 'paid' | 'pending' | 'failed' | 'canceled';
    limit?: number;
    startingAfter?: string;
  }): Promise<CreatorPayout[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.startingAfter) params.append('starting_after', filters.startingAfter);

      const response = await fetch(`/api/stripe/payouts/${creatorId}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payouts: ${response.statusText}`);
      }

      const payouts = await response.json();
      return payouts;
    } catch (error) {
      console.error('Error fetching payouts:', error);
      throw error;
    }
  }

  async getPayoutDetails(payoutId: string): Promise<CreatorPayout> {
    try {
      const response = await fetch(`/api/stripe/payouts/details/${payoutId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payout details: ${response.statusText}`);
      }

      const payout = await response.json();
      return payout;
    } catch (error) {
      console.error('Error fetching payout details:', error);
      throw error;
    }
  }

  async cancelPayout(payoutId: string): Promise<void> {
    try {
      const response = await fetch(`/api/stripe/payouts/cancel/${payoutId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel payout: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error canceling payout:', error);
      throw error;
    }
  }

  // Payout Schedule Management
  async getPayoutSchedule(creatorId: string): Promise<PayoutSchedule> {
    try {
      const response = await fetch(`/api/stripe/payouts/schedule/${creatorId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payout schedule: ${response.statusText}`);
      }

      const schedule = await response.json();
      return schedule;
    } catch (error) {
      console.error('Error fetching payout schedule:', error);
      throw error;
    }
  }

  async updatePayoutSchedule(creatorId: string, scheduleData: {
    interval: 'manual' | 'daily' | 'weekly' | 'monthly';
    weeklyAnchor?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    monthlyAnchor?: number;
    delayDays?: number;
  }): Promise<PayoutSchedule> {
    try {
      const response = await fetch(`/api/stripe/payouts/schedule/${creatorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update payout schedule: ${response.statusText}`);
      }

      const schedule = await response.json();
      return schedule;
    } catch (error) {
      console.error('Error updating payout schedule:', error);
      throw error;
    }
  }

  // Payout Settings
  async getPayoutSettings(creatorId: string): Promise<PayoutSettings> {
    try {
      const response = await fetch(`/api/stripe/payouts/settings/${creatorId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payout settings: ${response.statusText}`);
      }

      const settings = await response.json();
      return settings;
    } catch (error) {
      console.error('Error fetching payout settings:', error);
      throw error;
    }
  }

  async updatePayoutSettings(creatorId: string, settings: Partial<PayoutSettings>): Promise<PayoutSettings> {
    try {
      const response = await fetch(`/api/stripe/payouts/settings/${creatorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`Failed to update payout settings: ${response.statusText}`);
      }

      const updatedSettings = await response.json();
      return updatedSettings;
    } catch (error) {
      console.error('Error updating payout settings:', error);
      throw error;
    }
  }

  // Payout Analytics
  async getPayoutAnalytics(creatorId: string, period: 'week' | 'month' | 'year'): Promise<{
    totalPayouts: number;
    totalAmount: number;
    averagePayout: number;
    successRate: number;
    failedPayouts: number;
    pendingAmount: number;
    currency: string;
  }> {
    try {
      const response = await fetch(`/api/stripe/payouts/analytics/${creatorId}?period=${period}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payout analytics: ${response.statusText}`);
      }

      const analytics = await response.json();
      return analytics;
    } catch (error) {
      console.error('Error fetching payout analytics:', error);
      throw error;
    }
  }

  // Webhook Event Processing
  async processWebhookEvent(event: PayoutWebhookEvent): Promise<void> {
    try {
      const response = await fetch('/api/stripe/webhooks/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Failed to process webhook event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
      throw error;
    }
  }

  // Batch Payout Operations
  async createBatchPayouts(payouts: Array<{
    creatorId: string;
    amount: number;
    currency: string;
    destination: string;
    description?: string;
  }>): Promise<CreatorPayout[]> {
    try {
      const response = await fetch('/api/stripe/payouts/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payouts }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create batch payouts: ${response.statusText}`);
      }

      const createdPayouts = await response.json();
      return createdPayouts;
    } catch (error) {
      console.error('Error creating batch payouts:', error);
      throw error;
    }
  }

  // Payout Verification
  async verifyPayoutAccount(creatorId: string, accountId: string, verificationData: {
    amounts: number[];
  }): Promise<{ verified: boolean; message?: string }> {
    try {
      const response = await fetch(`/api/stripe/payouts/verify/${creatorId}/${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      if (!response.ok) {
        throw new Error(`Failed to verify payout account: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error verifying payout account:', error);
      throw error;
    }
  }

  // Payout Limits and Compliance
  async getPayoutLimits(creatorId: string): Promise<{
    dailyLimit: number;
    monthlyLimit: number;
    minimumPayout: number;
    currency: string;
  }> {
    try {
      const response = await fetch(`/api/stripe/payouts/limits/${creatorId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payout limits: ${response.statusText}`);
      }

      const limits = await response.json();
      return limits;
    } catch (error) {
      console.error('Error fetching payout limits:', error);
      throw error;
    }
  }

  // Error Handling and Retry Logic
  async retryFailedPayout(payoutId: string): Promise<CreatorPayout> {
    try {
      const response = await fetch(`/api/stripe/payouts/retry/${payoutId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to retry payout: ${response.statusText}`);
      }

      const payout = await response.json();
      return payout;
    } catch (error) {
      console.error('Error retrying payout:', error);
      throw error;
    }
  }

  // Utility Methods
  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  }

  parseAmount(amount: string, currency: string): number {
    const numericAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    return Math.round(numericAmount * 100); // Convert to cents
  }

  getPayoutStatusColor(status: string): string {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'canceled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  getPayoutStatusIcon(status: string): string {
    switch (status) {
      case 'paid': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      case 'canceled': return '🚫';
      default: return '❓';
    }
  }
}

export default StripePayoutService; 