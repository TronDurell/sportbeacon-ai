import '@testing-library/jest-dom';

// Polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';

// @ts-ignore
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder as any;

// Mock Response for fetch
global.Response = class Response {
  constructor(public body: any, public init?: any) {}
  static json(data: any) { return new Response(JSON.stringify(data)); }
  static text(text: string) { return new Response(text); }
  async json() { return JSON.parse(await this.text()); }
  async text() { return this.body; }
  get ok() { return true; }
  get status() { return 200; }
};

// Mock AudioContext for tests
// @ts-ignore
global.AudioContext = class AudioContext {};

// Firebase soft mocks
jest.mock('firebase/app', () => ({ 
  initializeApp: () => ({}) 
}));

jest.mock('firebase/auth', () => ({
  getAuth: () => ({ currentUser: null }),
  onAuthStateChanged: (_: any, cb: any) => { 
    cb(null); 
    return () => {}; 
  }
}));

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
