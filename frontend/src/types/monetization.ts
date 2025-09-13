// Central definitions used by monetization, tips, payouts, and video services.

export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | string;

// ============================================================================
// EARNINGS TYPES
// ============================================================================

export interface EarningsSummary {
  total: number;            // in minor units, e.g., cents
  totalEarnings: number;    // in minor units, e.g., cents
  totalTips: number;        // in minor units, e.g., cents
  averageTip: number;       // in minor units, e.g., cents
  monthlyEarnings?: number; // in minor units, e.g., cents
  weeklyEarnings: number;   // in minor units, e.g., cents
  dailyEarnings: number;    // in minor units, e.g., cents
  pendingEarnings: number;  // in minor units, e.g., cents
  lastPayout?: {
    amount: number;
    date: string;
    status: string;
  };
  currency: CurrencyCode;
  periodStart: string;      // ISO date
  periodEnd: string;        // ISO date
}

export interface EarningsBreakdown {
  tipsTotal: number;
  adShareTotal: number;
  subsTotal: number;
  currency: CurrencyCode;
  period: "daily" | "weekly" | "monthly" | "yearly";
  data: Array<{ date: string; earnings: number; tipCount: number; averageTip: number; }>;
}

export interface PayoutInfo {
  destination: "stripe" | "paypal" | "bank";
  lastPayoutAt?: string;    // ISO date
  pendingAmount: number;    // minor units
  currency: CurrencyCode;
  amount: number;           // minor units
  createdAt: string;        // ISO date
  status: "pending" | "completed" | "failed";
}

export interface PayoutSettings {
  userId: string;
  method: "bank_transfer" | "paypal" | "stripe";
  bankAccount?: {
    accountNumber: string;
    routingNumber: string;
    accountType: "checking" | "savings";
  };
  paypalEmail?: string;
  stripeAccountId?: string;
  minimumPayout: number;
  autoPayout: boolean;
  taxInfo?: TaxInfo;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRequest {
  userId: string;
  amount: number;
  currency: string;
  method: "bank_transfer" | "paypal" | "stripe";
  notes?: string;
}

export interface PayoutResponse {
  success: boolean;
  payoutId?: string;
  estimatedArrival?: string;
  error?: string;
}

// ============================================================================
// TIP TYPES
// ============================================================================

export interface CreateTipRequest {
  toUserId: string;
  amount: number;           // minor units
  currency: CurrencyCode;
  message?: string;
}

export interface TipResponse {
  id: string;
  tipId: string;            // session ID or transaction ID
  status: "succeeded" | "pending" | "failed";
  createdAt: string;        // ISO date
  checkoutUrl?: string;     // Stripe checkout URL
  amount?: number;          // tip amount
  currency?: string;        // currency code
  expiresAt: number;        // expiration timestamp
}

export interface TipStatistics {
  count: number;
  totalAmount: number;      // minor units
  currency: CurrencyCode;
}

export interface TipTransactionDocument {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  message?: string;
  anonymous: boolean;
  status: "pending" | "succeeded" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ANNOTATION TYPES
// ============================================================================

export interface AnnotationPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface AnnotationData {
  id: string;
  videoId: string;
  title: string;
  content: string;
  type: "highlight" | "note" | "drawing" | "text";
  startTime?: number;
  endTime?: number;
  points?: AnnotationPoint[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationMetadata {
  videoId: string;
  annotationCount: number;
  lastUpdated: string;
  tags: string[];
  categories: string[];
}

export interface VideoAnnotationDocument {
  id: string;
  videoId: string;
  data: {
    content: string;
    title: string;
    startTime?: number;
    endTime?: number;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// VIDEO TYPES
// ============================================================================

export interface VideoUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percent?: number;         // 0..100 (optional)
  progress: number;         // 0..100 (alternative progress field)
  state: string;            // upload state
  videoId?: string;         // video identifier
}

export interface VideoMetadata {
  width: number;
  height: number;
  durationSec: number;
  codec?: string;
  videoId: string;          // video identifier
  fileName: string;         // file name
  originalName?: string;    // original file name
  fileSize?: number;        // file size in bytes
  contentType: string;      // MIME type
  downloadURL: string;      // download URL
  storagePath: string;      // storage path
  uploadedBy: string;       // user ID who uploaded
}

export interface VideoFile {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  name: string;             // alternative name field
  fullPath: string;         // full file path
  downloadURL?: string;     // download URL
  size?: number;            // alternative size field
  lastModified: string;     // last modified timestamp
}

export interface MediaMetadata {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadTask {
  id: string;
  metadata: MediaMetadata;
  progress: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

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
    lastTipAt: string | Date | any; // Allow Timestamp type
  }>;
  transactionTrends: Array<{
    period: string;
    count: number;
    amount: number;
    growth: number;
  }>;
}

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
}

// ============================================================================
// TAX AND COMPLIANCE TYPES
// ============================================================================

export interface TaxInfo {
  userId: string;
  year: number;
  totalEarnings: number;
  totalTips: number;
  totalPayouts: number;
  taxWithheld: number;
  formsGenerated: boolean;
  formsSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EarningsMilestone {
  id: string;
  userId: string;
  type: "total_earnings" | "monthly_earnings" | "tip_count";
  value: number;
  achieved: boolean;
  achievedAt?: string;
  createdAt: string;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface EarningsExportOptions {
  startDate: Date;
  endDate: Date;
  format: "csv" | "pdf" | "json";
  includeTransactions: boolean;
  includeAnalytics: boolean;
}

export interface EarningsExport {
  id: string;
  userId: string;
  options: EarningsExportOptions;
  status: "generating" | "ready" | "failed";
  downloadURL?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// ============================================================================
// CREATOR PROFILE TYPES
// ============================================================================

export interface CreatorProfileDocument {
  userId: string;
  displayName: string;
  bio?: string;
  avatarURL?: string;
  tipEarnings: number;
  totalTips: number;
  averageTip: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  winRate?: number;
  gamesPlayed?: Array<{ date: string; count: number; wins: number; }>;
  winRateBySport?: Record<string, number>;
  performanceTrend?: Array<{ date: string; winRate: number; averageScore: number; }>;
  achievements?: Array<{ id: string; name: string; date: string; }>;
  recentGames?: Array<{ id: string; date: string; result: string; }>;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

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