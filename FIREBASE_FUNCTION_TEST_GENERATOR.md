# 🧪 Firebase Function Test Generator Prompt

## **Jest Test Suite Generator for Firebase Callable Functions**

```
Generate a Jest test suite for all Firebase callable functions.
Include:

Mocking for Firestore and Firebase Auth
Input validation tests (valid and invalid cases)
Role-based access tests
Error handling paths
Success scenarios
Save output in __tests__/firebase-functions.test.ts and generate jest.Mocked<Firestore> stubs.
```

## **Test Suite Structure**

### **1. Test Setup and Mocking**

```typescript
import { jest } from '@jest/globals';
import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Mock Firebase Admin
jest.mock('firebase-admin/firestore');
jest.mock('firebase-admin/auth');

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock validation utilities
jest.mock('../utils/validation', () => ({
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
```

### **2. Authentication & Authorization Tests**

```typescript
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
        const { authLogin } = require('../src/index');
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
        expect(result.data).toHaveProperty('userId', 'test-user-id');
        expect(mockAuth.verifyIdToken).toHaveBeenCalled();
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
        expect(result.error).toBe('VALIDATION_ERROR');
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
        expect(result.message).toContain('Password must be at least 8 characters');
        expect(result.error).toBe('VALIDATION_ERROR');
      });

      it('should handle rate limiting', async () => {
        // Arrange
        const { checkRateLimit } = require('../utils/validation');
        (checkRateLimit as jest.Mock).mockResolvedValue(false);

        const validData = {
          email: 'test@example.com',
          password: 'validPassword123'
        };

        // Act
        const result = await authLogin(validData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Rate limit exceeded');
        expect(checkRateLimit).toHaveBeenCalledWith('test-user-id', 'authLogin', 5, 300000);
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
        expect(result.message).toContain('Invalid credentials');
        expect(result.error).toBe('AUTH_ERROR');
      });
    });

    describe('authRegister', () => {
      const mockContext = {
        auth: null // No auth for registration
      };

      beforeEach(() => {
        const { authRegister } = require('../src/index');
      });

      it('should successfully register with valid data', async () => {
        // Arrange
        const validData = {
          email: 'newuser@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          role: 'player'
        };

        mockAuth.createUser.mockResolvedValue({
          uid: 'new-user-id',
          email: 'newuser@example.com'
        });

        mockDoc.mockReturnValue({
          set: mockSet.mockResolvedValue(undefined)
        });

        // Act
        const result = await authRegister(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Registration successful');
        expect(result.data).toHaveProperty('userId', 'new-user-id');
        expect(mockAuth.createUser).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'StrongPassword123!'
        });
      });

      it('should reject duplicate email', async () => {
        // Arrange
        const duplicateData = {
          email: 'existing@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe'
        };

        mockAuth.createUser.mockRejectedValue(new Error('Email already exists'));

        // Act
        const result = await authRegister(duplicateData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Email already exists');
        expect(result.error).toBe('DUPLICATE_EMAIL');
      });

      it('should validate required fields', async () => {
        // Arrange
        const invalidData = {
          email: 'test@example.com'
          // Missing password, firstName, lastName
        };

        // Act
        const result = await authRegister(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(3);
        expect(result.errors?.some(e => e.field === 'password')).toBe(true);
        expect(result.errors?.some(e => e.field === 'firstName')).toBe(true);
        expect(result.errors?.some(e => e.field === 'lastName')).toBe(true);
      });
    });
  });
```

### **3. Player Management Tests**

```typescript
  describe('Player Management Functions', () => {
    
    describe('getPlayer', () => {
      const mockContext = {
        auth: {
          uid: 'coach-user-id',
          token: { email: 'coach@example.com', role: 'coach' }
        }
      };

      beforeEach(() => {
        const { getPlayer } = require('../src/index');
        const { validateAuth, checkPlayerAccess } = require('../utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(undefined);
        (checkPlayerAccess as jest.Mock).mockResolvedValue(true);
      });

      it('should return player data for authorized user', async () => {
        // Arrange
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
        expect(result.data).toEqual(mockPlayerData);
        expect(mockCollection).toHaveBeenCalledWith('players');
        expect(mockDoc).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      });

      it('should reject invalid UUID format', async () => {
        // Arrange
        const invalidData = { playerId: 'invalid-uuid' };

        // Act
        const result = await getPlayer(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid player ID format');
        expect(result.error).toBe('VALIDATION_ERROR');
      });

      it('should reject unauthorized access', async () => {
        // Arrange
        const { checkPlayerAccess } = require('../utils/validation');
        (checkPlayerAccess as jest.Mock).mockResolvedValue(false);

        const validData = { playerId: '123e4567-e89b-12d3-a456-426614174000' };

        // Act
        const result = await getPlayer(validData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Access denied');
        expect(result.error).toBe('ACCESS_DENIED');
      });

      it('should handle player not found', async () => {
        // Arrange
        const validData = { playerId: '123e4567-e89b-12d3-a456-426614174000' };

        mockGet.mockResolvedValue({
          exists: false,
          data: () => null
        });

        // Act
        const result = await getPlayer(validData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Player not found');
        expect(result.error).toBe('NOT_FOUND');
      });
    });

    describe('getPlayerAiAnalysis', () => {
      const mockContext = {
        auth: {
          uid: 'coach-user-id',
          token: { email: 'coach@example.com', role: 'coach' }
        }
      };

      beforeEach(() => {
        const { getPlayerAiAnalysis } = require('../src/index');
        const { validateAuth, checkPlayerAccess } = require('../utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(undefined);
        (checkPlayerAccess as jest.Mock).mockResolvedValue(true);
      });

      it('should return AI analysis for player', async () => {
        // Arrange
        const validData = { 
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          analysisType: 'performance'
        };

        const mockAnalysisData = {
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          analysisType: 'performance',
          score: 85,
          insights: ['Good technique', 'Needs improvement in speed'],
          recommendations: ['Focus on agility drills', 'Practice shooting accuracy']
        };

        mockGet.mockResolvedValue({
          exists: true,
          data: () => mockAnalysisData
        });

        // Act
        const result = await getPlayerAiAnalysis(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockAnalysisData);
      });

      it('should validate analysis type', async () => {
        // Arrange
        const invalidData = { 
          playerId: '123e4567-e89b-12d3-a456-426614174000',
          analysisType: 'invalid-type'
        };

        // Act
        const result = await getPlayerAiAnalysis(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('analysisType must be one of');
        expect(result.error).toBe('VALIDATION_ERROR');
      });
    });
  });
```

### **4. Video Processing Tests**

```typescript
  describe('Video Processing Functions', () => {
    
    describe('videoAnalyze', () => {
      const mockContext = {
        auth: {
          uid: 'coach-user-id',
          token: { email: 'coach@example.com', role: 'coach' }
        }
      };

      beforeEach(() => {
        const { videoAnalyze } = require('../src/index');
        const { validateAuth } = require('../utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(undefined);
      });

      it('should initiate video analysis', async () => {
        // Arrange
        const validData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          analysisType: 'pose',
          parameters: {
            confidence: 0.8,
            includeHeatmap: true
          }
        };

        mockSet.mockResolvedValue(undefined);

        // Act
        const result = await videoAnalyze(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Video analysis initiated');
        expect(result.data).toHaveProperty('analysisId');
        expect(mockSet).toHaveBeenCalled();
      });

      it('should validate video file parameters', async () => {
        // Arrange
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
        expect(result.message).toContain('confidence must be between 0 and 1');
        expect(result.error).toBe('VALIDATION_ERROR');
      });

      it('should handle analysis queue limits', async () => {
        // Arrange
        const { checkRateLimit } = require('../utils/validation');
        (checkRateLimit as jest.Mock).mockResolvedValue(false);

        const validData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          analysisType: 'pose'
        };

        // Act
        const result = await videoAnalyze(validData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Analysis queue limit exceeded');
        expect(result.error).toBe('RATE_LIMIT_EXCEEDED');
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
        const { videoComplete } = require('../src/index');
        const { validateAuth } = require('../utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(undefined);
      });

      it('should complete video processing', async () => {
        // Arrange
        const validData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          status: 'completed',
          results: {
            analysisScore: 85,
            keyPoints: ['Good form', 'Needs work on timing']
          }
        };

        mockUpdate.mockResolvedValue(undefined);

        // Act
        const result = await videoComplete(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('Video processing completed');
        expect(mockUpdate).toHaveBeenCalledWith({
          status: 'completed',
          completedAt: expect.any(Date),
          results: validData.results
        });
      });

      it('should validate status values', async () => {
        // Arrange
        const invalidData = {
          videoId: '123e4567-e89b-12d3-a456-426614174000',
          status: 'invalid-status'
        };

        // Act
        const result = await videoComplete(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('status must be one of');
        expect(result.error).toBe('VALIDATION_ERROR');
      });
    });
  });
```

### **5. League & Event Tests**

```typescript
  describe('League & Event Functions', () => {
    
    describe('submitLeague', () => {
      const mockContext = {
        auth: {
          uid: 'admin-user-id',
          token: { email: 'admin@example.com', role: 'admin' }
        }
      };

      beforeEach(() => {
        const { submitLeague } = require('../src/index');
        const { validateAuth } = require('../utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(undefined);
      });

      it('should create league with valid data', async () => {
        // Arrange
        const validData = {
          name: 'Spring Soccer League 2024',
          sport: 'soccer',
          ageGroup: 'u12',
          maxTeams: 16,
          maxPlayersPerTeam: 15,
          startDate: '2024-03-01',
          endDate: '2024-06-30'
        };

        mockSet.mockResolvedValue(undefined);

        // Act
        const result = await submitLeague(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('League created successfully');
        expect(result.data).toHaveProperty('leagueId');
        expect(mockSet).toHaveBeenCalledWith({
          ...validData,
          createdBy: 'admin-user-id',
          createdAt: expect.any(Date),
          status: 'active'
        });
      });

      it('should reject non-admin users', async () => {
        // Arrange
        const nonAdminContext = {
          auth: {
            uid: 'user-id',
            token: { email: 'user@example.com', role: 'user' }
          }
        };

        const validData = {
          name: 'Test League',
          sport: 'soccer',
          ageGroup: 'u12',
          maxTeams: 16,
          maxPlayersPerTeam: 15
        };

        // Act
        const result = await submitLeague(validData, nonAdminContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Admin access required');
        expect(result.error).toBe('ACCESS_DENIED');
      });

      it('should validate league constraints', async () => {
        // Arrange
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
        expect(result.message).toContain('maxTeams must be no more than 1000');
        expect(result.error).toBe('VALIDATION_ERROR');
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
        const { getEvent } = require('../src/index');
        const { validateAuth } = require('../utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(undefined);
      });

      it('should return event data', async () => {
        // Arrange
        const validData = { eventId: '123e4567-e89b-12d3-a456-426614174000' };

        const mockEventData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Championship Game',
          date: '2024-03-15',
          venue: 'Central Stadium',
          teams: ['Team A', 'Team B']
        };

        mockGet.mockResolvedValue({
          exists: true,
          data: () => mockEventData
        });

        // Act
        const result = await getEvent(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockEventData);
      });
    });
  });
```

### **6. Payment & Integration Tests**

```typescript
  describe('Payment & Integration Functions', () => {
    
    describe('stripeCheckout', () => {
      const mockContext = {
        auth: {
          uid: 'user-id',
          token: { email: 'user@example.com', role: 'user' }
        }
      };

      beforeEach(() => {
        const { stripeCheckout } = require('../src/index');
        const { validateAuth } = require('../utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(undefined);
      });

      it('should create checkout session', async () => {
        // Arrange
        const validData = {
          amount: 5000, // $50.00 in cents
          currency: 'usd',
          description: 'League Registration Fee',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel'
        };

        // Mock Stripe
        const mockStripe = {
          checkout: {
            sessions: {
              create: jest.fn().mockResolvedValue({
                id: 'cs_test_session_id',
                url: 'https://checkout.stripe.com/pay/cs_test_session_id'
              })
            }
          }
        };

        jest.doMock('stripe', () => jest.fn(() => mockStripe));

        // Act
        const result = await stripeCheckout(validData, mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('sessionId', 'cs_test_session_id');
        expect(result.data).toHaveProperty('checkoutUrl');
      });

      it('should validate payment amount', async () => {
        // Arrange
        const invalidData = {
          amount: -100, // Negative amount
          currency: 'usd',
          description: 'Test payment'
        };

        // Act
        const result = await stripeCheckout(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('amount must be positive');
        expect(result.error).toBe('VALIDATION_ERROR');
      });

      it('should validate currency codes', async () => {
        // Arrange
        const invalidData = {
          amount: 1000,
          currency: 'invalid',
          description: 'Test payment'
        };

        // Act
        const result = await stripeCheckout(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('currency must be one of');
        expect(result.error).toBe('VALIDATION_ERROR');
      });
    });
  });
```

### **7. Town Rec Specific Tests**

```typescript
  describe('Town Rec Specific Functions', () => {
    
    describe('getWaitlist', () => {
      const mockContext = {
        auth: {
          uid: 'admin-user-id',
          token: { email: 'admin@example.com', role: 'admin' }
        }
      };

      beforeEach(() => {
        const { getWaitlist } = require('../src/index');
        const { validateAuth } = require('../utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(undefined);
      });

      it('should return waitlist data for admin', async () => {
        // Arrange
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
        expect(result.data).toHaveLength(1);
        expect(result.data[0].playerName).toBe('John Doe');
      });

      it('should reject non-admin access', async () => {
        // Arrange
        const nonAdminContext = {
          auth: {
            uid: 'user-id',
            token: { email: 'user@example.com', role: 'user' }
          }
        };

        const validData = {
          leagueId: '123e4567-e89b-12d3-a456-426614174000'
        };

        // Act
        const result = await getWaitlist(validData, nonAdminContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('Admin access required');
        expect(result.error).toBe('ACCESS_DENIED');
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
        const { processAgeOverride } = require('../src/index');
        const { validateAuth } = require('../utils/validation');
        (validateAuth as jest.Mock).mockResolvedValue(undefined);
      });

      it('should process age override request', async () => {
        // Arrange
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
        expect(result.message).toBe('Age override request processed');
        expect(mockUpdate).toHaveBeenCalledWith({
          status: 'approved',
          processedBy: 'admin-user-id',
          processedAt: expect.any(Date),
          reason: validData.reason
        });
      });

      it('should validate action values', async () => {
        // Arrange
        const invalidData = {
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          action: 'invalid-action'
        };

        // Act
        const result = await processAgeOverride(invalidData, mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.message).toContain('action must be one of');
        expect(result.error).toBe('VALIDATION_ERROR');
      });
    });
  });
```

### **8. Error Handling Tests**

```typescript
  describe('Error Handling', () => {
    
    it('should handle Firestore errors gracefully', async () => {
      // Arrange
      const { getPlayer } = require('../src/index');
      const { validateAuth } = require('../utils/validation');
      (validateAuth as jest.Mock).mockResolvedValue(undefined);

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
      expect(result.message).toBe('Database error occurred');
      expect(result.error).toBe('DATABASE_ERROR');
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const { getPlayer } = require('../src/index');
      const { validateAuth } = require('../utils/validation');
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
      expect(result.message).toBe('Authentication failed');
      expect(result.error).toBe('AUTH_ERROR');
    });

    it('should handle validation errors with multiple fields', async () => {
      // Arrange
      const { authRegister } = require('../src/index');

      const invalidData = {
        email: 'invalid-email',
        password: '123' // Too short
      };

      const mockContext = { auth: null };

      // Act
      const result = await authRegister(invalidData, mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(3); // email, password, firstName, lastName
      expect(result.errors?.some(e => e.field === 'email')).toBe(true);
      expect(result.errors?.some(e => e.field === 'password')).toBe(true);
      expect(result.errors?.some(e => e.field === 'firstName')).toBe(true);
      expect(result.errors?.some(e => e.field === 'lastName')).toBe(true);
    });
  });
```

### **9. Performance Tests**

```typescript
  describe('Performance Tests', () => {
    
    it('should handle concurrent requests', async () => {
      // Arrange
      const { getPlayer } = require('../src/index');
      const { validateAuth, checkPlayerAccess } = require('../utils/validation');
      (validateAuth as jest.Mock).mockResolvedValue(undefined);
      (checkPlayerAccess as jest.Mock).mockResolvedValue(true);

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
      const { getEvents } = require('../src/index');
      const { validateAuth } = require('../utils/validation');
      (validateAuth as jest.Mock).mockResolvedValue(undefined);

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
      expect(result.data).toHaveLength(1000);
    });
  });
```

## **Test Configuration**

### **Jest Configuration**

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testTimeout: 10000
};
```

### **Test Setup File**

```typescript
// __tests__/setup.ts
import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set up any global test configuration
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Clean up any global test resources
});

// Global test utilities
global.testUtils = {
  createMockContext: (role = 'user', uid = 'test-user-id') => ({
    auth: {
      uid,
      token: { 
        email: `${role}@example.com`, 
        role 
      }
    }
  }),
  
  createMockData: (data: any) => data,
  
  expectValidationError: (result: any, field: string) => {
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some((e: any) => e.field === field)).toBe(true);
  }
};
```

## **Usage Instructions**

1. **Save the test file as `__tests__/firebase-functions.test.ts`**
2. **Run tests with: `npm test`**
3. **Run with coverage: `npm test -- --coverage`**
4. **Run specific test suite: `npm test -- --testNamePattern="getPlayer"`**

## **Success Criteria**

- ✅ All functions have comprehensive test coverage
- ✅ Input validation is thoroughly tested
- ✅ Error handling paths are covered
- ✅ Role-based access is verified
- ✅ Performance tests are included
- ✅ Mocking is properly configured
- ✅ Test coverage exceeds 80% 