interface ResolveDisputeResponse {
    success: boolean;
    disputeId: string;
    athleteId: string;
    action: string;
    resolutionId: string;
    timestamp: Date;
    message: string;
    metadata?: Record<string, any>;
}
interface DisputeResolutionRecord {
    id: string;
    disputeId: string;
    athleteId: string;
    action: 'resolve' | 'reject' | 'escalate';
    resolution: string;
    resolutionReason: string;
    resolvedBy: string;
    resolvedAt: Date;
    previousStatus: string;
    newStatus: string;
    targetType: string;
    targetId: string;
    metadata: Record<string, any>;
}
export declare const resolveDispute: import("firebase-functions/v2/https").CallableFunction<any, Promise<ResolveDisputeResponse>, unknown>;
export declare function getDisputeResolutionHistory(disputeId: string, athleteId: string): Promise<DisputeResolutionRecord[]>;
export declare function getPendingDisputesForAthlete(athleteId: string): Promise<Array<{
    disputeId: string;
    submittedAt: Date;
    disputeType: string;
    targetType: string;
    targetId: string;
    priority: string;
}>>;
export declare function getDisputeResolutionStats(timeRange: {
    start: Date;
    end: Date;
}): Promise<{
    total: number;
    resolved: number;
    rejected: number;
    escalated: number;
    averageResolutionTime: number;
}>;
export {};
//# sourceMappingURL=resolveDispute.d.ts.map