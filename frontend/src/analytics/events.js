/* SportBeaconAI - Analytics Events System
   Typed event helpers that integrate with Memory SDK and dataLayer
*/
import { memoryClient } from '@sportbeacon/memory-sdk';
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
};
// ============================================================================
// ANALYTICS SERVICE CLASS
// ============================================================================
class AnalyticsService {
    memoryClient = memoryClient;
    tenantId;
    userId = null;
    constructor(tenantId = 'sportbeacon') {
        this.tenantId = tenantId;
    }
    // ============================================================================
    // CORE EVENT EMISSION
    // ============================================================================
    async emitEvent(eventType, data, memoryKind = 'observation') {
        try {
            const timestamp = new Date().toISOString();
            const analyticsEvent = {
                event: eventType,
                ts: timestamp,
                tenantId: this.tenantId,
                userId: this.userId || 'anonymous',
                meta: data
            };
            // Write to Memory SDK
            if (this.userId) {
                await this.memoryClient.writeEvent?.(this.userId, {
                    kind: memoryKind,
                    scope: 'web',
                    trace: eventType,
                    tags: ['analytics', 'kpi', this.tenantId],
                    data: analyticsEvent
                });
            }
            // Push to dataLayer for future connectors (Google Analytics, etc.)
            if (typeof window !== 'undefined' && window.dataLayer) {
                window.dataLayer.push({
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
        }
        catch (error) {
            console.error(`Failed to emit analytics event ${eventType}:`, error);
        }
    }
    // ============================================================================
    // TYPED EVENT HELPERS
    // ============================================================================
    async emitAthleteClaimed(data) {
        await this.emitEvent(ANALYTICS_EVENTS.ATHLETE_CLAIMED, {
            athleteId: data.athleteId,
        });
    }
    async emitHighlightAdded(data) {
        await this.emitEvent(ANALYTICS_EVENTS.HIGHLIGHT_ADDED, {
            athleteId: data.athleteId,
            highlightType: data.highlightType,
            source: data.source,
            sport: data.sport,
        });
    }
    async emitCsvImported(data) {
        await this.emitEvent(ANALYTICS_EVENTS.CSV_IMPORTED, {
            athleteId: data.athleteId,
            sport: data.sport,
            method: data.method,
        });
    }
    async emitStatSubmitted(data) {
        await this.emitEvent(ANALYTICS_EVENTS.STAT_SUBMITTED, {
            athleteId: data.athleteId,
            sport: data.sport,
            statType: data.statType,
            method: data.method,
        });
    }
    async emitStatVerified(data) {
        await this.emitEvent(ANALYTICS_EVENTS.STAT_VERIFIED, {
            athleteId: data.athleteId,
            sport: data.sport,
            statType: data.statType,
            verificationTime: data.verificationTime,
        });
    }
    async emitDisputeSubmitted(data) {
        await this.emitEvent(ANALYTICS_EVENTS.DISPUTE_SUBMITTED, {
            athleteId: data.athleteId,
            disputeType: data.disputeType,
        });
    }
    async emitDisputeResolved(data) {
        await this.emitEvent(ANALYTICS_EVENTS.DISPUTE_RESOLVED, {
            athleteId: data.athleteId,
            disputeType: data.disputeType,
            disputeResolutionTime: data.disputeResolutionTime,
        });
    }
    async emitAthleteProfileViewed(data) {
        await this.emitEvent(ANALYTICS_EVENTS.ATHLETE_PROFILE_VIEWED, {
            athleteId: data.athleteId,
        });
    }
    async emitAdminActionPerformed(data) {
        await this.emitEvent(ANALYTICS_EVENTS.ADMIN_ACTION_PERFORMED, {
            success: data.success,
            error: data.error,
        });
    }
    async emitMemoryUpdated(data) {
        await this.emitEvent(ANALYTICS_EVENTS.MEMORY_UPDATED, {
            athleteId: data.athleteId,
        });
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    setUserId(userId) {
        this.userId = userId;
    }
    clearUserId() {
        this.userId = null;
    }
    setTenantId(tenantId) {
        this.tenantId = tenantId;
    }
    // ============================================================================
    // KPI CALCULATION HELPERS
    // ============================================================================
    async calculateKPIMetrics(timeframe = 'week') {
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
    async getRecentEvents(limit = 50) {
        // TODO: Implement actual event retrieval from Memory SDK
        return [];
    }
    async exportKPIData(format = 'json') {
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
        }
        else {
            analytics.clearUserId();
        }
    }, [user?.uid]);
    return analytics;
};
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export const createDateString = (date = new Date()) => {
    return date.toISOString();
};
export const parseDateString = (dateString) => {
    return new Date(dateString);
};
export const isValidDateString = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.includes('T') && dateString.endsWith('Z');
};
// ============================================================================
// EVENT VALIDATION
// ============================================================================
export const validateAnalyticsEvent = (event) => {
    const errors = [];
    if (!event.event) {
        errors.push('Event type is required');
    }
    if (!event.ts) {
        errors.push('Timestamp is required');
    }
    else if (!isValidDateString(event.ts)) {
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
