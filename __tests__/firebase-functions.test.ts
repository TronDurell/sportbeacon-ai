import { jest } from '@jest/globals';
import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Mock Firebase Admin
jest.mock('firebase-admin/firestore');
jest.mock('firebase-admin/auth');

// Mock logger
jest.mock('firebase-functions/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock validation utilities
jest.mock('../functions/src/utils/validation', () => ({
  validateAuth: jest.fn(),
  validateUUID: jest.fn(),
  checkRateLimit: jest.fn(),
  checkPlayerAccess: jest.fn()
}));

// Type definitions for mocks
type MockedFirestore = jest.Mocked<ReturnType<typeof getFirestore>>;
type MockedAuth = jest.Mocked<ReturnType<typeof getAuth>>;

describe('Firebase Functions Test Suite', () => {
  let mockFirestore: MockedFirestore;
  let mockAuth: MockedAuth;
  let mockCollection: jest.Mocked<any>;
  let mockDoc: jest.Mocked<any>;
  let mockGet: jest.Mocked<any>;
  let mockSet: jest.Mocked<any>;
  let mockUpdate: jest.Mocked<any>;
  let mockDelete: jest.Mocked<any>;
  let mockWhere: jest.Mocked<any>;
  let mockOrderBy: jest.Mocked<any>;
  let mockLimit: jest.Mocked<any>;
  let mockOffset: jest.Mocked<any>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup Firestore mocks
    mockGet = jest.fn();
    mockSet = jest.fn();
    mockUpdate = jest.fn();
    mockDelete = jest.fn();
    mockWhere = jest.fn();
    mockOrderBy = jest.fn();
    mockLimit = jest.fn();
    mockOffset = jest.fn();

    mockDoc = jest.fn(() => ({
      get: mockGet,
      set: mockSet,
      update: mockUpdate,
      delete: mockDelete
    }));

    mockCollection = jest.fn(() => ({
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      offset: mockOffset
    }));

    mockFirestore = {
      collection: mockCollection,
      doc: mockDoc,
      batch: jest.fn(),
      runTransaction: jest.fn(),
      settings: jest.fn()
    } as MockedFirestore;

    // Setup Auth mocks
    mockAuth = {
      verifyIdToken: jest.fn(),
      createCustomToken: jest.fn(),
      setCustomUserClaims: jest.fn(),
      getUser: jest.fn(),
      listUsers: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn()
    } as MockedAuth;

    // Apply mocks
    (getFirestore as jest.MockedFunction<typeof getFirestore>).mockReturnValue(mockFirestore);
    (getAuth as jest.MockedFunction<typeof getAuth>).mockReturnValue(mockAuth);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication & Authorization Functions', () => {
    
    describe('authLogin', () => {
      const mockContext = {
        auth: {
          uid: 'test-user-id',
          token: { email: 'test@example.com', role: 'user' }
        }
      };

      beforeEach(() => {
        // Import the actual function
        const { authLogin } = require('../functions/src/index');
      });

      it('should successfully authenticate with valid credentials', async () => {
        // Arrange
        const validData = {
          email: 'test@example.com',
          password: 'validPassword123'
        };

        mockAuth.verifyIdToken.mockResolvedValue({
          uid: 'test-user-id',
          email: 'test@example.com',
          role: 'user'
        });

        // Act
        const result = await authLogin(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Login successful');
        expect(result.data).toHaveProperty('user');
        expect(result.data.user).toHaveProperty('uid', 'user123');
        expect(result.data.user).toHaveProperty('email', 'test@example.com');
      });

      it('should reject invalid email format', async () => {
        // Arrange
        const invalidData = {
          email: 'invalid-email',
          password: 'password123'
        };

        // Act
        const result = await authLogin(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid email format');
      });

      it('should reject weak password', async () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com',
          password: '123'
        };

        // Act
        const result = await authLogin(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Password must be at least 8 characters long');
      });

      it('should reject missing email', async () => {
        // Arrange
        const invalidData = {
          password: 'validPassword123'
        };

        // Act
        const result = await authLogin(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Email is required');
      });

      it('should reject missing password', async () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com'
        };

        // Act
        const result = await authLogin(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Password is required');
      });

      it('should handle authentication errors', async () => {
        // Arrange
        mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid credentials'));

        const validData = {
          email: 'test@example.com',
          password: 'validPassword123'
        };

        // Act
        const result = await authLogin(validData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toBe('Login failed');
      });
    });

    describe('authLogout', () => {
      const mockContext = {
        auth: {
          uid: 'user-id',
          token: { email: 'user@example.com', role: 'user' }
        }
      };

      beforeEach(() => {
        const { authLogout } = require('../functions/src/index');
        const { validateAuth } = require('../functions/src/utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(mockContext.auth);
      });

      it('should successfully logout authenticated user', async () => {
        // Arrange
        const { authLogout } = require('../functions/src/index');

        // Act
        const result = await authLogout({}, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Logout successful');
      });

      it('should reject unauthenticated user', async () => {
        // Arrange
        const { authLogout } = require('../functions/src/index');
        const { validateAuth } = require('../functions/src/utils/validation');
        (validateAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

        // Act
        const result = await authLogout({}, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toBe('Logout failed');
      });
    });
  });

  describe('Player Management Functions', () => {
    
    describe('getPlayer', () => {
      const mockContext = {
        auth: {
          uid: 'coach-user-id',
          token: { email: 'coach@example.com', role: 'coach' }
        }
      };

      beforeEach(() => {
        const { getPlayer } = require('../functions/src/index');
        const { validateAuth } = require('../functions/src/utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(mockContext.auth);
      });

      it('should return player data for authorized user', async () => {
        // Arrange
        const { getPlayer } = require('../functions/src/index');
        const validData = { playerId: '123e4567-e89b-12d3-a456-426614174000' };
        
        const mockPlayerData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          firstName: 'John',
          lastName: 'Doe',
          age: 12,
          team: 'Team A',
          coachId: 'coach-user-id'
        };

        mockGet.mockResolvedValue({
          exists: true,
          data: () => mockPlayerData
        });

        // Act
        const result = await getPlayer(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('playerId', '123e4567-e89b-12d3-a456-426614174000');
      });

      it('should reject invalid UUID format', async () => {
        // Arrange
        const { getPlayer } = require('../functions/src/index');
        const invalidData = { playerId: 'invalid-uuid' };

        // Act
        const result = await getPlayer(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid player ID format');
      });

      it('should reject missing player ID', async () => {
        // Arrange
        const { getPlayer } = require('../functions/src/index');
        const invalidData = {};

        // Act
        const result = await getPlayer(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Player ID is required');
      });

      it('should reject non-string player ID', async () => {
        // Arrange
        const { getPlayer } = require('../functions/src/index');
        const invalidData = { playerId: 123 };

        // Act
        const result = await getPlayer(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Player ID is required and must be a string');
      });
    });

    describe('getPlayerVideoClips', () => {
      const mockContext = {
        auth: {
          uid: 'coach-user-id',
          token: { email: 'coach@example.com', role: 'coach' }
        }
      };

      beforeEach(() => {
        const { getPlayerVideoClips } = require('../functions/src/index');
        const { validateAuth } = require('../functions/src/utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(mockContext.auth);
      });

      it('should return video clips with valid parameters', async () => {
        // Arrange
        const { getPlayerVideoClips } = require('../functions/src/index');
        const validData = {
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          includeVideos: true,
          includeAnalytics: false,
          limit: 10,
          offset: 0
        };

        // Act
        const result = await getPlayerVideoClips(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('playerId', '123e4567-e89b-12d3-a456-426614174000');
      });

      it('should reject invalid limit values', async () => {
        // Arrange
        const { getPlayerVideoClips } = require('../functions/src/index');
        const invalidData = {
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          limit: 150 // Exceeds maximum
        };

        // Act
        const result = await getPlayerVideoClips(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Limit must be a number between 1 and 100');
      });

      it('should reject negative offset', async () => {
        // Arrange
        const { getPlayerVideoClips } = require('../functions/src/index');
        const invalidData = {
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          offset: -5
        };

        // Act
        const result = await getPlayerVideoClips(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Offset must be a non-negative number');
      });

      it('should reject invalid boolean parameters', async () => {
        // Arrange
        const { getPlayerVideoClips } = require('../functions/src/index');
        const invalidData = {
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          includeVideos: 'true' // Should be boolean
        };

        // Act
        const result = await getPlayerVideoClips(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('includeVideos must be a boolean');
      });
    });

    describe('getPlayerDrillHistory', () => {
      const mockContext = {
        auth: {
          uid: 'coach-user-id',
          token: { email: 'coach@example.com', role: 'coach' }
        }
      };

      beforeEach(() => {
        const { getPlayerDrillHistory } = require('../functions/src/index');
        const { validateAuth } = require('../functions/src/utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(mockContext.auth);
      });

      it('should return drill history with valid parameters', async () => {
        // Arrange
        const { getPlayerDrillHistory } = require('../functions/src/index');
        const validData = {
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          drillType: 'passing',
          limit: 20,
          offset: 0
        };

        // Act
        const result = await getPlayerDrillHistory(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('playerId', '123e4567-e89b-12d3-a456-426614174000');
      });

      it('should reject invalid date format', async () => {
        // Arrange
        const { getPlayerDrillHistory } = require('../functions/src/index');
        const invalidData = {
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          startDate: '01/01/2024' // Wrong format
        };

        // Act
        const result = await getPlayerDrillHistory(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('startDate must be in YYYY-MM-DD format');
      });

      it('should reject invalid date range', async () => {
        // Arrange
        const { getPlayerDrillHistory } = require('../functions/src/index');
        const invalidData = {
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          startDate: '2024-12-31',
          endDate: '2024-01-01' // End before start
        };

        // Act
        const result = await getPlayerDrillHistory(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('startDate must be before or equal to endDate');
      });

      it('should reject invalid drill type length', async () => {
        // Arrange
        const { getPlayerDrillHistory } = require('../functions/src/index');
        const invalidData = {
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          drillType: 'a'.repeat(60) // Too long
        };

        // Act
        const result = await getPlayerDrillHistory(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('drillType must be a string between 1 and 50 characters');
      });
    });
  });

  describe('Video Processing Functions', () => {
    
    describe('videoAnalyze', () => {
      const mockContext = {
        auth: {
          uid: 'coach-user-id',
          token: { email: 'coach@example.com', role: 'coach' }
        }
      };

      beforeEach(() => {
        const { videoAnalyze } = require('../functions/src/index');
        const { validateAuth } = require('../functions/src/utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(mockContext.auth);
      });

      it('should initiate video analysis with valid parameters', async () => {
        // Arrange
        const { videoAnalyze } = require('../functions/src/index');
        const validData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          analysisType: 'pose',
          parameters: {
            confidence: 0.8,
            includeHeatmap: true
          },
          priority: 'medium'
        };

        // Act
        const result = await videoAnalyze(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('videoId', '123e4567-e89b-12d3-a456-426614174000');
      });

      it('should reject invalid analysis type', async () => {
        // Arrange
        const { videoAnalyze } = require('../functions/src/index');
        const invalidData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          analysisType: 'invalid-type'
        };

        // Act
        const result = await videoAnalyze(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Analysis type must be one of');
      });

      it('should reject invalid confidence value', async () => {
        // Arrange
        const { videoAnalyze } = require('../functions/src/index');
        const invalidData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          analysisType: 'pose',
          parameters: {
            confidence: 1.5 // Invalid: should be between 0 and 1
          }
        };

        // Act
        const result = await videoAnalyze(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Confidence must be a number between 0 and 1');
      });

      it('should reject invalid priority', async () => {
        // Arrange
        const { videoAnalyze } = require('../functions/src/index');
        const invalidData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          analysisType: 'pose',
          priority: 'urgent' // Invalid priority
        };

        // Act
        const result = await videoAnalyze(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Priority must be one of');
      });
    });

    describe('videoComplete', () => {
      const mockContext = {
        auth: {
          uid: 'coach-user-id',
          token: { email: 'coach@example.com', role: 'coach' }
        }
      };

      beforeEach(() => {
        const { videoComplete } = require('../functions/src/index');
        const { validateAuth } = require('../functions/src/utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(mockContext.auth);
      });

      it('should complete video processing with valid data', async () => {
        // Arrange
        const { videoComplete } = require('../functions/src/index');
        const validData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          status: 'completed',
          results: {
            analysisScore: 85,
            keyPoints: ['Good form', 'Needs work on timing']
          }
        };

        // Act
        const result = await videoComplete(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('videoId', '123e4567-e89b-12d3-a456-426614174000');
      });

      it('should reject invalid status', async () => {
        // Arrange
        const { videoComplete } = require('../functions/src/index');
        const invalidData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          status: 'invalid-status'
        };

        // Act
        const result = await videoComplete(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Status must be one of');
      });

      it('should reject invalid analysis score', async () => {
        // Arrange
        const { videoComplete } = require('../functions/src/index');
        const invalidData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          status: 'completed',
          results: {
            analysisScore: 150 // Invalid: should be between 0 and 100
          }
        };

        // Act
        const result = await videoComplete(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Analysis score must be a number between 0 and 100');
      });

      it('should reject invalid key points format', async () => {
        // Arrange
        const { videoComplete } = require('../functions/src/index');
        const invalidData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          status: 'completed',
          results: {
            keyPoints: ['Good form', 123] // Should be array of strings
          }
        };

        // Act
        const result = await videoComplete(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Key points must be an array of strings');
      });
    });
  });

  describe('League & Event Functions', () => {
    
    describe('submitLeague', () => {
      const mockContext = {
        auth: {
          uid: 'admin-user-id',
          token: { email: 'admin@example.com', role: 'admin' }
        }
      };

      beforeEach(() => {
        const { submitLeague } = require('../functions/src/index');
        const { validateTownStaff } = require('../functions/src/utils/validation');
        (validateTownStaff as jest.Mock).mockResolvedValue({
          auth: mockContext.auth,
          staffData: { isActive: true, role: 'admin' }
        });
      });

      it('should create league with valid data', async () => {
        // Arrange
        const { submitLeague } = require('../functions/src/index');
        const validData = {
          name: 'Spring Soccer League 2024',
          sport: 'soccer',
          ageGroup: 'u12',
          maxTeams: 16,
          maxPlayersPerTeam: 15,
          startDate: '2024-03-01',
          endDate: '2024-06-30',
          venueId: '123e4567-e89b-12d3-a456-426614174000',
          description: 'A competitive spring soccer league'
        };

        // Act
        const result = await submitLeague(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('League submitted successfully');
      });

      it('should reject non-admin users', async () => {
        // Arrange
        const { submitLeague } = require('../functions/src/index');
        const { validateTownStaff } = require('../functions/src/utils/validation');
        (validateTownStaff as jest.Mock).mockRejectedValue(new Error('Unauthorized: User is not active Town Staff'));

        const validData = {
          name: 'Test League',
          sport: 'soccer',
          ageGroup: 'u12',
          maxTeams: 16,
          maxPlayersPerTeam: 15
        };

        // Act
        const result = await submitLeague(validData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('League submission failed');
      });

      it('should reject invalid sport', async () => {
        // Arrange
        const { submitLeague } = require('../functions/src/index');
        const invalidData = {
          name: 'Test League',
          sport: 'invalid-sport',
          ageGroup: 'u12',
          maxTeams: 16,
          maxPlayersPerTeam: 15
        };

        // Act
        const result = await submitLeague(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Sport must be one of');
      });

      it('should reject invalid age group', async () => {
        // Arrange
        const { submitLeague } = require('../functions/src/index');
        const invalidData = {
          name: 'Test League',
          sport: 'soccer',
          ageGroup: 'u20', // Invalid age group
          maxTeams: 16,
          maxPlayersPerTeam: 15
        };

        // Act
        const result = await submitLeague(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Age group must be one of');
      });

      it('should reject invalid team limits', async () => {
        // Arrange
        const { submitLeague } = require('../functions/src/index');
        const invalidData = {
          name: 'Test League',
          sport: 'soccer',
          ageGroup: 'u12',
          maxTeams: 2000, // Exceeds maximum
          maxPlayersPerTeam: 15
        };

        // Act
        const result = await submitLeague(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Maximum teams must be between 1 and 1000');
      });

      it('should reject invalid date range', async () => {
        // Arrange
        const { submitLeague } = require('../functions/src/index');
        const invalidData = {
          name: 'Test League',
          sport: 'soccer',
          ageGroup: 'u12',
          maxTeams: 16,
          maxPlayersPerTeam: 15,
          startDate: '2024-12-31',
          endDate: '2024-01-01' // End before start
        };

        // Act
        const result = await submitLeague(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Start date must be before or equal to end date');
      });
    });

    describe('getEvent', () => {
      const mockContext = {
        auth: {
          uid: 'user-id',
          token: { email: 'user@example.com', role: 'user' }
        }
      };

      beforeEach(() => {
        const { getEvent } = require('../functions/src/index');
        const { validateAuth } = require('../functions/src/utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(mockContext.auth);
      });

      it('should return event data', async () => {
        // Arrange
        const { getEvent } = require('../functions/src/index');
        const validData = { 
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          includeDetails: true,
          includeParticipants: false
        };

        // Act
        const result = await getEvent(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('eventId', '123e4567-e89b-12d3-a456-426614174000');
      });

      it('should reject invalid event ID format', async () => {
        // Arrange
        const { getEvent } = require('../functions/src/index');
        const invalidData = { eventId: 'invalid-uuid' };

        // Act
        const result = await getEvent(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid event ID format');
      });

      it('should reject invalid boolean parameters', async () => {
        // Arrange
        const { getEvent } = require('../functions/src/index');
        const invalidData = { 
          eventId: '123e4567-e89b-12d3-a456-426614174000',
          includeDetails: 'true' // Should be boolean
        };

        // Act
        const result = await getEvent(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('includeDetails must be a boolean');
      });
    });
  });

  describe('Payment & Integration Functions', () => {
    
    describe('stripeCheckout', () => {
      const mockContext = {
        auth: {
          uid: 'user-id',
          token: { email: 'user@example.com', role: 'user' }
        }
      };

      beforeEach(() => {
        const { stripeCheckout } = require('../functions/src/index');
        const { validateAuth } = require('../functions/src/utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(mockContext.auth);
      });

      it('should create checkout session with valid data', async () => {
        // Arrange
        const { stripeCheckout } = require('../functions/src/index');
        const validData = {
          amount: 5000, // $50.00 in cents
          currency: 'usd',
          description: 'League Registration Fee',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
          metadata: {
            leagueId: '123e4567-e89b-12d3-a456-426614174000',
            userId: 'user-id'
          }
        };

        // Act
        const result = await stripeCheckout(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Checkout session created');
      });

      it('should reject negative amount', async () => {
        // Arrange
        const { stripeCheckout } = require('../functions/src/index');
        const invalidData = {
          amount: -100,
          currency: 'usd',
          description: 'Test payment'
        };

        // Act
        const result = await stripeCheckout(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Amount must be positive');
      });

      it('should reject excessive amount', async () => {
        // Arrange
        const { stripeCheckout } = require('../functions/src/index');
        const invalidData = {
          amount: 2000000, // $20,000 - exceeds limit
          currency: 'usd',
          description: 'Test payment'
        };

        // Act
        const result = await stripeCheckout(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Amount exceeds maximum allowed');
      });

      it('should reject invalid currency', async () => {
        // Arrange
        const { stripeCheckout } = require('../functions/src/index');
        const invalidData = {
          amount: 1000,
          currency: 'invalid',
          description: 'Test payment'
        };

        // Act
        const result = await stripeCheckout(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Currency must be one of');
      });

      it('should reject invalid URLs', async () => {
        // Arrange
        const { stripeCheckout } = require('../functions/src/index');
        const invalidData = {
          amount: 1000,
          currency: 'usd',
          description: 'Test payment',
          successUrl: 'not-a-url'
        };

        // Act
        const result = await stripeCheckout(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Success URL must be a valid URL');
      });

      it('should reject invalid metadata', async () => {
        // Arrange
        const { stripeCheckout } = require('../functions/src/index');
        const invalidData = {
          amount: 1000,
          currency: 'usd',
          description: 'Test payment',
          metadata: {
            key: 'a'.repeat(50) // Key too long
          }
        };

        // Act
        const result = await stripeCheckout(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Metadata keys must be strings no longer than 40 characters');
      });
    });
  });

  describe('Town Rec Specific Functions', () => {
    
    describe('getWaitlist', () => {
      const mockContext = {
        auth: {
          uid: 'admin-user-id',
          token: { email: 'admin@example.com', role: 'admin' }
        }
      };

      beforeEach(() => {
        const { getWaitlist } = require('../functions/src/index');
        const { validateTownStaff } = require('../functions/src/utils/validation');
        (validateTownStaff as jest.Mock).mockResolvedValue({
          auth: mockContext.auth,
          staffData: { isActive: true, role: 'admin' }
        });
      });

      it('should return waitlist data for admin', async () => {
        // Arrange
        const { getWaitlist } = require('../functions/src/index');
        const validData = {
          leagueId: '123e4567-e89b-12d3-a456-426614174000',
          status: 'pending'
        };

        const mockWaitlistData = [
          {
            id: 'waitlist-1',
            playerName: 'John Doe',
            parentEmail: 'parent@example.com',
            requestedDate: '2024-01-15',
            status: 'pending'
          }
        ];

        mockWhere.mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                docs: mockWaitlistData.map(item => ({
                  id: item.id,
                  data: () => item
                }))
              })
            })
          })
        });

        // Act
        const result = await getWaitlist(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Waitlist retrieved');
      });

      it('should reject non-admin access', async () => {
        // Arrange
        const { getWaitlist } = require('../functions/src/index');
        const { validateTownStaff } = require('../functions/src/utils/validation');
        (validateTownStaff as jest.Mock).mockRejectedValue(new Error('Unauthorized: User is not active Town Staff'));

        const validData = {
          leagueId: '123e4567-e89b-12d3-a456-426614174000'
        };

        // Act
        const result = await getWaitlist(validData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Waitlist retrieval failed');
      });
    });

    describe('processAgeOverride', () => {
      const mockContext = {
        auth: {
          uid: 'admin-user-id',
          token: { email: 'admin@example.com', role: 'admin' }
        }
      };

      beforeEach(() => {
        const { processAgeOverride } = require('../functions/src/index');
        const { validateTownStaff } = require('../functions/src/utils/validation');
        (validateTownStaff as jest.Mock).mockResolvedValue({
          auth: mockContext.auth,
          staffData: { isActive: true, role: 'admin' }
        });
      });

      it('should process age override request', async () => {
        // Arrange
        const { processAgeOverride } = require('../functions/src/index');
        const validData = {
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          action: 'approve',
          reason: 'Player demonstrates exceptional skill level'
        };

        mockUpdate.mockResolvedValue(undefined);

        // Act
        const result = await processAgeOverride(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Age override processed');
      });

      it('should reject invalid action', async () => {
        // Arrange
        const { processAgeOverride } = require('../functions/src/index');
        const invalidData = {
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          action: 'invalid-action'
        };

        // Act
        const result = await processAgeOverride(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('action must be one of');
      });
    });
  });

  describe('Error Handling', () => {
    
    it('should handle Firestore errors gracefully', async () => {
      // Arrange
      const { getPlayer } = require('../functions/src/index');
      const { validateAuth } = require('../functions/src/utils/validation');
      (validateAuth as jest.Mock).mockResolvedValue({
        uid: 'user-id',
        token: { email: 'user@example.com', role: 'user' }
      });

      mockGet.mockRejectedValue(new Error('Firestore connection failed'));

      const validData = { playerId: '123e4567-e89b-12d3-a456-426614174000' };
      const mockContext = {
        auth: {
          uid: 'user-id',
          token: { email: 'user@example.com', role: 'user' }
        }
      };

      // Act
      const result = await getPlayer(validData, mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Get player failed');
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const { getPlayer } = require('../functions/src/index');
      const { validateAuth } = require('../functions/src/utils/validation');
      (validateAuth as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const validData = { playerId: '123e4567-e89b-12d3-a456-426614174000' };
      const mockContext = {
        auth: {
          uid: 'user-id',
          token: { email: 'user@example.com', role: 'user' }
        }
      };

      // Act
      const result = await getPlayer(validData, mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Get player failed');
    });

    it('should handle validation errors with multiple fields', async () => {
      // Arrange
      const { authLogin } = require('../functions/src/index');

      const invalidData = {
        email: 'invalid-email',
        password: '123' // Too short
      };

      const mockContext = { auth: null };

      // Act
      const result = await authLogin(invalidData, mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid email format');
    });
  });

  describe('Performance Tests', () => {
    
    it('should handle concurrent requests', async () => {
      // Arrange
      const { getPlayer } = require('../functions/src/index');
      const { validateAuth } = require('../functions/src/utils/validation');
      (validateAuth as jest.Mock).mockResolvedValue({
        uid: 'user-id',
        token: { email: 'user@example.com', role: 'user' }
      });

      const validData = { playerId: '123e4567-e89b-12d3-a456-426614174000' };
      const mockContext = {
        auth: {
          uid: 'user-id',
          token: { email: 'user@example.com', role: 'user' }
        }
      };

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ id: 'test-player', name: 'Test Player' })
      });

      // Act
      const startTime = Date.now();
      const promises = Array(10).fill(null).map(() => getPlayer(validData, mockContext));
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle large data sets efficiently', async () => {
      // Arrange
      const { getEvents } = require('../functions/src/index');
      const { validateAuth } = require('../functions/src/utils/validation');
      (validateAuth as jest.Mock).mockResolvedValue({
        uid: 'user-id',
        token: { email: 'user@example.com', role: 'user' }
      });

      const mockEventsData = Array(1000).fill(null).map((_, index) => ({
        id: `event-${index}`,
        name: `Event ${index}`,
        date: '2024-03-15'
      }));

      mockWhere.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                docs: mockEventsData.map(item => ({
                  id: item.id,
                  data: () => item
                }))
              })
            })
          })
        })
      });

      const validData = { limit: 1000 };
      const mockContext = {
        auth: {
          uid: 'user-id',
          token: { email: 'user@example.com', role: 'user' }
        }
      };

      // Act
      const startTime = Date.now();
      const result = await getEvents(validData, mockContext);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.success).toBe(true);
    });
  });
}); 