"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schemas = exports.ValidationMiddleware = void 0;
const zod_1 = require("zod");
// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================
class ValidationMiddleware {
    /**
     * Validate data against a Zod schema
     */
    static validateData(schema, data) {
        try {
            const result = schema.safeParse(data);
            if (result.success) {
                return {
                    success: true,
                    data: result.data
                };
            }
            else {
                return {
                    success: false,
                    errors: result.error
                };
            }
        }
        catch (error) {
            return {
                success: false,
                errors: error
            };
        }
    }
    /**
     * Validate response data against a Zod schema
     */
    static validateResponse(schema, data) {
        return this.validateData(schema, data);
    }
    /**
     * Create validation middleware for Firebase Functions
     */
    static createValidationMiddleware(schema) {
        return (data) => {
            return this.validateData(schema, data);
        };
    }
}
exports.ValidationMiddleware = ValidationMiddleware;
// ============================================================================
// COMMON SCHEMAS
// ============================================================================
exports.Schemas = {
    // User schemas
    User: zod_1.z.object({
        uid: zod_1.z.string(),
        email: zod_1.z.string().email(),
        role: zod_1.z.string(),
        createdAt: zod_1.z.any(),
        updatedAt: zod_1.z.any()
    }),
    CreateUser: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        firstName: zod_1.z.string().min(1),
        lastName: zod_1.z.string().min(1),
        role: zod_1.z.enum(["admin", "director", "coach", "parent", "player", "staff"])
    }),
    // Player schemas
    Player: zod_1.z.object({
        id: zod_1.z.string(),
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        dateOfBirth: zod_1.z.string(),
        position: zod_1.z.string().optional(),
        teamId: zod_1.z.string().optional()
    }),
    CreatePlayer: zod_1.z.object({
        firstName: zod_1.z.string().min(1),
        lastName: zod_1.z.string().min(1),
        dateOfBirth: zod_1.z.string(),
        position: zod_1.z.string().optional(),
        teamId: zod_1.z.string().optional()
    }),
    UpdatePlayer: zod_1.z.object({
        firstName: zod_1.z.string().min(1).optional(),
        lastName: zod_1.z.string().min(1).optional(),
        dateOfBirth: zod_1.z.string().optional(),
        position: zod_1.z.string().optional(),
        teamId: zod_1.z.string().optional()
    }),
    // Team schemas
    Team: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        leagueId: zod_1.z.string(),
        players: zod_1.z.array(zod_1.z.string()).optional()
    }),
    CreateTeam: zod_1.z.object({
        name: zod_1.z.string().min(1),
        leagueId: zod_1.z.string(),
        players: zod_1.z.array(zod_1.z.string()).optional()
    }),
    UpdateTeam: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        leagueId: zod_1.z.string().optional(),
        players: zod_1.z.array(zod_1.z.string()).optional()
    }),
    // League schemas
    League: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        season: zod_1.z.string(),
        status: zod_1.z.enum(["active", "inactive", "completed"])
    }),
    CreateLeague: zod_1.z.object({
        name: zod_1.z.string().min(1),
        season: zod_1.z.string(),
        status: zod_1.z.enum(["active", "inactive", "completed"]).default("active")
    }),
    // Game schemas
    Game: zod_1.z.object({
        id: zod_1.z.string(),
        homeTeamId: zod_1.z.string(),
        awayTeamId: zod_1.z.string(),
        leagueId: zod_1.z.string(),
        scheduledDate: zod_1.z.any(),
        status: zod_1.z.enum(["scheduled", "in_progress", "completed", "cancelled"])
    }),
    CreateGame: zod_1.z.object({
        homeTeamId: zod_1.z.string(),
        awayTeamId: zod_1.z.string(),
        leagueId: zod_1.z.string(),
        scheduledDate: zod_1.z.any(),
        status: zod_1.z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled")
    }),
    // Venue schemas
    Venue: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        address: zod_1.z.string(),
        capacity: zod_1.z.number().optional()
    }),
    CreateVenue: zod_1.z.object({
        name: zod_1.z.string().min(1),
        address: zod_1.z.string(),
        capacity: zod_1.z.number().optional()
    }),
    // Payment schemas
    Payment: zod_1.z.object({
        id: zod_1.z.string(),
        amount: zod_1.z.number(),
        currency: zod_1.z.string(),
        status: zod_1.z.enum(["pending", "completed", "failed", "refunded"]),
        userId: zod_1.z.string()
    }),
    CreatePayment: zod_1.z.object({
        amount: zod_1.z.number().positive(),
        currency: zod_1.z.string().default("usd"),
        userId: zod_1.z.string()
    }),
    // Notification schemas
    Notification: zod_1.z.object({
        id: zod_1.z.string(),
        userId: zod_1.z.string(),
        title: zod_1.z.string(),
        message: zod_1.z.string(),
        type: zod_1.z.enum(["info", "warning", "error", "success"]),
        read: zod_1.z.boolean().default(false)
    }),
    CreateNotification: zod_1.z.object({
        userId: zod_1.z.string(),
        title: zod_1.z.string(),
        message: zod_1.z.string(),
        type: zod_1.z.enum(["info", "warning", "error", "success"]).default("info")
    }),
    // API Response schema
    ApiResponse: zod_1.z.object({
        success: zod_1.z.boolean(),
        message: zod_1.z.string(),
        data: zod_1.z.any().optional(),
        error: zod_1.z.any().optional()
    }),
    // Search schemas
    UserSearchSchema: zod_1.z.object({
        query: zod_1.z.string().optional(),
        role: zod_1.z.string().optional(),
        limit: zod_1.z.number().min(1).max(100).default(20),
        offset: zod_1.z.number().min(0).default(0)
    }),
    PlayerSearchSchema: zod_1.z.object({
        query: zod_1.z.string().optional(),
        teamId: zod_1.z.string().optional(),
        position: zod_1.z.string().optional(),
        limit: zod_1.z.number().min(1).max(100).default(20),
        offset: zod_1.z.number().min(0).default(0)
    }),
    TeamSearchSchema: zod_1.z.object({
        query: zod_1.z.string().optional(),
        leagueId: zod_1.z.string().optional(),
        limit: zod_1.z.number().min(1).max(100).default(20),
        offset: zod_1.z.number().min(0).default(0)
    }),
    LeagueSearchSchema: zod_1.z.object({
        query: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
        limit: zod_1.z.number().min(1).max(100).default(20),
        offset: zod_1.z.number().min(0).default(0)
    }),
    GameSearchSchema: zod_1.z.object({
        teamId: zod_1.z.string().optional(),
        leagueId: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
        limit: zod_1.z.number().min(1).max(100).default(20),
        offset: zod_1.z.number().min(0).default(0)
    }),
    VenueSearchSchema: zod_1.z.object({
        query: zod_1.z.string().optional(),
        limit: zod_1.z.number().min(1).max(100).default(20),
        offset: zod_1.z.number().min(0).default(0)
    }),
    PaymentSearchSchema: zod_1.z.object({
        userId: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
        limit: zod_1.z.number().min(1).max(100).default(20),
        offset: zod_1.z.number().min(0).default(0)
    }),
    NotificationSearchSchema: zod_1.z.object({
        userId: zod_1.z.string().optional(),
        type: zod_1.z.string().optional(),
        read: zod_1.z.boolean().optional(),
        limit: zod_1.z.number().min(1).max(100).default(20),
        offset: zod_1.z.number().min(0).default(0)
    }),
    // Pagination response
    PaginatedResponse: zod_1.z.object({
        data: zod_1.z.array(zod_1.z.any()),
        total: zod_1.z.number(),
        limit: zod_1.z.number(),
        offset: zod_1.z.number(),
        hasMore: zod_1.z.boolean()
    }),
    // Notifications paginated response
    NotificationsPaginatedResponse: zod_1.z.object({
        notifications: zod_1.z.array(zod_1.z.any()),
        total: zod_1.z.number(),
        limit: zod_1.z.number(),
        offset: zod_1.z.number(),
        hasMore: zod_1.z.boolean()
    })
};
