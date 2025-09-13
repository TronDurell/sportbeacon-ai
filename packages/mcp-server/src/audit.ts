/**
 * Audit Logging for MCP Server
 * Logs all agent and tool interactions for security and monitoring
 */

import { getFirestore } from 'firebase-admin/firestore';
import { AuditEvent } from './types.js';
import crypto from 'crypto';

const db = getFirestore();

/**
 * Audit logger class
 */
export class AuditLogger {
  private collection = 'agent_audit';
  
  /**
   * Log an audit event
   */
  async log(event: AuditEvent): Promise<void> {
    try {
      // Sanitize sensitive data
      const sanitizedEvent = this.sanitizeEvent(event);
      
      // Add hash for integrity
      const eventHash = this.generateEventHash(sanitizedEvent);
      
      const auditDoc = {
        ...sanitizedEvent,
        eventHash,
        createdAt: new Date()
      };
      
      // Store in Firestore
      await db.collection(this.collection).add(auditDoc);
      
      // Also log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Audit Event:', {
          method: event.method,
          uid: event.uid,
          role: event.role,
          duration: event.duration,
          success: event.success
        });
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit failures shouldn't break the API
    }
  }
  
  /**
   * Get audit events for a user
   */
  async getUserAuditEvents(uid: string, limit: number = 100): Promise<AuditEvent[]> {
    try {
      const snapshot = await db.collection(this.collection)
        .where('uid', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          timestamp: data.timestamp,
          uid: data.uid,
          role: data.role,
          method: data.method,
          argsHash: data.argsHash,
          resultSummary: data.resultSummary,
          duration: data.duration,
          success: data.success
        };
      });
    } catch (error) {
      console.error('Failed to get user audit events:', error);
      return [];
    }
  }
  
  /**
   * Get audit events for a method
   */
  async getMethodAuditEvents(method: string, limit: number = 100): Promise<AuditEvent[]> {
    try {
      const snapshot = await db.collection(this.collection)
        .where('method', '==', method)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          timestamp: data.timestamp,
          uid: data.uid,
          role: data.role,
          method: data.method,
          argsHash: data.argsHash,
          resultSummary: data.resultSummary,
          duration: data.duration,
          success: data.success
        };
      });
    } catch (error) {
      console.error('Failed to get method audit events:', error);
      return [];
    }
  }
  
  /**
   * Get audit statistics
   */
  async getAuditStats(timeRange: { from: Date; to: Date }): Promise<{
    totalEvents: number;
    successRate: number;
    averageDuration: number;
    topMethods: Array<{ method: string; count: number }>;
    topUsers: Array<{ uid: string; count: number }>;
  }> {
    try {
      const snapshot = await db.collection(this.collection)
        .where('timestamp', '>=', timeRange.from.toISOString())
        .where('timestamp', '<=', timeRange.to.toISOString())
        .get();
      
      const events = snapshot.docs.map(doc => doc.data());
      
      const totalEvents = events.length;
      const successfulEvents = events.filter(e => e.success).length;
      const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;
      
      const totalDuration = events.reduce((sum, e) => sum + (e.duration || 0), 0);
      const averageDuration = totalEvents > 0 ? totalDuration / totalEvents : 0;
      
      // Count methods
      const methodCounts = events.reduce((acc, e) => {
        acc[e.method] = (acc[e.method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topMethods = Object.entries(methodCounts)
        .map(([method, count]) => ({ method, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Count users
      const userCounts = events.reduce((acc, e) => {
        acc[e.uid] = (acc[e.uid] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topUsers = Object.entries(userCounts)
        .map(([uid, count]) => ({ uid, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      return {
        totalEvents,
        successRate,
        averageDuration,
        topMethods,
        topUsers
      };
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      return {
        totalEvents: 0,
        successRate: 0,
        averageDuration: 0,
        topMethods: [],
        topUsers: []
      };
    }
  }
  
  /**
   * Sanitize audit event to remove sensitive data
   */
  private sanitizeEvent(event: AuditEvent): AuditEvent {
    // Remove or hash sensitive information
    const sanitized = { ...event };
    
    // Hash the argsHash to prevent data leakage
    if (sanitized.argsHash) {
      sanitized.argsHash = crypto.createHash('sha256')
        .update(sanitized.argsHash)
        .digest('hex')
        .substring(0, 16);
    }
    
    // Truncate result summary if too long
    if (sanitized.resultSummary && sanitized.resultSummary.length > 200) {
      sanitized.resultSummary = sanitized.resultSummary.substring(0, 200) + '...';
    }
    
    return sanitized;
  }
  
  /**
   * Generate hash for event integrity
   */
  private generateEventHash(event: AuditEvent): string {
    const hashInput = `${event.timestamp}:${event.uid}:${event.method}:${event.argsHash}:${event.resultSummary}`;
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }
  
  /**
   * Cleanup old audit events
   */
  async cleanupOldEvents(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    try {
      const snapshot = await db.collection(this.collection)
        .where('timestamp', '<', cutoffDate.toISOString())
        .limit(1000) // Process in batches
        .get();
      
      if (snapshot.empty) {
        return 0;
      }
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`Cleaned up ${snapshot.docs.length} old audit events`);
      return snapshot.docs.length;
    } catch (error) {
      console.error('Failed to cleanup old audit events:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

/**
 * Middleware to log request/response
 */
export function auditMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  
  // Override res.json to capture response
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - startTime;
    
    // Log audit event asynchronously
    setImmediate(async () => {
      try {
        await auditLogger.log({
          timestamp: new Date().toISOString(),
          uid: req.auth?.uid || 'anonymous',
          role: req.auth?.role || 'unknown',
          method: req.body?.method || req.method,
          argsHash: JSON.stringify(req.body?.params || {}).slice(0, 50),
          resultSummary: data.error ? 'error' : 'success',
          duration,
          success: !data.error
        });
      } catch (error) {
        console.error('Failed to log audit event in middleware:', error);
      }
    });
    
    return originalJson.call(this, data);
  };
  
  next();
}
