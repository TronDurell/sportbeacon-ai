import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/init';
import { useAuth } from '../hooks/useAuth';
import { SecurityValidator, SECURITY_EVENTS } from '../firebase/security.config';

/**
 * Security service for frontend security monitoring and reporting
 */
export class SecurityService {
  private static readonly MAX_LOG_ENTRIES = 1000;
  private static readonly SECURITY_LOG_COLLECTION = 'securityLogs';
  private static readonly RATE_LIMIT_COLLECTION = 'rateLimits';
  private static readonly MODERATION_REPORTS_COLLECTION = 'moderationReports';

  /**
   * Report security event
   */
  static async reportSecurityEvent(
    event: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    try {
      const eventData = {
        event,
        details: this.sanitizeDetails(details),
        severity,
        timestamp: serverTimestamp(),
        userId: 'frontend', // Will be updated by backend
        source: 'frontend',
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      };

      await addDoc(collection(db, this.SECURITY_LOG_COLLECTION), eventData);
    } catch (error) {
      console.error('Failed to report security event:', error);
    }
  }

  /**
   * Report suspicious activity
   */
  static async reportSuspiciousActivity(
    activity: string,
    details: any
  ): Promise<void> {
    await this.reportSecurityEvent(
      SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
      { activity, ...details },
      'medium'
    );
  }

  /**
   * Report invalid input attempt
   */
  static async reportInvalidInput(
    field: string,
    value: any,
    expectedType: string
  ): Promise<void> {
    await this.reportSecurityEvent(
      SECURITY_EVENTS.INVALID_INPUT,
      {
        field,
        value: this.sanitizeValue(value),
        expectedType,
        timestamp: new Date().toISOString()
      },
      'low'
    );
  }

  /**
   * Report rate limit exceeded
   */
  static async reportRateLimitExceeded(
    operation: string,
    limit: number,
    window: string
  ): Promise<void> {
    await this.reportSecurityEvent(
      SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
      {
        operation,
        limit,
        window,
        timestamp: new Date().toISOString()
      },
      'medium'
    );
  }

  /**
   * Report content for moderation
   */
  static async reportContent(
    contentType: 'post' | 'comment' | 'message' | 'profile' | 'file',
    contentId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    try {
      const reportData = {
        contentType,
        contentId,
        reason,
        description: description || '',
        status: 'pending',
        timestamp: serverTimestamp(),
        reporterId: 'anonymous', // Will be updated by backend
        reviewedBy: null,
        reviewedAt: null,
        action: null
      };

      await addDoc(collection(db, this.MODERATION_REPORTS_COLLECTION), reportData);
    } catch (error) {
      console.error('Failed to report content:', error);
    }
  }

  /**
   * Get security logs for user (admin only)
   */
  static async getSecurityLogs(
    userId?: string,
    limitCount: number = 100
  ): Promise<any[]> {
    try {
      let logsQuery = query(
        collection(db, this.SECURITY_LOG_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(Math.min(limitCount, this.MAX_LOG_ENTRIES))
      );

      if (userId) {
        logsQuery = query(
          collection(db, this.SECURITY_LOG_COLLECTION),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(Math.min(limitCount, this.MAX_LOG_ENTRIES))
        );
      }

      const logsSnapshot = await getDocs(logsQuery);
      return logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Failed to get security logs:', error);
      return [];
    }
  }

  /**
   * Get rate limit status for user
   */
  static async getRateLimitStatus(userId: string): Promise<any> {
    try {
      const rateLimitDoc = await getDocs(
        query(
          collection(db, this.RATE_LIMIT_COLLECTION),
          where('userId', '==', userId)
        )
      );

      if (rateLimitDoc.empty) {
        return { status: 'normal', limits: {} };
      }

      const data = rateLimitDoc.docs[0].data();
      return {
        status: this.calculateRateLimitStatus(data),
        limits: data
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return { status: 'unknown', limits: {} };
    }
  }

  /**
   * Monitor security events in real-time
   */
  static monitorSecurityEvents(
    callback: (events: any[]) => void,
    userId?: string
  ): () => void {
    let eventsQuery = query(
      collection(db, this.SECURITY_LOG_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    if (userId) {
      eventsQuery = query(
        collection(db, this.SECURITY_LOG_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(events);
    }, (error) => {
      console.error('Error monitoring security events:', error);
    });

    return unsubscribe;
  }

  /**
   * Validate and sanitize user input
   */
  static validateUserInput(
    input: string,
    type: 'email' | 'username' | 'displayName' | 'bio' | 'message'
  ): { isValid: boolean; error?: string; sanitized?: string } {
    const validation = SecurityValidator.validateUserInput(input, type);
    
    if (!validation.isValid) {
      this.reportInvalidInput(type, input, 'validated');
      return validation;
    }

    const sanitized = SecurityValidator.sanitizeInput(input);
    return {
      isValid: true,
      sanitized
    };
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(
    file: File,
    fileType: keyof typeof import('../firebase/security.config').FILE_LIMITS
  ): { isValid: boolean; error?: string } {
    const validation = SecurityValidator.validateFileUpload(file, fileType);
    
    if (!validation.isValid) {
      this.reportInvalidInput('file', {
        name: file.name,
        size: file.size,
        type: file.type
      }, 'validated');
    }

    return validation;
  }

  /**
   * Check if user is rate limited
   */
  static async checkRateLimit(
    operation: string,
    userId: string
  ): Promise<{ isLimited: boolean; retryAfter?: number }> {
    try {
      const status = await this.getRateLimitStatus(userId);
      
      if (status.status === 'limited') {
        this.reportRateLimitExceeded(operation, 0, 'unknown');
        return { isLimited: true, retryAfter: 60 }; // 1 minute default
      }

      return { isLimited: false };
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return { isLimited: false };
    }
  }

  /**
   * Get security statistics
   */
  static async getSecurityStats(userId?: string): Promise<any> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [dailyEvents, weeklyEvents, totalEvents] = await Promise.all([
        this.getSecurityLogs(userId, 1000).then(logs => 
          logs.filter(log => new Date(log.timestamp?.toDate?.() || log.timestamp) > oneDayAgo)
        ),
        this.getSecurityLogs(userId, 1000).then(logs => 
          logs.filter(log => new Date(log.timestamp?.toDate?.() || log.timestamp) > oneWeekAgo)
        ),
        this.getSecurityLogs(userId, 1000)
      ]);

      return {
        daily: {
          total: dailyEvents.length,
          suspicious: dailyEvents.filter(e => e.event === SECURITY_EVENTS.SUSPICIOUS_ACTIVITY).length,
          invalidInput: dailyEvents.filter(e => e.event === SECURITY_EVENTS.INVALID_INPUT).length,
          rateLimit: dailyEvents.filter(e => e.event === SECURITY_EVENTS.RATE_LIMIT_EXCEEDED).length
        },
        weekly: {
          total: weeklyEvents.length,
          suspicious: weeklyEvents.filter(e => e.event === SECURITY_EVENTS.SUSPICIOUS_ACTIVITY).length,
          invalidInput: weeklyEvents.filter(e => e.event === SECURITY_EVENTS.INVALID_INPUT).length,
          rateLimit: weeklyEvents.filter(e => e.event === SECURITY_EVENTS.RATE_LIMIT_EXCEEDED).length
        },
        total: totalEvents.length
      };
    } catch (error) {
      console.error('Failed to get security stats:', error);
      return { daily: {}, weekly: {}, total: 0 };
    }
  }

  /**
   * Sanitize details for logging
   */
  private static sanitizeDetails(details: any): any {
    if (!details) return details;

    const sanitized = { ...details };

    // Remove sensitive information
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard', 'cvv'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Limit string lengths
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.substring(0, 500) + '...';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize value for logging
   */
  private static sanitizeValue(value: any): any {
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return value;
  }

  /**
   * Calculate rate limit status
   */
  private static calculateRateLimitStatus(data: any): 'normal' | 'warning' | 'limited' {
    const thresholds = {
      warning: 0.8, // 80% of limit
      limited: 1.0  // 100% of limit
    };

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'number' && key.includes('_limit')) {
        const limit = value;
        const current = data[key.replace('_limit', '_count')] || 0;
        const ratio = current / limit;

        if (ratio >= thresholds.limited) return 'limited';
        if (ratio >= thresholds.warning) return 'warning';
      }
    }

    return 'normal';
  }
}

export default SecurityService; 