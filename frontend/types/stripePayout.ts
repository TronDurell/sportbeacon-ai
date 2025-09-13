import type { Timestamp } from 'firebase/firestore';

// Stripe Connect Account Types
export interface StripeConnectAccount {
  id: string;
  object: 'account';
  business_profile: {
    mcc: string;
    name: string;
    support_email: string;
    support_phone: string;
    url: string;
  };
  capabilities: {
    card_payments: 'active' | 'inactive' | 'pending';
    transfers: 'active' | 'inactive' | 'pending';
  };
  charges_enabled: boolean;
  country: string;
  created: number;
  default_currency: string;
  details_submitted: boolean;
  email: string;
  payouts_enabled: boolean;
  requirements: {
    alternatives: any[];
    current_deadline: number | null;
    currently_due: string[];
    disabled_reason: string | null;
    errors: any[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: any[];
  };
  settings: {
    payouts: {
      schedule: {
        delay_days: number;
        interval: 'daily' | 'weekly' | 'monthly' | 'manual';
        monthly_anchor: number | null;
        weekly_anchor: string | null;
      };
    };
  };
  type: 'express' | 'standard' | 'custom';
  verification: {
    disabled_reason: string | null;
    due_by: number | null;
    fields_needed: string[];
  };
}

// Payout Account Types
export interface PayoutAccount {
  id: string;
  object: 'bank_account' | 'card';
  account: string;
  account_holder_name: string;
  account_holder_type: 'individual' | 'company';
  bank_name?: string;
  country: string;
  currency: string;
  default_for_currency: boolean;
  fingerprint: string;
  last4: string;
  metadata: Record<string, string>;
  routing_number?: string;
  status: 'new' | 'validated' | 'verified' | 'verification_failed' | 'errored';
  type: 'bank_account' | 'debit_card';
}

// Payout Schedule Types
export interface PayoutSchedule {
  id: string;
  interval: 'manual' | 'daily' | 'weekly' | 'monthly';
  weekly_anchor?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  monthly_anchor?: number;
  delay_days: number;
  is_active: boolean;
  created: number;
  updated: number;
}

// Creator Payout Types
export interface CreatorPayout {
  id: string;
  object: 'payout';
  amount: number;
  arrival_date: number;
  automatic: boolean;
  balance_transaction: string;
  created: number;
  currency: string;
  description: string;
  destination: string;
  failure_balance_transaction: string | null;
  failure_code: string | null;
  failure_message: string | null;
  livemode: boolean;
  metadata: Record<string, string>;
  method: 'instant' | 'standard';
  original_payout: string | null;
  reversed_by: string | null;
  source_type: 'bank_account' | 'card';
  statement_descriptor: string | null;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  type: 'bank_account' | 'card';
}

// Payout Transaction Types
export interface PayoutTransaction {
  id: string;
  payout_id: string;
  creator_id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created: number;
  updated: number;
  metadata: Record<string, string>;
  fee_amount: number;
  net_amount: number;
  source_type: 'charge' | 'refund' | 'adjustment' | 'fee' | 'stripe_fee';
  source_id: string;
}

// Payout Settings Types
export interface PayoutSettings {
  id: string;
  creator_id: string;
  default_currency: string;
  minimum_payout_amount: number;
  payout_schedule: PayoutSchedule;
  payout_methods: {
    bank_accounts: boolean;
    debit_cards: boolean;
  };
  notifications: {
    payout_sent: boolean;
    payout_failed: boolean;
    payout_canceled: boolean;
    account_updated: boolean;
  };
  compliance: {
    tax_forms_required: boolean;
    tax_forms_submitted: boolean;
    verification_required: boolean;
    verification_completed: boolean;
  };
  created: number;
  updated: number;
}

// Payout Analytics Types
export interface PayoutAnalytics {
  id: string;
  creator_id: string;
  period: 'week' | 'month' | 'year';
  start_date: number;
  end_date: number;
  metrics: {
    total_payouts: number;
    total_amount: number;
    average_payout: number;
    success_rate: number;
    failed_payouts: number;
    pending_amount: number;
    total_fees: number;
    net_amount: number;
  };
  currency: string;
  created: number;
}

// Payout Limits Types
export interface PayoutLimits {
  id: string;
  creator_id: string;
  daily_limit: number;
  monthly_limit: number;
  minimum_payout: number;
  currency: string;
  country: string;
  account_type: 'individual' | 'company';
  verification_level: 'unverified' | 'verified' | 'verified_plus';
  created: number;
  updated: number;
}

// Webhook Event Types
export interface PayoutWebhookEvent {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: {
    object: CreatorPayout | StripeConnectAccount | PayoutAccount;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key: string | null;
  };
  type: 
    | 'payout.paid'
    | 'payout.pending'
    | 'payout.failed'
    | 'payout.canceled'
    | 'payout.updated'
    | 'account.updated'
    | 'account.application.deauthorized'
    | 'account.application.authorized'
    | 'account.external_account.created'
    | 'account.external_account.updated'
    | 'account.external_account.deleted';
}

// Payout Form Types
export interface PayoutFormData {
  amount: number;
  currency: string;
  destination: string;
  description: string;
  metadata?: Record<string, string>;
}

// Payout Filter Types
export interface PayoutFilters {
  status?: 'paid' | 'pending' | 'failed' | 'canceled';
  currency?: string;
  destination?: string;
  start_date?: number;
  end_date?: number;
  limit?: number;
  starting_after?: string;
}

// Payout Summary Types
export interface PayoutSummary {
  total_payouts: number;
  total_amount: number;
  pending_amount: number;
  failed_amount: number;
  success_rate: number;
  average_payout: number;
  currency: string;
  period: 'week' | 'month' | 'year';
}

// Creator Onboarding Types
export interface CreatorOnboarding {
  id: string;
  creator_id: string;
  account_id: string;
  status: 'pending' | 'completed' | 'failed';
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    disabled_reason: string | null;
  };
  onboarding_url: string;
  return_url: string;
  refresh_url: string;
  created: number;
  updated: number;
}

// Payout Verification Types
export interface PayoutVerification {
  id: string;
  creator_id: string;
  account_id: string;
  type: 'bank_account' | 'debit_card';
  status: 'pending' | 'verified' | 'failed';
  verification_method: 'amounts' | 'instant' | 'microdeposits';
  amounts?: number[];
  attempts_remaining: number;
  created: number;
  expires_at: number;
}

// Payout Error Types
export interface PayoutError {
  code: string;
  message: string;
  param?: string;
  type: 'card_error' | 'validation_error' | 'rate_limit_error' | 'invalid_request_error' | 'authentication_error' | 'api_connection_error' | 'api_error';
  decline_code?: string;
  doc_url?: string;
}

// Payout Response Types
export interface PayoutResponse<T> {
  success: boolean;
  data?: T;
  error?: PayoutError;
  message?: string;
}

// Payout Batch Types
export interface PayoutBatch {
  id: string;
  creator_id: string;
  payouts: CreatorPayout[];
  total_amount: number;
  total_count: number;
  successful_count: number;
  failed_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created: number;
  completed_at?: number;
}

// Payout Notification Types
export interface PayoutNotification {
  id: string;
  creator_id: string;
  payout_id: string;
  type: 'payout_sent' | 'payout_failed' | 'payout_canceled' | 'account_updated';
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  created: number;
}

// All types are already exported inline above 