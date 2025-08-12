import type { Timestamp } from 'firebase/firestore';

// Earnings summary for creators
export interface EarningsSummary {
  totalEarnings: number; // Total earnings in cents
  totalTips: number; // Number of tips received
  averageTip: number; // Average tip amount in cents
  monthlyEarnings: number; // Current month earnings
  weeklyEarnings: number; // Current week earnings
  dailyEarnings: number; // Today's earnings
  pendingEarnings: number; // Earnings not yet paid out
  lastPayout?: {
    amount: number;
    date: Timestamp;
    status: 'paid' | 'pending' | 'failed';
  };
  nextPayout?: {
    estimatedAmount: number;
    scheduledDate: Timestamp;
  };
}

// Earnings breakdown by time period
export interface EarningsBreakdown {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data: Array<{
    date: string;
    earnings: number;
    tipCount: number;
    averageTip: number;
  }>;
}

// Payout information
export interface PayoutInfo {
  id: string;
  userId: string;
  amount: number; // Amount in cents
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  method: 'bank_account' | 'card' | 'stripe_balance';
  destination?: {
    type: 'bank_account' | 'card';
    last4?: string;
    bankName?: string;
  };
  createdAt: Timestamp;
  processedAt?: Timestamp;
  arrivalDate?: Timestamp;
  failureReason?: string;
  metadata?: Record<string, any>;
}

// Payout settings for creators
export interface PayoutSettings {
  userId: string;
  autoPayout: boolean;
  minimumPayout: number; // Minimum amount in cents
  payoutSchedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  payoutDay?: number; // Day of week/month for scheduled payouts
  destination: {
    type: 'bank_account' | 'card';
    accountId?: string;
    cardId?: string;
  };
  taxInfo?: {
    taxId?: string;
    taxIdType?: 'ssn' | 'ein' | 'business_number';
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  updatedAt: Timestamp;
}

// Transaction analytics
export interface TransactionAnalytics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  averageTransactionValue: number;
  topTippers: Array<{
    userId: string;
    displayName: string;
    totalAmount: number;
    tipCount: number;
    lastTipAt: Timestamp;
  }>;
  transactionTrends: Array<{
    period: string;
    count: number;
    amount: number;
    growth: number; // Percentage growth from previous period
  }>;
}

// Revenue sources breakdown
export interface RevenueSources {
  tips: {
    total: number;
    count: number;
    percentage: number;
  };
  subscriptions?: {
    total: number;
    count: number;
    percentage: number;
  };
  purchases?: {
    total: number;
    count: number;
    percentage: number;
  };
  other?: {
    total: number;
    count: number;
    percentage: number;
  };
}

// Tax and compliance information
export interface TaxInfo {
  userId: string;
  taxYear: number;
  totalEarnings: number;
  totalPayouts: number;
  taxWithheld: number;
  taxForms: Array<{
    type: '1099-K' | '1099-MISC' | 'W-9';
    year: number;
    status: 'pending' | 'generated' | 'sent';
    generatedAt?: Timestamp;
  }>;
  updatedAt: Timestamp;
}

// Notification preferences for earnings
export interface EarningsNotifications {
  userId: string;
  newTip: boolean;
  payoutProcessed: boolean;
  payoutFailed: boolean;
  milestoneReached: boolean;
  taxFormAvailable: boolean;
  weeklySummary: boolean;
  monthlySummary: boolean;
  updatedAt: Timestamp;
}

// Milestone tracking
export interface EarningsMilestone {
  id: string;
  userId: string;
  type: 'first_tip' | 'first_payout' | 'earnings_threshold' | 'tip_count';
  value: number;
  achieved: boolean;
  achievedAt?: Timestamp;
  description: string;
  reward?: {
    type: 'badge' | 'feature' | 'bonus';
    value: string;
  };
}

// Dashboard configuration
export interface DashboardConfig {
  userId: string;
  defaultPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  currency: string;
  timezone: string;
  showTaxInfo: boolean;
  showMilestones: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  updatedAt: Timestamp;
}

// Real-time earnings update
export interface EarningsUpdate {
  userId: string;
  type: 'tip_received' | 'payout_processed' | 'milestone_achieved';
  amount?: number;
  previousTotal: number;
  newTotal: number;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

// Payout request
export interface PayoutRequest {
  userId: string;
  amount: number;
  currency: string;
  destination: {
    type: 'bank_account' | 'card';
    accountId?: string;
    cardId?: string;
  };
  reason?: string;
  scheduledFor?: Timestamp;
}

// Payout response
export interface PayoutResponse {
  success: boolean;
  payoutId?: string;
  error?: string;
  estimatedArrival?: Timestamp;
}

// Earnings export options
export interface EarningsExportOptions {
  format: 'csv' | 'json' | 'pdf';
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  includeTransactions: boolean;
  includeAnalytics: boolean;
  includeTaxInfo: boolean;
}

// Export result
export interface EarningsExport {
  id: string;
  userId: string;
  format: string;
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  downloadUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
  error?: string;
}

// Hook return types
export interface UseMonetizationReturn {
  // State
  earnings: EarningsSummary | null;
  breakdown: EarningsBreakdown | null;
  payouts: PayoutInfo[];
  analytics: TransactionAnalytics | null;
  revenueSources: RevenueSources | null;
  settings: PayoutSettings | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  requestPayout: (amount: number) => Promise<PayoutResponse>;
  updatePayoutSettings: (settings: Partial<PayoutSettings>) => Promise<void>;
  exportEarnings: (options: EarningsExportOptions) => Promise<EarningsExport>;
  refreshEarnings: () => Promise<void>;
  clearError: () => void;
  
  // Utilities
  formatEarnings: (amount: number) => string;
  calculateGrowth: (current: number, previous: number) => number;
  getEarningsPeriod: (period: string) => EarningsBreakdown | null;
  
  // Computed values
  pendingEarnings: number;
  canRequestPayout: boolean;
  earningsGrowth: number;
}

// Service method types
export interface MonetizationService {
  getEarningsSummary: (userId: string) => Promise<EarningsSummary>;
  getEarningsBreakdown: (userId: string, period: string) => Promise<EarningsBreakdown>;
  getPayoutHistory: (userId: string, limit?: number) => Promise<PayoutInfo[]>;
  getTransactionAnalytics: (userId: string) => Promise<TransactionAnalytics>;
  getRevenueSources: (userId: string) => Promise<RevenueSources>;
  getPayoutSettings: (userId: string) => Promise<PayoutSettings | null>;
  requestPayout: (request: PayoutRequest) => Promise<PayoutResponse>;
  updatePayoutSettings: (userId: string, settings: Partial<PayoutSettings>) => Promise<void>;
  exportEarnings: (userId: string, options: EarningsExportOptions) => Promise<EarningsExport>;
  getTaxInfo: (userId: string, year: number) => Promise<TaxInfo | null>;
  getMilestones: (userId: string) => Promise<EarningsMilestone[]>;
}

// Export all types
export type {
  EarningsSummary,
  EarningsBreakdown,
  PayoutInfo,
  PayoutSettings,
  TransactionAnalytics,
  RevenueSources,
  TaxInfo,
  EarningsNotifications,
  EarningsMilestone,
  DashboardConfig,
  EarningsUpdate,
  PayoutRequest,
  PayoutResponse,
  EarningsExportOptions,
  EarningsExport,
  UseMonetizationReturn,
  MonetizationService
}; 