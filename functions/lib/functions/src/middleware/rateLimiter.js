"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = exports.createRateLimiter = exports.rateLimitConfigs = exports.RateLimiter = void 0;
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
/**
 * Rate limiter class for controlling API request frequency
 * Uses Firestore to track request counts with configurable windows
 */
class RateLimiter {
    db = (0, firestore_1.getFirestore)();
    config;
    /**
     * Creates a new rate limiter instance
     * @param config - Configuration for rate limiting behavior
     */
    constructor(config) {
        this.config = config;
    }
    /**
     * Generates a unique key for rate limiting based on context
     * @param context - Request context containing auth and request info
     * @returns Unique identifier for rate limiting
     */
    getKey(context) {
        if (this.config.keyGenerator) {
            return this.config.keyGenerator(context);
        }
        // Default key generator based on user ID or IP
        if (context.auth?.uid) {
            return `rate_limit:${context.auth.uid}`;
        }
        // Fallback to IP-based limiting for unauthenticated requests
        return `rate_limit:ip:${context.rawRequest?.ip || "unknown"}`;
    }
    /**
     * Checks if a request is allowed based on current rate limits
     * @param context - Request context for key generation
     * @returns Promise resolving to rate limit status
     */
    async checkLimit(context) {
        const key = this.getKey(context);
        const now = Date.now();
        const resetTime = now + this.config.windowMs;
        try {
            const rateLimitRef = this.db.collection("rateLimits").doc(key);
            // Use transaction to ensure atomic updates
            const result = await this.db.runTransaction(async (transaction) => {
                const doc = await transaction.get(rateLimitRef);
                if (!doc.exists) {
                    // First request
                    const entry = {
                        count: 1,
                        resetTime,
                    };
                    transaction.set(rateLimitRef, entry);
                    return { allowed: true, remaining: this.config.maxRequests - 1, resetTime };
                }
                const data = doc.data();
                // Check if window has expired
                if (now > data.resetTime) {
                    // Reset window
                    const entry = {
                        count: 1,
                        resetTime,
                    };
                    transaction.set(rateLimitRef, entry);
                    return { allowed: true, remaining: this.config.maxRequests - 1, resetTime };
                }
                // Check if limit exceeded
                if (data.count >= this.config.maxRequests) {
                    return { allowed: false, remaining: 0, resetTime: data.resetTime };
                }
                // Increment count
                transaction.update(rateLimitRef, {
                    count: data.count + 1,
                });
                return {
                    allowed: true,
                    remaining: this.config.maxRequests - data.count - 1,
                    resetTime: data.resetTime,
                };
            });
            return result;
        }
        catch (error) {
            logger.error("Rate limiting error:", error);
            // Allow request if rate limiting fails
            return { allowed: true, remaining: this.config.maxRequests, resetTime };
        }
    }
    /**
     * Cleans up expired rate limit entries from Firestore
     * Should be called periodically to prevent database bloat
     */
    async cleanup() {
        try {
            const now = Date.now();
            const expiredDocs = await this.db
                .collection("rateLimits")
                .where("resetTime", "<", now)
                .get();
            const batch = this.db.batch();
            expiredDocs.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            if (expiredDocs.docs.length > 0) {
                await batch.commit();
                logger.info(`Cleaned up ${expiredDocs.docs.length} expired rate limit entries`);
            }
        }
        catch (error) {
            logger.error("Rate limit cleanup error:", error);
        }
    }
}
exports.RateLimiter = RateLimiter;
/**
 * Predefined rate limit configurations for different endpoint types
 */
exports.rateLimitConfigs = {
    // Strict limits for authentication endpoints
    auth: {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
    },
    // Moderate limits for API endpoints
    api: {
        maxRequests: 100,
        windowMs: 60 * 1000, // 1 minute
    },
    // Higher limits for read operations
    read: {
        maxRequests: 500,
        windowMs: 60 * 1000, // 1 minute
    },
    // Strict limits for write operations
    write: {
        maxRequests: 50,
        windowMs: 60 * 1000, // 1 minute
    },
    // Very strict limits for admin operations
    admin: {
        maxRequests: 10,
        windowMs: 60 * 1000, // 1 minute
    },
};
/**
 * Factory function to create a rate limiter instance
 * @param type - Type of rate limiting configuration to use
 * @returns Configured RateLimiter instance
 */
function createRateLimiter(type) {
    return new RateLimiter(exports.rateLimitConfigs[type]);
}
exports.createRateLimiter = createRateLimiter;
/**
 * Express middleware factory for rate limiting
 * @param type - Type of rate limiting configuration to use
 * @returns Express middleware function
 */
function rateLimitMiddleware(type) {
    const limiter = createRateLimiter(type);
    return async (req, res, next) => {
        const context = {
            auth: req.auth,
            rawRequest: req,
        };
        const result = await limiter.checkLimit(context);
        if (!result.allowed) {
            res.status(429).json({
                success: false,
                message: "Rate limit exceeded",
                error: "TOO_MANY_REQUESTS",
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            });
            return;
        }
        // Add rate limit headers
        res.set({
            "X-RateLimit-Limit": exports.rateLimitConfigs[type].maxRequests,
            "X-RateLimit-Remaining": result.remaining,
            "X-RateLimit-Reset": result.resetTime,
        });
        next();
    };
}
exports.rateLimitMiddleware = rateLimitMiddleware;
//# sourceMappingURL=rateLimiter.js.map