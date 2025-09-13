export interface PolicyDelta {
    id: string;
    type: 'content_moderation' | 'user_behavior' | 'feature_usage' | 'performance';
    field: string;
    oldValue: any;
    newValue: any;
    confidence: number;
    evidence: string[];
    appliedAt: string;
    appliedBy: 'system';
}
export interface PolicyConfig {
    contentModeration: {
        spamThreshold: number;
        harassmentThreshold: number;
        inappropriateThreshold: number;
        autoModerationEnabled: boolean;
    };
    userBehavior: {
        maxPostsPerHour: number;
        maxCommentsPerHour: number;
        rateLimitWindow: number;
    };
    featureUsage: {
        memorySDKEnabled: boolean;
        learningGatesEnabled: boolean;
        personalizationLevel: 'low' | 'medium' | 'high';
    };
    performance: {
        maxResponseTime: number;
        minAccuracy: number;
        maxErrorRate: number;
    };
}
export declare const applyPolicyDeltas: import("firebase-functions/v2/scheduler").ScheduleFunction;
//# sourceMappingURL=applyPolicyDeltas.d.ts.map