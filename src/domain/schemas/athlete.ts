/* SportBeaconAI - Athlete Lifetime Archive Domain Schemas
   Comprehensive TypeScript + Zod schemas for athlete data management
*/

import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// BASE TYPES AND UTILITIES
// ============================================================================

export const ID = z.string().min(1, 'ID cannot be empty');
export const TimestampSchema = z.instanceof(Timestamp).or(z.date()).transform(val => 
  val instanceof Date ? Timestamp.fromDate(val) : val
);
export const EmailSchema = z.string().email('Invalid email format');
export const PhoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format');

// ============================================================================
// PROVENANCE AND AUDIT TRAIL
// ============================================================================

export const ProvenanceSchema = z.object({
  source: z.enum(['csv', 'manual', 'hudl', 'youtube', 'maxpreps', 'nfhs', 'system']),
  addedBy: ID,
  addedAt: TimestampSchema,
  verifiedBy: ID.optional(),
  verifiedAt: TimestampSchema.optional(),
  lastModifiedBy: ID.optional(),
  lastModifiedAt: TimestampSchema.optional(),
  metadata: z.record(z.any()).optional()
});

export const VerificationRecordSchema = z.object({
  id: ID,
  verifiedBy: ID,
  verifiedAt: TimestampSchema,
  verificationType: z.enum(['coach', 'parent', 'athlete', 'admin', 'system']),
  confidence: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// ============================================================================
// FEEDBACK AND LEARNING SYSTEM
// ============================================================================

export const FeedbackEventSchema = z.object({
  id: ID,
  athleteId: ID,
  type: z.enum(['CORRECTION', 'MERGE', 'DUPLICATE', 'DISPUTE', 'SUGGESTION', 'APPROVAL']),
  submittedBy: ID,
  submittedAt: TimestampSchema,
  targetType: z.enum(['athlete', 'season', 'game', 'statLine', 'highlight']),
  targetId: ID,
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['pending', 'in_review', 'resolved', 'rejected']).default('pending'),
  resolvedBy: ID.optional(),
  resolvedAt: TimestampSchema.optional(),
  resolution: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// ============================================================================
// SOURCE LINKS AND EMBEDS
// ============================================================================

export const SourceLinkSchema = z.object({
  id: ID,
  type: z.enum(['hudl', 'youtube', 'vimeo', 'instagram', 'twitter', 'website']),
  url: z.string().url('Invalid URL format'),
  title: z.string().optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  embedCode: z.string().optional(),
  duration: z.number().optional(), // in seconds
  addedBy: ID,
  addedAt: TimestampSchema,
  isVerified: z.boolean().default(false),
  metadata: z.record(z.any()).optional()
});

// ============================================================================
// ATHLETE CORE ENTITY
// ============================================================================

export const AthleteSchema = z.object({
  id: ID,
  // Basic Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  
  // Contact Information
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  
  // Physical Attributes
  height: z.number().min(0).max(300).optional(), // in inches
  weight: z.number().min(0).max(500).optional(), // in pounds
  
  // Sports and Positions
  sports: z.array(z.enum(['basketball', 'football', 'soccer', 'baseball', 'softball', 'volleyball', 'track', 'swimming'])).default([]),
  primarySport: z.enum(['basketball', 'football', 'soccer', 'baseball', 'softball', 'volleyball', 'track', 'swimming']).optional(),
  positions: z.record(z.array(z.string())).default({}), // sport -> positions[]
  
  // Academic Information
  graduationYear: z.number().min(1900).max(2100).optional(),
  gpa: z.number().min(0).max(4.0).optional(),
  satScore: z.number().min(400).max(1600).optional(),
  actScore: z.number().min(1).max(36).optional(),
  
  // School Information
  currentSchool: z.string().optional(),
  schoolType: z.enum(['high_school', 'junior_college', 'college', 'professional']).optional(),
  
  // Status and Privacy
  isPublic: z.boolean().default(true),
  isClaimed: z.boolean().default(false),
  claimedBy: ID.optional(),
  claimedAt: TimestampSchema.optional(),
  
  // System Fields
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: ID,
  lastModifiedBy: ID,
  
  // Verification and Quality
  verificationStatus: z.enum(['unverified', 'pending', 'verified', 'disputed']).default('unverified'),
  qualityScore: z.number().min(0).max(1).default(0),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  metadata: z.record(z.any()).default({})
});

// ============================================================================
// SEASON ENTITY
// ============================================================================

export const SeasonSchema = z.object({
  id: ID,
  athleteId: ID,
  sport: z.enum(['basketball', 'football', 'soccer', 'baseball', 'softball', 'volleyball', 'track', 'swimming']),
  year: z.number().min(1900).max(2100),
  season: z.enum(['fall', 'winter', 'spring', 'summer']),
  
  // Team Information
  teamName: z.string().optional(),
  teamLevel: z.enum(['varsity', 'jv', 'freshman', 'club', 'travel']).optional(),
  league: z.string().optional(),
  division: z.string().optional(),
  
  // Jersey and Position
  jerseyNumber: z.number().min(0).max(99).optional(),
  position: z.string().optional(),
  
  // Season Stats (computed totals)
  gamesPlayed: z.number().min(0).default(0),
  gamesStarted: z.number().min(0).default(0),
  
  // Basketball-specific totals
  basketballTotals: z.object({
    points: z.number().min(0).default(0),
    rebounds: z.number().min(0).default(0),
    assists: z.number().min(0).default(0),
    steals: z.number().min(0).default(0),
    blocks: z.number().min(0).default(0),
    turnovers: z.number().min(0).default(0),
    fieldGoalsMade: z.number().min(0).default(0),
    fieldGoalsAttempted: z.number().min(0).default(0),
    threePointersMade: z.number().min(0).default(0),
    threePointersAttempted: z.number().min(0).default(0),
    freeThrowsMade: z.number().min(0).default(0),
    freeThrowsAttempted: z.number().min(0).default(0),
    minutesPlayed: z.number().min(0).default(0)
  }).optional(),
  
  // Football-specific totals
  footballTotals: z.object({
    passingYards: z.number().min(0).default(0),
    passingAttempts: z.number().min(0).default(0),
    passingCompletions: z.number().min(0).default(0),
    passingTouchdowns: z.number().min(0).default(0),
    interceptions: z.number().min(0).default(0),
    rushingYards: z.number().min(0).default(0),
    rushingAttempts: z.number().min(0).default(0),
    rushingTouchdowns: z.number().min(0).default(0),
    receivingYards: z.number().min(0).default(0),
    receivingReceptions: z.number().min(0).default(0),
    receivingTouchdowns: z.number().min(0).default(0),
    tackles: z.number().min(0).default(0),
    sacks: z.number().min(0).default(0),
    fumblesForced: z.number().min(0).default(0),
    fumblesRecovered: z.number().min(0).default(0)
  }).optional(),
  
  // System Fields
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: ID,
  lastModifiedBy: ID,
  
  // Verification
  isVerified: z.boolean().default(false),
  verifiedBy: ID.optional(),
  verifiedAt: TimestampSchema.optional(),
  
  // Metadata
  notes: z.string().optional(),
  metadata: z.record(z.any()).default({})
});

// ============================================================================
// GAME ENTITY
// ============================================================================

export const GameSchema = z.object({
  id: ID,
  athleteId: ID,
  seasonId: ID,
  sport: z.enum(['basketball', 'football', 'soccer', 'baseball', 'softball', 'volleyball', 'track', 'swimming']),
  
  // Game Information
  gameDate: z.date(),
  opponent: z.string().min(1, 'Opponent is required'),
  isHomeGame: z.boolean().default(true),
  
  // Game Details
  gameType: z.enum(['regular', 'playoff', 'championship', 'exhibition', 'scrimmage']).default('regular'),
  level: z.enum(['varsity', 'jv', 'freshman', 'club', 'travel']).optional(),
  league: z.string().optional(),
  
  // Game Results
  teamScore: z.number().min(0).optional(),
  opponentScore: z.number().min(0).optional(),
  gameResult: z.enum(['win', 'loss', 'tie', 'forfeit', 'cancelled']).optional(),
  
  // Player Participation
  didPlay: z.boolean().default(true),
  didStart: z.boolean().default(false),
  minutesPlayed: z.number().min(0).optional(),
  
  // System Fields
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: ID,
  lastModifiedBy: ID,
  
  // Verification
  isVerified: z.boolean().default(false),
  verifiedBy: ID.optional(),
  verifiedAt: TimestampSchema.optional(),
  
  // Metadata
  notes: z.string().optional(),
  metadata: z.record(z.any()).default({})
});

// ============================================================================
// STAT LINE ENTITIES (SPORT-SPECIFIC)
// ============================================================================

export const BasketballStatLineSchema = z.object({
  id: ID,
  athleteId: ID,
  seasonId: ID,
  gameId: ID,
  
  // Basic Stats
  minutesPlayed: z.number().min(0).max(48).optional(),
  points: z.number().min(0).default(0),
  rebounds: z.number().min(0).default(0),
  assists: z.number().min(0).default(0),
  steals: z.number().min(0).default(0),
  blocks: z.number().min(0).default(0),
  turnovers: z.number().min(0).default(0),
  personalFouls: z.number().min(0).default(0),
  
  // Shooting Stats
  fieldGoalsMade: z.number().min(0).default(0),
  fieldGoalsAttempted: z.number().min(0).default(0),
  threePointersMade: z.number().min(0).default(0),
  threePointersAttempted: z.number().min(0).default(0),
  freeThrowsMade: z.number().min(0).default(0),
  freeThrowsAttempted: z.number().min(0).default(0),
  
  // Advanced Stats (computed)
  fieldGoalPercentage: z.number().min(0).max(1).optional(),
  threePointPercentage: z.number().min(0).max(1).optional(),
  freeThrowPercentage: z.number().min(0).max(1).optional(),
  plusMinus: z.number().optional(),
  
  // System Fields
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: ID,
  lastModifiedBy: ID,
  
  // Verification
  isVerified: z.boolean().default(false),
  verifiedBy: ID.optional(),
  verifiedAt: TimestampSchema.optional(),
  
  // Metadata
  notes: z.string().optional(),
  metadata: z.record(z.any()).default({})
});

export const FootballStatLineSchema = z.object({
  id: ID,
  athleteId: ID,
  seasonId: ID,
  gameId: ID,
  
  // Passing Stats
  passingYards: z.number().min(0).default(0),
  passingAttempts: z.number().min(0).default(0),
  passingCompletions: z.number().min(0).default(0),
  passingTouchdowns: z.number().min(0).default(0),
  interceptions: z.number().min(0).default(0),
  
  // Rushing Stats
  rushingYards: z.number().min(0).default(0),
  rushingAttempts: z.number().min(0).default(0),
  rushingTouchdowns: z.number().min(0).default(0),
  rushingLongest: z.number().min(0).optional(),
  
  // Receiving Stats
  receivingYards: z.number().min(0).default(0),
  receivingReceptions: z.number().min(0).default(0),
  receivingTouchdowns: z.number().min(0).default(0),
  receivingLongest: z.number().min(0).optional(),
  
  // Defensive Stats
  tackles: z.number().min(0).default(0),
  tacklesForLoss: z.number().min(0).default(0),
  sacks: z.number().min(0).default(0),
  fumblesForced: z.number().min(0).default(0),
  fumblesRecovered: z.number().min(0).default(0),
  interceptions: z.number().min(0).default(0),
  passesDefended: z.number().min(0).default(0),
  
  // Special Teams
  kickoffReturns: z.number().min(0).default(0),
  kickoffReturnYards: z.number().min(0).default(0),
  puntReturns: z.number().min(0).default(0),
  puntReturnYards: z.number().min(0).default(0),
  
  // Advanced Stats (computed)
  completionPercentage: z.number().min(0).max(1).optional(),
  yardsPerAttempt: z.number().min(0).optional(),
  yardsPerCompletion: z.number().min(0).optional(),
  passerRating: z.number().min(0).max(158.3).optional(),
  
  // System Fields
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: ID,
  lastModifiedBy: ID,
  
  // Verification
  isVerified: z.boolean().default(false),
  verifiedBy: ID.optional(),
  verifiedAt: TimestampSchema.optional(),
  
  // Metadata
  notes: z.string().optional(),
  metadata: z.record(z.any()).default({})
});

// Union type for all stat line types
export const StatLineSchema = z.union([BasketballStatLineSchema, FootballStatLineSchema]);

// ============================================================================
// HIGHLIGHT ENTITY
// ============================================================================

export const HighlightSchema = z.object({
  id: ID,
  athleteId: ID,
  seasonId: ID.optional(),
  gameId: ID.optional(),
  
  // Highlight Information
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  sport: z.enum(['basketball', 'football', 'soccer', 'baseball', 'softball', 'volleyball', 'track', 'swimming']),
  
  // Media Information
  sourceLinks: z.array(SourceLinkSchema).min(1, 'At least one source link is required'),
  thumbnailUrl: z.string().url().optional(),
  
  // Highlight Details
  highlightType: z.enum(['play', 'game_highlights', 'season_highlights', 'training', 'interview', 'other']).default('play'),
  tags: z.array(z.string()).default([]),
  
  // Visibility and Quality
  isPublic: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  qualityScore: z.number().min(0).max(1).default(0),
  
  // System Fields
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  createdBy: ID,
  lastModifiedBy: ID,
  
  // Verification
  isVerified: z.boolean().default(false),
  verifiedBy: ID.optional(),
  verifiedAt: TimestampSchema.optional(),
  
  // Metadata
  notes: z.string().optional(),
  metadata: z.record(z.any()).default({})
});

// ============================================================================
// CONSENT AND PRIVACY
// ============================================================================

export const ConsentRecordSchema = z.object({
  id: ID,
  athleteId: ID,
  consentType: z.enum(['data_collection', 'data_sharing', 'public_profile', 'marketing', 'research']),
  grantedBy: ID, // user ID of person granting consent
  grantedAt: TimestampSchema,
  consentText: z.string().min(1, 'Consent text is required'),
  digitalSignature: z.string().min(1, 'Digital signature is required'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  isActive: z.boolean().default(true),
  revokedAt: TimestampSchema.optional(),
  revokedBy: ID.optional(),
  revocationReason: z.string().optional(),
  
  // COPPA Compliance
  isParentalConsent: z.boolean().default(false),
  parentEmail: EmailSchema.optional(),
  parentName: z.string().optional(),
  
  // System Fields
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  metadata: z.record(z.any()).default({})
});

// ============================================================================
// ADMIN QUEUE ITEMS
// ============================================================================

export const AdminQueueItemSchema = z.object({
  id: ID,
  queueType: z.enum(['verification', 'duplicate', 'dispute', 'outlier', 'merge']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'resolved', 'rejected']).default('pending'),
  
  // Target Information
  targetType: z.enum(['athlete', 'season', 'game', 'statLine', 'highlight']),
  targetId: ID,
  athleteId: ID,
  
  // Queue Details
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  submittedBy: ID,
  submittedAt: TimestampSchema,
  
  // Resolution
  assignedTo: ID.optional(),
  assignedAt: TimestampSchema.optional(),
  resolvedBy: ID.optional(),
  resolvedAt: TimestampSchema.optional(),
  resolution: z.string().optional(),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  metadata: z.record(z.any()).default({})
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ID = z.infer<typeof ID>;
export type Timestamp = z.infer<typeof TimestampSchema>;
export type Provenance = z.infer<typeof ProvenanceSchema>;
export type VerificationRecord = z.infer<typeof VerificationRecordSchema>;
export type FeedbackEvent = z.infer<typeof FeedbackEventSchema>;
export type SourceLink = z.infer<typeof SourceLinkSchema>;
export type Athlete = z.infer<typeof AthleteSchema>;
export type Season = z.infer<typeof SeasonSchema>;
export type Game = z.infer<typeof GameSchema>;
export type BasketballStatLine = z.infer<typeof BasketballStatLineSchema>;
export type FootballStatLine = z.infer<typeof FootballStatLineSchema>;
export type StatLine = z.infer<typeof StatLineSchema>;
export type Highlight = z.infer<typeof HighlightSchema>;
export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;
export type AdminQueueItem = z.infer<typeof AdminQueueItemSchema>;

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

export const Schemas = {
  ID,
  Timestamp: TimestampSchema,
  Provenance: ProvenanceSchema,
  VerificationRecord: VerificationRecordSchema,
  FeedbackEvent: FeedbackEventSchema,
  SourceLink: SourceLinkSchema,
  Athlete: AthleteSchema,
  Season: SeasonSchema,
  Game: GameSchema,
  BasketballStatLine: BasketballStatLineSchema,
  FootballStatLine: FootballStatLineSchema,
  StatLine: StatLineSchema,
  Highlight: HighlightSchema,
  ConsentRecord: ConsentRecordSchema,
  AdminQueueItem: AdminQueueItemSchema
} as const;
