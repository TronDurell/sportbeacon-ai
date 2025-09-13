/**
 * Rate Limiting for MCP Server
 * Implements token bucket algorithm with Firestore fallback
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { getFirestore } from 'firebase-admin/firestore';
import { RateLimitConfig } from './types.js';

const db = getFirestore();

// In-memory rate limiters for performance
const memoryLimiters = new Map<string, RateLimiterMemory>();

/**
 * Setup rate limiting middleware
 */
export function setupRateLimiting(app: any, config: { default: RateLimitConfig; perMethod: Record<string, RateLimitConfig> }) {
  // Global rate limiting
  app.use(createRateLimitMiddleware(config.default, 'global'));

  // Method-specific rate limiting
  app.use('/mcp', (req: Request, res: Response, next: NextFunction) => {
    const method = req.body?.method;
    if (method && config.perMethod[method]) {
      return createRateLimitMiddleware(config.perMethod[method], `method:${method}`)(req, res, next);
    }
    next();
  });
}

/**
 * Create rate limiting middleware
 */
function createRateLimitMiddleware(config: RateLimitConfig, keyPrefix: string) {
  const limiter = getOrCreateLimiter(config, keyPrefix);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = generateRateLimitKey(req, keyPrefix);
      const result = await limiter.consume(key);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remainingPoints?.toString() || '0',
        'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext).toISOString()
      });

      next();
    } catch (rateLimitError: any) {
      // Rate limit exceeded
      const secs = Math.round(rateLimitError.msBeforeNext / 1000) || 1;
      
      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + rateLimitError.msBeforeNext).toISOString(),
        'Retry-After': secs.toString()
      });

      res.status(429).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: `Rate limit exceeded. Try again in ${secs} seconds.`
        },
        id: req.body?.id || null
      });
    }
  };
}

/**
 * Get or create rate limiter instance
 */
function getOrCreateLimiter(config: RateLimitConfig, keyPrefix: string): RateLimiterMemory {
  const cacheKey = `${keyPrefix}:${config.windowMs}:${config.maxRequests}`;
  
  if (!memoryLimiters.has(cacheKey)) {
    const limiter = new RateLimiterMemory({
      keyPrefix,
      points: config.maxRequests,
      duration: Math.floor(config.windowMs / 1000), // Convert to seconds
      blockDuration: Math.floor(config.windowMs / 1000), // Block for same duration
      execEvenly: true, // Distribute requests evenly across window
    });
    
    memoryLimiters.set(cacheKey, limiter);
  }
  
  return memoryLimiters.get(cacheKey)!;
}

/**
 * Generate rate limit key based on request
 */
function generateRateLimitKey(req: Request, keyPrefix: string): string {
  const auth = (req as any).auth;
  
  if (auth) {
    // Use authenticated user ID
    return `${keyPrefix}:${auth.uid}`;
  } else {
    // Fallback to IP address
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `${keyPrefix}:ip:${ip}`;
  }
}

/**
 * Firestore-based rate limiting for distributed systems
 */
export class FirestoreRateLimiter {
  private collection = 'rate_limits';
  
  async consume(key: string, points: number = 1, windowMs: number = 60000): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      const docRef = db.collection(this.collection).doc(key);
      
      return await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        
        if (!doc.exists) {
          // First request in window
          transaction.set(docRef, {
            count: points,
            windowStart: now,
            lastRequest: now
          });
          return true;
        }
        
        const data = doc.data()!;
        
        if (data.windowStart < windowStart) {
          // New window, reset counter
          transaction.update(docRef, {
            count: points,
            windowStart: now,
            lastRequest: now
          });
          return true;
        }
        
        if (data.count + points > 100) { // Max 100 requests per window
          return false;
        }
        
        // Increment counter
        transaction.update(docRef, {
          count: data.count + points,
          lastRequest: now
        });
        
        return true;
      });
    } catch (error) {
      console.error('Firestore rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      return true;
    }
  }
  
  async getRemaining(key: string, windowMs: number = 60000): Promise<number> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      const doc = await db.collection(this.collection).doc(key).get();
      
      if (!doc.exists) {
        return 100; // Max requests
      }
      
      const data = doc.data()!;
      
      if (data.windowStart < windowStart) {
        return 100; // New window
      }
      
      return Math.max(0, 100 - data.count);
    } catch (error) {
      console.error('Error getting remaining rate limit:', error);
      return 100; // Fail open
    }
  }
  
  async reset(key: string): Promise<void> {
    try {
      await db.collection(this.collection).doc(key).delete();
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }
}

/**
 * Cleanup old rate limit entries
 */
export async function cleanupRateLimits(): Promise<void> {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  try {
    const snapshot = await db.collection('rate_limits')
      .where('lastRequest', '<', oneHourAgo)
      .limit(100)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${snapshot.docs.length} old rate limit entries`);
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
  }
}
