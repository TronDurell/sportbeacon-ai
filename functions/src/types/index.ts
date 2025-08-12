import {CallableContext} from "firebase-functions/v1/https";
import {CallableResponse} from "firebase-functions/v2/https";

// V2 CallableContext type that matches the actual v2 signature
export type CallableContextV2 = CallableResponse<unknown> | undefined;

// Firebase Functions Type Definitions
// Import comprehensive types from the main interfaces

export * from '../../../types/interfaces';

// Firebase-specific type extensions
export interface FirebaseContext {
  auth: {
    uid: string;
    token: Record<string, unknown>;
  };
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

// Authentication types
export interface AuthContext {
  uid: string;
  token: {
    admin?: boolean;
    director?: boolean;
    coach?: boolean;
    parent?: boolean;
    player?: boolean;
    scout?: boolean;
    referee?: boolean;
    role?: string;
  };
}

export interface TownStaffData {
  isActive: boolean;
  role: string;
  permissions: string[];
  createdAt: FirebaseFirestore.Timestamp;
}

export interface ValidatedContext {
  auth: AuthContext;
  staffData?: TownStaffData;
}

// Request/Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AnalyticsEvent {
  eventType: string;
  userId: string;
  metadata?: Record<string, unknown>;
  timestamp: FirebaseFirestore.Timestamp;
}

export interface CoachFeedback {
  coachId: string;
  playerId: string;
  feedback: string;
  rating: number;
  category: string;
}

export interface PlayerAnalysis {
  playerId: string;
  analysisType: "performance" | "skills" | "fitness";
  data: Record<string, unknown>;
}

export interface StripeCheckoutRequest {
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
}

// Firestore document types
export interface User {
  uid: string;
  email: string;
  role: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface Registration {
  playerId: string;
  parentId: string;
  leagueId: string;
  status: "pending" | "approved" | "rejected" | "waitlisted";
  createdAt: FirebaseFirestore.Timestamp;
}

export interface SiblingRequest {
  parentId: string;
  siblingIds: string[];
  leagueId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: FirebaseFirestore.Timestamp;
}

export interface AgeOverrideRequest {
  playerId: string;
  parentId: string;
  leagueId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: FirebaseFirestore.Timestamp;
}

export interface WaitlistEntry {
  playerId: string;
  leagueId: string;
  position: number;
  joinedAt: FirebaseFirestore.Timestamp;
}

export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  timestamp: FirebaseFirestore.Timestamp;
  metadata?: Record<string, unknown>;
}

// Stripe-specific types
export interface PayoutRequest {
  userId: string;
  amount: number;
  currency: string;
  destination: {
    type: string;
    [key: string]: any;
  };
  reason?: string;
  scheduledFor?: FirebaseFirestore.Timestamp;
}

export interface PayoutResponse {
  success: boolean;
  error?: string;
  data?: {
    status: any;
    amount: any;
    currency: any;
    arrivalDate: any;
    failureReason?: any;
  };
}

export interface PayoutInfo {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrivalDate?: number;
  failureReason?: string;
}

export interface CreatorProfileDocument {
  uid: string;
  verified: boolean;
  stripeAccountId?: string;
  payoutSettings?: {
    minimumPayout: number;
    schedule: string;
  };
}

export interface CallableRequestContext {
  auth?: {
    uid: string;
    token: Record<string, any>;
  };
}

// Event types for Firestore triggers
export interface FirestoreEvent<T = unknown> {
  data: T;
  context: {
    eventId: string;
    timestamp: string;
    eventType: string;
    resource: string;
  };
}

// Type guards
/**
 * Type guard to check if context has authentication data
 * @param context - The callable context to check
 * @returns True if context has valid auth data
 */
export function isAuthContext(context: CallableContext | CallableContextV2): context is (CallableContext | CallableContextV2) & {auth: AuthContext} {
  return context !== undefined &&
         context !== null &&
         typeof context === "object" &&
         "auth" in context &&
         context.auth !== undefined;
}

/**
 * Type guard to check if data is valid TownStaffData
 * @param data - The data to validate
 * @returns True if data matches TownStaffData interface
 */
export function isTownStaffData(data: unknown): data is TownStaffData {
  return (
    typeof data === "object" &&
    data !== null &&
    "isActive" in data &&
    "role" in data &&
    "permissions" in data &&
    "createdAt" in data
  );
}
