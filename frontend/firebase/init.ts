import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, type Functions, connectFunctionsEmulator } from 'firebase/functions';

import { 
  getFirebaseConfig, 
  isDevelopment, 
  useEmulator, 
  emulatorConfig,
  logFirebaseConfig 
} from './config';

// Initialize Firebase app
const firebaseConfig = getFirebaseConfig();
export const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

// Connect to emulators in development
if (isDevelopment && useEmulator) {
  try {
    // Connect to Firebase emulators
    connectAuthEmulator(auth, emulatorConfig.auth.url, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorConfig.firestore.host, emulatorConfig.firestore.port);
    connectStorageEmulator(storage, emulatorConfig.storage.host, emulatorConfig.storage.port);
    connectFunctionsEmulator(functions, emulatorConfig.functions.host, emulatorConfig.functions.port);
    
    console.log('🔥 Firebase emulators connected successfully');
  } catch (error) {
    console.warn('⚠️ Failed to connect to Firebase emulators:', error);
    console.log('💡 Make sure Firebase emulators are running: firebase emulators:start');
  }
}

// Log configuration in development
logFirebaseConfig();

// Export Firebase app instance
export default app;

// Type exports for use throughout the application
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Functions }; 