// Mock for @sportbeacon/memory-sdk
export const createMemoryClient = jest.fn(() => ({
  writeEvent: jest.fn(() => Promise.resolve()),
  writeSnapshot: jest.fn(() => Promise.resolve()),
  calculateKPI: jest.fn(() => Promise.resolve()),
  captureFunctionResult: jest.fn(() => Promise.resolve()),
  initialize: jest.fn(() => Promise.resolve()),
  cleanup: jest.fn(() => Promise.resolve()),
}));

export const memoryClient = createMemoryClient;

export default {
  createMemoryClient,
  memoryClient,
};
