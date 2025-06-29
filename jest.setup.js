// Jest setup file
require('@testing-library/jest-dom');

// Mock react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: jest.fn((obj) => obj.web || obj.default),
  },
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
    announceForAccessibility: jest.fn(),
    addEventListener: jest.fn(),
  },
}));

// Mock @tensorflow/tfjs
jest.mock('@tensorflow/tfjs', () => {
  const mockEngine = {
    endScope: jest.fn(),
    reset: jest.fn(),
    startScope: jest.fn(),
    setMemoryInfo: jest.fn(),
  };
  
  return {
    ready: jest.fn(() => Promise.resolve()),
    setBackend: jest.fn(() => Promise.resolve()),
    getBackend: jest.fn(() => 'cpu'),
    engine: jest.fn(() => mockEngine),
    tensor2d: jest.fn(() => ({
      dispose: jest.fn(),
      array: jest.fn(() => Promise.resolve([[1, 2, 3]])),
    })),
    sequential: jest.fn(() => ({
      compile: jest.fn(),
      fit: jest.fn(() => Promise.resolve({ history: { loss: [0.5] } })),
      predict: jest.fn(() => ({
        array: jest.fn(() => Promise.resolve([[50, 0.3, 20, 500]])),
        dispose: jest.fn(),
      })),
      dispose: jest.fn(),
    })),
    layers: {
      dense: jest.fn(() => ({})),
      dropout: jest.fn(() => ({})),
    },
    train: {
      adam: jest.fn(() => ({})),
    },
    regularizers: {
      l2: jest.fn(() => ({})),
    },
  };
});

// Mock firebase
jest.mock('./lib/firebase', () => ({
  db: {},
  getCollection: jest.fn(async () => [{ id: 'mock', value: 1 }]),
  setDocument: jest.fn(async () => {}),
  updateDocument: jest.fn(async () => {}),
  deleteDocument: jest.fn(async () => {}),
  collection: jest.fn(),
  doc: jest.fn(),
}));

// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}; 