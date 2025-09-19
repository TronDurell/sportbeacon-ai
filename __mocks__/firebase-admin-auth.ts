// Mock Auth instance using unified factory
import { createAuthMock } from './factories/firebase';
import type { DecodedIdToken, UserRecord } from './factories/types';

// Re-export types for backward compatibility
export type { DecodedIdToken, UserRecord };

export const getAuth = jest.fn(() => createAuthMock());
