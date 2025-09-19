// __mocks__/@sportbeacon/memory-sdk.ts
import { jest } from '@jest/globals';

export const memoryClient = {
  getMemory: jest.fn(),
  setMemory: jest.fn(),
  deleteMemory: jest.fn(),
  clearMemory: jest.fn(),
};

export type MemoryClient = typeof memoryClient;
