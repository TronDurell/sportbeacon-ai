import { z } from 'zod';

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserRoleSchema = z.enum([
  'admin',
  'director', 
  'coach',
  'parent',
  'player',
  'referee',
  'scout'
]);

export const UserPreferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean()
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']),
    showContactInfo: z.boolean()
  }),
  language: z.string(),
  timezone: z.string()
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: UserRoleSchema,
  isActive: z.boolean(),
  lastLogin: z.date().optional(),
  profileImage: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  preferences: UserPreferencesSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  lastLogin: true
});

export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

export const AuthContextSchema = z.object({
  user: UserSchema.nullable(),
  isAuthenticated: z.boolean(),
  isLoading: z.boolean()
});

// ============================================================================
// PLAYER SCHEMAS
// ============================================================================

export const PlayerPositionSchema = z.enum([
  'goalkeeper',
  'defender',
  'midfielder',
  'forward',
  'utility'
]);

export const SkillLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'elite'
]);

export const PlayerStatsSchema = z.object({
  gamesPlayed: z.number().min(0),
  goals: z.number().min(0),
  assists: z.number().min(0),
  cleanSheets: z.number().min(0),
  yellowCards: z.number().min(0),
  redCards: z.number().min(0),
  minutesPlayed: z.number().min(0),
  rating: z.number().min(1).max(10)
});

export const EmergencyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional()
});

export const MedicalInfoSchema = z.object({
  allergies: z.array(z.string()),
  medications: z.array(z.string()),
  conditions: z.array(z.string()),
  emergencyContact: EmergencyContactSchema
});

export const PlayerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  dateOfBirth: z.date(),
  gender: z.enum(['male', 'female', 'other']),
  position: z.array(PlayerPositionSchema),
  skillLevel: SkillLevelSchema,
  experience: z.number().min(0),
  height: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  dominantFoot: z.enum(['left', 'right', 'both']).optional(),
  jerseyNumber: z.number().min(1).max(99).optional(),
  teamId: z.string().optional(),
  leagueId: z.string().optional(),
  stats: PlayerStatsSchema.optional(),
  medicalInfo: MedicalInfoSchema.optional(),
  emergencyContact: EmergencyContactSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const CreatePlayerSchema = PlayerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true
});

export const UpdatePlayerSchema = PlayerSchema.partial().omit({
  id: true,
  userId: true,
  createdAt: true,
  createdBy: true
});

// ============================================================================
// TEAM SCHEMAS
// ============================================================================

export const TeamColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string()
});

export const TeamStatsSchema = z.object({
  wins: z.number().min(0),
  losses: z.number().min(0),
  draws: z.number().min(0),
  goalsFor: z.number().min(0),
  goalsAgainst: z.number().min(0),
  points: z.number().min(0)
});

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  leagueId: z.string(),
  coachId: z.string(),
  players: z.array(PlayerSchema),
  maxPlayers: z.number().min(1),
  minPlayers: z.number().min(1),
  logo: z.string().url().optional(),
  colors: TeamColorsSchema,
  stats: TeamStatsSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const CreateTeamSchema = TeamSchema.omit({
  id: true,
  players: true,
  stats: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true
});

export const UpdateTeamSchema = TeamSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

// ============================================================================
// LEAGUE SCHEMAS
// ============================================================================

export const LeagueStatusSchema = z.enum([
  'draft',
  'registration',
  'active',
  'completed',
  'cancelled'
]);

export const LeagueRulesSchema = z.object({
  maxPlayersPerTeam: z.number().min(1),
  minPlayersPerTeam: z.number().min(1),
  gameDuration: z.number().min(1),
  substitutionRules: z.string(),
  tiebreakerRules: z.string(),
  playoffFormat: z.string()
});

export const AgeGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  minAge: z.number().min(0),
  maxAge: z.number().min(0)
});

export const DivisionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  skillLevel: SkillLevelSchema,
  teams: z.array(TeamSchema),
  schedule: z.array(z.any()) // Will be defined when Game schema is created
});

export const LeagueSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  directorId: z.string(),
  season: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
  registrationDeadline: z.date(),
  maxTeams: z.number().min(2).max(100),
  minTeams: z.number().min(2),
  ageGroups: z.array(AgeGroupSchema),
  divisions: z.array(DivisionSchema),
  rules: LeagueRulesSchema,
  status: LeagueStatusSchema,
  teams: z.array(TeamSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const CreateLeagueSchema = LeagueSchema.omit({
  id: true,
  teams: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true
});

export const UpdateLeagueSchema = LeagueSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

// ============================================================================
// GAME SCHEMAS
// ============================================================================

export const GameStatusSchema = z.enum([
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed'
]);

export const GameScoreSchema = z.object({
  homeScore: z.number().min(0),
  awayScore: z.number().min(0),
  homeHalfScore: z.number().min(0).optional(),
  awayHalfScore: z.number().min(0).optional(),
  isFinal: z.boolean()
});

export const GameEventTypeSchema = z.enum([
  'goal',
  'assist',
  'yellow_card',
  'red_card',
  'substitution',
  'injury',
  'other'
]);

export const GameEventSchema = z.object({
  id: z.string(),
  type: GameEventTypeSchema,
  playerId: z.string(),
  teamId: z.string(),
  minute: z.number().min(0),
  description: z.string(),
  timestamp: z.date()
});

export const GameSchema = z.object({
  id: z.string(),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  divisionId: z.string(),
  leagueId: z.string(),
  scheduledDate: z.date(),
  actualDate: z.date().optional(),
  venueId: z.string(),
  refereeId: z.string().optional(),
  status: GameStatusSchema,
  score: GameScoreSchema.optional(),
  events: z.array(GameEventSchema),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const CreateGameSchema = GameSchema.omit({
  id: true,
  events: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true
});

export const UpdateGameSchema = GameSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

// ============================================================================
// VENUE SCHEMAS
// ============================================================================

export const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional()
});

export const ContactInfoSchema = z.object({
  phone: z.string().min(1),
  email: z.string().email(),
  website: z.string().url().optional(),
  contactPerson: z.string().optional()
});

export const FacilityTypeSchema = z.enum([
  'field',
  'court',
  'gym',
  'track',
  'pool',
  'other'
]);

export const SurfaceTypeSchema = z.enum([
  'grass',
  'turf',
  'concrete',
  'wood',
  'clay',
  'other'
]);

export const FacilitySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: FacilityTypeSchema,
  capacity: z.number().min(1),
  surfaceType: SurfaceTypeSchema,
  amenities: z.array(z.string())
});

export const VenueAvailabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isAvailable: z.boolean()
});

export const VenuePricingSchema = z.object({
  hourlyRate: z.number().min(0),
  dailyRate: z.number().min(0),
  seasonalRate: z.number().min(0).optional(),
  currency: z.string().length(3)
});

export const VenueSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  address: AddressSchema,
  contact: ContactInfoSchema,
  facilities: z.array(FacilitySchema),
  capacity: z.number().min(1),
  surfaceType: SurfaceTypeSchema,
  amenities: z.array(z.string()),
  availability: z.array(VenueAvailabilitySchema),
  pricing: VenuePricingSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const CreateVenueSchema = VenueSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true
});

export const UpdateVenueSchema = VenueSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const PaymentStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
  'cancelled'
]);

export const PaymentTypeSchema = z.enum([
  'registration',
  'league_fee',
  'equipment',
  'refund',
  'other'
]);

export const PaymentMethodSchema = z.enum([
  'credit_card',
  'debit_card',
  'bank_transfer',
  'cash',
  'check'
]);

export const PaymentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  status: PaymentStatusSchema,
  type: PaymentTypeSchema,
  method: PaymentMethodSchema,
  description: z.string().min(1),
  referenceId: z.string().optional(),
  stripePaymentId: z.string().optional(),
  refundedAmount: z.number().min(0).optional(),
  refundedAt: z.date().optional(),
  refundedBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const CreatePaymentSchema = PaymentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true
});

export const UpdatePaymentSchema = PaymentSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationTypeSchema = z.enum([
  'game_reminder',
  'registration_deadline',
  'team_update',
  'payment_reminder',
  'system_alert'
]);

export const NotificationPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'urgent'
]);

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  isRead: z.boolean(),
  readAt: z.date().optional(),
  priority: NotificationPrioritySchema,
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const CreateNotificationSchema = NotificationSchema.omit({
  id: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true
});

export const UpdateNotificationSchema = NotificationSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    statusCode: z.number().optional(),
    timestamp: z.date()
  });

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  ApiResponseSchema(z.array(dataSchema)).extend({
    pagination: z.object({
      page: z.number().min(1),
      limit: z.number().min(1),
      total: z.number().min(0),
      totalPages: z.number().min(0),
      hasNext: z.boolean(),
      hasPrev: z.boolean()
    })
  });

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const ValidationRuleSchema = z.object({
  type: z.enum(['required', 'email', 'minLength', 'maxLength', 'pattern', 'custom']),
  value: z.unknown().optional(),
  message: z.string(),
  custom: z.function().optional(),
  sanitize: z.function().optional()
});

export const ValidationSchema = z.record(z.array(ValidationRuleSchema));

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const Schemas = {
  // User schemas
  User: UserSchema,
  CreateUser: CreateUserSchema,
  UpdateUser: UpdateUserSchema,
  UserRole: UserRoleSchema,
  UserPreferences: UserPreferencesSchema,
  AuthContext: AuthContextSchema,

  // Player schemas
  Player: PlayerSchema,
  CreatePlayer: CreatePlayerSchema,
  UpdatePlayer: UpdatePlayerSchema,
  PlayerPosition: PlayerPositionSchema,
  SkillLevel: SkillLevelSchema,
  PlayerStats: PlayerStatsSchema,
  EmergencyContact: EmergencyContactSchema,
  MedicalInfo: MedicalInfoSchema,

  // Team schemas
  Team: TeamSchema,
  CreateTeam: CreateTeamSchema,
  UpdateTeam: UpdateTeamSchema,
  TeamColors: TeamColorsSchema,
  TeamStats: TeamStatsSchema,

  // League schemas
  League: LeagueSchema,
  CreateLeague: CreateLeagueSchema,
  UpdateLeague: UpdateLeagueSchema,
  LeagueStatus: LeagueStatusSchema,
  LeagueRules: LeagueRulesSchema,
  AgeGroup: AgeGroupSchema,
  Division: DivisionSchema,

  // Game schemas
  Game: GameSchema,
  CreateGame: CreateGameSchema,
  UpdateGame: UpdateGameSchema,
  GameStatus: GameStatusSchema,
  GameScore: GameScoreSchema,
  GameEvent: GameEventSchema,
  GameEventType: GameEventTypeSchema,

  // Venue schemas
  Venue: VenueSchema,
  CreateVenue: CreateVenueSchema,
  UpdateVenue: UpdateVenueSchema,
  Address: AddressSchema,
  ContactInfo: ContactInfoSchema,
  Facility: FacilitySchema,
  FacilityType: FacilityTypeSchema,
  SurfaceType: SurfaceTypeSchema,
  VenueAvailability: VenueAvailabilitySchema,
  VenuePricing: VenuePricingSchema,

  // Payment schemas
  Payment: PaymentSchema,
  CreatePayment: CreatePaymentSchema,
  UpdatePayment: UpdatePaymentSchema,
  PaymentStatus: PaymentStatusSchema,
  PaymentType: PaymentTypeSchema,
  PaymentMethod: PaymentMethodSchema,

  // Notification schemas
  Notification: NotificationSchema,
  CreateNotification: CreateNotificationSchema,
  UpdateNotification: UpdateNotificationSchema,
  NotificationType: NotificationTypeSchema,
  NotificationPriority: NotificationPrioritySchema,

  // API schemas
  ApiResponse: ApiResponseSchema,
  PaginatedResponse: PaginatedResponseSchema,
  ValidationRule: ValidationRuleSchema,
  ValidationSchema: ValidationSchema
} as const;

export type SchemasType = typeof Schemas; 