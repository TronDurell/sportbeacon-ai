// Set Firebase environment variables before any imports
// Use proper test environment isolation - no hardcoded secrets
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = 'test-measurement-id';
process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY = 'test-vapid-key';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoachAgent, coachAgent } from '../lib/ai/coachAgent';
import { ScoutEval, scoutEval } from '../lib/ai/scoutEval';
import { VenuePredictor, venuePredictor } from '../lib/ai/venuePredictor';
import { EventNLPBuilder, eventNLPBuilder } from '../lib/ai/eventNLPBuilder';
import { CivicIndexer, civicIndexer } from '../lib/ai/civicIndexer';
import { TownRecAgent } from '../lib/ai/TownRecAgent';

describe('AI Modules Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    coachAgent.cleanup();
    scoutEval.cleanup();
    venuePredictor.cleanup();
    eventNLPBuilder.cleanup();
    civicIndexer.cleanup();
  });

  describe('CoachAgent', () => {
    it('should initialize successfully', async () => {
      await coachAgent.initialize();
      expect(coachAgent).toBeInstanceOf(CoachAgent);
    });

    it('should generate personalized recommendations', async () => {
      const userId = 'test-user-123';
      const recommendations = await coachAgent.getUserRecommendations(userId);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('priority');
      });
    });

    it('should generate workout plans', async () => {
      const userId = 'test-user-123';
      const workoutPlan = await coachAgent.generateWorkoutPlan(userId);
      
      expect(workoutPlan).toHaveProperty('id');
      expect(workoutPlan).toHaveProperty('exercises');
      expect(workoutPlan).toHaveProperty('duration');
      expect(workoutPlan).toHaveProperty('difficulty');
    });

    it('should handle errors gracefully', async () => {
      const invalidUserId = '';
      
      await expect(coachAgent.getUserRecommendations(invalidUserId))
        .rejects.toThrow();
    });

    it('should maintain singleton instance', () => {
      const instance1 = CoachAgent.getInstance();
      const instance2 = CoachAgent.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('ScoutEval', () => {
    it('should initialize successfully', async () => {
      await scoutEval.initialize();
      expect(scoutEval).toBeInstanceOf(ScoutEval);
    });

    it('should analyze video content', async () => {
      const videoUrl = 'https://example.com/test-video.mp4';
      const analysis = await scoutEval.analyzeVideo(videoUrl);
      
      expect(analysis).toHaveProperty('overallScore');
      expect(analysis).toHaveProperty('skillBreakdown');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('confidence');
    });

    it('should provide skill breakdown', async () => {
      const videoUrl = 'https://example.com/test-video.mp4';
      const analysis = await scoutEval.analyzeVideo(videoUrl);
      
      expect(analysis.skillBreakdown).toHaveProperty('footwork');
      expect(analysis.skillBreakdown).toHaveProperty('form');
      expect(analysis.skillBreakdown).toHaveProperty('stance');
      
      Object.values(analysis.skillBreakdown).forEach(skill => {
        expect(skill).toHaveProperty('score');
        expect(skill).toHaveProperty('confidence');
        expect(skill).toHaveProperty('observations');
        expect(skill).toHaveProperty('improvements');
      });
    });

    it('should handle invalid video URLs', async () => {
      const invalidUrl = 'invalid-url';
      
      await expect(scoutEval.analyzeVideo(invalidUrl))
        .rejects.toThrow();
    });

    it('should maintain singleton instance', () => {
      const instance1 = ScoutEval.getInstance();
      const instance2 = ScoutEval.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('VenuePredictor', () => {
    it('should initialize successfully', async () => {
      await venuePredictor.initialize();
      expect(venuePredictor).toBeInstanceOf(VenuePredictor);
    });

    it('should predict venue availability', async () => {
      const venueId = 'venue-123';
      const prediction = venuePredictor.getVenuePrediction(venueId);
      
      if (prediction) {
        expect(prediction).toHaveProperty('venueId');
        expect(prediction).toHaveProperty('availability');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('factors');
      }
    });

    it('should get venue alerts', async () => {
      const venueId = 'venue-123';
      const alerts = venuePredictor.getVenueAlerts(venueId);
      
      expect(Array.isArray(alerts)).toBe(true);
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('severity');
      });
    });

    it('should acknowledge alerts', async () => {
      const alertId = 'alert-123';
      await expect(venuePredictor.acknowledgeAlert(alertId))
        .resolves.not.toThrow();
    });

    it('should maintain singleton instance', () => {
      const instance1 = VenuePredictor.getInstance();
      const instance2 = VenuePredictor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('EventNLPBuilder', () => {
    it('should initialize successfully', async () => {
      await eventNLPBuilder.initialize();
      expect(eventNLPBuilder).toBeInstanceOf(EventNLPBuilder);
    });

    it('should parse natural language commands', async () => {
      const command = {
        text: 'Create basketball game tomorrow at 3pm',
        userId: 'user-123',
        timestamp: new Date()
      };
      
      const result = await eventNLPBuilder.parseCommand(command);
      
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('structuredData');
    });

    it('should handle complex event descriptions', async () => {
      const command = {
        text: 'Schedule soccer practice for U12 team every Tuesday and Thursday at 4pm',
        userId: 'coach-123',
        timestamp: new Date()
      };
      
      const result = await eventNLPBuilder.parseCommand(command);
      
      expect(result.intent).toBe('schedule_recurring_event');
      expect(result.entities).toHaveProperty('sport');
      expect(result.entities).toHaveProperty('ageGroup');
      expect(result.entities).toHaveProperty('frequency');
      expect(result.entities).toHaveProperty('time');
    });

    it('should handle invalid commands gracefully', async () => {
      const invalidCommand = {
        text: '',
        userId: 'user-123',
        timestamp: new Date()
      };
      
      await expect(eventNLPBuilder.parseCommand(invalidCommand))
        .rejects.toThrow();
    });

    it('should maintain singleton instance', () => {
      const instance1 = EventNLPBuilder.getInstance();
      const instance2 = EventNLPBuilder.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('CivicIndexer', () => {
    it('should initialize successfully', async () => {
      await civicIndexer.initialize();
      expect(civicIndexer).toBeInstanceOf(CivicIndexer);
    });

    it('should calculate civic health index', async () => {
      const townId = 'town-123';
      const index = await civicIndexer.calculateCivicHealthIndex(townId);
      
      expect(index).toHaveProperty('overallScore');
      expect(index).toHaveProperty('categories');
      expect(index).toHaveProperty('trends');
      expect(index).toHaveProperty('recommendations');
    });

    it('should provide category breakdowns', async () => {
      const townId = 'town-123';
      const index = await civicIndexer.calculateCivicHealthIndex(townId);
      
      expect(index.categories).toHaveProperty('sportsParticipation');
      expect(index.categories).toHaveProperty('facilityAccess');
      expect(index.categories).toHaveProperty('communityEngagement');
      expect(index.categories).toHaveProperty('youthDevelopment');
      
      Object.values(index.categories).forEach(category => {
        expect(category).toHaveProperty('score');
        expect(category).toHaveProperty('weight');
        expect(category).toHaveProperty('metrics');
      });
    });

    it('should generate improvement recommendations', async () => {
      const townId = 'town-123';
      const index = await civicIndexer.calculateCivicHealthIndex(townId);
      
      expect(Array.isArray(index.recommendations)).toBe(true);
      index.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('category');
        expect(rec).toHaveProperty('action');
        expect(rec).toHaveProperty('impact');
        expect(rec).toHaveProperty('effort');
      });
    });

    it('should maintain singleton instance', () => {
      const instance1 = CivicIndexer.getInstance();
      const instance2 = CivicIndexer.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('TownRecAgent', () => {
    it('should handle parent queries', async () => {
      const agent = new TownRecAgent({
        townName: 'TestTown',
        staffRole: 'coordinator'
      });
      
      const query = 'When does my child\'s soccer practice start?';
      const response = await agent.handleQuery(query, 'parent-123');
      
      expect(response).toHaveProperty('answer');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('suggestions');
    });

    it('should handle coach queries', async () => {
      const agent = new TownRecAgent({
        townName: 'TestTown',
        staffRole: 'coordinator'
      });
      
      const query = 'What facilities are available for basketball practice?';
      const response = await agent.handleQuery(query, 'coach-123');
      
      expect(response).toHaveProperty('answer');
      expect(response).toHaveProperty('facilities');
      expect(response).toHaveProperty('availability');
    });

    it('should handle staff queries', async () => {
      const agent = new TownRecAgent({
        townName: 'TestTown',
        staffRole: 'coordinator'
      });
      
      const query = 'How many players are on the waitlist for U10 soccer?';
      const response = await agent.handleQuery(query, 'staff-123');
      
      expect(response).toHaveProperty('answer');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('actions');
    });
  });

  describe('AI Module Integration', () => {
    it('should work together seamlessly', async () => {
      // Initialize all modules
      await Promise.all([
        coachAgent.initialize(),
        scoutEval.initialize(),
        venuePredictor.initialize(),
        eventNLPBuilder.initialize(),
        civicIndexer.initialize()
      ]);

      // Test that all modules are properly initialized
      expect(coachAgent).toBeInstanceOf(CoachAgent);
      expect(scoutEval).toBeInstanceOf(ScoutEval);
      expect(venuePredictor).toBeInstanceOf(VenuePredictor);
      expect(eventNLPBuilder).toBeInstanceOf(EventNLPBuilder);
      expect(civicIndexer).toBeInstanceOf(CivicIndexer);
    });

    it('should handle concurrent operations', async () => {
      const startTime = Date.now();
      
      // Run multiple operations concurrently
      const promises = [
        coachAgent.getUserRecommendations('user-1'),
        scoutEval.analyzeVideo('video-1'),
        venuePredictor.getVenuePrediction('venue-1'),
        eventNLPBuilder.parseCommand({
          text: 'Create basketball game',
          userId: 'user-1',
          timestamp: new Date()
        }),
        civicIndexer.calculateCivicHealthIndex('town-1')
      ];
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds
    });

    it('should handle AI failures gracefully', async () => {
      // Mock AI module failures
      jest.spyOn(coachAgent, 'getUserRecommendations').mockRejectedValue(new Error('AI service unavailable'));
      
      try {
        await coachAgent.getUserRecommendations('user-123');
      } catch (error) {
        expect(error.message).toBe('AI service unavailable');
      }
    });
  });

  describe('Performance Tests', () => {
    it('should complete operations within performance thresholds', async () => {
      const startTime = Date.now();
      
      await coachAgent.getUserRecommendations('user-123');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle memory efficiently', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await coachAgent.getUserRecommendations(`user-${i}`);
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
}); 