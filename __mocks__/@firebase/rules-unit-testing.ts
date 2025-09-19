// __mocks__/@firebase/rules-unit-testing.ts
import { jest } from '@jest/globals';

export const initializeTestEnvironment = jest.fn(() => Promise.resolve({
  cleanup: jest.fn(),
  withSecurityRulesDisabled: jest.fn(),
  withSecurityRules: jest.fn(),
  clearFirestore: jest.fn(),
  unauthenticatedContext: jest.fn(() => ({
    firestore: jest.fn(() => ({
      collection: jest.fn(),
      doc: jest.fn(),
      addDoc: jest.fn(),
      getDoc: jest.fn(),
      updateDoc: jest.fn(),
      deleteDoc: jest.fn(),
      query: jest.fn(),
      where: jest.fn(),
      getDocs: jest.fn(),
    })),
  })),
}));

export type RulesTestEnvironment = {
  cleanup: jest.Mock;
  withSecurityRulesDisabled: jest.Mock;
  withSecurityRules: jest.Mock;
};

export type RulesTestContext = {
  firestore: any;
  auth: any;
};
