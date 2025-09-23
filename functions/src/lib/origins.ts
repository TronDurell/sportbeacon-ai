/**
 * CORS Origins Configuration
 * 
 * Validates and provides allowed origins for CORS configuration.
 * Supports environment override via CORS_ORIGINS (comma-separated).
 */

const DEFAULT_ORIGINS = [
  'https://sportbeacon-ai.web.app',
  'https://sportbeaconai.web.app'
];

/**
 * Parse CORS_ORIGINS environment variable
 * Format: comma-separated list of origins
 * Example: "https://preview-123.web.app,https://staging.web.app"
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.CORS_ORIGINS;
  
  if (!envOrigins) {
    return DEFAULT_ORIGINS;
  }
  
  // Parse comma-separated origins and validate
  const origins = envOrigins
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => {
      // Basic validation - must be valid URL
      try {
        new URL(origin);
        return true;
      } catch {
        console.warn(`Invalid CORS origin: ${origin}`);
        return false;
      }
    });
  
  // Always include default origins
  const allOrigins = [...new Set([...DEFAULT_ORIGINS, ...origins])];
  
  console.log(`CORS origins configured: ${allOrigins.join(', ')}`);
  return allOrigins;
}

/**
 * Validate if an origin is allowed
 */
export function isOriginAllowed(origin: string): boolean {
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Get CORS configuration for express
 */
export function getCorsConfig() {
  const origins = getAllowedOrigins();
  
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  };
}
