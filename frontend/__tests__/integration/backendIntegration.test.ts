import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { BackendIntegrationProvider, useBackendIntegration } from '../../contexts/BackendIntegrationContext';
import DataFlowValidator from '../../services/dataFlowValidator';
import PerformanceMonitor from '../../services/performanceMonitor';
import PlayerProfileService from '../../services/playerProfileService';
import TipTrackerService from '../../services/tipTrackerService';
import CreatorDashboardService from '../../services/creatorDashboardService';
import MediaService from '../../services/mediaService';
import { renderHook, act } from '@testing-library/react';

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

describe('Backend Integration Tests', () => {
  let dataFlowValidator: DataFlowValidator;
  let performanceMonitor: PerformanceMonitor;
  let playerProfileService: PlayerProfileService;
  let tipTrackerService: TipTrackerService;
  let creatorDashboardService: CreatorDashboardService;
  let mediaService: MediaService;

  const testUserId = 'test-user-123';
  const testProfileId = 'profile-123';
  const testTipId = 'tip-123';
  const testDashboardId = 'dashboard-123';
  const testMediaId = 'media-123';

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
    const collections = [
      'dataFlows', 
      'performanceMetrics', 
      'performanceAlerts', 
      'performanceSnapshots',
      'playerProfiles',
      'tips',
      'creatorDashboards',
      'media'
    ];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (error) {
        // Collection might not exist, continue
      }
    }
  };

  describe('BackendIntegrationContext Integration', () => {
    it('should initialize backend integration context successfully', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BackendIntegrationProvider>{children}</BackendIntegrationProvider>
      );

      const { result } = renderHook(() => useBackendIntegration(), { wrapper });

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.state.isInitialized).toBe(true);
      expect(result.current.state.isOnline).toBe(true);
      expect(result.current.state.error).toBeNull();
    });

    it('should handle network status changes', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BackendIntegrationProvider>{children}</BackendIntegrationProvider>
      );

      const { result } = renderHook(() => useBackendIntegration(), { wrapper });

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Simulate network offline
      await act(async () => {
        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false
        });
        
        // Trigger network change event
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.state.isOnline).toBe(false);
    });

    it('should handle service initialization errors', async () => {
      // Mock service initialization error
      jest.spyOn(PlayerProfileService, 'getInstance').mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BackendIntegrationProvider>{children}</BackendIntegrationProvider>
      );

      const { result } = renderHook(() => useBackendIntegration(), { wrapper });

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.state.error).toBeTruthy();
      expect(result.current.state.isInitialized).toBe(false);
    });
  });

  describe('End-to-End Data Flow Integration', () => {
    it('should complete full tip creation flow with all services', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId, {
        amount: 1000,
        currency: 'USD',
        message: 'Test tip'
      });

      // Mock service calls
      const mockCreateTip = jest.fn().mockResolvedValue({ id: testTipId, amount: 1000 });
      const mockUpdateProfile = jest.fn().mockResolvedValue({ id: testProfileId });
      const mockUpdateDashboard = jest.fn().mockResolvedValue({ id: testDashboardId });
      
      (tipTrackerService.createTip as jest.Mock).mockImplementation(mockCreateTip);
      (playerProfileService.updatePlayerProfile as jest.Mock).mockImplementation(mockUpdateProfile);
      (creatorDashboardService.updateCreatorDashboard as jest.Mock).mockImplementation(mockUpdateDashboard);

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
        data: { tipId: testTipId },
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

      // Verify service calls
      expect(mockCreateTip).toHaveBeenCalled();
      expect(mockUpdateProfile).toHaveBeenCalled();
      expect(mockUpdateDashboard).toHaveBeenCalled();
    });

    it('should handle profile update flow with media upload', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('profile_update', testUserId, {
        displayName: 'Updated Name',
        bio: 'Updated bio',
        mediaFiles: ['image1.jpg', 'image2.jpg']
      });

      // Mock service calls
      const mockUpdateProfile = jest.fn().mockResolvedValue({ id: testProfileId });
      const mockUploadMedia = jest.fn().mockResolvedValue({ id: testMediaId });
      
      (playerProfileService.updatePlayerProfile as jest.Mock).mockImplementation(mockUpdateProfile);
      (mediaService.uploadMedia as jest.Mock).mockImplementation(mockUploadMedia);

      // Record profile update
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'profile_updated',
        userId: testUserId,
        data: { displayName: 'Updated Name' },
        status: 'completed',
        duration: 120
      });

      // Record media upload
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'media_uploaded',
        userId: testUserId,
        data: { mediaId: testMediaId },
        status: 'completed',
        duration: 2500
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
      expect(completedFlow?.events).toHaveLength(3);

      // Verify service calls
      expect(mockUpdateProfile).toHaveBeenCalled();
      expect(mockUploadMedia).toHaveBeenCalled();
    });

    it('should handle dashboard sync with analytics', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('dashboard_sync', testUserId);

      // Mock service calls
      const mockUpdateDashboard = jest.fn().mockResolvedValue({ id: testDashboardId });
      const mockGetAnalytics = jest.fn().mockResolvedValue({ 
        totalTips: 100, 
        totalEarnings: 5000,
        followers: 1000 
      });
      
      (creatorDashboardService.updateCreatorDashboard as jest.Mock).mockImplementation(mockUpdateDashboard);
      (creatorDashboardService.getCreatorAnalytics as jest.Mock).mockImplementation(mockGetAnalytics);

      // Record dashboard sync
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'dashboard_synced',
        userId: testUserId,
        data: { dashboardId: testDashboardId },
        status: 'completed',
        duration: 300
      });

      // Record analytics update
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'analytics_updated',
        userId: testUserId,
        data: { analyticsId: 'analytics-123' },
        status: 'completed',
        duration: 150
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow completion
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow).toBeTruthy();
      expect(completedFlow?.status).toBe('validated');
      expect(completedFlow?.events).toHaveLength(2);

      // Verify service calls
      expect(mockUpdateDashboard).toHaveBeenCalled();
      expect(mockGetAnalytics).toHaveBeenCalled();
    });
  });

  describe('Performance Integration Testing', () => {
    it('should track performance metrics across all services', async () => {
      const startTime = performance.now();

      // Track operation performance
      await performanceMonitor.trackOperation('profile_update_operation', startTime, testUserId, {
        service: 'PlayerProfileService',
        operation: 'updatePlayerProfile'
      });

      // Track query performance
      await performanceMonitor.trackQuery('get_user_profiles', startTime, 25, testUserId, {
        filters: { status: 'active' },
        limit: 50
      });

      // Track listener performance
      await performanceMonitor.trackListener('user_profile_listener', startTime, 3, testUserId, {
        collection: 'playerProfiles',
        documentId: testUserId
      });

      // Track network request performance
      await performanceMonitor.trackNetworkRequest(
        'https://api.stripe.com/v1/payment_intents',
        'POST',
        startTime,
        200,
        1024,
        testUserId
      );

      // Get performance metrics
      const metrics = await performanceMonitor.getPerformanceMetrics(testUserId);
      expect(metrics.length).toBeGreaterThan(0);

      // Verify different metric types
      const operationMetrics = metrics.filter(m => m.metricType === 'operation');
      const queryMetrics = metrics.filter(m => m.metricType === 'query');
      const listenerMetrics = metrics.filter(m => m.metricType === 'listener');
      const networkMetrics = metrics.filter(m => m.metricType === 'network');

      expect(operationMetrics.length).toBeGreaterThan(0);
      expect(queryMetrics.length).toBeGreaterThan(0);
      expect(listenerMetrics.length).toBeGreaterThan(0);
      expect(networkMetrics.length).toBeGreaterThan(0);
    });

    it('should handle performance alerts and thresholds', async () => {
      // Track slow operation
      const startTime = performance.now();
      await performanceMonitor.trackOperation('slow_operation', startTime, testUserId, {
        duration: 10000 // 10 seconds
      });

      // Get performance analytics
      const analytics = await performanceMonitor.getPerformanceAnalytics(testUserId);
      expect(analytics.averageResponseTime).toBeGreaterThan(0);

      // Check for alerts (should be created for slow operations)
      const alerts = await performanceMonitor.getPerformanceAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should track memory usage and optimization', async () => {
      // Simulate memory usage tracking
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;
        const initialMemory = memory.usedJSHeapSize;

        // Perform operations that might use memory
        for (let i = 0; i < 1000; i++) {
          await performanceMonitor.trackOperation(`operation_${i}`, performance.now(), testUserId);
        }

        // Get current stats
        const stats = performanceMonitor.getCurrentStats();
        expect(stats.memoryUsage).toBeGreaterThan(0);
        expect(stats.totalOperations).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    it('should handle service failures gracefully', async () => {
      // Mock service failure
      const mockCreateTip = jest.fn().mockRejectedValue(new Error('Stripe API timeout'));
      (tipTrackerService.createTip as jest.Mock).mockImplementation(mockCreateTip);

      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Record failed event
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'stripe_api_call',
        eventName: 'stripe_payment_processed',
        userId: testUserId,
        status: 'failed',
        error: 'Stripe API timeout',
        duration: 10000
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow status
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.status).toBe('failed');
      expect(completedFlow?.errorCount).toBe(1);
      expect(completedFlow?.successCount).toBe(0);
    });

    it('should handle network failures and recovery', async () => {
      // Mock network failure
      const mockUpdateProfile = jest.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ id: testProfileId });
      
      (playerProfileService.updatePlayerProfile as jest.Mock).mockImplementation(mockUpdateProfile);

      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('profile_update', testUserId);

      // Record failed event
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'profile_updated',
        userId: testUserId,
        status: 'failed',
        error: 'Network timeout',
        duration: 5000
      });

      // Record retry success
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'profile_updated_retry',
        userId: testUserId,
        status: 'completed',
        duration: 120
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow status
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.errorCount).toBe(1);
      expect(completedFlow?.successCount).toBe(1);
    });

    it('should handle validation failures and recovery', async () => {
      // Start data flow with invalid data
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Record event with invalid amount
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'user_interaction',
        eventName: 'tip_created',
        userId: testUserId,
        data: { amount: -100 }, // Invalid negative amount
        status: 'completed'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify validation results
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      const failedValidations = completedFlow?.validationResults.filter(v => v.status === 'failed');
      expect(failedValidations?.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Integration Testing', () => {
    it('should provide real-time updates for data flows', (done) => {
      // Subscribe to data flow updates
      const unsubscribe = dataFlowValidator.subscribeToDataFlow('test-flow-id', (flow) => {
        if (flow) {
          expect(flow.id).toBe('test-flow-id');
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

  describe('Security Integration Testing', () => {
    it('should validate authentication and authorization', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Record authentication event
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'user_interaction',
        eventName: 'user_authenticated',
        userId: testUserId,
        data: { authMethod: 'firebase', role: 'creator' },
        status: 'completed'
      });

      // Record authorization event
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'access_validated',
        userId: testUserId,
        data: { permissions: ['read', 'write'] },
        status: 'completed'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify security validations
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      const securityValidations = completedFlow?.validationResults.filter(v => 
        v.validationType === 'security'
      );
      expect(securityValidations?.every(v => v.status === 'passed')).toBe(true);
    });

    it('should handle unauthorized access attempts', async () => {
      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Record unauthorized access attempt
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'access_denied',
        userId: testUserId,
        status: 'failed',
        error: 'Insufficient permissions'
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow status
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.errorCount).toBe(1);
      expect(completedFlow?.status).toBe('failed');
    });
  });

  describe('Load Testing Integration', () => {
    it('should handle concurrent operations', async () => {
      const concurrentOperations = 10;
      const promises = [];

      // Start concurrent operations
      for (let i = 0; i < concurrentOperations; i++) {
        const promise = (async () => {
          const flowId = await dataFlowValidator.startDataFlow('tip_creation', `${testUserId}-${i}`);
          
          await dataFlowValidator.recordEvent(flowId, {
            eventType: 'user_interaction',
            eventName: 'tip_created',
            userId: `${testUserId}-${i}`,
            status: 'completed'
          });

          await dataFlowValidator.completeDataFlow(flowId);
          return flowId;
        })();
        
        promises.push(promise);
      }

      // Wait for all operations to complete
      const flowIds = await Promise.all(promises);

      // Verify all flows completed
      expect(flowIds.length).toBe(concurrentOperations);

      // Get analytics for all flows
      const analytics = await dataFlowValidator.getDataFlowAnalytics();
      expect(analytics.totalFlows).toBeGreaterThanOrEqual(concurrentOperations);
    });

    it('should handle high-volume data processing', async () => {
      const highVolumeOperations = 100;
      const startTime = performance.now();

      // Perform high-volume operations
      for (let i = 0; i < highVolumeOperations; i++) {
        await performanceMonitor.trackOperation(`high_volume_operation_${i}`, startTime, testUserId);
      }

      // Get performance analytics
      const analytics = await performanceMonitor.getPerformanceAnalytics(testUserId);
      expect(analytics.totalOperations).toBeGreaterThanOrEqual(highVolumeOperations);
      expect(analytics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Integration with External Services', () => {
    it('should integrate with Stripe payment processing', async () => {
      // Mock Stripe integration
      const mockStripePayment = jest.fn().mockResolvedValue({
        id: 'pi_123',
        status: 'succeeded',
        amount: 1000
      });

      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);

      // Record Stripe payment
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'stripe_api_call',
        eventName: 'stripe_payment_processed',
        userId: testUserId,
        data: { paymentIntentId: 'pi_123', amount: 1000 },
        status: 'completed',
        duration: 800
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow completion
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.status).toBe('validated');
    });

    it('should integrate with media storage services', async () => {
      // Mock media storage integration
      const mockMediaUpload = jest.fn().mockResolvedValue({
        id: testMediaId,
        url: 'https://storage.googleapis.com/media/test-image.jpg'
      });

      // Start data flow
      const flowId = await dataFlowValidator.startDataFlow('media_upload', testUserId);

      // Record media upload
      await dataFlowValidator.recordEvent(flowId, {
        eventType: 'firestore_write',
        eventName: 'media_uploaded',
        userId: testUserId,
        data: { mediaId: testMediaId, url: 'https://storage.googleapis.com/media/test-image.jpg' },
        status: 'completed',
        duration: 2500
      });

      // Complete flow
      await dataFlowValidator.completeDataFlow(flowId);

      // Verify flow completion
      const completedFlow = await dataFlowValidator.getDataFlow(flowId);
      expect(completedFlow?.status).toBe('validated');
    });
  });
}); 