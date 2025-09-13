import { z } from "zod";

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}

export interface ValidationMiddlewareOptions {
  schema: z.ZodSchema<unknown>;
  strict?: boolean;
}

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

export class ValidationMiddleware {
  /**
   * Validate data against a Zod schema
   */
  static validateData<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          errors: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: error as z.ZodError
      };
    }
  }

  /**
   * Validate response data against a Zod schema
   */
  static validateResponse<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    return this.validateData(schema, data);
  }

  /**
   * Create validation middleware for Firebase Functions
   */
  static createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
    return (data: unknown): ValidationResult<T> => {
      return this.validateData(schema, data);
    };
  }
}

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const Schemas = {
  // User schemas
  User: z.object({
    uid: z.string(),
    email: z.string().email(),
    role: z.string(),
    createdAt: z.any(),
    updatedAt: z.any()
  }),

  CreateUser: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(["admin", "director", "coach", "parent", "player", "staff"])
  }),

  // Player schemas
  Player: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string(),
    position: z.string().optional(),
    teamId: z.string().optional()
  }),

  CreatePlayer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string(),
    position: z.string().optional(),
    teamId: z.string().optional()
  }),

  UpdatePlayer: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    dateOfBirth: z.string().optional(),
    position: z.string().optional(),
    teamId: z.string().optional()
  }),

  // Team schemas
  Team: z.object({
    id: z.string(),
    name: z.string(),
    leagueId: z.string(),
    players: z.array(z.string()).optional()
  }),

  CreateTeam: z.object({
    name: z.string().min(1),
    leagueId: z.string(),
    players: z.array(z.string()).optional()
  }),

  UpdateTeam: z.object({
    name: z.string().min(1).optional(),
    leagueId: z.string().optional(),
    players: z.array(z.string()).optional()
  }),

  // League schemas
  League: z.object({
    id: z.string(),
    name: z.string(),
    season: z.string(),
    status: z.enum(["active", "inactive", "completed"])
  }),

  CreateLeague: z.object({
    name: z.string().min(1),
    season: z.string(),
    status: z.enum(["active", "inactive", "completed"]).default("active")
  }),

  // Game schemas
  Game: z.object({
    id: z.string(),
    homeTeamId: z.string(),
    awayTeamId: z.string(),
    leagueId: z.string(),
    scheduledDate: z.any(),
    status: z.enum(["scheduled", "in_progress", "completed", "cancelled"])
  }),

  CreateGame: z.object({
    homeTeamId: z.string(),
    awayTeamId: z.string(),
    leagueId: z.string(),
    scheduledDate: z.any(),
    status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled")
  }),

  // Venue schemas
  Venue: z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    capacity: z.number().optional()
  }),

  CreateVenue: z.object({
    name: z.string().min(1),
    address: z.string(),
    capacity: z.number().optional()
  }),

  // Payment schemas
  Payment: z.object({
    id: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.enum(["pending", "completed", "failed", "refunded"]),
    userId: z.string()
  }),

  CreatePayment: z.object({
    amount: z.number().positive(),
    currency: z.string().default("usd"),
    userId: z.string()
  }),

  // Notification schemas
  Notification: z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.enum(["info", "warning", "error", "success"]),
    read: z.boolean().default(false)
  }),

  CreateNotification: z.object({
    userId: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.enum(["info", "warning", "error", "success"]).default("info")
  }),

  // API Response schema
  ApiResponse: z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.any().optional(),
    error: z.any().optional()
  }),

  // Search schemas
  UserSearchSchema: z.object({
    query: z.string().optional(),
    role: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }),

  PlayerSearchSchema: z.object({
    query: z.string().optional(),
    teamId: z.string().optional(),
    position: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }),

  TeamSearchSchema: z.object({
    query: z.string().optional(),
    leagueId: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }),

  LeagueSearchSchema: z.object({
    query: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }),

  GameSearchSchema: z.object({
    teamId: z.string().optional(),
    leagueId: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }),

  VenueSearchSchema: z.object({
    query: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }),

  PaymentSearchSchema: z.object({
    userId: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }),

  NotificationSearchSchema: z.object({
    userId: z.string().optional(),
    type: z.string().optional(),
    read: z.boolean().optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  }),

  // Pagination response
  PaginatedResponse: z.object({
    data: z.array(z.any()),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean()
  }),

  // Notifications paginated response
  NotificationsPaginatedResponse: z.object({
    notifications: z.array(z.any()),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean()
  })
}; 