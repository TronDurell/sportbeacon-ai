// Firebase test setup for frontend
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

let testEnv: RulesTestEnvironment;

export const setupFirebaseTest = async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'sportbeaconai-test',
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} {
              allow read, write: if true; // Test mode - allow all
            }
          }
        }
      `,
    },
  });
  
  return testEnv;
};

export const clearFirestoreData = async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
};

export const cleanup = async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
};

// Mock Firebase config for tests
export const mockFirebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'sportbeaconai-test.firebaseapp.com',
  projectId: 'sportbeaconai-test',
  storageBucket: 'sportbeaconai-test.appspot.com',
  messagingSenderId: '123456789',
  appId: 'test-app-id'
};
