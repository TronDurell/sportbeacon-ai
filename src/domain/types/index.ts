/* SportBeaconAI - Domain Types Export
   Centralized export of all domain types and schemas
*/

// Re-export all types and schemas from the main schema file
export {
  // Base Types
  ID,
  Timestamp,
  
  // Core Entities
  Athlete,
  Season,
  Game,
  BasketballStatLine,
  FootballStatLine,
  StatLine,
  Highlight,
  
  // System Entities
  Provenance,
  VerificationRecord,
  FeedbackEvent,
  SourceLink,
  ConsentRecord,
  AdminQueueItem,
  
  // Schemas
  Schemas,
  
  // Individual Schemas
  AthleteSchema,
  SeasonSchema,
  GameSchema,
  BasketballStatLineSchema,
  FootballStatLineSchema,
  StatLineSchema,
  HighlightSchema,
  ProvenanceSchema,
  VerificationRecordSchema,
  FeedbackEventSchema,
  SourceLinkSchema,
  ConsentRecordSchema,
  AdminQueueItemSchema
} from '../schemas/athlete';

// Re-export converters
export {
  Converters,
  getConverter,
  createCollectionPath,
  createAdminCollectionPath,
  athleteConverter,
  seasonConverter,
  gameConverter,
  basketballStatLineConverter,
  footballStatLineConverter,
  highlightConverter,
  feedbackEventConverter,
  consentRecordConverter,
  adminQueueItemConverter,
  provenanceConverter,
  sourceLinkConverter,
  verificationRecordConverter
} from '../converters/firestore';

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Sport types
export type Sport = 'basketball' | 'football' | 'soccer' | 'baseball' | 'softball' | 'volleyball' | 'track' | 'swimming';

// Position types for different sports
export interface SportPositions {
  basketball: string[];
  football: string[];
  soccer: string[];
  baseball: string[];
  softball: string[];
  volleyball: string[];
  track: string[];
  swimming: string[];
}

// Verification status types
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'disputed';

// Queue types for admin operations
export type QueueType = 'verification' | 'duplicate' | 'dispute' | 'outlier' | 'merge';

// Feedback types
export type FeedbackType = 'CORRECTION' | 'MERGE' | 'DUPLICATE' | 'DISPUTE' | 'SUGGESTION' | 'APPROVAL';

// Priority levels
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// Status types
export type Status = 'pending' | 'in_review' | 'resolved' | 'rejected';

// ============================================================================
// COLLECTION PATHS
// ============================================================================

export const COLLECTION_PATHS = {
  ATHLETES: 'athletes',
  SEASONS: (athleteId: string) => `athletes/${athleteId}/seasons`,
  GAMES: (athleteId: string) => `athletes/${athleteId}/games`,
  STAT_LINES: (athleteId: string) => `athletes/${athleteId}/statLines`,
  HIGHLIGHTS: (athleteId: string) => `athletes/${athleteId}/highlights`,
  FEEDBACK: (athleteId: string) => `athletes/${athleteId}/feedback`,
  CONSENTS: (athleteId: string) => `athletes/${athleteId}/consents`,
  ADMIN_QUEUES: (queueType: string) => `adminQueues/${queueType}/items`
} as const;

// ============================================================================
// FIELD PATHS FOR QUERIES
// ============================================================================

export const FIELD_PATHS = {
  // Athlete fields
  ATHLETE_FIRST_NAME: 'firstName',
  ATHLETE_LAST_NAME: 'lastName',
  ATHLETE_GRADUATION_YEAR: 'graduationYear',
  ATHLETE_CURRENT_SCHOOL: 'currentSchool',
  ATHLETE_IS_PUBLIC: 'isPublic',
  ATHLETE_VERIFICATION_STATUS: 'verificationStatus',
  
  // Season fields
  SEASON_SPORT: 'sport',
  SEASON_YEAR: 'year',
  SEASON_SEASON: 'season',
  SEASON_TEAM_NAME: 'teamName',
  SEASON_IS_VERIFIED: 'isVerified',
  
  // Game fields
  GAME_SPORT: 'sport',
  GAME_DATE: 'gameDate',
  GAME_OPPONENT: 'opponent',
  GAME_IS_HOME: 'isHomeGame',
  GAME_DID_PLAY: 'didPlay',
  GAME_IS_VERIFIED: 'isVerified',
  
  // Stat line fields
  STAT_LINE_POINTS: 'points',
  STAT_LINE_REBOUNDS: 'rebounds',
  STAT_LINE_ASSISTS: 'assists',
  STAT_LINE_IS_VERIFIED: 'isVerified',
  
  // Highlight fields
  HIGHLIGHT_SPORT: 'sport',
  HIGHLIGHT_IS_PUBLIC: 'isPublic',
  HIGHLIGHT_IS_FEATURED: 'isFeatured',
  HIGHLIGHT_IS_VERIFIED: 'isVerified',
  
  // Feedback fields
  FEEDBACK_TYPE: 'type',
  FEEDBACK_STATUS: 'status',
  FEEDBACK_PRIORITY: 'priority',
  FEEDBACK_SUBMITTED_AT: 'submittedAt',
  
  // Admin queue fields
  QUEUE_TYPE: 'queueType',
  QUEUE_STATUS: 'status',
  QUEUE_PRIORITY: 'priority',
  QUEUE_SUBMITTED_AT: 'submittedAt',
  QUEUE_ASSIGNED_TO: 'assignedTo'
} as const;

// ============================================================================
// QUERY HELPERS
// ============================================================================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  where?: Array<{ field: string; operator: any; value: any }>;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  totalCount?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

export interface BulkValidationResult<T> {
  success: boolean;
  valid: T[];
  invalid: Array<{
    index: number;
    data: any;
    errors: Array<{
      field: string;
      message: string;
      code?: string;
    }>;
  }>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface BulkApiResponse<T> {
  success: boolean;
  data: T[];
  errors: Array<{
    index: number;
    error: string;
  }>;
  metadata: {
    total: number;
    success: number;
    failed: number;
  };
}
