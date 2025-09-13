/**
 * Security middleware for Firebase Functions
 * Provides rate limiting, input validation, and audit logging
 */
declare const RATE_LIMITS: {
    API: {
        REQUESTS_PER_MINUTE: number;
        REQUESTS_PER_HOUR: number;
        REQUESTS_PER_DAY: number;
    };
    AUTH: {
        LOGIN_ATTEMPTS_PER_HOUR: number;
        PASSWORD_RESET_PER_HOUR: number;
        EMAIL_VERIFICATION_PER_HOUR: number;
    };
    UPLOAD: {
        FILES_PER_HOUR: number;
        TOTAL_SIZE_PER_HOUR: number;
    };
    PAYMENT: {
        TIPS_PER_HOUR: number;
        PAYOUT_REQUESTS_PER_DAY: number;
    };
};
declare const SECURITY_EVENTS: {
    readonly RATE_LIMIT_EXCEEDED: "rate_limit_exceeded";
    readonly INVALID_INPUT: "invalid_input";
    readonly SUSPICIOUS_ACTIVITY: "suspicious_activity";
    readonly PERMISSION_DENIED: "permission_denied";
    readonly API_ACCESS: "api_access";
    readonly ERROR_OCCURRED: "error_occurred";
};
/**
 * Rate limiting middleware
 */
export declare const rateLimit: (operation: string, limit: number, window: "minute" | "hour" | "day") => (data: any, context: any) => Promise<void>;
/**
 * Input validation middleware
 */
export declare const validateInput: (schema: Record<string, any>) => (data: any, context: any) => void;
/**
 * Permission checking middleware
 */
export declare const requirePermission: (permission: string) => (data: any, context: any) => void;
/**
 * Role checking middleware
 */
export declare const requireRole: (role: string) => (data: any, context: any) => void;
/**
 * Audit logging middleware
 */
export declare const auditLog: (operation: string) => (data: any, context: any) => Promise<void>;
/**
 * Error handling middleware
 */
export declare const errorHandler: (error: any, context: any) => never;
/**
 * Suspicious activity detection
 */
export declare const detectSuspiciousActivity: (data: any, context: any) => void;
export { RATE_LIMITS, SECURITY_EVENTS };
//# sourceMappingURL=security.d.ts.map