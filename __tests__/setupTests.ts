import 'jest';

// Global test setup
afterEach(() => { 
  jest.clearAllMocks(); 
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up global test timeout
jest.setTimeout(10000);
