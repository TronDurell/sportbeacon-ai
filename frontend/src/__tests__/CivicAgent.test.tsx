import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CivicAgent, { CivicQuery, MunicipalityConfig, LeaguePolicy } from '../lib/ai/CivicAgent';

// Mock analytics tracker
jest.mock('../lib/analytics/eventTracking', () => ({
  analyticsTracker: {
    trackEvent: jest.fn(),
    startFeatureSession: jest.fn(() => 'test-session-id'),
    endFeatureSession: jest.fn()
  }
}));

// Mock municipal data
const mockLeaguePolicies: LeaguePolicy[] = [
  {
    sport: 'soccer',
    ageGroups: [
      { minAge: 5, maxAge: 7, name: 'U8', skillLevel: 'beginner', description: 'Introduction to soccer' },
      { minAge: 8, maxAge: 10, name: 'U10', skillLevel: 'intermediate', description: 'Developing skills' }
    ],
    registrationDeadlines: [new Date('2024-02-01')],
    refundPolicy: 'Full refund within 7 days of registration',
    equipmentRequirements: ['cleats', 'shin guards'],
    practiceSchedule: 'Tuesdays and Thursdays 5-6 PM',
    gameSchedule: 'Saturdays 9 AM - 12 PM',
    cost: 150,
    maxPlayers: 12,
    minPlayers: 8,
    waitlistPolicy: 'Players added as spots become available',
    siblingDiscount: 10,
    financialAid: true
  },
  {
    sport: 'basketball',
    ageGroups: [
      { minAge: 8, maxAge: 10, name: 'U10', skillLevel: 'beginner', description: 'Introduction to basketball' },
      { minAge: 11, maxAge: 13, name: 'U13', skillLevel: 'intermediate', description: 'Developing skills' }
    ],
    registrationDeadlines: [new Date('2024-01-15')],
    refundPolicy: '50% refund within 14 days of registration',
    equipmentRequirements: ['basketball shoes'],
    practiceSchedule: 'Mondays and Wednesdays 6-7 PM',
    gameSchedule: 'Fridays 6-8 PM',
    cost: 120,
    maxPlayers: 10,
    minPlayers: 6,
    waitlistPolicy: 'No waitlist available',
    siblingDiscount: 15,
    financialAid: false
  }
];

describe('CivicAgent', () => {
  let agent: CivicAgent;

  beforeEach(() => {
    agent = new CivicAgent('Cary', mockLeaguePolicies, 'public');
  });

  afterEach(() => {
    agent.endSession();
  });

  describe('Initialization', () => {
    test('should initialize with municipality configuration', () => {
      expect(agent).toBeDefined();
    });

    test('should provide onboarding assistant', async () => {
      const response = await agent.getOnboardingAssistant();
      
      expect(response.answer).toContain('Cary');
      expect(response.confidence).toBeGreaterThan(0.8);
      expect(response.contactInfo).toBeDefined();
      expect(response.nextSteps).toBeDefined();
    });
  });

  describe('Policy Queries', () => {
    test('should handle refund policy questions', async () => {
      const query: CivicQuery = {
        type: 'policy',
        question: 'What is the refund policy?',
        context: {}
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toContain('refund');
      expect(response.confidence).toBeGreaterThan(0.8);
      expect(response.relatedPolicies).toBeDefined();
    });

    test('should handle age requirement questions', async () => {
      const query: CivicQuery = {
        type: 'policy',
        question: 'What are the age requirements for soccer?',
        context: {}
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toContain('Age Groups');
      expect(response.relatedPolicies).toBeDefined();
    });

    test('should handle cost questions', async () => {
      const query: CivicQuery = {
        type: 'policy',
        question: 'How much does it cost to register?',
        context: {}
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toContain('Cost');
      expect(response.relatedPolicies).toBeDefined();
    });

    test('should handle sibling discount questions', async () => {
      const query: CivicQuery = {
        type: 'policy',
        question: 'Do you offer sibling discounts?',
        context: {}
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toContain('sibling');
      expect(response.relatedPolicies).toBeDefined();
    });
  });

  describe('Registration Queries', () => {
    test('should handle registration questions with age and sport', async () => {
      const query: CivicQuery = {
        type: 'registration',
        question: 'How do I register my 8-year-old for soccer?',
        context: { childAge: 8, sport: 'soccer' }
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toContain('Registration');
      expect(response.relatedPolicies).toBeDefined();
      expect(response.nextSteps).toBeDefined();
    });

    test('should handle registration without specific details', async () => {
      const query: CivicQuery = {
        type: 'registration',
        question: 'How do I register?',
        context: {}
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toContain('age');
      expect(response.answer).toContain('sport');
    });
  });

  describe('Facility Queries', () => {
    test('should handle facility questions', async () => {
      const query: CivicQuery = {
        type: 'facility',
        question: 'Where are the soccer fields located?',
        context: { sport: 'soccer' }
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toContain('facilities');
      expect(response.recommendedFacilities).toBeDefined();
    });

    test('should handle general facility questions', async () => {
      const query: CivicQuery = {
        type: 'facility',
        question: 'What facilities are available?',
        context: {}
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toContain('facilities');
      expect(response.recommendedFacilities).toBeDefined();
    });
  });

  describe('Recommendation Queries', () => {
    test('should provide league recommendations based on age', async () => {
      const query: CivicQuery = {
        type: 'recommendation',
        question: 'What league is best for my 8-year-old?',
        context: { childAge: 8 }
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toContain('Recommended');
      expect(response.relatedPolicies).toBeDefined();
    });

    test('should provide recommendations with budget constraints', async () => {
      const query: CivicQuery = {
        type: 'recommendation',
        question: 'What leagues are available under $100?',
        context: { budget: 100 }
      };

      const response = await agent.handleQuery(query);
      
      // Since basketball costs $120, it should not be recommended for $100 budget
      expect(response.answer).toContain('No leagues match your criteria');
      expect(response.relatedPolicies).toBeDefined();
    });

    test('should provide recommendations with skill level', async () => {
      const query: CivicQuery = {
        type: 'recommendation',
        question: 'What programs are available for beginners?',
        context: { skillLevel: 'beginner' }
      };

      const response = await agent.handleQuery(query);
      
      // Should find beginner leagues
      expect(response.answer).toContain('Recommended');
      expect(response.relatedPolicies).toBeDefined();
    });
  });

  describe('General Queries', () => {
    test('should handle general questions', async () => {
      const query: CivicQuery = {
        type: 'general',
        question: 'Hello, how can you help me?',
        context: {}
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toContain('Welcome');
      expect(response.answer).toContain('Cary');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid queries gracefully', async () => {
      const query: CivicQuery = {
        type: 'policy',
        question: '',
        context: {}
      };

      const response = await agent.handleQuery(query);
      
      expect(response.answer).toBeDefined();
      expect(response.confidence).toBeLessThan(1);
    });
  });

  describe('Session Management', () => {
    test('should end session properly', async () => {
      await agent.endSession();
      // Session should be ended without errors
    });
  });

  describe('Public API Methods', () => {
    test('should provide policy lookup', async () => {
      const response = await agent.getPolicyLookup('What is the refund policy?');
      
      expect(response.answer).toContain('refund');
      expect(response.confidence).toBeGreaterThan(0.8);
    });

    test('should provide league recommendations', async () => {
      const response = await agent.getLeagueRecommendations({ childAge: 8 });
      
      expect(response.answer).toContain('Recommended');
      expect(response.relatedPolicies).toBeDefined();
    });

    test('should provide facility information', async () => {
      const response = await agent.getFacilityInfo('soccer');
      
      expect(response.answer).toContain('facilities');
      expect(response.recommendedFacilities).toBeDefined();
    });
  });
}); 