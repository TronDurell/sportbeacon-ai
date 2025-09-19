// SportBeaconAI - Firebase Mock Types
// Shared type definitions for consistent mock typing

export type DecodedIdToken = { 
  uid: string; 
  email?: string; 
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iss?: string;
  aud?: string;
  auth_time?: number;
  exp?: number;
  iat?: number;
  firebase?: {
    identities?: Record<string, any>;
    sign_in_provider?: string;
  };
} & Record<string, any>;

export interface UserRecord {
  uid: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime?: string;
  };
  customClaims?: Record<string, any>;
}

export interface FirebaseApp {
  name: string;
  options: any;
}

export interface MockFirebaseApp extends FirebaseApp {
  delete: jest.MockedFunction<() => Promise<void>>;
}
