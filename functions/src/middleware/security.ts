import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db } from "../index";

/**
 * Security middleware for Firebase Functions
 * Provides rate limiting, input validation, and audit logging
 */

// Rate limiting configuration
const RATE_LIMITS = {
  API: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 1000,
    REQUESTS_PER_DAY: 10000,
  },
  AUTH: {
    LOGIN_ATTEMPTS_PER_HOUR: 5,
    PASSWORD_RESET_PER_HOUR: 3,
    EMAIL_VERIFICATION_PER_HOUR: 5,
  },
  UPLOAD: {
    FILES_PER_HOUR: 20,
    TOTAL_SIZE_PER_HOUR: 500 * 1024 * 1024, // 500MB
  },
  PAYMENT: {
    TIPS_PER_HOUR: 10,
    PAYOUT_REQUESTS_PER_DAY: 5,
  }
};

// Security event types
const SECURITY_EVENTS = {
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  INVALID_INPUT: "invalid_input",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  PERMISSION_DENIED: "permission_denied",
  API_ACCESS: "api_access",
  ERROR_OCCURRED: "error_occurred",
} as const;

/**
 * Rate limiting middleware
 */
export const rateLimit = (operation: string, limit: number, window: "minute" | "hour" | "day") => {
  return async (data: any, context: any) => {
    const userId = context.auth?.uid;
    if (!userId) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const now = admin.firestore.Timestamp.now();
    const windowStart = getWindowStart(now, window);
    
    // Check rate limit
    const rateLimitDoc = await db.collection("rateLimits").doc(userId).get();
    const rateLimitData = rateLimitDoc.exists ? rateLimitDoc.data() : {};
    
    const key = `${operation}_${window}`;
    const currentCount = rateLimitData?.[key] || 0;
    const lastReset = rateLimitData?.[`${key}_reset`] || windowStart;
    
    // Reset counter if window has passed
    if (lastReset < windowStart) {
      await db.collection("rateLimits").doc(userId).update({
        [key]: 1,
        [`${key}_reset`]: now
      });
    } else if (currentCount >= limit) {
      // Rate limit exceeded
      await logSecurityEvent({
        userId,
        event: SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
        details: {
          operation,
          limit,
          window,
          currentCount
        }
      });
      
      throw new functions.https.HttpsError(
        "resource-exhausted",
        `Rate limit exceeded for ${operation}. Limit: ${limit} requests per ${window}`
      );
    } else {
      // Increment counter
      await db.collection("rateLimits").doc(userId).update({
        [key]: currentCount + 1
      });
    }
  };
};

/**
 * Input validation middleware
 */
export const validateInput = (schema: Record<string, any>) => {
  return (data: any, context: any) => {
    const errors: string[] = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value !== undefined && value !== null) {
        // Type validation
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
        }
        
        // String validation
        if (rules.type === "string") {
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`${field} must be at least ${rules.minLength} characters`);
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`${field} must be no more than ${rules.maxLength} characters`);
          }
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(`${field} format is invalid`);
          }
        }
        
        // Number validation
        if (rules.type === "number") {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`${field} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push(`${field} must be no more than ${rules.max}`);
          }
        }
        
        // Array validation
        if (rules.type === "array") {
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`${field} must have at least ${rules.minLength} items`);
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`${field} must have no more than ${rules.maxLength} items`);
          }
        }
        
        // Custom validation
        if (rules.validate) {
          const customError = rules.validate(value, data);
          if (customError) {
            errors.push(customError);
          }
        }
      }
    }
    
    if (errors.length > 0) {
      logSecurityEvent({
        userId: context.auth?.uid || "unknown",
        event: SECURITY_EVENTS.INVALID_INPUT,
        details: {
          errors,
          data: sanitizeData(data)
        }
      });
      
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Input validation failed: ${errors.join(", ")}`
      );
    }
  };
};

/**
 * Permission checking middleware
 */
export const requirePermission = (permission: string) => {
  return (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    
    const userToken = context.auth.token;
    const hasPermission = checkUserPermission(userToken, permission);
    
    if (!hasPermission) {
      logSecurityEvent({
        userId: context.auth.uid,
        event: SECURITY_EVENTS.PERMISSION_DENIED,
        details: {
          requiredPermission: permission,
          userToken: sanitizeToken(userToken)
        }
      });
      
      throw new functions.https.HttpsError(
        "permission-denied",
        `Insufficient permissions. Required: ${permission}`
      );
    }
  };
};

/**
 * Role checking middleware
 */
export const requireRole = (role: string) => {
  return (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    
    const userToken = context.auth.token;
    const hasRole = userToken[role] === true || userToken.admin === true;
    
    if (!hasRole) {
      logSecurityEvent({
        userId: context.auth.uid,
        event: SECURITY_EVENTS.PERMISSION_DENIED,
        details: {
          requiredRole: role,
          userToken: sanitizeToken(userToken)
        }
      });
      
      throw new functions.https.HttpsError(
        "permission-denied",
        `Insufficient role. Required: ${role}`
      );
    }
  };
};

/**
 * Audit logging middleware
 */
export const auditLog = (operation: string) => {
  return async (data: any, context: any) => {
    const userId = context.auth?.uid || "unknown";
    
    await logSecurityEvent({
      userId,
      event: SECURITY_EVENTS.API_ACCESS,
      details: {
        operation,
        data: sanitizeData(data),
        timestamp: admin.firestore.Timestamp.now()
      }
    });
  };
};

/**
 * Error handling middleware
 */
export const errorHandler = (error: any, context: any) => {
  const userId = context.auth?.uid || "unknown";
  
  logSecurityEvent({
    userId,
    event: SECURITY_EVENTS.ERROR_OCCURRED,
    details: {
      error: error.message || "Unknown error",
      code: error.code || "unknown",
      stack: error.stack ? error.stack.substring(0, 500) : undefined
    }
  });
  
  // Don't expose internal errors to clients
  if (error.code === "internal") {
    throw new functions.https.HttpsError("internal", "An internal error occurred");
  }
  
  throw error;
};

/**
 * Suspicious activity detection
 */
export const detectSuspiciousActivity = (data: any, context: any) => {
  const userId = context.auth?.uid;
  if (!userId) return;
  
  const suspiciousPatterns = [
    // Rapid requests
    { pattern: "rapid_requests", check: () => checkRapidRequests(userId) },
    // Unusual payment amounts
    { pattern: "unusual_payment", check: () => checkUnusualPayment(data) },
    // Multiple failed attempts
    { pattern: "failed_attempts", check: () => checkFailedAttempts(userId) },
    // Geographic anomalies
    { pattern: "geographic_anomaly", check: () => checkGeographicAnomaly(context) }
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.check()) {
      logSecurityEvent({
        userId,
        event: SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
        details: {
          pattern: pattern.pattern,
          data: sanitizeData(data)
        }
      });
      
      // For high-risk patterns, block the request
      if (pattern.pattern === "rapid_requests" || pattern.pattern === "failed_attempts") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Suspicious activity detected. Please try again later."
        );
      }
    }
  }
};

// Helper functions

function getWindowStart(now: admin.firestore.Timestamp, window: "minute" | "hour" | "day"): admin.firestore.Timestamp {
  const date = now.toDate();
  const windowSizes = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000
  };
  
  const windowSize = windowSizes[window];
  const windowStart = new Date(Math.floor(date.getTime() / windowSize) * windowSize);
  
  return admin.firestore.Timestamp.fromDate(windowStart);
}

function checkUserPermission(token: any, permission: string): boolean {
  const permissions = {
    admin: ["read_all_profiles", "update_all_profiles", "delete_profiles", "manage_users", "view_analytics", "manage_content", "process_payouts", "view_audit_logs", "manage_system_settings"],
    moderator: ["read_all_profiles", "update_profiles", "manage_content", "view_reports", "moderate_comments", "view_analytics"],
    creator: ["read_own_profile", "update_own_profile", "create_tips", "read_public_content", "upload_own_files", "receive_tips", "view_earnings", "request_payouts", "manage_creator_profile"],
    user: ["read_own_profile", "update_own_profile", "create_tips", "read_public_content", "upload_own_files"]
  };
  
  if (token.admin) return true;
  if (token.moderator && permissions.moderator.includes(permission)) return true;
  if (token.creator && permissions.creator.includes(permission)) return true;
  if (permissions.user.includes(permission)) return true;
  
  return false;
}

async function checkRapidRequests(userId: string): Promise<boolean> {
  const now = admin.firestore.Timestamp.now();
  const oneMinuteAgo = admin.firestore.Timestamp.fromDate(new Date(now.toDate().getTime() - 60 * 1000));
  
  const recentRequests = await db.collection("securityLogs")
    .where("userId", "==", userId)
    .where("event", "==", SECURITY_EVENTS.API_ACCESS)
    .where("timestamp", ">", oneMinuteAgo)
    .get();
  
  return recentRequests.size > 30; // More than 30 requests per minute
}

function checkUnusualPayment(data: any): boolean {
  if (data.amount && typeof data.amount === "number") {
    // Check for unusually large payments
    if (data.amount > 1000000) return true; // $10,000+
    
    // Check for round numbers that might be test payments
    if (data.amount % 1000 === 0 && data.amount > 10000) return true;
  }
  
  return false;
}

async function checkFailedAttempts(userId: string): Promise<boolean> {
  const now = admin.firestore.Timestamp.now();
  const oneHourAgo = admin.firestore.Timestamp.fromDate(new Date(now.toDate().getTime() - 60 * 60 * 1000));
  
  const failedAttempts = await db.collection("securityLogs")
    .where("userId", "==", userId)
    .where("event", "in", [SECURITY_EVENTS.ERROR_OCCURRED, SECURITY_EVENTS.PERMISSION_DENIED])
    .where("timestamp", ">", oneHourAgo)
    .get();
  
  return failedAttempts.size > 10; // More than 10 failed attempts per hour
}

function checkGeographicAnomaly(context: any): boolean {
  // This would typically check against user's known locations
  // For now, return false as we don't have location data
  return false;
}

async function logSecurityEvent(event: {
  userId: string;
  event: string;
  details: any;
}) {
  try {
    await db.collection("securityLogs").add({
      ...event,
      timestamp: admin.firestore.Timestamp.now(),
      ipAddress: "unknown", // Would be extracted from request
      userAgent: "unknown" // Would be extracted from request
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

function sanitizeData(data: any): any {
  if (!data) return data;
  
  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = ["password", "token", "secret", "key", "ssn", "creditCard"];
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  }
  
  return sanitized;
}

function sanitizeToken(token: any): any {
  if (!token) return token;
  
  return {
    uid: token.uid,
    email: token.email,
    email_verified: token.email_verified,
    admin: token.admin,
    moderator: token.moderator,
    creator: token.creator,
    verified: token.verified
  };
}

// Export middleware functions
export {
  RATE_LIMITS,
  SECURITY_EVENTS
}; 