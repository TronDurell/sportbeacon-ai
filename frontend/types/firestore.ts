import type { Timestamp } from 'firebase/firestore';

// Player Profile Types
export interface Player {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: Timestamp;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  sport: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  position?: string;
  team?: string;
  school?: string;
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  height?: number; // in cm
  weight?: number; // in kg
  avatar?: string;
  bio?: string;
  tags: string[];
  achievements: Achievement[];
  stats: PlayerStats;
  preferences: PlayerPreferences;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: Timestamp;
  type: 'tournament' | 'personal' | 'team' | 'academic' | 'other';
  level: 'local' | 'regional' | 'national' | 'international';
  image?: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  goalsScored?: number;
  assists?: number;
  saves?: number;
  points?: number;
  averageRating: number;
  totalReviews: number;
  lastUpdated: Timestamp;
}

export interface PlayerPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'coaches-only';
    showStats: boolean;
    showAchievements: boolean;
    showLocation: boolean;
  };
  communication: {
    allowDirectMessages: boolean;
    allowCoachContact: boolean;
    preferredLanguage: string;
  };
}

// Coach Types
export interface Coach {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio: string;
  sports: string[];
  certifications: Certification[];
  experience: number; // years
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  avatar?: string;
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  availability: CoachAvailability[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: Timestamp;
  expiryDate?: Timestamp;
  credentialId?: string;
  image?: string;
}

export interface CoachAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
}

// Drill Types
export interface Drill {
  id: string;
  title: string;
  description: string;
  sport: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  category: string;
  tags: string[];
  coachId: string;
  coachName: string;
  duration: number; // in minutes
  equipment: string[];
  instructions: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  rating: number;
  totalRatings: number;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Report Types
export interface Report {
  id: string;
  type: 'progress' | 'assessment' | 'injury' | 'performance' | 'general';
  title: string;
  content: string;
  playerId: string;
  playerName: string;
  coachId: string;
  coachName: string;
  sessionDate: Timestamp;
  metrics: ReportMetrics;
  attachments: Attachment[];
  isPrivate: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReportMetrics {
  performance: number; // 1-10 scale
  effort: number; // 1-10 scale
  technique: number; // 1-10 scale
  teamwork?: number; // 1-10 scale
  leadership?: number; // 1-10 scale
  notes?: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio';
  url: string;
  filename: string;
  size: number;
  uploadedAt: Timestamp;
}

// Video Annotation Types
export interface VideoAnnotation {
  id: string;
  videoId: string;
  type: 'highlight' | 'correction' | 'instruction' | 'note' | 'marker';
  title: string;
  description: string;
  timestamp: number; // seconds from start
  duration: number; // seconds
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
  createdBy: string;
  createdByName: string;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Search Filter Types
export interface SearchFilters {
  sport?: string;
  level?: string;
  ageRange?: {
    min: number;
    max: number;
  };
  location?: string;
  tags?: string[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'coach' | 'athlete' | 'townstaff' | 'guest';
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Session Types
export interface Session {
  id: string;
  title: string;
  description: string;
  playerId: string;
  playerName: string;
  coachId: string;
  coachName: string;
  sport: string;
  date: Timestamp;
  duration: number; // minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  location: string;
  notes?: string;
  drills: SessionDrill[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SessionDrill {
  drillId: string;
  drillTitle: string;
  duration: number; // minutes
  order: number;
  notes?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'session' | 'message' | 'achievement' | 'reminder' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  isActionable: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// Analytics Types
export interface Analytics {
  id: string;
  userId: string;
  type: 'player' | 'coach' | 'session' | 'drill';
  metrics: {
    [key: string]: number | string | boolean;
  };
  date: Timestamp;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Timestamp;
}

// Error Types
export interface FirestoreError {
  code: string;
  message: string;
  details?: any;
  timestamp: Timestamp;
}

// Query Result Types
export interface QueryResult<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
  hasMore: boolean;
  lastDoc?: any;
}

// Real-time Listener Types
export interface ListenerOptions {
  includeMetadataChanges?: boolean;
  onError?: (error: Error) => void;
  onNext?: (snapshot: any) => void;
}

// Batch Operation Types
export interface BatchOperation<T> {
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId?: string;
  data?: Partial<T>;
}

// Transaction Types
export interface TransactionOptions {
  maxAttempts?: number;
  timeout?: number;
}

// Export all types
export type {
  Player,
  Achievement,
  PlayerStats,
  PlayerPreferences,
  Coach,
  Certification,
  CoachAvailability,
  Drill,
  Report,
  ReportMetrics,
  Attachment,
  VideoAnnotation,
  SearchFilters,
  User,
  Session,
  SessionDrill,
  Notification,
  Analytics,
  FirestoreError,
  QueryResult,
  ListenerOptions,
  BatchOperation,
  TransactionOptions
}; 