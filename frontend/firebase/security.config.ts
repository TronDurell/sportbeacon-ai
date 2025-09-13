import type { Timestamp } from 'firebase/firestore';

/**
 * Security configuration for SportBeaconAI
 * Centralized security constants and validation rules
 */

// File upload limits and restrictions
export const FILE_LIMITS = {
  // Video files
  VIDEO: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_TYPES: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    MAX_DURATION: 30 * 60, // 30 minutes in seconds
  },
  // Image files
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    MAX_DIMENSIONS: { width: 4096, height: 4096 },
  },
  // Document files
  DOCUMENT: {
    MAX_SIZE: 25 * 1024 * 1024, // 25MB
    ALLOWED_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
  },
  // Audio files
  AUDIO: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  }
} as const;

// Payment and transaction limits
export const PAYMENT_LIMITS = {
  MINIMUM_TIP: 50, // $0.50 in cents
  MAXIMUM_TIP: 1000000, // $10,000 in cents
  MINIMUM_PAYOUT: 1000, // $10.00 in cents
  MAXIMUM_PAYOUT: 5000000, // $50,000 in cents
  DAILY_TIP_LIMIT: 10000, // $100 per day
  DAILY_TIP_COUNT: 50, // Maximum tips per day
  SUPPORTED_CURRENCIES: ['usd', 'cad', 'eur', 'gbp'] as const,
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
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
} as const;

// User roles and permissions
export const USER_ROLES = {
  USER: 'user',
  CREATOR: 'creator',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  VERIFIED: 'verified',
} as const;

export const USER_PERMISSIONS = {
  // Basic user permissions
  USER: [
    'read_own_profile',
    'update_own_profile',
    'create_tips',
    'read_public_content',
    'upload_own_files',
  ],
  // Creator permissions
  CREATOR: [
    'read_own_profile',
    'update_own_profile',
    'create_tips',
    'read_public_content',
    'upload_own_files',
    'receive_tips',
    'view_earnings',
    'request_payouts',
    'manage_creator_profile',
  ],
  // Admin permissions
  ADMIN: [
    'read_all_profiles',
    'update_all_profiles',
    'delete_profiles',
    'manage_users',
    'view_analytics',
    'manage_content',
    'process_payouts',
    'view_audit_logs',
    'manage_system_settings',
  ],
  // Moderator permissions
  MODERATOR: [
    'read_all_profiles',
    'update_profiles',
    'manage_content',
    'view_reports',
    'moderate_comments',
    'view_analytics',
  ],
} as const;

// Content moderation rules
export const CONTENT_MODERATION = {
  PROFANITY_FILTER: true,
  SPAM_DETECTION: true,
  IMAGE_MODERATION: true,
  VIDEO_MODERATION: true,
  AUTO_FLAG_THRESHOLD: 0.8, // Confidence threshold for auto-flagging
  MANUAL_REVIEW_THRESHOLD: 0.6, // Confidence threshold for manual review
  MAX_REPORTS_BEFORE_REVIEW: 3,
  MAX_REPORTS_BEFORE_SUSPENSION: 10,
} as const;

// Data retention policies
export const DATA_RETENTION = {
  USER_LOGS: 90 * 24 * 60 * 60 * 1000, // 90 days
  AUDIT_LOGS: 365 * 24 * 60 * 60 * 1000, // 1 year
  PAYMENT_LOGS: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years (tax compliance)
  DELETED_CONTENT: 30 * 24 * 60 * 60 * 1000, // 30 days
  BACKUP_RETENTION: 365 * 24 * 60 * 60 * 1000, // 1 year
} as const;

// Security validation functions
export class SecurityValidator {
  /**
   * Validate file upload
   */
  static validateFileUpload(
    file: File,
    fileType: keyof typeof FILE_LIMITS
  ): { isValid: boolean; error?: string } {
    const limits = FILE_LIMITS[fileType];
    
    // Check file size
    if (file.size > limits.MAX_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${(limits.MAX_SIZE / (1024 * 1024)).toFixed(1)}MB`
      };
    }
    
    // Check file type
    if (!limits.ALLOWED_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${limits.ALLOWED_TYPES.join(', ')}`
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validate payment amount
   */
  static validatePaymentAmount(
    amount: number,
    type: 'tip' | 'payout'
  ): { isValid: boolean; error?: string } {
    const limits = type === 'tip' ? {
      min: PAYMENT_LIMITS.MINIMUM_TIP,
      max: PAYMENT_LIMITS.MAXIMUM_TIP
    } : {
      min: PAYMENT_LIMITS.MINIMUM_PAYOUT,
      max: PAYMENT_LIMITS.MAXIMUM_PAYOUT
    };
    
    if (amount < limits.min) {
      return {
        isValid: false,
        error: `Amount must be at least $${(limits.min / 100).toFixed(2)}`
      };
    }
    
    if (amount > limits.max) {
      return {
        isValid: false,
        error: `Amount cannot exceed $${(limits.max / 100).toFixed(2)}`
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validate currency
   */
  static validateCurrency(currency: string): { isValid: boolean; error?: string } {
    if (!PAYMENT_LIMITS.SUPPORTED_CURRENCIES.includes(currency.toLowerCase() as any)) {
      return {
        isValid: false,
        error: `Currency ${currency} is not supported. Supported currencies: ${PAYMENT_LIMITS.SUPPORTED_CURRENCIES.join(', ')}`
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validate user input
   */
  static validateUserInput(
    input: string,
    type: 'email' | 'username' | 'displayName' | 'bio' | 'message'
  ): { isValid: boolean; error?: string } {
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      username: /^[a-zA-Z0-9_]{3,20}$/,
      displayName: /^[a-zA-Z0-9\s]{1,50}$/,
      bio: /^[\s\S]{0,500}$/,
      message: /^[\s\S]{0,1000}$/
    };
    
    const limits = {
      email: 254,
      username: 20,
      displayName: 50,
      bio: 500,
      message: 1000
    };
    
    if (input.length > limits[type]) {
      return {
        isValid: false,
        error: `${type} cannot exceed ${limits[type]} characters`
      };
    }
    
    if (patterns[type] && !patterns[type].test(input)) {
      return {
        isValid: false,
        error: `${type} format is invalid`
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validate timestamp
   */
  static validateTimestamp(timestamp: Timestamp): { isValid: boolean; error?: string } {
    const now = new Date();
    const timestampDate = timestamp.toDate();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    if (timestampDate < oneYearAgo || timestampDate > oneYearFromNow) {
      return {
        isValid: false,
        error: 'Timestamp is outside valid range'
      };
    }
    
    return { isValid: true };
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  /**
   * Check if user has permission
   */
  static hasPermission(
    userRoles: string[],
    requiredPermission: string
  ): boolean {
    const allPermissions = userRoles.flatMap(role => 
      (USER_PERMISSIONS as any)[role] || []
    );
    
    return allPermissions.includes(requiredPermission as any);
  }

  /**
   * Validate rate limiting
   */
  static validateRateLimit(
    currentCount: number,
    limit: number,
    timeWindow: 'minute' | 'hour' | 'day'
  ): { isValid: boolean; error?: string } {
    const limits = {
      minute: RATE_LIMITS.API.REQUESTS_PER_MINUTE,
      hour: RATE_LIMITS.API.REQUESTS_PER_HOUR,
      day: RATE_LIMITS.API.REQUESTS_PER_DAY
    };
    
    if (currentCount >= limits[timeWindow]) {
      return {
        isValid: false,
        error: `Rate limit exceeded for ${timeWindow}. Limit: ${limits[timeWindow]} requests`
      };
    }
    
    return { isValid: true };
  }
}

// Security event types
export const SECURITY_EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
  
  // Authorization events
  PERMISSION_DENIED: 'permission_denied',
  ROLE_CHANGE: 'role_change',
  ACCESS_ATTEMPT: 'access_attempt',
  
  // Data events
  DATA_CREATE: 'data_create',
  DATA_UPDATE: 'data_update',
  DATA_DELETE: 'data_delete',
  DATA_ACCESS: 'data_access',
  
  // Payment events
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILURE: 'payment_failure',
  PAYOUT_REQUEST: 'payout_request',
  PAYOUT_PROCESSED: 'payout_processed',
  
  // Security events
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_INPUT: 'invalid_input',
  FILE_UPLOAD_ATTEMPT: 'file_upload_attempt',
  
  // System events
  SYSTEM_ERROR: 'system_error',
  CONFIGURATION_CHANGE: 'configuration_change',
  BACKUP_CREATED: 'backup_created',
  MAINTENANCE_MODE: 'maintenance_mode',
} as const;

// Export all security configurations as types only 