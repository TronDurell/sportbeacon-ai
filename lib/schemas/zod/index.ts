// ============================================================================
// ZOD SCHEMAS INDEX
// ============================================================================
// This file exports all Zod schemas for runtime validation
// Import from: import { Schemas } from '@/lib/schemas/zod'

export * from './user';

// ============================================================================
// SCHEMA UTILITIES
// ============================================================================

import { z } from 'zod';
import { 
  UserSchema,
  PlayerSchema,
  TeamSchema,
  LeagueSchema,
  GameSchema,
  VenueSchema,
  PaymentSchema,
  NotificationSchema,
  CreateUserSchema,
  CreatePlayerSchema,
  CreateTeamSchema,
  CreateLeagueSchema,
  CreateGameSchema,
  CreateVenueSchema,
  CreatePaymentSchema,
  CreateNotificationSchema,
  UpdateUserSchema,
  UpdatePlayerSchema,
  UpdateTeamSchema,
  UpdateLeagueSchema,
  UpdateGameSchema,
  UpdateVenueSchema,
  UpdatePaymentSchema,
  UpdateNotificationSchema,
  ApiResponseSchema,
  PaginatedResponseSchema
} from './user';

// ============================================================================
// MAIN SCHEMAS EXPORT
// ============================================================================

export const Schemas = {
  // Core entity schemas
  User: UserSchema,
  Player: PlayerSchema,
  Team: TeamSchema,
  League: LeagueSchema,
  Game: GameSchema,
  Venue: VenueSchema,
  Payment: PaymentSchema,
  Notification: NotificationSchema,

  // Create schemas (for new entities)
  CreateUser: CreateUserSchema,
  CreatePlayer: CreatePlayerSchema,
  CreateTeam: CreateTeamSchema,
  CreateLeague: CreateLeagueSchema,
  CreateGame: CreateGameSchema,
  CreateVenue: CreateVenueSchema,
  CreatePayment: CreatePaymentSchema,
  CreateNotification: CreateNotificationSchema,

  // Update schemas (for partial updates)
  UpdateUser: UpdateUserSchema,
  UpdatePlayer: UpdatePlayerSchema,
  UpdateTeam: UpdateTeamSchema,
  UpdateLeague: UpdateLeagueSchema,
  UpdateGame: UpdateGameSchema,
  UpdateVenue: UpdateVenueSchema,
  UpdatePayment: UpdatePaymentSchema,
  UpdateNotification: UpdateNotificationSchema,

  // API response schemas
  ApiResponse: ApiResponseSchema,
  PaginatedResponse: PaginatedResponseSchema,

  // Specific API response schemas
  UserApiResponse: ApiResponseSchema(UserSchema),
  PlayerApiResponse: ApiResponseSchema(PlayerSchema),
  TeamApiResponse: ApiResponseSchema(TeamSchema),
  LeagueApiResponse: ApiResponseSchema(LeagueSchema),
  GameApiResponse: ApiResponseSchema(GameSchema),
  VenueApiResponse: ApiResponseSchema(VenueSchema),
  PaymentApiResponse: ApiResponseSchema(PaymentSchema),
  NotificationApiResponse: ApiResponseSchema(NotificationSchema),

  // Paginated response schemas
  UsersPaginatedResponse: PaginatedResponseSchema(UserSchema),
  PlayersPaginatedResponse: PaginatedResponseSchema(PlayerSchema),
  TeamsPaginatedResponse: PaginatedResponseSchema(TeamSchema),
  LeaguesPaginatedResponse: PaginatedResponseSchema(LeagueSchema),
  GamesPaginatedResponse: PaginatedResponseSchema(GameSchema),
  VenuesPaginatedResponse: PaginatedResponseSchema(VenueSchema),
  PaymentsPaginatedResponse: PaginatedResponseSchema(PaymentSchema),
  NotificationsPaginatedResponse: PaginatedResponseSchema(NotificationSchema)
} as const;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate data against a schema and return typed result
 */
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
};

/**
 * Validate data and throw error if invalid
 */
export const validateDataStrict = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T => {
  return schema.parse(data);
};

/**
 * Validate data and return with default values
 */
export const validateDataWithDefaults = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaults: Partial<T> = {}
): T => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ...defaults, ...result.data };
  }
  return { ...defaults, ...schema.parse({}) };
};

/**
 * Create a validation function for a specific schema
 */
export const createValidator = <T>(schema: z.ZodSchema<T>) => {
  return {
    validate: (data: unknown) => validateData(schema, data),
    validateStrict: (data: unknown) => validateDataStrict(schema, data),
    validateWithDefaults: (data: unknown, defaults?: Partial<T>) => 
      validateDataWithDefaults(schema, data, defaults),
    schema
  };
};

// ============================================================================
// FORM VALIDATION UTILITIES
// ============================================================================

/**
 * Create form validation schema from entity schema
 */
export const createFormSchema = <T>(
  entitySchema: z.ZodSchema<T>,
  requiredFields: (keyof T)[] = []
) => {
  const formSchema = entitySchema.partial();
  
  if (requiredFields.length > 0) {
    const requiredSchema = requiredFields.reduce((acc, field) => {
      acc[field] = entitySchema.shape[field as keyof typeof entitySchema.shape];
      return acc;
    }, {} as Record<string, z.ZodTypeAny>);
    
    return formSchema.extend(requiredSchema);
  }
  
  return formSchema;
};

/**
 * Create search/filter schema
 */
export const createSearchSchema = <T>(
  entitySchema: z.ZodSchema<T>,
  searchableFields: (keyof T)[] = []
) => {
  const searchFields = searchableFields.reduce((acc, field) => {
    acc[field] = z.string().optional();
    return acc;
  }, {} as Record<string, z.ZodTypeAny>);

  return z.object({
    ...searchFields,
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  });
};

// ============================================================================
// SPECIFIC FORM SCHEMAS
// ============================================================================

// User forms
export const UserRegistrationFormSchema = createFormSchema(CreateUserSchema, [
  'email',
  'firstName',
  'lastName',
  'role'
]);

export const UserProfileFormSchema = createFormSchema(UpdateUserSchema, [
  'firstName',
  'lastName'
]);

// Player forms
export const PlayerRegistrationFormSchema = createFormSchema(CreatePlayerSchema, [
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'position',
  'skillLevel'
]);

export const PlayerProfileFormSchema = createFormSchema(UpdatePlayerSchema, [
  'firstName',
  'lastName'
]);

// Team forms
export const TeamCreationFormSchema = createFormSchema(CreateTeamSchema, [
  'name',
  'leagueId',
  'coachId',
  'maxPlayers',
  'minPlayers'
]);

export const TeamUpdateFormSchema = createFormSchema(UpdateTeamSchema, [
  'name'
]);

// League forms
export const LeagueCreationFormSchema = createFormSchema(CreateLeagueSchema, [
  'name',
  'directorId',
  'season',
  'startDate',
  'endDate',
  'registrationDeadline',
  'maxTeams',
  'minTeams'
]);

export const LeagueUpdateFormSchema = createFormSchema(UpdateLeagueSchema, [
  'name'
]);

// Game forms
export const GameCreationFormSchema = createFormSchema(CreateGameSchema, [
  'homeTeamId',
  'awayTeamId',
  'divisionId',
  'leagueId',
  'scheduledDate',
  'venueId'
]);

export const GameUpdateFormSchema = createFormSchema(UpdateGameSchema, [
  'homeTeamId',
  'awayTeamId'
]);

// Venue forms
export const VenueCreationFormSchema = createFormSchema(CreateVenueSchema, [
  'name',
  'address',
  'contact',
  'capacity',
  'surfaceType'
]);

export const VenueUpdateFormSchema = createFormSchema(UpdateVenueSchema, [
  'name'
]);

// Payment forms
export const PaymentCreationFormSchema = createFormSchema(CreatePaymentSchema, [
  'userId',
  'amount',
  'currency',
  'type',
  'method',
  'description'
]);

export const PaymentUpdateFormSchema = createFormSchema(UpdatePaymentSchema, [
  'status'
]);

// Notification forms
export const NotificationCreationFormSchema = createFormSchema(CreateNotificationSchema, [
  'userId',
  'type',
  'title',
  'message',
  'priority'
]);

export const NotificationUpdateFormSchema = createFormSchema(UpdateNotificationSchema, [
  'isRead'
]);

// ============================================================================
// SEARCH SCHEMAS
// ============================================================================

export const UserSearchSchema = createSearchSchema(UserSchema, [
  'firstName',
  'lastName',
  'email',
  'role'
]);

export const PlayerSearchSchema = createSearchSchema(PlayerSchema, [
  'firstName',
  'lastName',
  'position',
  'skillLevel'
]);

export const TeamSearchSchema = createSearchSchema(TeamSchema, [
  'name',
  'leagueId'
]);

export const LeagueSearchSchema = createSearchSchema(LeagueSchema, [
  'name',
  'season',
  'status'
]);

export const GameSearchSchema = createSearchSchema(GameSchema, [
  'homeTeamId',
  'awayTeamId',
  'leagueId',
  'status'
]);

export const VenueSearchSchema = createSearchSchema(VenueSchema, [
  'name',
  'address'
]);

export const PaymentSearchSchema = createSearchSchema(PaymentSchema, [
  'userId',
  'type',
  'status'
]);

export const NotificationSearchSchema = createSearchSchema(NotificationSchema, [
  'userId',
  'type',
  'priority'
]);

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export const ValidationUtils = {
  validateData,
  validateDataStrict,
  validateDataWithDefaults,
  createValidator,
  createFormSchema,
  createSearchSchema
};

export const FormSchemas = {
  UserRegistration: UserRegistrationFormSchema,
  UserProfile: UserProfileFormSchema,
  PlayerRegistration: PlayerRegistrationFormSchema,
  PlayerProfile: PlayerProfileFormSchema,
  TeamCreation: TeamCreationFormSchema,
  TeamUpdate: TeamUpdateFormSchema,
  LeagueCreation: LeagueCreationFormSchema,
  LeagueUpdate: LeagueUpdateFormSchema,
  GameCreation: GameCreationFormSchema,
  GameUpdate: GameUpdateFormSchema,
  VenueCreation: VenueCreationFormSchema,
  VenueUpdate: VenueUpdateFormSchema,
  PaymentCreation: PaymentCreationFormSchema,
  PaymentUpdate: PaymentUpdateFormSchema,
  NotificationCreation: NotificationCreationFormSchema,
  NotificationUpdate: NotificationUpdateFormSchema
};

export const SearchSchemas = {
  User: UserSearchSchema,
  Player: PlayerSearchSchema,
  Team: TeamSearchSchema,
  League: LeagueSearchSchema,
  Game: GameSearchSchema,
  Venue: VenueSearchSchema,
  Payment: PaymentSearchSchema,
  Notification: NotificationSearchSchema
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  SchemasType
} from './user';

// Export Zod for convenience
export { z };

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Example usage in forms:
import { Schemas, ValidationUtils, FormSchemas } from '@/lib/schemas/zod';

// Validate user registration
const userData = { email: 'test@example.com', firstName: 'John', lastName: 'Doe' };
const result = ValidationUtils.validateData(Schemas.CreateUser, userData);

if (result.success) {
  // Data is valid, proceed with creation
  const user = result.data;
} else {
  // Handle validation errors
  console.error(result.errors);
}

// Example usage in API endpoints:
import { Schemas } from '@/lib/schemas/zod';

export const createUser = async (data: unknown) => {
  const validation = ValidationUtils.validateDataStrict(Schemas.CreateUser, data);
  
  // If validation passes, create user
  const user = await userService.create(validation);
  
  return ValidationUtils.validateDataStrict(Schemas.UserApiResponse, {
    success: true,
    data: user,
    timestamp: new Date()
  });
};

// Example usage in forms:
import { FormSchemas } from '@/lib/schemas/zod';

const formSchema = FormSchemas.UserRegistration;
const formData = formSchema.parse(formValues);
*/ 