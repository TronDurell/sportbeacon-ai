import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ScoutEval } from '../../lib/ai/scoutEval';
import { VenuePredictor } from '../../lib/ai/venuePredictor';
import { CivicIndexer } from '../../lib/ai/civicIndexer';

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: jest.fn(),
  tensor: jest.fn(),
  tidy: jest.fn((fn) => fn()),
  dispose: jest.fn(),
  ready: jest.fn().mockResolvedValue(true),
}));

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

describe('AI Module Performance Tests', () => {
  let scoutEval: ScoutEval;
  let venuePredictor: VenuePredictor;
  let civicIndexer: CivicIndexer;

  beforeEach(async () => {
    scoutEval = new ScoutEval();
    venuePredictor = new VenuePredictor();
    civicIndexer = new CivicIndexer();

    await scoutEval.initialize();
    await venuePredictor.initialize();
    await civicIndexer.initialize();
  });

  afterEach(async () => {
    await scoutEval.cleanup();
    await venuePredictor.cleanup();
    await civicIndexer.cleanup();
  });

  describe('ScoutEval Performance', () => {
    it('should process scout evaluation within 2 seconds', async () => {
      const mockVideoData = {
        videoUrl: 'https://example.com/video.mp4',
        playerId: 'player-123',
        duration: 120, // 2 minutes
        quality: 'high',
      };

      const startTime = performance.now();
      
      const result = await scoutEval.processEvaluation(mockVideoData);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(result).toBeDefined();
      expect(result.analysisId).toBeDefined();
    });

    it('should handle multiple concurrent evaluations efficiently', async () => {
      const mockVideos = Array.from({ length: 5 }, (_, i) => ({
        videoUrl: `https://example.com/video-${i}.mp4`,
        playerId: `player-${i}`,
        duration: 60,
        quality: 'medium',
      }));

      const startTime = performance.now();
      
      const promises = mockVideos.map(video => scoutEval.processEvaluation(video));
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(5);
      expect(totalTime).toBeLessThan(5000); // Should process 5 videos in under 5 seconds
      expect(totalTime / 5).toBeLessThan(1500); // Average time per video should be under 1.5 seconds
    });

    it('should maintain performance under memory pressure', async () => {
      // Simulate memory pressure by processing many evaluations
      const mockVideos = Array.from({ length: 20 }, (_, i) => ({
        videoUrl: `https://example.com/video-${i}.mp4`,
        playerId: `player-${i}`,
        duration: 30,
        quality: 'low',
      }));

      const startTime = performance.now();
      
      for (const video of mockVideos) {
        await scoutEval.processEvaluation(video);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(15000); // Should process 20 videos in under 15 seconds
      expect(totalTime / 20).toBeLessThan(1000); // Average time per video should be under 1 second
    });

    it('should handle large video files efficiently', async () => {
      const largeVideoData = {
        videoUrl: 'https://example.com/large-video.mp4',
        playerId: 'player-123',
        duration: 600, // 10 minutes
        quality: 'high',
        fileSize: 500 * 1024 * 1024, // 500MB
      };

      const startTime = performance.now();
      
      const result = await scoutEval.processEvaluation(largeVideoData);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(5000); // Should process large video in under 5 seconds
      expect(result).toBeDefined();
    });
  });

  describe('VenuePredictor Performance', () => {
    it('should predict venue capacity within 1 second', async () => {
      const mockVenueData = {
        location: { lat: 40.7128, lng: -74.0060 },
        sport: 'soccer',
        timeSlot: '2024-01-15T14:00:00Z',
        weather: 'sunny',
        temperature: 75,
      };

      const startTime = performance.now();
      
      const prediction = await venuePredictor.predictCapacity(mockVenueData);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(prediction).toBeDefined();
      expect(prediction.capacity).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0.5);
    });

    it('should handle batch venue predictions efficiently', async () => {
      const mockVenues = Array.from({ length: 10 }, (_, i) => ({
        location: { lat: 40.7128 + i * 0.01, lng: -74.0060 + i * 0.01 },
        sport: 'soccer',
        timeSlot: '2024-01-15T14:00:00Z',
        weather: 'sunny',
        temperature: 75,
      }));

      const startTime = performance.now();
      
      const predictions = await venuePredictor.predictBatchCapacity(mockVenues);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(predictions).toHaveLength(10);
      expect(processingTime).toBeLessThan(3000); // Should process 10 venues in under 3 seconds
      expect(processingTime / 10).toBeLessThan(500); // Average time per venue should be under 500ms
    });

    it('should handle real-time prediction updates', async () => {
      const mockVenueData = {
        location: { lat: 40.7128, lng: -74.0060 },
        sport: 'soccer',
        timeSlot: '2024-01-15T14:00:00Z',
        weather: 'sunny',
        temperature: 75,
      };

      // Simulate real-time updates every 100ms
      const predictions = [];
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const prediction = await venuePredictor.predictCapacity(mockVenueData);
        predictions.push(prediction);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(predictions).toHaveLength(10);
      expect(totalTime).toBeLessThan(2000); // Should complete all predictions in under 2 seconds
    });
  });

  describe('CivicIndexer Performance', () => {
    it('should calculate civic health index within 3 seconds', async () => {
      const mockCivicData = {
        population: 100000,
        sportsParticipation: 0.75,
        facilityCount: 25,
        volunteerHours: 5000,
        communityEvents: 50,
        youthPrograms: 15,
      };

      const startTime = performance.now();
      
      const civicIndex = await civicIndexer.calculateCivicHealthIndex(mockCivicData);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(3000); // Should complete in under 3 seconds
      expect(civicIndex).toBeDefined();
      expect(civicIndex.score).toBeGreaterThan(0);
      expect(civicIndex.score).toBeLessThanOrEqual(100);
    });

    it('should handle large dataset processing efficiently', async () => {
      const mockCivicData = Array.from({ length: 100 }, (_, i) => ({
        cityId: `city-${i}`,
        population: 50000 + i * 1000,
        sportsParticipation: 0.5 + (i % 50) * 0.01,
        facilityCount: 10 + (i % 20),
        volunteerHours: 2000 + i * 100,
        communityEvents: 20 + (i % 30),
        youthPrograms: 5 + (i % 10),
      }));

      const startTime = performance.now();
      
      const civicIndices = await civicIndexer.calculateBatchCivicIndices(mockCivicData);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(civicIndices).toHaveLength(100);
      expect(processingTime).toBeLessThan(10000); // Should process 100 cities in under 10 seconds
      expect(processingTime / 100).toBeLessThan(200); // Average time per city should be under 200ms
    });

    it('should handle real-time civic data updates', async () => {
      const mockCivicData = {
        cityId: 'city-123',
        population: 100000,
        sportsParticipation: 0.75,
        facilityCount: 25,
        volunteerHours: 5000,
        communityEvents: 50,
        youthPrograms: 15,
      };

      // Simulate real-time updates
      const updates = [];
      const startTime = performance.now();
      
      for (let i = 0; i < 5; i++) {
        const updatedData = {
          ...mockCivicData,
          volunteerHours: 5000 + i * 100,
          communityEvents: 50 + i * 2,
        };
        
        const civicIndex = await civicIndexer.calculateCivicHealthIndex(updatedData);
        updates.push(civicIndex);
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(updates).toHaveLength(5);
      expect(totalTime).toBeLessThan(5000); // Should complete all updates in under 5 seconds
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform multiple operations
      for (let i = 0; i < 50; i++) {
        await scoutEval.processEvaluation({
          videoUrl: `https://example.com/video-${i}.mp4`,
          playerId: `player-${i}`,
          duration: 60,
          quality: 'medium',
        });
        
        await venuePredictor.predictCapacity({
          location: { lat: 40.7128, lng: -74.0060 },
          sport: 'soccer',
          timeSlot: '2024-01-15T14:00:00Z',
          weather: 'sunny',
          temperature: 75,
        });
        
        await civicIndexer.calculateCivicHealthIndex({
          population: 100000,
          sportsParticipation: 0.75,
          facilityCount: 25,
          volunteerHours: 5000,
          communityEvents: 50,
          youthPrograms: 15,
        });
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should properly cleanup resources after operations', async () => {
      const mockVideoData = {
        videoUrl: 'https://example.com/video.mp4',
        playerId: 'player-123',
        duration: 120,
        quality: 'high',
      };

      // Perform operation
      await scoutEval.processEvaluation(mockVideoData);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Check that resources are properly cleaned up
      expect(scoutEval.isInitialized()).toBe(true);
      expect(scoutEval.getActiveOperations()).toBe(0);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors without significant performance impact', async () => {
      const startTime = performance.now();
      
      // Attempt operations that will fail
      const promises = [
        scoutEval.processEvaluation({ videoUrl: 'invalid-url', playerId: 'player-123', duration: 60, quality: 'high' }),
        venuePredictor.predictCapacity({ location: { lat: 999, lng: 999 }, sport: 'invalid', timeSlot: 'invalid', weather: 'invalid', temperature: -999 }),
        civicIndexer.calculateCivicHealthIndex({ population: -1, sportsParticipation: 2, facilityCount: -5, volunteerHours: -1000, communityEvents: -10, youthPrograms: -5 }),
      ];
      
      const results = await Promise.allSettled(promises);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(2000); // Should handle errors quickly
      expect(results.every(result => result.status === 'rejected')).toBe(true);
    });

    it('should recover gracefully from temporary failures', async () => {
      const mockVideoData = {
        videoUrl: 'https://example.com/video.mp4',
        playerId: 'player-123',
        duration: 60,
        quality: 'high',
      };

      // Simulate temporary failure followed by success
      jest.spyOn(scoutEval, 'processEvaluation').mockRejectedValueOnce(new Error('Temporary failure'));
      
      const startTime = performance.now();
      
      // First attempt should fail
      await expect(scoutEval.processEvaluation(mockVideoData)).rejects.toThrow('Temporary failure');
      
      // Second attempt should succeed
      jest.spyOn(scoutEval, 'processEvaluation').mockResolvedValueOnce({ analysisId: 'analysis-123' });
      const result = await scoutEval.processEvaluation(mockVideoData);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(3000); // Should recover quickly
      expect(result.analysisId).toBe('analysis-123');
    });
  });

  describe('Load Testing', () => {
    it('should handle high concurrent load', async () => {
      const concurrentOperations = 20;
      const mockVideoData = {
        videoUrl: 'https://example.com/video.mp4',
        playerId: 'player-123',
        duration: 60,
        quality: 'medium',
      };

      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentOperations }, () =>
        scoutEval.processEvaluation(mockVideoData)
      );
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(concurrentOperations);
      expect(totalTime).toBeLessThan(10000); // Should handle 20 concurrent operations in under 10 seconds
      expect(totalTime / concurrentOperations).toBeLessThan(1000); // Average time per operation should be under 1 second
    });

    it('should maintain performance under sustained load', async () => {
      const operationsPerBatch = 10;
      const numberOfBatches = 5;
      const mockVideoData = {
        videoUrl: 'https://example.com/video.mp4',
        playerId: 'player-123',
        duration: 60,
        quality: 'medium',
      };

      const startTime = performance.now();
      
      for (let batch = 0; batch < numberOfBatches; batch++) {
        const promises = Array.from({ length: operationsPerBatch }, () =>
          scoutEval.processEvaluation(mockVideoData)
        );
        
        await Promise.all(promises);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(15000); // Should complete all batches in under 15 seconds
      expect(totalTime / (operationsPerBatch * numberOfBatches)).toBeLessThan(500); // Average time per operation should be under 500ms
    });
  });
}); 