/* SportBeaconAI - Analytics Events Tests
   Unit tests for analytics event system
*/
import { describe, it, expect, jest, beforeEach, afterEach  } from '@jest/globals';
import { analytics, ANALYTICS_EVENTS, createDateString, parseDateString, isValidDateString, validateAnalyticsEvent } from './events';
// ============================================================================
// MOCK SETUP
// ============================================================================
// Mock Memory SDK
jest.mock('@sportbeacon/memory-sdk', () => ({
    memoryClient: jest.fn(() => ({
        writeEvent: jest.fn().mockResolvedValue('event_id')
    }))
}));
// Mock window.dataLayer
const mockDataLayer = [];
Object.defineProperty(window, 'dataLayer', {
    value: mockDataLayer,
    writable: true
});
// ============================================================================
// TEST SUITE
// ============================================================================
describe('Analytics Events System', () => {
    beforeEach(() => {
        // Clear mocks and dataLayer
        jest.clearAllMocks();
        mockDataLayer.length = 0;
        analytics.setUserId('test_user_123');
        analytics.setTenantId('test_tenant');
    });
    afterEach(() => {
        analytics.clearUserId();
    });
    // ============================================================================
    // CORE FUNCTIONALITY TESTS
    // ============================================================================
    describe('Event Emission', () => {
        it('should emit athlete claimed event', async () => {
            await analytics.emitAthleteClaimed({
                athleteId: 'athlete_123',
                claimerType: 'coach',
                claimMethod: 'email'
            });
            // Verify dataLayer push
            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: ANALYTICS_EVENTS.ATHLETE_CLAIMED,
                tenant_id: 'test_tenant',
                user_id: 'test_user_123',
                athleteId: 'athlete_123'
            });
        });
        it('should emit highlight added event', async () => {
            await analytics.emitHighlightAdded({
                athleteId: 'athlete_123',
                highlightId: 'highlight_456',
                highlightType: 'play',
                source: 'youtube',
                sport: 'basketball',
                isPublic: true
            });
            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: ANALYTICS_EVENTS.HIGHLIGHT_ADDED,
                athleteId: 'athlete_123',
                highlightType: 'play',
                source: 'youtube',
                sport: 'basketball'
            });
        });
        it('should emit CSV imported event', async () => {
            await analytics.emitCsvImported({
                athleteId: 'athlete_123',
                sport: 'basketball',
                rowCount: 10,
                successCount: 8,
                errorCount: 2,
                method: 'csv'
            });
            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: ANALYTICS_EVENTS.CSV_IMPORTED,
                athleteId: 'athlete_123',
                sport: 'basketball',
                method: 'csv'
            });
        });
        it('should emit stat submitted event', async () => {
            await analytics.emitStatSubmitted({
                athleteId: 'athlete_123',
                statId: 'stat_789',
                sport: 'basketball',
                statType: 'game_stats',
                method: 'manual',
                submittedBy: 'coach'
            });
            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: ANALYTICS_EVENTS.STAT_SUBMITTED,
                athleteId: 'athlete_123',
                sport: 'basketball',
                statType: 'game_stats',
                method: 'manual'
            });
        });
        it('should emit stat verified event', async () => {
            await analytics.emitStatVerified({
                athleteId: 'athlete_123',
                statId: 'stat_789',
                sport: 'basketball',
                statType: 'game_stats',
                verifiedBy: 'admin',
                verificationTime: 3600000, // 1 hour
                resolution: 'approved'
            });
            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: ANALYTICS_EVENTS.STAT_VERIFIED,
                athleteId: 'athlete_123',
                sport: 'basketball',
                statType: 'game_stats',
                verifiedBy: 'admin',
                verificationTime: 3600000
            });
        });
        it('should emit dispute submitted event', async () => {
            await analytics.emitDisputeSubmitted({
                athleteId: 'athlete_123',
                disputeId: 'dispute_101',
                disputeType: 'stat_accuracy',
                targetType: 'stat',
                targetId: 'stat_789',
                submittedBy: 'parent',
                priority: 'high'
            });
            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: ANALYTICS_EVENTS.DISPUTE_SUBMITTED,
                athleteId: 'athlete_123',
                disputeType: 'stat_accuracy',
                targetType: 'stat',
                targetId: 'stat_789',
                submittedBy: 'parent',
                priority: 'high'
            });
        });
        it('should emit dispute resolved event', async () => {
            await analytics.emitDisputeResolved({
                athleteId: 'athlete_123',
                disputeId: 'dispute_101',
                disputeType: 'stat_accuracy',
                resolution: 'resolved',
                resolvedBy: 'admin',
                disputeResolutionTime: 7200000, // 2 hours
                resolutionReason: 'Data corrected after review'
            });
            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0]).toMatchObject({
                event: ANALYTICS_EVENTS.DISPUTE_RESOLVED,
                athleteId: 'athlete_123',
                disputeType: 'stat_accuracy',
                resolution: 'resolved',
                resolvedBy: 'admin',
                disputeResolutionTime: 7200000
            });
        });
    });
    // ============================================================================
    // ERROR HANDLING TESTS
    // ============================================================================
    describe('Error Handling', () => {
        it('should handle missing dataLayer gracefully', async () => {
            // Remove dataLayer
            delete window.dataLayer;
            await analytics.emitAthleteClaimed({
                athleteId: 'athlete_123',
                claimerType: 'coach',
                claimMethod: 'email'
            });
            // Should not throw error
            expect(true).toBe(true);
        });
        it('should handle Memory SDK errors gracefully', async () => {
            const { memoryClient } = await import('@sportbeacon/memory-sdk');
            const mockMemoryClient = memoryClient;
            mockMemoryClient.mockReturnValue({
                writeEvent: jest.fn().mockRejectedValue(new Error('Memory SDK error'))
            });
            await analytics.emitAthleteClaimed({
                athleteId: 'athlete_123',
                claimerType: 'coach',
                claimMethod: 'email'
            });
            // Should still push to dataLayer
            expect(mockDataLayer).toHaveLength(1);
        });
        it('should handle missing user ID', async () => {
            analytics.clearUserId();
            await analytics.emitAthleteClaimed({
                athleteId: 'athlete_123',
                claimerType: 'coach',
                claimMethod: 'email'
            });
            expect(mockDataLayer).toHaveLength(1);
            expect(mockDataLayer[0].user_id).toBe('anonymous');
        });
    });
    // ============================================================================
    // UTILITY FUNCTION TESTS
    // ============================================================================
    describe('Utility Functions', () => {
        describe('createDateString', () => {
            it('should create valid ISO date string', () => {
                const dateString = createDateString();
                expect(isValidDateString(dateString)).toBe(true);
            });
            it('should create date string from specific date', () => {
                const date = new Date('2024-01-01T12:00:00Z');
                const dateString = createDateString(date);
                expect(dateString).toBe('2024-01-01T12:00:00.000Z');
            });
        });
        describe('parseDateString', () => {
            it('should parse valid date string', () => {
                const dateString = '2024-01-01T12:00:00.000Z';
                const date = parseDateString(dateString);
                expect(date).toBeInstanceOf(Date);
                expect(date.toISOString()).toBe(dateString);
            });
        });
        describe('isValidDateString', () => {
            it('should validate correct date strings', () => {
                expect(isValidDateString('2024-01-01T12:00:00.000Z')).toBe(true);
                expect(isValidDateString('2024-12-31T23:59:59.999Z')).toBe(true);
            });
            it('should reject invalid date strings', () => {
                expect(isValidDateString('invalid-date')).toBe(false);
                expect(isValidDateString('2024-01-01')).toBe(false); // Missing time
                expect(isValidDateString('2024-01-01T12:00:00')).toBe(false); // Missing Z
                expect(isValidDateString('')).toBe(false);
            });
        });
        describe('validateAnalyticsEvent', () => {
            it('should validate complete event', () => {
                const event = {
                    event: 'test_event',
                    ts: '2024-01-01T12:00:00.000Z',
                    tenantId: 'test_tenant',
                    userId: 'test_user',
                    meta: { test: 'data' }
                };
                const errors = validateAnalyticsEvent(event);
                expect(errors).toHaveLength(0);
            });
            it('should catch missing required fields', () => {
                const event = {
                    event: 'test_event',
                    ts: 'invalid-date',
                    tenantId: '',
                    userId: 'test_user',
                    meta: {}
                };
                const errors = validateAnalyticsEvent(event);
                expect(errors).toContain('Invalid timestamp format');
                expect(errors).toContain('Tenant ID is required');
            });
            it('should validate metadata object', () => {
                const event = {
                    event: 'test_event',
                    ts: '2024-01-01T12:00:00.000Z',
                    tenantId: 'test_tenant',
                    userId: 'test_user',
                    meta: 'not-an-object'
                };
                const errors = validateAnalyticsEvent(event);
                expect(errors).toContain('Metadata is required and must be an object');
            });
        });
    });
    // ============================================================================
    // INTEGRATION TESTS
    // ============================================================================
    describe('Integration Tests', () => {
        it('should emit multiple events in sequence', async () => {
            await analytics.emitAthleteClaimed({
                athleteId: 'athlete_123',
                claimerType: 'coach',
                claimMethod: 'email'
            });
            await analytics.emitHighlightAdded({
                athleteId: 'athlete_123',
                highlightId: 'highlight_456',
                highlightType: 'play',
                source: 'youtube',
                sport: 'basketball',
                isPublic: true
            });
            await analytics.emitStatSubmitted({
                athleteId: 'athlete_123',
                statId: 'stat_789',
                sport: 'basketball',
                statType: 'game_stats',
                method: 'manual',
                submittedBy: 'coach'
            });
            expect(mockDataLayer).toHaveLength(3);
            expect(mockDataLayer[0].event).toBe(ANALYTICS_EVENTS.ATHLETE_CLAIMED);
            expect(mockDataLayer[1].event).toBe(ANALYTICS_EVENTS.HIGHLIGHT_ADDED);
            expect(mockDataLayer[2].event).toBe(ANALYTICS_EVENTS.STAT_SUBMITTED);
        });
        it('should maintain consistent user context across events', async () => {
            analytics.setUserId('consistent_user');
            analytics.setTenantId('consistent_tenant');
            await analytics.emitAthleteClaimed({
                athleteId: 'athlete_123',
                claimerType: 'coach',
                claimMethod: 'email'
            });
            await analytics.emitStatSubmitted({
                athleteId: 'athlete_123',
                statId: 'stat_789',
                sport: 'basketball',
                statType: 'game_stats',
                method: 'manual',
                submittedBy: 'coach'
            });
            expect(mockDataLayer[0].user_id).toBe('consistent_user');
            expect(mockDataLayer[0].tenant_id).toBe('consistent_tenant');
            expect(mockDataLayer[1].user_id).toBe('consistent_user');
            expect(mockDataLayer[1].tenant_id).toBe('consistent_tenant');
        });
    });
    // ============================================================================
    // DEVELOPMENT MODE TESTS
    // ============================================================================
    describe('Development Mode', () => {
        it('should log events in development mode', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            await analytics.emitAthleteClaimed({
                athleteId: 'athlete_123',
                claimerType: 'coach',
                claimMethod: 'email'
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Analytics]'), expect.any(Object));
            consoleSpy.mockRestore();
            process.env.NODE_ENV = originalEnv;
        });
        it('should not log events in production mode', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            await analytics.emitAthleteClaimed({
                athleteId: 'athlete_123',
                claimerType: 'coach',
                claimMethod: 'email'
            });
            expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('[Analytics]'), expect.any(Object));
            consoleSpy.mockRestore();
            process.env.NODE_ENV = originalEnv;
        });
    });
});
