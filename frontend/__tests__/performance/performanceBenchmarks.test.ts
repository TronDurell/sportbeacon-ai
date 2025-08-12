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

// Performance benchmarks configuration
const BENCHMARK_CONFIG = {
  iterations: 100,
  warmupIterations: 10,
  timeout: 30000, // 30 seconds
  memoryThreshold: 100, // 100 MB
  responseTimeThreshold: 5000, // 5 seconds
  concurrentUsers: 50,
  stressTestDuration: 60000, // 1 minute
  loadTestRampUp: 10000, // 10 seconds
};

describe('Performance Benchmarks', () => {
  let dataFlowValidator: DataFlowValidator;
  let performanceMonitor: PerformanceMonitor;
  let playerProfileService: PlayerProfileService;
  let tipTrackerService: TipTrackerService;
  let creatorDashboardService: CreatorDashboardService;
  let mediaService: MediaService;

  const testUserId = 'test-user-123';

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
    // Implementation would clear test data from Firestore
  };

  // Helper function to measure performance
  const measurePerformance = async (
    operation: () => Promise<any>,
    iterations: number = BENCHMARK_CONFIG.iterations
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
    operationsPerSecond: number;
    memoryUsage?: number;
  }> => {
    const times: number[] = [];
    const startMemory = performance.memory?.usedJSHeapSize || 0;

    // Warmup iterations
    for (let i = 0; i < BENCHMARK_CONFIG.warmupIterations; i++) {
      await operation();
    }

    // Actual measurements
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await operation();
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const endMemory = performance.memory?.usedJSHeapSize || 0;
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const operationsPerSecond = (iterations / totalTime) * 1000;
    const memoryUsage = endMemory - startMemory;

    return {
      averageTime,
      minTime,
      maxTime,
      totalTime,
      operationsPerSecond,
      memoryUsage
    };
  };

  describe('Data Flow Performance Benchmarks', () => {
    it('should benchmark tip creation flow performance', async () => {
      const benchmark = await measurePerformance(async () => {
        const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);
        
        await dataFlowValidator.recordEvent(flowId, {
          eventType: 'user_interaction',
          eventName: 'tip_created',
          userId: testUserId,
          data: { amount: 1000, currency: 'USD' },
          status: 'completed'
        });

        await dataFlowValidator.recordEvent(flowId, {
          eventType: 'firestore_write',
          eventName: 'tip_saved_to_firestore',
          userId: testUserId,
          data: { tipId: 'tip-123' },
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

        await dataFlowValidator.completeDataFlow(flowId);
      });

      // Performance assertions
      expect(benchmark.averageTime).toBeLessThan(BENCHMARK_CONFIG.responseTimeThreshold);
      expect(benchmark.operationsPerSecond).toBeGreaterThan(0.1); // At least 0.1 ops/sec
      expect(benchmark.memoryUsage).toBeLessThan(BENCHMARK_CONFIG.memoryThreshold * 1024 * 1024); // Convert to bytes
      
      console.log('Tip Creation Flow Performance:', {
        averageTime: `${benchmark.averageTime.toFixed(2)}ms`,
        operationsPerSecond: `${benchmark.operationsPerSecond.toFixed(2)} ops/sec`,
        memoryUsage: `${(benchmark.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
      });
    });

    it('should benchmark profile update flow performance', async () => {
      const benchmark = await measurePerformance(async () => {
        const flowId = await dataFlowValidator.startDataFlow('profile_update', testUserId);
        
        await dataFlowValidator.recordEvent(flowId, {
          eventType: 'firestore_write',
          eventName: 'profile_updated',
          userId: testUserId,
          data: { displayName: 'Updated Name' },
          status: 'completed'
        });

        await dataFlowValidator.recordEvent(flowId, {
          eventType: 'firestore_write',
          eventName: 'data_synced',
          userId: testUserId,
          data: { synced: true },
          status: 'completed'
        });

        await dataFlowValidator.completeDataFlow(flowId);
      });

      // Performance assertions
      expect(benchmark.averageTime).toBeLessThan(BENCHMARK_CONFIG.responseTimeThreshold);
      expect(benchmark.operationsPerSecond).toBeGreaterThan(0.2); // At least 0.2 ops/sec
      expect(benchmark.memoryUsage).toBeLessThan(BENCHMARK_CONFIG.memoryThreshold * 1024 * 1024);
      
      console.log('Profile Update Flow Performance:', {
        averageTime: `${benchmark.averageTime.toFixed(2)}ms`,
        operationsPerSecond: `${benchmark.operationsPerSecond.toFixed(2)} ops/sec`,
        memoryUsage: `${(benchmark.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
      });
    });

    it('should benchmark media upload flow performance', async () => {
      const benchmark = await measurePerformance(async () => {
        const flowId = await dataFlowValidator.startDataFlow('media_upload', testUserId);
        
        await dataFlowValidator.recordEvent(flowId, {
          eventType: 'firestore_write',
          eventName: 'media_uploaded',
          userId: testUserId,
          data: { fileId: 'file-123' },
          status: 'completed'
        });

        await dataFlowValidator.recordEvent(flowId, {
          eventType: 'firestore_write',
          eventName: 'metadata_updated',
          userId: testUserId,
          data: { metadataId: 'meta-123' },
          status: 'completed'
        });

        await dataFlowValidator.completeDataFlow(flowId);
      });

      // Performance assertions
      expect(benchmark.averageTime).toBeLessThan(BENCHMARK_CONFIG.responseTimeThreshold);
      expect(benchmark.operationsPerSecond).toBeGreaterThan(0.15); // At least 0.15 ops/sec
      expect(benchmark.memoryUsage).toBeLessThan(BENCHMARK_CONFIG.memoryThreshold * 1024 * 1024);
      
      console.log('Media Upload Flow Performance:', {
        averageTime: `${benchmark.averageTime.toFixed(2)}ms`,
        operationsPerSecond: `${benchmark.operationsPerSecond.toFixed(2)} ops/sec`,
        memoryUsage: `${(benchmark.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
      });
    });
  });

  describe('Service Performance Benchmarks', () => {
    it('should benchmark PlayerProfileService operations', async () => {
      const mockCreateProfile = jest.fn().mockResolvedValue({ id: 'profile-123' });
      (playerProfileService.createPlayerProfile as jest.Mock).mockImplementation(mockCreateProfile);

      const benchmark = await measurePerformance(async () => {
        await playerProfileService.createPlayerProfile({
          userId: testUserId,
          displayName: 'Test User',
          bio: 'Test bio'
        });
      });

      // Performance assertions
      expect(benchmark.averageTime).toBeLessThan(1000); // Less than 1 second
      expect(benchmark.operationsPerSecond).toBeGreaterThan(1); // At least 1 op/sec
      expect(benchmark.memoryUsage).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
      
      console.log('PlayerProfileService Performance:', {
        averageTime: `${benchmark.averageTime.toFixed(2)}ms`,
        operationsPerSecond: `${benchmark.operationsPerSecond.toFixed(2)} ops/sec`,
        memoryUsage: `${(benchmark.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
      });
    });

    it('should benchmark TipTrackerService operations', async () => {
      const mockCreateTip = jest.fn().mockResolvedValue({ id: 'tip-123', amount: 1000 });
      (tipTrackerService.createTip as jest.Mock).mockImplementation(mockCreateTip);

      const benchmark = await measurePerformance(async () => {
        await tipTrackerService.createTip({
          userId: testUserId,
          amount: 1000,
          currency: 'USD',
          message: 'Test tip'
        });
      });

      // Performance assertions
      expect(benchmark.averageTime).toBeLessThan(2000); // Less than 2 seconds
      expect(benchmark.operationsPerSecond).toBeGreaterThan(0.5); // At least 0.5 ops/sec
      expect(benchmark.memoryUsage).toBeLessThan(50 * 1024 * 1024);
      
      console.log('TipTrackerService Performance:', {
        averageTime: `${benchmark.averageTime.toFixed(2)}ms`,
        operationsPerSecond: `${benchmark.operationsPerSecond.toFixed(2)} ops/sec`,
        memoryUsage: `${(benchmark.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
      });
    });

    it('should benchmark CreatorDashboardService operations', async () => {
      const mockCreateDashboard = jest.fn().mockResolvedValue({ id: 'dashboard-123' });
      (creatorDashboardService.createCreatorDashboard as jest.Mock).mockImplementation(mockCreateDashboard);

      const benchmark = await measurePerformance(async () => {
        await creatorDashboardService.createCreatorDashboard({
          userId: testUserId,
          displayName: 'Test Creator'
        });
      });

      // Performance assertions
      expect(benchmark.averageTime).toBeLessThan(1000); // Less than 1 second
      expect(benchmark.operationsPerSecond).toBeGreaterThan(1); // At least 1 op/sec
      expect(benchmark.memoryUsage).toBeLessThan(50 * 1024 * 1024);
      
      console.log('CreatorDashboardService Performance:', {
        averageTime: `${benchmark.averageTime.toFixed(2)}ms`,
        operationsPerSecond: `${benchmark.operationsPerSecond.toFixed(2)} ops/sec`,
        memoryUsage: `${(benchmark.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
      });
    });

    it('should benchmark MediaService operations', async () => {
      const mockUploadMedia = jest.fn().mockResolvedValue({ id: 'media-123', url: 'https://example.com/media.jpg' });
      (mediaService.uploadMedia as jest.Mock).mockImplementation(mockUploadMedia);

      const benchmark = await measurePerformance(async () => {
        await mediaService.uploadMedia({
          userId: testUserId,
          file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
          metadata: { title: 'Test Media' }
        });
      });

      // Performance assertions
      expect(benchmark.averageTime).toBeLessThan(3000); // Less than 3 seconds
      expect(benchmark.operationsPerSecond).toBeGreaterThan(0.3); // At least 0.3 ops/sec
      expect(benchmark.memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      
      console.log('MediaService Performance:', {
        averageTime: `${benchmark.averageTime.toFixed(2)}ms`,
        operationsPerSecond: `${benchmark.operationsPerSecond.toFixed(2)} ops/sec`,
        memoryUsage: `${(benchmark.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
      });
    });
  });

  describe('Performance Monitor Benchmarks', () => {
    it('should benchmark performance metric tracking', async () => {
      const benchmark = await measurePerformance(async () => {
        await performanceMonitor.trackOperation('test_operation', performance.now(), testUserId);
      }, 1000); // More iterations for accurate measurement

      // Performance assertions
      expect(benchmark.averageTime).toBeLessThan(10); // Less than 10ms
      expect(benchmark.operationsPerSecond).toBeGreaterThan(50); // At least 50 ops/sec
      expect(benchmark.memoryUsage).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      
      console.log('Performance Metric Tracking:', {
        averageTime: `${benchmark.averageTime.toFixed(2)}ms`,
        operationsPerSecond: `${benchmark.operationsPerSecond.toFixed(2)} ops/sec`,
        memoryUsage: `${(benchmark.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
      });
    });

    it('should benchmark analytics calculation performance', async () => {
      // Create some test data first
      for (let i = 0; i < 100; i++) {
        await performanceMonitor.trackOperation(`test_operation_${i}`, performance.now(), testUserId);
      }

      const benchmark = await measurePerformance(async () => {
        await performanceMonitor.getPerformanceAnalytics(testUserId);
      });

      // Performance assertions
      expect(benchmark.averageTime).toBeLessThan(500); // Less than 500ms
      expect(benchmark.operationsPerSecond).toBeGreaterThan(1); // At least 1 op/sec
      expect(benchmark.memoryUsage).toBeLessThan(50 * 1024 * 1024);
      
      console.log('Analytics Calculation Performance:', {
        averageTime: `${benchmark.averageTime.toFixed(2)}ms`,
        operationsPerSecond: `${benchmark.operationsPerSecond.toFixed(2)} ops/sec`,
        memoryUsage: `${(benchmark.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
      });
    });
  });

  describe('Load Testing', () => {
    it('should handle concurrent user load', async () => {
      const concurrentUsers = BENCHMARK_CONFIG.concurrentUsers;
      const startTime = performance.now();

      // Simulate concurrent users
      const userPromises = Array.from({ length: concurrentUsers }, (_, i) => 
        (async () => {
          const userId = `user-${i}`;
          const flowId = await dataFlowValidator.startDataFlow('tip_creation', userId);
          
          await dataFlowValidator.recordEvent(flowId, {
            eventType: 'user_interaction',
            eventName: 'tip_created',
            userId,
            status: 'completed'
          });

          await dataFlowValidator.completeDataFlow(flowId);
          return flowId;
        })()
      );

      // Wait for all users to complete
      const flowIds = await Promise.all(userPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Performance assertions
      expect(flowIds.length).toBe(concurrentUsers);
      expect(totalTime).toBeLessThan(BENCHMARK_CONFIG.timeout);
      
      // Calculate throughput
      const throughput = (concurrentUsers / totalTime) * 1000; // users per second
      expect(throughput).toBeGreaterThan(0.5); // At least 0.5 users per second
      
      console.log('Concurrent User Load Test:', {
        concurrentUsers,
        totalTime: `${totalTime.toFixed(2)}ms`,
        throughput: `${throughput.toFixed(2)} users/sec`
      });
    });

    it('should handle high-volume data processing', async () => {
      const highVolumeOperations = 1000;
      const startTime = performance.now();

      // Perform high-volume operations
      const operationPromises = Array.from({ length: highVolumeOperations }, (_, i) =>
        performanceMonitor.trackOperation(`high_volume_operation_${i}`, performance.now(), testUserId)
      );

      await Promise.all(operationPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Performance assertions
      expect(totalTime).toBeLessThan(BENCHMARK_CONFIG.timeout);
      
      // Calculate throughput
      const throughput = (highVolumeOperations / totalTime) * 1000; // operations per second
      expect(throughput).toBeGreaterThan(10); // At least 10 ops/sec
      
      console.log('High-Volume Data Processing:', {
        operations: highVolumeOperations,
        totalTime: `${totalTime.toFixed(2)}ms`,
        throughput: `${throughput.toFixed(2)} ops/sec`
      });
    });
  });

  describe('Stress Testing', () => {
    it('should handle stress test with continuous operations', async () => {
      const stressTestDuration = BENCHMARK_CONFIG.stressTestDuration;
      const startTime = performance.now();
      let operationCount = 0;
      const errors: Error[] = [];

      // Run stress test for specified duration
      while (performance.now() - startTime < stressTestDuration) {
        try {
          const flowId = await dataFlowValidator.startDataFlow('tip_creation', testUserId);
          
          await dataFlowValidator.recordEvent(flowId, {
            eventType: 'user_interaction',
            eventName: 'tip_created',
            userId: testUserId,
            status: 'completed'
          });

          await dataFlowValidator.completeDataFlow(flowId);
          operationCount++;
        } catch (error) {
          errors.push(error as Error);
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Performance assertions
      expect(operationCount).toBeGreaterThan(0);
      expect(errors.length).toBeLessThan(operationCount * 0.1); // Less than 10% error rate
      
      // Calculate throughput
      const throughput = (operationCount / totalTime) * 1000; // operations per second
      expect(throughput).toBeGreaterThan(0.1); // At least 0.1 ops/sec
      
      console.log('Stress Test Results:', {
        duration: `${stressTestDuration}ms`,
        operations: operationCount,
        errors: errors.length,
        errorRate: `${((errors.length / operationCount) * 100).toFixed(2)}%`,
        throughput: `${throughput.toFixed(2)} ops/sec`
      });
    });

    it('should handle memory stress test', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryOperations = 10000;
      const startTime = performance.now();

      // Perform memory-intensive operations
      for (let i = 0; i < memoryOperations; i++) {
        await performanceMonitor.trackOperation(`memory_operation_${i}`, performance.now(), testUserId, {
          data: new Array(1000).fill('test data') // Create large data objects
        });
      }

      const endTime = performance.now();
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      const totalTime = endTime - startTime;

      // Performance assertions
      expect(totalTime).toBeLessThan(BENCHMARK_CONFIG.timeout);
      expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024); // Less than 500MB increase
      
      // Calculate throughput
      const throughput = (memoryOperations / totalTime) * 1000;
      expect(throughput).toBeGreaterThan(5); // At least 5 ops/sec
      
      console.log('Memory Stress Test:', {
        operations: memoryOperations,
        totalTime: `${totalTime.toFixed(2)}ms`,
        memoryIncrease: `${(memoryIncrease / (1024 * 1024)).toFixed(2)}MB`,
        throughput: `${throughput.toFixed(2)} ops/sec`
      });
    });
  });

  describe('Network Performance Testing', () => {
    it('should benchmark network request performance', async () => {
      const benchmark = await measurePerformance(async () => {
        await performanceMonitor.trackNetworkRequest(
          'https://api.stripe.com/v1/payment_intents',
          'POST',
          performance.now(),
          200,
          1024,
          testUserId
        );
      }, 100);

      // Performance assertions
      expect(benchmark.averageTime).toBeLessThan(100); // Less than 100ms for tracking
      expect(benchmark.operationsPerSecond).toBeGreaterThan(5); // At least 5 ops/sec
      
      console.log('Network Request Tracking Performance:', {
        averageTime: `${benchmark.averageTime.toFixed(2)}ms`,
        operationsPerSecond: `${benchmark.operationsPerSecond.toFixed(2)} ops/sec`
      });
    });

    it('should handle network latency simulation', async () => {
      const latencySimulations = [100, 500, 1000, 2000]; // Different latency values
      const results: Array<{ latency: number; averageTime: number }> = [];

      for (const latency of latencySimulations) {
        const benchmark = await measurePerformance(async () => {
          // Simulate network latency
          await new Promise(resolve => setTimeout(resolve, latency));
          
          await performanceMonitor.trackNetworkRequest(
            'https://api.stripe.com/v1/payment_intents',
            'POST',
            performance.now(),
            200,
            1024,
            testUserId
          );
        }, 10);

        results.push({ latency, averageTime: benchmark.averageTime });
      }

      // Verify that simulated latency affects performance
      for (let i = 1; i < results.length; i++) {
        expect(results[i].averageTime).toBeGreaterThan(results[i - 1].averageTime);
      }
      
      console.log('Network Latency Simulation Results:', results);
    });
  });

  describe('Memory Performance Testing', () => {
    it('should benchmark memory usage patterns', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryOperations = 1000;
      const memorySnapshots: number[] = [];

      // Perform operations and track memory usage
      for (let i = 0; i < memoryOperations; i++) {
        await performanceMonitor.trackOperation(`memory_test_${i}`, performance.now(), testUserId);
        
        if (i % 100 === 0) {
          memorySnapshots.push(performance.memory?.usedJSHeapSize || 0);
        }
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const totalMemoryIncrease = finalMemory - initialMemory;

      // Performance assertions
      expect(totalMemoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB increase
      expect(memorySnapshots.length).toBeGreaterThan(0);
      
      // Check for memory leaks (memory should not continuously increase)
      const memoryGrowth = memorySnapshots.slice(1).map((memory, index) => 
        memory - memorySnapshots[index]
      );
      
      const averageGrowth = memoryGrowth.reduce((sum, growth) => sum + growth, 0) / memoryGrowth.length;
      expect(averageGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB average growth
      
      console.log('Memory Usage Pattern Test:', {
        operations: memoryOperations,
        totalMemoryIncrease: `${(totalMemoryIncrease / (1024 * 1024)).toFixed(2)}MB`,
        averageGrowth: `${(averageGrowth / (1024 * 1024)).toFixed(2)}MB per snapshot`
      });
    });

    it('should handle garbage collection performance', async () => {
      const gcOperations = 100;
      const startTime = performance.now();

      // Perform operations that should trigger garbage collection
      for (let i = 0; i < gcOperations; i++) {
        // Create temporary objects
        const tempData = new Array(1000).fill(`temp_data_${i}`);
        
        await performanceMonitor.trackOperation(`gc_test_${i}`, performance.now(), testUserId, {
          tempData
        });

        // Clear references to allow garbage collection
        tempData.length = 0;
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Performance assertions
      expect(totalTime).toBeLessThan(BENCHMARK_CONFIG.timeout);
      
      // Calculate throughput
      const throughput = (gcOperations / totalTime) * 1000;
      expect(throughput).toBeGreaterThan(1); // At least 1 op/sec
      
      console.log('Garbage Collection Performance:', {
        operations: gcOperations,
        totalTime: `${totalTime.toFixed(2)}ms`,
        throughput: `${throughput.toFixed(2)} ops/sec`
      });
    });
  });
}); 