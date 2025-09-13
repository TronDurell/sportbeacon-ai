import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__', '<rootDir>/functions/src', '<rootDir>/frontend/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json'
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@firebase|firebase|uuid)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^firebase-admin/(.*)$': '<rootDir>/__mocks__/firebase-admin-$1.ts',
    '^firebase-functions/logger$': '<rootDir>/__mocks__/firebase-functions.logger.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.ts'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**',
    '!jest.config.ts',
    '!tsconfig.jest.json'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      lines: 60,
      functions: 60,
      branches: 40,
      statements: 60
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
  verbose: true,
  passWithNoTests: true
};

export default config;
