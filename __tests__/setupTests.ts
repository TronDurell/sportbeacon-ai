import 'jest';
import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for Response (needed for Firebase Auth)
global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  
  async text() {
    return this.body;
  }
  
  async json() {
    return JSON.parse(this.body);
  }
};

// Polyfill for AudioContext (needed for BadgeService)
global.AudioContext = class AudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 44100;
  }
  
  createOscillator() {
    return {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 440 }
    };
  }
  
  createGain() {
    return {
      connect: jest.fn(),
      gain: { value: 1 }
    };
  }
  
  createAnalyser() {
    return {
      connect: jest.fn(),
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn()
    };
  }
};

// Global test setup
afterEach(() => { 
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Export mock reset helper for tests that need it
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
};

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Restore console after each test for debugging when needed
afterEach(() => {
  // Only restore if we're in debug mode
  if (process.env.DEBUG_TESTS === 'true') {
    global.console = originalConsole;
  }
});

// Set up global test timeout
jest.setTimeout(10000);

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
// Safe env defaults
process.env.REACT_APP_API_BASE ??= 'http://localhost';

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock timers for consistent testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock window object for DOM-related tests
if (!global.window) {
  global.window = {} as any;
}

// Mock localStorage
if (!global.localStorage) {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.localStorage = localStorageMock as any;
}

// Mock sessionStorage
if (!global.sessionStorage) {
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.sessionStorage = sessionStorageMock as any;
}
