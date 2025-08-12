import { CallableContext } from "firebase-functions/v1/https";
import { CallableResponse } from "firebase-functions/v2/https";
export type CallableContextV2 = CallableResponse<unknown> | undefined;
export interface TodoFixMe {
    [key: string]: any;
}
export interface TodoFixMeContext {
    [key: string]: any;
}
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
export interface FirestoreEvent<T = unknown> {
    data: T;
    context: {
        eventId: string;
        timestamp: string;
        eventType: string;
        resource: string;
    };
}
/**
 * Type guard to check if context has authentication data
 * @param context - The callable context to check
 * @returns True if context has valid auth data
 */
export declare function isAuthContext(context: CallableContext | CallableContextV2): context is (CallableContext | CallableContextV2) & {
    auth: AuthContext;
};
/**
 * Type guard to check if data is valid TownStaffData
 * @param data - The data to validate
 * @returns True if data matches TownStaffData interface
 */
export declare function isTownStaffData(data: unknown): data is TownStaffData;
//# sourceMappingURL=index.d.ts.map