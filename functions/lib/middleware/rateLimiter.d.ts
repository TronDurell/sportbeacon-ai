interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (context: any) => string;
}
/**
 * Rate limiter class for controlling API request frequency
 * Uses Firestore to track request counts with configurable windows
 */
export declare class RateLimiter {
    private db;
    private config;
    /**
     * Creates a new rate limiter instance
     * @param config - Configuration for rate limiting behavior
     */
    constructor(config: RateLimitConfig);
    /**
     * Generates a unique key for rate limiting based on context
     * @param context - Request context containing auth and request info
     * @returns Unique identifier for rate limiting
     */
    private getKey;
    /**
     * Checks if a request is allowed based on current rate limits
     * @param context - Request context for key generation
     * @returns Promise resolving to rate limit status
     */
    checkLimit(context: any): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
    /**
     * Cleans up expired rate limit entries from Firestore
     * Should be called periodically to prevent database bloat
     */
    cleanup(): Promise<void>;
}
/**
 * Predefined rate limit configurations for different endpoint types
 */
export declare const rateLimitConfigs: {
    auth: {
        maxRequests: number;
        windowMs: number;
    };
    api: {
        maxRequests: number;
        windowMs: number;
    };
    read: {
        maxRequests: number;
        windowMs: number;
    };
    write: {
        maxRequests: number;
        windowMs: number;
    };
    admin: {
        maxRequests: number;
        windowMs: number;
    };
};
/**
 * Factory function to create a rate limiter instance
 * @param type - Type of rate limiting configuration to use
 * @returns Configured RateLimiter instance
 */
export declare function createRateLimiter(type: keyof typeof rateLimitConfigs): RateLimiter;
/**
 * Express middleware factory for rate limiting
 * @param type - Type of rate limiting configuration to use
 * @returns Express middleware function
 */
export declare function rateLimitMiddleware(type: keyof typeof rateLimitConfigs): (req: any, res: any, next: any) => Promise<void>;
export {};
//# sourceMappingURL=rateLimiter.d.ts.map