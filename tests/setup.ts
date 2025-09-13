/* SportBeaconAI - Test Setup Configuration
   Jest and Firebase emulator setup for Memory SDK tests
*/

import { config } from 'dotenv';

// Load environment variables
config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Jest configuration
export const jestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'packages/memory-sdk/src/**/*.ts',
    'frontend/src/memory/**/*.ts',
    'frontend/src/hooks/useComposerAssist.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000, // 30 seconds for Firebase emulator operations
  maxWorkers: 1, // Run tests serially to avoid emulator conflicts
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts'
};

// Test utilities
export const testUtils = {
  // Generate random test data
  generateTestMemory: (overrides = {}) => ({
    tenantId: 'test-tenant-001',
    scope: 'user' as const,
    ownerId: 'test-user-001',
    kind: 'preference' as const,
    text: 'Test memory content',
    tags: ['test'],
    source: 'ui' as const,
    confidence: 0.8,
    ...overrides
  }),

  // Generate test feedback
  generateTestFeedback: (overrides = {}) => ({
    delta: 0.2,
    reason: 'Test feedback',
    tags: ['test'],
    ...overrides
  }),

  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Clean up test data
  cleanupTestData: async () => {
    // Implementation would clean up test collections
    console.log('Cleaning up test data...');
  }
};

// Global test setup
beforeAll(async () => {
  console.log('Setting up test environment...');
});

afterAll(async () => {
  console.log('Tearing down test environment...');
  await testUtils.cleanupTestData();
});

// Suppress console warnings during tests
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (args[0]?.includes('Firebase') || args[0]?.includes('emulator')) {
      return; // Suppress Firebase emulator warnings
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});
