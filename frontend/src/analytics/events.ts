/* SportBeaconAI - Analytics Events System
   Typed event helpers that integrate with Memory SDK and dataLayer
*/

import { memoryClient, type MemoryEventKind } from '@sportbeacon/memory-sdk';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DateString = string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ

export interface AnalyticsEvent {
  event: string;
  ts: DateString;
  tenantId: string;
  userId: string;
  meta: Record<string, any>;
}

export interface KPIEventData {
  athleteId?: string;
  sport?: string;
  statType?: string;
  highlightType?: string;
  disputeType?: string;
  resolution?: string;
  method?: 'csv' | 'manual' | 'connector';
  source?: 'hudl' | 'youtube' | 'vimeo' | 'instagram' | 'twitter';
  verificationTime?: number; // in milliseconds
  disputeResolutionTime?: number; // in milliseconds
  error?: string;
  success?: boolean;
}

// ============================================================================
// ANALYTICS EVENT TYPES
// ============================================================================

export const ANALYTICS_EVENTS = {
  ATHLETE_CLAIMED: 'athlete_claimed',
  HIGHLIGHT_ADDED: 'highlight_added',
  CSV_IMPORTED: 'csv_imported',
  STAT_SUBMITTED: 'stat_submitted',
  STAT_VERIFIED: 'stat_verified',
  DISPUTE_SUBMITTED: 'dispute_submitted',
  DISPUTE_RESOLVED: 'dispute_resolved',
  ATHLETE_PROFILE_VIEWED: 'athlete_profile_viewed',
  ADMIN_ACTION_PERFORMED: 'admin_action_performed',
  MEMORY_UPDATED: 'memory_updated'
} as const;

export type AnalyticsEventType = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// ============================================================================
// ANALYTICS SERVICE CLASS
// ============================================================================

class AnalyticsService {
  private memoryClient = memoryClient();
  private tenantId: string;
  private userId: string | null = null;

  constructor(tenantId: string = 'sportbeacon') {
    this.tenantId = tenantId;
  }

  // ============================================================================
  // CORE EVENT EMISSION
  // ============================================================================

  private async emitEvent(
    eventType: AnalyticsEventType,
    data: KPIEventData,
    memoryKind: MemoryEventKind = 'observation'
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString() as DateString;
      
      const analyticsEvent: AnalyticsEvent = {
        event: eventType,
        ts: timestamp,
        tenantId: this.tenantId,
        userId: this.userId || 'anonymous',
        meta: data
      };

      // Write to Memory SDK
      if (this.userId) {
        await this.memoryClient.writeEvent(this.userId, {
          kind: memoryKind,
          scope: 'web',
          trace: eventType,
          tags: ['analytics', 'kpi', this.tenantId],
          data: analyticsEvent
        });
      }

      // Push to dataLayer for future connectors (Google Analytics, etc.)
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: eventType,
          timestamp: timestamp,
          tenant_id: this.tenantId,
          user_id: this.userId,
          ...data
        });
      }

      // Console logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${eventType}:`, analyticsEvent);
      }

    } catch (error) {
      console.error(`Failed to emit analytics event ${eventType}:`, error);
    }
  }

  // ============================================================================
  // TYPED EVENT HELPERS
  // ============================================================================

  async emitAthleteClaimed(data: {
    athleteId: string;
    claimerType: 'athlete' | 'parent' | 'coach';
    claimMethod: 'email' | 'phone' | 'manual';
  }): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.ATHLETE_CLAIMED, {
      athleteId: data.athleteId,
      meta: {
        claimerType: data.claimerType,
        claimMethod: data.claimMethod
      }
    });
  }

  async emitHighlightAdded(data: {
    athleteId: string;
    highlightId: string;
    highlightType: string;
    source: 'hudl' | 'youtube' | 'vimeo' | 'instagram' | 'twitter';
    sport: string;
    isPublic: boolean;
  }): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.HIGHLIGHT_ADDED, {
      athleteId: data.athleteId,
      highlightType: data.highlightType,
      source: data.source,
      sport: data.sport,
      meta: {
        highlightId: data.highlightId,
        isPublic: data.isPublic
      }
    });
  }

  async emitCsvImported(data: {
    athleteId: string;
    sport: string;
    rowCount: number;
    successCount: number;
    errorCount: number;
    method: 'csv';
  }): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.CSV_IMPORTED, {
      athleteId: data.athleteId,
      sport: data.sport,
      method: data.method,
      meta: {
        rowCount: data.rowCount,
        successCount: data.successCount,
        errorCount: data.errorCount
      }
    });
  }

  async emitStatSubmitted(data: {
    athleteId: string;
    statId: string;
    sport: string;
    statType: string;
    method: 'csv' | 'manual' | 'connector';
    submittedBy: 'athlete' | 'coach' | 'parent' | 'admin';
  }): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.STAT_SUBMITTED, {
      athleteId: data.athleteId,
      sport: data.sport,
      statType: data.statType,
      method: data.method,
      meta: {
        statId: data.statId,
        submittedBy: data.submittedBy
      }
    });
  }

  async emitStatVerified(data: {
    athleteId: string;
    statId: string;
    sport: string;
    statType: string;
    verifiedBy: 'coach' | 'admin' | 'system';
    verificationTime: number;
    resolution: 'approved' | 'rejected' | 'needs_clarification';
  }): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.STAT_VERIFIED, {
      athleteId: data.athleteId,
      sport: data.sport,
      statType: data.statType,
      verificationTime: data.verificationTime,
      meta: {
        statId: data.statId,
        verifiedBy: data.verifiedBy,
        resolution: data.resolution
      }
    });
  }

  async emitDisputeSubmitted(data: {
    athleteId: string;
    disputeId: string;
    disputeType: 'stat_accuracy' | 'duplicate_entry' | 'wrong_athlete' | 'other';
    targetType: 'stat' | 'highlight' | 'profile';
    targetId: string;
    submittedBy: 'athlete' | 'parent' | 'coach';
    priority: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.DISPUTE_SUBMITTED, {
      athleteId: data.athleteId,
      disputeType: data.disputeType,
      meta: {
        disputeId: data.disputeId,
        targetType: data.targetType,
        targetId: data.targetId,
        submittedBy: data.submittedBy,
        priority: data.priority
      }
    });
  }

  async emitDisputeResolved(data: {
    athleteId: string;
    disputeId: string;
    disputeType: string;
    resolution: 'resolved' | 'rejected' | 'escalated';
    resolvedBy: 'admin' | 'coach' | 'system';
    disputeResolutionTime: number;
    resolutionReason: string;
  }): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.DISPUTE_RESOLVED, {
      athleteId: data.athleteId,
      disputeType: data.disputeType,
      disputeResolutionTime: data.disputeResolutionTime,
      meta: {
        disputeId: data.disputeId,
        resolvedBy: data.resolvedBy,
        resolution: data.resolution,
        resolutionReason: data.resolutionReason
      }
    });
  }

  async emitAthleteProfileViewed(data: {
    athleteId: string;
    viewerType: 'public' | 'athlete' | 'parent' | 'coach' | 'admin';
    viewedTabs: string[];
    sessionDuration?: number;
  }): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.ATHLETE_PROFILE_VIEWED, {
      athleteId: data.athleteId,
      meta: {
        viewerType: data.viewerType,
        viewedTabs: data.viewedTabs,
        sessionDuration: data.sessionDuration
      }
    });
  }

  async emitAdminActionPerformed(data: {
    action: 'verify_stat' | 'resolve_dispute' | 'merge_athletes' | 'delete_content';
    targetId: string;
    targetType: string;
    adminId: string;
    success: boolean;
    error?: string;
  }): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.ADMIN_ACTION_PERFORMED, {
      success: data.success,
      error: data.error,
      meta: {
        action: data.action,
        targetId: data.targetId,
        targetType: data.targetType,
        adminId: data.adminId
      }
    });
  }

  async emitMemoryUpdated(data: {
    athleteId: string;
    memoryField: string;
    updateType: 'preference' | 'history' | 'pattern';
    updateSource: 'user' | 'system' | 'feedback';
    confidence: number;
  }): Promise<void> {
    await this.emitEvent(ANALYTICS_EVENTS.MEMORY_UPDATED, {
      athleteId: data.athleteId,
      meta: {
        memoryField: data.memoryField,
        updateType: data.updateType,
        updateSource: data.updateSource,
        confidence: data.confidence
      }
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  setUserId(userId: string): void {
    this.userId = userId;
  }

  clearUserId(): void {
    this.userId = null;
  }

  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  // ============================================================================
  // KPI CALCULATION HELPERS
  // ============================================================================

  async calculateKPIMetrics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    athletesClaimed: number;
    highlightsAdded: number;
    csvImports: number;
    statsSubmitted: number;
    statsVerified: number;
    disputesSubmitted: number;
    disputesResolved: number;
    averageVerificationTime: number;
    averageDisputeResolutionTime: number;
    verificationRate: number;
    disputeResolutionRate: number;
  }> {
    // TODO: Implement actual KPI calculation from Memory SDK data
    // This would query the memory events and calculate metrics
    
    return {
      athletesClaimed: 0,
      highlightsAdded: 0,
      csvImports: 0,
      statsSubmitted: 0,
      statsVerified: 0,
      disputesSubmitted: 0,
      disputesResolved: 0,
      averageVerificationTime: 0,
      averageDisputeResolutionTime: 0,
      verificationRate: 0,
      disputeResolutionRate: 0
    };
  }

  // ============================================================================
  // DEVELOPMENT HELPERS
  // ============================================================================

  async getRecentEvents(limit: number = 50): Promise<AnalyticsEvent[]> {
    // TODO: Implement actual event retrieval from Memory SDK
    return [];
  }

  async exportKPIData(format: 'json' | 'csv' = 'json'): Promise<string> {
    // TODO: Implement KPI data export
    return '';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const analytics = new AnalyticsService();

// ============================================================================
// REACT HOOK FOR ANALYTICS
// ============================================================================

import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const useAnalytics = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      analytics.setUserId(user.uid);
    } else {
      analytics.clearUserId();
    }
  }, [user?.uid]);

  return analytics;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const createDateString = (date: Date = new Date()): DateString => {
  return date.toISOString() as DateString;
};

export const parseDateString = (dateString: DateString): Date => {
  return new Date(dateString);
};

export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('T') && dateString.endsWith('Z');
};

// ============================================================================
// EVENT VALIDATION
// ============================================================================

export const validateAnalyticsEvent = (event: Partial<AnalyticsEvent>): string[] => {
  const errors: string[] = [];

  if (!event.event) {
    errors.push('Event type is required');
  }

  if (!event.ts) {
    errors.push('Timestamp is required');
  } else if (!isValidDateString(event.ts)) {
    errors.push('Invalid timestamp format');
  }

  if (!event.tenantId) {
    errors.push('Tenant ID is required');
  }

  if (!event.userId) {
    errors.push('User ID is required');
  }

  if (!event.meta || typeof event.meta !== 'object') {
    errors.push('Metadata is required and must be an object');
  }

  return errors;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default analytics;
