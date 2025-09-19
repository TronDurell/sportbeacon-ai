// SportBeaconAI - Unified Firebase Mock Factories
// Provides consistent mock shapes across all tests to prevent "never" type inference

import type { DecodedIdToken } from './types';

// ============================================================================
// FIRESTORE MOCK FACTORY
// ============================================================================

export function createFirestoreMock() {
  const mockCollection = jest.fn().mockReturnThis();
  const mockDoc = jest.fn().mockReturnThis();
  const mockWhere = jest.fn().mockReturnThis();
  const mockOrderBy = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  const mockGet = jest.fn().mockResolvedValue({ docs: [], empty: true });
  const mockAdd = jest.fn().mockResolvedValue({ id: 'mock-id' });

  const mockDocumentSnapshot = {
    exists: false,
    data: jest.fn().mockReturnValue({}),
    id: 'mock-doc-id',
    ref: mockDoc(),
    metadata: {}
  };

  const mockDocRef = {
    get: jest.fn().mockResolvedValue(mockDocumentSnapshot),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    collection: jest.fn().mockReturnValue({
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      get: mockGet,
      add: mockAdd
    })
  };

  const mockTransaction = {
    get: jest.fn().mockResolvedValue(mockDocumentSnapshot),
    set: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis()
  };

  const mockBatch = {
    set: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    commit: jest.fn().mockResolvedValue(undefined)
  };

  return {
    collection: jest.fn((path: string) => ({
      doc: jest.fn((docPath?: string) => mockDocRef),
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      get: mockGet,
      add: mockAdd
    })),
    doc: jest.fn((path: string) => mockDocRef),
    runTransaction: jest.fn(async (updateFunction: any) => {
      return updateFunction(mockTransaction);
    }),
    batch: jest.fn(() => mockBatch),
    settings: jest.fn(),
    enableNetwork: jest.fn(),
    disableNetwork: jest.fn()
  };
}

// ============================================================================
// AUTH MOCK FACTORY
// ============================================================================

export function createAuthMock(overrides?: Partial<DecodedIdToken>) {
  const defaultToken: DecodedIdToken = {
    uid: 'test-user-id',
    email: 'test@example.com',
    email_verified: true,
    name: 'Test User',
    iss: 'https://securetoken.google.com/test-project',
    aud: 'test-project',
    auth_time: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    ...overrides
  };

  const mockVerifyIdToken = jest.fn(async (token: string): Promise<DecodedIdToken> => {
    return defaultToken;
  });

  const mockCreateCustomToken = jest.fn(async (uid: string, additionalClaims?: Record<string, any>): Promise<string> => {
    return 'mock-custom-token';
  });

  const mockGetUser = jest.fn(async (uid: string) => {
    return {
      uid,
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User',
      disabled: false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    };
  });

  const mockCreateUser = jest.fn(async (userProperties: any) => {
    return {
      uid: 'new-user-id',
      email: userProperties.email || 'newuser@example.com',
      emailVerified: false,
      disabled: false,
      metadata: {
        creationTime: new Date().toISOString()
      }
    };
  });

  const mockUpdateUser = jest.fn(async (uid: string, properties: any) => {
    return {
      uid,
      email: properties.email || 'updated@example.com',
      emailVerified: properties.emailVerified || false,
      displayName: properties.displayName,
      disabled: properties.disabled || false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    };
  });

  const mockDeleteUser = jest.fn(async (uid: string) => {
    return;
  });

  const mockSetCustomUserClaims = jest.fn(async (uid: string, customClaims: Record<string, any>) => {
    return;
  });

  return {
    verifyIdToken: mockVerifyIdToken,
    createCustomToken: mockCreateCustomToken,
    getUser: mockGetUser,
    createUser: mockCreateUser,
    updateUser: mockUpdateUser,
    deleteUser: mockDeleteUser,
    setCustomUserClaims: mockSetCustomUserClaims,
    listUsers: jest.fn().mockResolvedValue({
      users: [],
      pageToken: undefined
    })
  };
}

// ============================================================================
// LOGGER MOCK FACTORY
// ============================================================================

export function createLoggerMock() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    debug: jest.fn()
  };
}

// ============================================================================
// APP MOCK FACTORY
// ============================================================================

export function createFirebaseAppMock(name: string = 'default') {
  return {
    name,
    options: {},
    delete: jest.fn().mockResolvedValue(undefined)
  };
}
