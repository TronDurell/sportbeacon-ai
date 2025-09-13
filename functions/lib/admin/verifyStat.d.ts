interface VerifyStatResponse {
    success: boolean;
    statId: string;
    athleteId: string;
    action: string;
    verificationId: string;
    timestamp: Date;
    message: string;
    metadata?: Record<string, any>;
}
interface StatVerificationRecord {
    id: string;
    statId: string;
    athleteId: string;
    action: 'approve' | 'reject' | 'request_clarification';
    reason?: string;
    clarificationMessage?: string;
    verifiedBy: string;
    verifiedAt: Date;
    previousStatus: string;
    newStatus: string;
    metadata: Record<string, any>;
}
export declare const verifyStat: import("firebase-functions/v2/https").CallableFunction<any, Promise<VerifyStatResponse>, unknown>;
export declare function getStatVerificationHistory(statId: string, athleteId: string): Promise<StatVerificationRecord[]>;
export declare function getPendingStatsForAthlete(athleteId: string): Promise<Array<{
    statId: string;
    submittedAt: Date;
    sport: string;
    statType: string;
}>>;
export declare function getVerificationStats(timeRange: {
    start: Date;
    end: Date;
}): Promise<{
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    averageVerificationTime: number;
}>;
export {};
//# sourceMappingURL=verifyStat.d.ts.map