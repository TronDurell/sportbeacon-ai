import { z } from "zod";
export interface ValidationResult<T = unknown> {
    success: boolean;
    data?: T;
    errors?: z.ZodError;
}
export interface ValidationMiddlewareOptions {
    schema: z.ZodSchema<unknown>;
    strict?: boolean;
}
export declare class ValidationMiddleware {
    /**
     * Validate data against a Zod schema
     */
    static validateData<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T>;
    /**
     * Validate response data against a Zod schema
     */
    static validateResponse<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T>;
    /**
     * Create validation middleware for Firebase Functions
     */
    static createValidationMiddleware<T>(schema: z.ZodSchema<T>): (data: unknown) => ValidationResult<T>;
}
export declare const Schemas: {
    User: z.ZodObject<{
        uid: z.ZodString;
        email: z.ZodString;
        role: z.ZodString;
        createdAt: z.ZodAny;
        updatedAt: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        createdAt?: any;
        updatedAt?: any;
        role?: string;
        uid?: string;
        email?: string;
    }, {
        createdAt?: any;
        updatedAt?: any;
        role?: string;
        uid?: string;
        email?: string;
    }>;
    CreateUser: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<["admin", "director", "coach", "parent", "player", "staff"]>;
    }, "strip", z.ZodTypeAny, {
        role?: "admin" | "director" | "coach" | "parent" | "player" | "staff";
        email?: string;
        password?: string;
        firstName?: string;
        lastName?: string;
    }, {
        role?: "admin" | "director" | "coach" | "parent" | "player" | "staff";
        email?: string;
        password?: string;
        firstName?: string;
        lastName?: string;
    }>;
    Player: z.ZodObject<{
        id: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        dateOfBirth: z.ZodString;
        position: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        teamId?: string;
        position?: string;
        firstName?: string;
        lastName?: string;
        id?: string;
        dateOfBirth?: string;
    }, {
        teamId?: string;
        position?: string;
        firstName?: string;
        lastName?: string;
        id?: string;
        dateOfBirth?: string;
    }>;
    CreatePlayer: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        dateOfBirth: z.ZodString;
        position: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        teamId?: string;
        position?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
    }, {
        teamId?: string;
        position?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
    }>;
    UpdatePlayer: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        dateOfBirth: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        teamId?: string;
        position?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
    }, {
        teamId?: string;
        position?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
    }>;
    Team: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        leagueId: z.ZodString;
        players: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        leagueId?: string;
        players?: string[];
        id?: string;
    }, {
        name?: string;
        leagueId?: string;
        players?: string[];
        id?: string;
    }>;
    CreateTeam: z.ZodObject<{
        name: z.ZodString;
        leagueId: z.ZodString;
        players: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        leagueId?: string;
        players?: string[];
    }, {
        name?: string;
        leagueId?: string;
        players?: string[];
    }>;
    UpdateTeam: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        leagueId: z.ZodOptional<z.ZodString>;
        players: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        leagueId?: string;
        players?: string[];
    }, {
        name?: string;
        leagueId?: string;
        players?: string[];
    }>;
    League: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        season: z.ZodString;
        status: z.ZodEnum<["active", "inactive", "completed"]>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        status?: "active" | "inactive" | "completed";
        id?: string;
        season?: string;
    }, {
        name?: string;
        status?: "active" | "inactive" | "completed";
        id?: string;
        season?: string;
    }>;
    CreateLeague: z.ZodObject<{
        name: z.ZodString;
        season: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<["active", "inactive", "completed"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        status?: "active" | "inactive" | "completed";
        season?: string;
    }, {
        name?: string;
        status?: "active" | "inactive" | "completed";
        season?: string;
    }>;
    Game: z.ZodObject<{
        id: z.ZodString;
        homeTeamId: z.ZodString;
        awayTeamId: z.ZodString;
        leagueId: z.ZodString;
        scheduledDate: z.ZodAny;
        status: z.ZodEnum<["scheduled", "in_progress", "completed", "cancelled"]>;
    }, "strip", z.ZodTypeAny, {
        leagueId?: string;
        status?: "completed" | "scheduled" | "in_progress" | "cancelled";
        id?: string;
        homeTeamId?: string;
        awayTeamId?: string;
        scheduledDate?: any;
    }, {
        leagueId?: string;
        status?: "completed" | "scheduled" | "in_progress" | "cancelled";
        id?: string;
        homeTeamId?: string;
        awayTeamId?: string;
        scheduledDate?: any;
    }>;
    CreateGame: z.ZodObject<{
        homeTeamId: z.ZodString;
        awayTeamId: z.ZodString;
        leagueId: z.ZodString;
        scheduledDate: z.ZodAny;
        status: z.ZodDefault<z.ZodEnum<["scheduled", "in_progress", "completed", "cancelled"]>>;
    }, "strip", z.ZodTypeAny, {
        leagueId?: string;
        status?: "completed" | "scheduled" | "in_progress" | "cancelled";
        homeTeamId?: string;
        awayTeamId?: string;
        scheduledDate?: any;
    }, {
        leagueId?: string;
        status?: "completed" | "scheduled" | "in_progress" | "cancelled";
        homeTeamId?: string;
        awayTeamId?: string;
        scheduledDate?: any;
    }>;
    Venue: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        address: z.ZodString;
        capacity: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        id?: string;
        address?: string;
        capacity?: number;
    }, {
        name?: string;
        id?: string;
        address?: string;
        capacity?: number;
    }>;
    CreateVenue: z.ZodObject<{
        name: z.ZodString;
        address: z.ZodString;
        capacity: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        address?: string;
        capacity?: number;
    }, {
        name?: string;
        address?: string;
        capacity?: number;
    }>;
    Payment: z.ZodObject<{
        id: z.ZodString;
        amount: z.ZodNumber;
        currency: z.ZodString;
        status: z.ZodEnum<["pending", "completed", "failed", "refunded"]>;
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status?: "pending" | "completed" | "failed" | "refunded";
        userId?: string;
        id?: string;
        amount?: number;
        currency?: string;
    }, {
        status?: "pending" | "completed" | "failed" | "refunded";
        userId?: string;
        id?: string;
        amount?: number;
        currency?: string;
    }>;
    CreatePayment: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId?: string;
        amount?: number;
        currency?: string;
    }, {
        userId?: string;
        amount?: number;
        currency?: string;
    }>;
    Notification: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        title: z.ZodString;
        message: z.ZodString;
        type: z.ZodEnum<["info", "warning", "error", "success"]>;
        read: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        message?: string;
        type?: "success" | "warning" | "info" | "error";
        userId?: string;
        title?: string;
        read?: boolean;
        id?: string;
    }, {
        message?: string;
        type?: "success" | "warning" | "info" | "error";
        userId?: string;
        title?: string;
        read?: boolean;
        id?: string;
    }>;
    CreateNotification: z.ZodObject<{
        userId: z.ZodString;
        title: z.ZodString;
        message: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["info", "warning", "error", "success"]>>;
    }, "strip", z.ZodTypeAny, {
        message?: string;
        type?: "success" | "warning" | "info" | "error";
        userId?: string;
        title?: string;
    }, {
        message?: string;
        type?: "success" | "warning" | "info" | "error";
        userId?: string;
        title?: string;
    }>;
    ApiResponse: z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
        data: z.ZodOptional<z.ZodAny>;
        error: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        success?: boolean;
        message?: string;
        error?: any;
        data?: any;
    }, {
        success?: boolean;
        message?: string;
        error?: any;
        data?: any;
    }>;
    UserSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        role?: string;
        query?: string;
        limit?: number;
        offset?: number;
    }, {
        role?: string;
        query?: string;
        limit?: number;
        offset?: number;
    }>;
    PlayerSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        teamId?: string;
        position?: string;
        query?: string;
        limit?: number;
        offset?: number;
    }, {
        teamId?: string;
        position?: string;
        query?: string;
        limit?: number;
        offset?: number;
    }>;
    TeamSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        leagueId: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        leagueId?: string;
        query?: string;
        limit?: number;
        offset?: number;
    }, {
        leagueId?: string;
        query?: string;
        limit?: number;
        offset?: number;
    }>;
    LeagueSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status?: string;
        query?: string;
        limit?: number;
        offset?: number;
    }, {
        status?: string;
        query?: string;
        limit?: number;
        offset?: number;
    }>;
    GameSearchSchema: z.ZodObject<{
        teamId: z.ZodOptional<z.ZodString>;
        leagueId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        teamId?: string;
        leagueId?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }, {
        teamId?: string;
        leagueId?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }>;
    VenueSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        query?: string;
        limit?: number;
        offset?: number;
    }, {
        query?: string;
        limit?: number;
        offset?: number;
    }>;
    PaymentSearchSchema: z.ZodObject<{
        userId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status?: string;
        userId?: string;
        limit?: number;
        offset?: number;
    }, {
        status?: string;
        userId?: string;
        limit?: number;
        offset?: number;
    }>;
    NotificationSearchSchema: z.ZodObject<{
        userId: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        read: z.ZodOptional<z.ZodBoolean>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        userId?: string;
        read?: boolean;
        limit?: number;
        offset?: number;
    }, {
        type?: string;
        userId?: string;
        read?: boolean;
        limit?: number;
        offset?: number;
    }>;
    PaginatedResponse: z.ZodObject<{
        data: z.ZodArray<z.ZodAny, "many">;
        total: z.ZodNumber;
        limit: z.ZodNumber;
        offset: z.ZodNumber;
        hasMore: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        data?: any[];
        limit?: number;
        offset?: number;
        total?: number;
        hasMore?: boolean;
    }, {
        data?: any[];
        limit?: number;
        offset?: number;
        total?: number;
        hasMore?: boolean;
    }>;
    NotificationsPaginatedResponse: z.ZodObject<{
        notifications: z.ZodArray<z.ZodAny, "many">;
        total: z.ZodNumber;
        limit: z.ZodNumber;
        offset: z.ZodNumber;
        hasMore: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        notifications?: any[];
        limit?: number;
        offset?: number;
        total?: number;
        hasMore?: boolean;
    }, {
        notifications?: any[];
        limit?: number;
        offset?: number;
        total?: number;
        hasMore?: boolean;
    }>;
};
//# sourceMappingURL=validation.d.ts.map