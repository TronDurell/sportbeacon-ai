import { vi } from 'vitest';

// Mock Firebase Admin SDK
vi.mock('firebase-admin', () => ({
  admin: {
    auth: vi.fn(),
    firestore: vi.fn(),
    initializeApp: vi.fn(),
  },
}));

// Mock environment variables
process.env.FIREBASE_PROJECT_ID = 'sportbeaconai-test';
process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});
