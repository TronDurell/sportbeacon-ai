/**
 * SportBeaconAI MCP Server Configuration
 * Environment variable parsing and validation with proper type coercion
 */

import { z } from 'zod';

// JSON-RPC ID type for proper typing
export type JsonRpcId = string | number | null;

// Configuration schema with proper type coercion
const ConfigSchema = z.object({
  port: z.coerce.number().default(3101),
  heartbeatMs: z.coerce.number().default(30000),
  maxTokens: z.coerce.number().default(8192),
  firebaseProjectId: z.string().default('sportbeaconai-test'),
  firebaseServiceAccountKey: z.string().optional(),
  allowedOrigins: z.string().transform(val => val.split(',')).default('http://localhost:3000,https://sportbeacon-ai.web.app'),
  requireAuth: z.coerce.boolean().default(true),
  rateLimitWindowMs: z.coerce.number().default(60000),
  rateLimitMaxRequests: z.coerce.number().default(60),
  rateLimitPerMethod: z.record(z.object({
    windowMs: z.coerce.number(),
    maxRequests: z.coerce.number()
  })).default({
    'getPlayerStats': { windowMs: 60000, maxRequests: 100 },
    'verifyStat': { windowMs: 60000, maxRequests: 30 },
    'exportDataset': { windowMs: 60000, maxRequests: 10 }
  })
});

// Parse and validate configuration
export const cfg = ConfigSchema.parse({
  port: process.env.PORT,
  heartbeatMs: process.env.HEARTBEAT_MS,
  maxTokens: process.env.MAX_TOKENS,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  allowedOrigins: process.env.ALLOWED_ORIGINS,
  requireAuth: process.env.REQUIRE_AUTH,
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
  rateLimitPerMethod: process.env.RATE_LIMIT_PER_METHOD ? JSON.parse(process.env.RATE_LIMIT_PER_METHOD) : undefined
});

// Export individual config values for convenience
export const {
  port,
  heartbeatMs,
  maxTokens,
  firebaseProjectId,
  firebaseServiceAccountKey,
  allowedOrigins,
  requireAuth,
  rateLimitWindowMs,
  rateLimitMaxRequests,
  rateLimitPerMethod
} = cfg;
