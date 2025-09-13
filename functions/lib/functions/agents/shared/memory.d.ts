/**
 * Shared Memory Utilities for Agents
 * Provides common memory operations for background agents
 */
/**
 * Agent memory context
 */
export interface AgentMemoryContext {
    agentId: string;
    agentType: 'verification' | 'reporting' | 'notification';
    scope: 'player' | 'team' | 'system';
    key: string;
    value: any;
    metadata?: Record<string, any>;
}
/**
 * Store agent memory with standardized format
 */
export declare function storeAgentMemory(context: AgentMemoryContext): Promise<void>;
/**
 * Retrieve agent memory by pattern
 */
export declare function retrieveAgentMemory(agentType: string, scope: string, keyPattern?: string, limit?: number): Promise<any[]>;
/**
 * Update agent learning patterns
 */
export declare function updateAgentLearning(agentType: string, action: string, success: boolean, metadata?: Record<string, any>): Promise<void>;
/**
 * Get agent performance metrics
 */
export declare function getAgentPerformance(agentType: string, timeRange: {
    from: Date;
    to: Date;
}): Promise<{
    totalActions: number;
    successfulActions: number;
    successRate: number;
    averageResponseTime: number;
    errorRate: number;
}>;
/**
 * Clean up old agent memory entries
 */
export declare function cleanupAgentMemory(olderThanDays?: number): Promise<number>;
/**
 * Store agent state for persistence
 */
export declare function storeAgentState(agentId: string, state: Record<string, any>, metadata?: Record<string, any>): Promise<void>;
/**
 * Retrieve agent state
 */
export declare function retrieveAgentState(agentId: string): Promise<Record<string, any> | null>;
/**
 * Log agent activity for monitoring
 */
export declare function logAgentActivity(agentId: string, activity: string, details?: Record<string, any>, success?: boolean): Promise<void>;
//# sourceMappingURL=memory.d.ts.map