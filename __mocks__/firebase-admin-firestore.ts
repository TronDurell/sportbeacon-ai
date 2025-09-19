// Mock Firestore instance using unified factory
import { createFirestoreMock } from './factories/firebase';

export const getFirestore = jest.fn(() => createFirestoreMock());