import type { 
  User as FirebaseUser,
  UserCredential,
  AuthError 
} from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { 
  DocumentData,
  DocumentReference,
  CollectionReference,
  QueryDocumentSnapshot,
  QuerySnapshot,
  WriteBatch,
  Transaction,
  FieldValue,
  Timestamp
} from 'firebase/firestore';
import type { 
  UploadTask,
  UploadTaskSnapshot,
  StorageReference,
  ListResult,
  UploadMetadata
} from 'firebase/storage';
import type { 
  HttpsCallable,
  HttpsCallableResult,
  FunctionsErrorCode
} from 'firebase/functions';

// Firebase configuration interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Firebase User type with additional properties
export interface User extends FirebaseUser {
  // Additional custom properties
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

// Firestore document types
export interface FirestoreDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

// Player Profile document - extends the consolidated PlayerProfile interface
import type { PlayerProfile } from '../types';

export interface PlayerProfileDocument extends FirestoreDocument, Omit<PlayerProfile, 'createdAt' | 'updatedAt' | 'createdBy'> {
  // Firestore-specific fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Coach Log document
export interface CoachLogDocument extends FirestoreDocument {
  playerId: string;
  drillId: string;
  drillName: string;
  performance: number;
  feedback: string;
  notes?: string;
  duration: number; // in minutes
  date: Timestamp;
  status: 'completed' | 'in_progress' | 'cancelled';
  aiFeedback?: {
    suggestions: string[];
    improvements: string[];
    nextSteps: string[];
  };
}

// Video Annotation document
export interface VideoAnnotationDocument extends FirestoreDocument {
  videoId: string;
  videoUrl: string;
  annotations: Array<{
    id: string;
    type: 'drawing' | 'text' | 'shape';
    data: any;
    timestamp: number;
    duration: number;
    position: {
      x: number;
      y: number;
    };
  }>;
  metadata: {
    title: string;
    description?: string;
    tags: string[];
    duration: number;
    thumbnailUrl?: string;
  };
  permissions: {
    owner: string;
    sharedWith: string[];
    isPublic: boolean;
  };
  // Additional properties for annotation service
  data?: {
    content?: string;
    title?: string;
    startTime?: number;
    endTime?: number;
    type?: string;
  };
}

// Transaction document
export interface TransactionDocument extends FirestoreDocument {
  amount: number;
  currency: string;
  type: 'tip' | 'subscription' | 'purchase';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  creatorId: string;
  viewerId: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  description: string;
  metadata?: Record<string, any>;
}

// Creator Profile document with Stripe integration
export interface CreatorProfileDocument extends FirestoreDocument {
  userId: string;
  verified: boolean;
  stripeCustomerId?: string;
  tipEarnings: number; // Total earnings in cents
  totalTips: number; // Number of tips received
  averageTip: number; // Average tip amount in cents
  lastTipAt?: Timestamp;
  // Creator-specific fields
  displayName: string;
  bio?: string;
  avatar?: string;
  categories: string[];
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  // Verification data
  verificationData?: {
    legalName: string;
    dateOfBirth: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    ssnLast4?: string;
    businessType?: string;
    businessName?: string;
  };
  // Payout settings
  payoutSettings?: {
    method: 'bank_account' | 'card';
    accountId?: string;
    cardId?: string;
    autoPayout: boolean;
    minimumPayout: number; // in cents
  };
}

// Tip Transaction document
export interface TipTransactionDocument extends FirestoreDocument {
  amount: number; // Amount in cents
  currency: string;
  fromUserId: string;
  toUserId: string;
  paymentIntentId: string;
  checkoutSessionId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  metadata?: {
    message?: string;
    anonymous?: boolean;
    category?: string;
  };
}

// Collection references
export interface FirestoreCollections {
  players: CollectionReference<PlayerProfileDocument>;
  coachLogs: CollectionReference<CoachLogDocument>;
  annotations: CollectionReference<VideoAnnotationDocument>;
  transactions: CollectionReference<TransactionDocument>;
}

// Storage references
export interface StorageReferences {
  videos: StorageReference;
  avatars: StorageReference;
  thumbnails: StorageReference;
  documents: StorageReference;
}

// Error types
export interface FirebaseError extends Error {
  code: string;
  message: string;
  details?: any;
}

// Hook return types
export interface UseFirestoreReturn<T> {
  data: T | null;
  loading: boolean;
  error: FirebaseError | null;
  refetch: () => Promise<void>;
}

export interface UseStorageReturn {
  upload: (file: File, path: string, metadata?: UploadMetadata) => Promise<string>;
  download: (path: string) => Promise<string>;
  delete: (path: string) => Promise<void>;
  loading: boolean;
  error: FirebaseError | null;
}

// Query types
export interface FirestoreQuery {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
  value: any;
}

export interface FirestoreOrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

// Batch operation types
export interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  ref: DocumentReference;
  data?: DocumentData;
}

// Export all Firebase types
// Additional types for hooks
export interface TipResponse {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  message?: string;
  createdAt: Timestamp;
  status: 'pending' | 'completed' | 'failed';
}

export interface TipStatistics {
  totalTips: number;
  totalAmount: number;
  averageTip: number;
  topTippers: Array<{
    userId: string;
    amount: number;
    count: number;
  }>;
}

export interface VideoUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
  metadata?: UploadMetadata;
}

export interface VideoMetadata {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  duration?: number;
  resolution?: {
    width: number;
    height: number;
  };
  uploadDate: Timestamp;
  userId: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

export type {
  UserCredential,
  AuthError,
  DocumentData,
  DocumentReference,
  CollectionReference,
  QueryDocumentSnapshot,
  QuerySnapshot,
  WriteBatch,
  Transaction,
  FieldValue,
  Timestamp,
  UploadTask,
  UploadTaskSnapshot,
  StorageReference,
  ListResult,
  UploadMetadata,
  HttpsCallable,
  HttpsCallableResult,
  FunctionsErrorCode
}; 