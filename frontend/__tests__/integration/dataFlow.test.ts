import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import DataFlowValidator from '../../services/dataFlowValidator';
import PerformanceMonitor from '../../services/performanceMonitor';
import PlayerProfileService from '../../services/playerProfileService';
import TipTrackerService from '../../services/tipTrackerService';
import CreatorDashboardService from '../../services/creatorDashboardService';
import MediaService from '../../services/mediaService';

// Mock Firebase config for testing
const firebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'test-app-id'
};

// Initialize Firebase for testing
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080);
connectStorageEmulator(storage, 'localhost', 9199);
connectAuthEmulator(auth, 'http://localhost:9099');

// Mock services
jest.mock('../../services/playerProfileService');
jest.mock('../../services/tipTrackerService');
jest.mock('../../services/creatorDashboardService');
jest.mock('../../services/mediaService');

describe('Data Flow Integration Tests', () => {
  let dataFlowValidator: DataFlowValidator;
  let performanceMonitor: PerformanceMonitor;
  let playerProfileService: PlayerProfileService;
  let tipTrackerService: TipTrackerService;
  let creatorDashboardService: CreatorDashboardService;
  let mediaService: MediaService;

  const testUserId = 'test-user-123';
  const testFlowId = 'test-flow-123';

  beforeEach(async () => {
    // Initialize services
    dataFlowValidator = DataFlowValidator.getInstance();
    performanceMonitor = PerformanceMonitor.getInstance();
    playerProfileService = PlayerProfileService.getInstance();
    tipTrackerService = TipTrackerService.getInstance();
    creatorDashboardService = CreatorDashboardService.getInstance();
    mediaService = MediaService.getInstance();

    // Clear any existing data
    await clearTestData();
  });

  afterEach(async () => {
    // Cleanup
    dataFlowValidator.cleanup();
    performanceMonitor.cleanup();
    await clearTestData();
  });

  // Helper function to clear test data
  const clearTestData = async () => {
    // Clear Firestore collections
    const collections = ['dataFlows', 'performanceMetrics', 'performanceAlerts', 'performanceSnapshots'];
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  };

  describe('End-to-End Data Flow Testing', () => {
    it('should complete tip creation flow successfully', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId, {
        amount: 1000,
        currency: 'USD',
        message: 'Test tip'
      });

      // Record user interaction
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'user_interaction',
        eventName: 'tip_created',
        userId: testUserId,
        data: { amount: 1000, currency: 'USD' },
        status: 'completed'
      });

      // Record Firestore write
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'tip_saved_to_firestore',
        userId: testUserId,
        data: { tipId: 'tip-123' },
        status: 'completed',
        duration: 150
      });

      // Record Stripe API call
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'stripe_api_call',
        eventName: 'stripe_payment_processed',
        userId: testUserId,
        data: { paymentIntentId: 'pi_123' },
        status: 'completed',
        duration: 800
      });

      // Record payout processing
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'payout_processed',
        eventName: 'payout_processed',
        userId: testUserId,
        data: { transferId: 'tr_123' },
        status: 'completed',
        duration: 200
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow completion
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow).toBeTruthy();
      expect(completedFlow?.status).toBe('validated');
      expect(completedFlow?.events).toHaveLength(4);
      expect(completedFlow?.validationResults.length).toBeGreaterThan(0);
      expect(completedFlow?.validationResults.every(v => v.status === 'passed')).toBe(true);
    });

    it('should handle profile update flow with validation', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('profile_update', testUserId, {
        displayName: 'Updated Name',
        bio: 'Updated bio'
      });

      // Record profile update
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'profile_updated',
        userId: testUserId,
        data: { displayName: 'Updated Name' },
        status: 'completed',
        duration: 120
      });

      // Record data sync
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'data_synced',
        userId: testUserId,
        data: { synced: true },
        status: 'completed',
        duration: 80
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow completion
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow).toBeTruthy();
      expect(completedFlow?.status).toBe('validated');
      expect(completedFlow?.events).toHaveLength(2);
    });

    it('should handle media upload flow with performance tracking', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('media_upload', testUserId, {
        fileName: 'test-image.jpg',
        fileSize: 1024000
      });

      // Record media upload
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'media_uploaded',
        userId: testUserId,
        data: { fileId: 'file-123' },
        status: 'completed',
        duration: 2500
      });

      // Record metadata update
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'metadata_updated',
        userId: testUserId,
        data: { metadataId: 'meta-123' },
        status: 'completed',
        duration: 180
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow completion
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow).toBeTruthy();
      expect(completedFlow?.status).toBe('validated');
      expect(completedFlow?.performanceMetrics.totalEvents).toBe(2);
      expect(completedFlow?.performanceMetrics.averageEventDuration).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track operation performance metrics', async () => {
      const startTime = performance.now();
      
      // Track operation
      await performanceMonitor.trackOperation('test_operation', startTime, testUserId, {
        operationType: 'database_query',
        collection: 'users'
      });

      // Get performance metrics
      const metrics = await performanceMonitor.getPerformanceMetrics(testUserId);
      expect(metrics.length).toBeGreaterThan(0);
      
      const operationMetric = metrics.find(m => m.metricName === 'test_operation');
      expect(operationMetric).toBeTruthy();
      expect(operationMetric?.metricType).toBe('operation');
      expect(operationMetric?.value).toBeGreaterThan(0);
    });

    it('should track query performance with result count', async () => {
      const startTime = performance.now();
      
      // Track query
      await performanceMonitor.trackQuery('get_user_profiles', startTime, 25, testUserId, {
        filters: { status: 'active' },
        limit: 50
      });

      // Get performance metrics
      const metrics = await performanceMonitor.getPerformanceMetrics(testUserId, undefined, undefined, 'query');
      expect(metrics.length).toBeGreaterThan(0);
      
      const queryMetric = metrics.find(m => m.metricName === 'get_user_profiles');
      expect(queryMetric).toBeTruthy();
      expect(queryMetric?.metricType).toBe('query');
      expect(queryMetric?.metadata?.resultCount).toBe(25);
    });

    it('should track listener performance', async () => {
      const startTime = performance.now();
      
      // Track listener
      await performanceMonitor.trackListener('user_profile_listener', startTime, 3, testUserId, {
        collection: 'playerProfiles',
        documentId: testUserId
      });

      // Get performance metrics
      const metrics = await performanceMonitor.getPerformanceMetrics(testUserId, undefined, undefined, 'listener');
      expect(metrics.length).toBeGreaterThan(0);
      
      const listenerMetric = metrics.find(m => m.metricName === 'user_profile_listener');
      expect(listenerMetric).toBeTruthy();
      expect(listenerMetric?.metricType).toBe('listener');
      expect(listenerMetric?.metadata?.eventCount).toBe(3);
    });

    it('should track network request performance', async () => {
      const startTime = performance.now();
      
      // Track network request
      await performanceMonitor.trackNetworkRequest(
        'https://api.stripe.com/v1/payment_intents',
        'POST',
        startTime,
        200,
        1024,
        testUserId
      );

      // Get performance metrics
      const metrics = await performanceMonitor.getPerformanceMetrics(testUserId, undefined, undefined, 'network');
      expect(metrics.length).toBeGreaterThan(0);
      
      const networkMetric = metrics.find(m => m.metricName.includes('POST'));
      expect(networkMetric).toBeTruthy();
      expect(networkMetric?.metricType).toBe('network');
      expect(networkMetric?.metadata?.statusCode).toBe(200);
    });

    it('should track error performance', async () => {
      // Track error
      await performanceMonitor.trackError(
        'firestore_permission_denied',
        'Permission denied accessing user profile',
        'Error stack trace...',
        testUserId,
        { collection: 'playerProfiles', operation: 'read' }
      );

      // Get performance metrics
      const metrics = await performanceMonitor.getPerformanceMetrics(testUserId, undefined, undefined, 'error');
      expect(metrics.length).toBeGreaterThan(0);
      
      const errorMetric = metrics.find(m => m.metricName === 'firestore_permission_denied');
      expect(errorMetric).toBeTruthy();
      expect(errorMetric?.metricType).toBe('error');
      expect(errorMetric?.metadata?.errorMessage).toContain('Permission denied');
    });
  });

  describe('Real-time Data Flow Validation', () => {
    it('should validate data consistency rules', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Add events that should pass validation
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'user_interaction',
        eventName: 'tip_created',
        userId: testUserId,
        data: { amount: 1000 },
        status: 'completed'
      });

      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'stripe_api_call',
        eventName: 'stripe_payment_processed',
        userId: testUserId,
        data: { paymentIntentId: 'pi_123' },
        status: 'completed'
      });

      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'payout_processed',
        eventName: 'payout_processed',
        userId: testUserId,
        data: { transferId: 'tr_123' },
        status: 'completed'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify validation results
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.validationResults).toBeDefined();
      
      const dataConsistencyValidations = completedFlow?.validationResults.filter(v => 
        v.validationType === 'data_consistency'
      );
      expect(dataConsistencyValidations?.every(v => v.status === 'passed')).toBe(true);
    });

    it('should validate performance rules', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('profile_update', testUserId);

      // Add fast events
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'profile_updated',
        userId: testUserId,
        status: 'completed',
        duration: 100
      });

      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'data_synced',
        userId: testUserId,
        status: 'completed',
        duration: 80
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify validation results
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      const performanceValidations = completedFlow?.validationResults.filter(v => 
        v.validationType === 'performance'
      );
      expect(performanceValidations?.every(v => v.status === 'passed')).toBe(true);
    });

    it('should validate security rules', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Add events with proper authentication
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'user_interaction',
        eventName: 'tip_created',
        userId: testUserId,
        status: 'completed'
      });

      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'tip_saved_to_firestore',
        userId: testUserId,
        status: 'completed'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify validation results
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      const securityValidations = completedFlow?.validationResults.filter(v => 
        v.validationType === 'security'
      );
      expect(securityValidations?.every(v => v.status === 'passed')).toBe(true);
    });

    it('should validate business logic rules', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Add all required events for tip creation
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'user_interaction',
        eventName: 'tip_created',
        userId: testUserId,
        status: 'completed'
      });

      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'stripe_api_call',
        eventName: 'stripe_payment_processed',
        userId: testUserId,
        status: 'completed'
      });

      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'payout_processed',
        eventName: 'payout_processed',
        userId: testUserId,
        status: 'completed'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify validation results
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      const businessLogicValidations = completedFlow?.validationResults.filter(v => 
        v.validationType === 'business_logic'
      );
      expect(businessLogicValidations?.every(v => v.status === 'passed')).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle failed events gracefully', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Add successful event
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'user_interaction',
        eventName: 'tip_created',
        userId: testUserId,
        status: 'completed'
      });

      // Add failed event
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'stripe_api_call',
        eventName: 'stripe_payment_processed',
        userId: testUserId,
        status: 'failed',
        error: 'Stripe API timeout'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow status
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.status).toBe('failed');
      expect(completedFlow?.errorCount).toBe(1);
      expect(completedFlow?.successCount).toBe(1);
    });

    it('should handle validation failures', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Add event with invalid data (negative amount)
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'user_interaction',
        eventName: 'tip_created',
        userId: testUserId,
        data: { amount: -100 },
        status: 'completed'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify validation results
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      const failedValidations = completedFlow?.validationResults.filter(v => v.status === 'failed');
      expect(failedValidations?.length).toBeGreaterThan(0);
    });

    it('should handle network errors', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Add network error event
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'stripe_api_call',
        eventName: 'stripe_payment_processed',
        userId: testUserId,
        status: 'failed',
        error: 'Network timeout',
        duration: 10000
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow status
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.status).toBe('failed');
      expect(completedFlow?.errorCount).toBe(1);
    });
  });

  describe('Performance Analytics', () => {
    it('should calculate performance analytics correctly', async () => {
      // Create multiple flows for analytics
      const flowIds = [];
      
      for (let i = 0; i < 5; i++) {
        const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);
        
        await dataFlowValidator.recordEvent(flowId, {
          eventType: 'user_interaction',
          eventName: 'tip_created',
          userId: testUserId,
          status: 'completed',
          duration: 100 + i * 50
        });

        await dataFlowValidator.recordEvent(flowId, {
          eventType: 'stripe_api_call',
          eventName: 'stripe_payment_processed',
          userId: testUserId,
          status: 'completed',
          duration: 200 + i * 30
        });

        await dataFlowValidator.recordEvent(flowId, {
          eventType: 'payout_processed',
          eventName: 'payout_processed',
          userId: testUserId,
          status: 'completed',
          duration: 150 + i * 20
        });

        await dataFlowValidator.completeDataFlow(flowId);
        flowIds.push(flowId);
      }

      // Get analytics
      const analytics = await dataFlowValidator.getDataFlowAnalytics(testUserId);
      
      expect(analytics.totalFlows).toBe(5);
      expect(analytics.successfulFlows).toBe(5);
      expect(analytics.failedFlows).toBe(0);
      expect(analytics.averageFlowDuration).toBeGreaterThan(0);
      expect(analytics.flowsByType.tip_creation).toBe(5);
    });

    it('should track performance metrics over time', async () => {
      // Track multiple operations
      const startTimes = [];
      for (let i = 0; i < 10; i++) {
        startTimes.push(performance.now());
        await performanceMonitor.trackOperation(`test_operation_${i}`, startTimes[i], testUserId);
      }

      // Get performance analytics
      const analytics = await performanceMonitor.getPerformanceAnalytics(testUserId);
      
      expect(analytics.totalOperations).toBe(10);
      expect(analytics.averageResponseTime).toBeGreaterThan(0);
      expect(analytics.errorRate).toBe(0);
      expect(analytics.metricsByType.operation).toBe(10);
    });
  });

  describe('Real-time Monitoring', () => {
    it('should provide real-time data flow updates', (done) => {
      // Subscribe to data flow updates
      const unsubscribe = dataFlowValidator.subscribeToDataFlow(testFlowId, (flow) => {
        if (flow) {
          expect(flow.id).toBe(testFlowId);
          expect(flow.userId).toBe(testUserId);
          unsubscribe();
          done();
        }
      });

      // Start a flow
      dataFlowValidator.startDataFlow('tip_creation', testUserId);
    });

    it('should provide real-time performance metrics', (done) => {
      // Subscribe to performance metrics
      const unsubscribe = performanceMonitor.subscribeToPerformanceMetrics((metrics) => {
        if (metrics.length > 0) {
          expect(metrics[0].metricType).toBe('operation');
          unsubscribe();
          done();
        }
      }, testUserId);

      // Track an operation
      performanceMonitor.trackOperation('test_operation', performance.now(), testUserId);
    });

    it('should provide real-time analytics updates', (done) => {
      // Subscribe to analytics
      const unsubscribe = performanceMonitor.subscribeToPerformanceAnalytics((analytics) => {
        expect(analytics.totalOperations).toBeGreaterThanOrEqual(0);
        unsubscribe();
        done();
      }, testUserId);

      // Track an operation to trigger analytics update
      performanceMonitor.trackOperation('test_operation', performance.now(), testUserId);
    });
  });

  describe('Integration with Backend Services', () => {
    it('should integrate with PlayerProfileService', async () => {
      // Mock PlayerProfileService methods
      const mockCreateProfile = jest.fn().mockResolvedValue('profile-123');
      const mockGetProfile = jest.fn().mockResolvedValue({ id: 'profile-123', displayName: 'Test User' });
      
      (playerProfileService.createPlayerProfile as jest.Mock).mockImplementation(mockCreateProfile);
      (playerProfileService.getPlayerProfile as jest.Mock).mockImplementation(mockGetProfile);

      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('profile_update', testUserId);

      // Record profile creation
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'profile_created',
        userId: testUserId,
        data: { profileId: 'profile-123' },
        status: 'completed'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify integration
      expect(mockCreateProfile).toHaveBeenCalled();
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.status).toBe('validated');
    });

    it('should integrate with TipTrackerService', async () => {
      // Mock TipTrackerService methods
      const mockCreateTip = jest.fn().mockResolvedValue('tip-123');
      const mockGetTip = jest.fn().mockResolvedValue({ id: 'tip-123', amount: 1000 });
      
      (tipTrackerService.createTip as jest.Mock).mockImplementation(mockCreateTip);
      (tipTrackerService.getTip as jest.Mock).mockImplementation(mockGetTip);

      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Record tip creation
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'user_interaction',
        eventName: 'tip_created',
        userId: testUserId,
        data: { tipId: 'tip-123', amount: 1000 },
        status: 'completed'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify integration
      expect(mockCreateTip).toHaveBeenCalled();
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.status).toBe('validated');
    });

    it('should integrate with CreatorDashboardService', async () => {
      // Mock CreatorDashboardService methods
      const mockCreateDashboard = jest.fn().mockResolvedValue('dashboard-123');
      const mockGetDashboard = jest.fn().mockResolvedValue({ id: 'dashboard-123', userId: testUserId });
      
      (creatorDashboardService.createCreatorDashboard as jest.Mock).mockImplementation(mockCreateDashboard);
      (creatorDashboardService.getCreatorDashboard as jest.Mock).mockImplementation(mockGetDashboard);

      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('dashboard_sync', testUserId);

      // Record dashboard sync
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'dashboard_synced',
        userId: testUserId,
        data: { dashboardId: 'dashboard-123' },
        status: 'completed'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify integration
      expect(mockCreateDashboard).toHaveBeenCalled();
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.status).toBe('validated');
    });
  });
}); 