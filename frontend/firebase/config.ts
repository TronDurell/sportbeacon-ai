import type { FirebaseConfig } from './types';

// Environment variable validation
export const validateFirebaseConfig = (): void => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars = requiredVars.filter(varName => !(import.meta.env as any)[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all VITE_FIREBASE_* variables are set.\n' +
      'Copy env.example to .env.local and fill in your Firebase project details.'
    );
  }
};

// Get Firebase configuration from environment variables
export const getFirebaseConfig = (): FirebaseConfig => {
  validateFirebaseConfig();

  return {
    apiKey: (import.meta.env as any).VITE_FIREBASE_API_KEY!,
    authDomain: (import.meta.env as any).VITE_FIREBASE_AUTH_DOMAIN!,
    projectId: (import.meta.env as any).VITE_FIREBASE_PROJECT_ID!,
    storageBucket: (import.meta.env as any).VITE_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: (import.meta.env as any).VITE_FIREBASE_MESSAGING_SENDER_ID!,
    appId: (import.meta.env as any).VITE_FIREBASE_APP_ID!,
    measurementId: (import.meta.env as any).VITE_FIREBASE_MEASUREMENT_ID
  };
};

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const useEmulator = (import.meta.env as any).VITE_USE_FIREBASE_EMULATOR === 'true';

// Emulator configuration
export const emulatorConfig = {
  auth: {
    host: 'localhost',
    port: 9099,
    url: 'http://localhost:9099'
  },
  firestore: {
    host: 'localhost',
    port: 8080
  },
  storage: {
    host: 'localhost',
    port: 9199
  },
  functions: {
    host: 'localhost',
    port: 5001
  }
};

// Log configuration for debugging
export const logFirebaseConfig = (): void => {
  if (isDevelopment) {
    console.log('🔥 Firebase Configuration:');
    console.log('  Project ID:', (import.meta.env as any).VITE_FIREBASE_PROJECT_ID);
    console.log('  Environment:', isProduction ? 'Production' : 'Development');
    console.log('  Emulator:', useEmulator ? 'Enabled' : 'Disabled');
    console.log('  Auth Domain:', (import.meta.env as any).VITE_FIREBASE_AUTH_DOMAIN);
  }
}; 