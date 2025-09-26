export interface StatSubmission {
    id: string;
    playerId: string;
    teamId: string;
    statType: string;
    value: number;
    gameId?: string;
    submittedBy: string;
    submittedAt: Date;
    verified?: boolean;
    notes?: string;
}
export interface VerificationResult {
    status: 'verified' | 'flagged';
    notes?: string;
    flaggedReason?: string;
    confidence?: number;
    verifiedBy?: string;
    verifiedAt?: Date;
}
export interface WeeklyReport {
    id: string;
    teamId: string;
    weekStart: Date;
    weekEnd: Date;
    stats: Record<string, number>;
    insights: string[];
    generatedAt: Date;
    generatedBy: string;
}
export interface TeamReport {
    id: string;
    teamId: string;
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalStats: number;
        verifiedStats: number;
        flaggedStats: number;
    };
    topPerformers: Array<{
        playerId: string;
        statType: string;
        value: number;
    }>;
    generatedAt: Date;
}
export interface MemoryEvent {
    tenantId: string;
    userId: string;
    kind: 'stat_verified' | 'stat_submitted' | 'feedback' | 'function_result' | 'function_error' | string;
    payload: Record<string, unknown>;
    createdAt?: Date;
}
export interface ApiRequest {
    body?: Record<string, unknown>;
    query?: Record<string, string>;
    params?: Record<string, string>;
    headers?: Record<string, string>;
}
export interface League {
    id: string;
    name: string;
    sport: string;
    season: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface User {
    id: string;
    email: string;
    role: 'admin' | 'coach' | 'athlete' | 'director' | 'townStaff';
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Team {
    id: string;
    name: string;
    leagueId: string;
    sport: string;
    season: string;
    players?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthContext {
    uid: string;
    token: {
        email?: string;
        email_verified?: boolean;
        role?: string;
    };
}
export interface CallableContextV2 {
    auth?: AuthContext;
    request?: {
        headers: Record<string, string>;
    };
}
export interface ApiContext {
    auth?: AuthContext;
    user?: User;
    request: ApiRequest;
}
export interface PayoutRequest {
    creatorId: string;
    amount: number;
    currency: string;
}
export interface PayoutResponse {
    success: boolean;
    payoutId?: string;
    error?: string;
}
export interface PayoutInfo {
    id: string;
    amount: number;
    currency: string;
    status: string;
    failureReason?: string;
    createdAt: Date;
}
export interface CreatorProfileDocument {
    id: string;
    userId: string;
    earnings: number;
    payouts: PayoutInfo[];
    verified?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CallableRequestContext {
    auth?: AuthContext;
    request: {
        headers: Record<string, string>;
    };
}
export declare function isAuthContext(context: any): context is AuthContext;
