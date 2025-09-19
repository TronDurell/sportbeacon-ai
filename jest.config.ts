import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.ts'],
  moduleFileExtensions: ['ts','tsx','js','jsx','json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { rootMode: 'upward' }],
    '^.+\\.(js|jsx)$': ['babel-jest', { rootMode: 'upward' }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@sportbeacon/memory-sdk)/)', // allow transpile of workspace pkg if needed
  ],
  testMatch: ['**/__tests__/**/*.(spec|test).(ts|tsx|js)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '^@sportbeacon/memory-sdk$': '<rootDir>/packages/memory-sdk/src/index.ts',
    '^firebase-admin/(.*)$': '<rootDir>/__mocks__/firebase-admin-$1.ts',
    '^firebase-functions/logger$': '<rootDir>/__mocks__/firebase-functions.logger.ts'
  },
  collectCoverageFrom: [
    'frontend/src/**/*.{ts,tsx,js,jsx}',
    '!frontend/src/**/__mocks__/**',
  ],
  coverageThreshold: { global: { lines: 60, functions: 60, branches: 40, statements: 60 } },
};

export default config;