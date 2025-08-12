import { z } from 'zod';
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
        email: string;
        role: string;
        uid: string;
        createdAt?: any;
        updatedAt?: any;
    }, {
        email: string;
        role: string;
        uid: string;
        createdAt?: any;
        updatedAt?: any;
    }>;
    CreateUser: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<["admin", "director", "coach", "parent", "player", "staff"]>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        role: "admin" | "director" | "coach" | "parent" | "player" | "staff";
        password: string;
        firstName: string;
        lastName: string;
    }, {
        email: string;
        role: "admin" | "director" | "coach" | "parent" | "player" | "staff";
        password: string;
        firstName: string;
        lastName: string;
    }>;
    Player: z.ZodObject<{
        id: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        dateOfBirth: z.ZodString;
        position: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        id: string;
        dateOfBirth: string;
        position?: string | undefined;
        teamId?: string | undefined;
    }, {
        firstName: string;
        lastName: string;
        id: string;
        dateOfBirth: string;
        position?: string | undefined;
        teamId?: string | undefined;
    }>;
    CreatePlayer: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        dateOfBirth: z.ZodString;
        position: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        position?: string | undefined;
        teamId?: string | undefined;
    }, {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        position?: string | undefined;
        teamId?: string | undefined;
    }>;
    UpdatePlayer: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        dateOfBirth: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: string | undefined;
        position?: string | undefined;
        teamId?: string | undefined;
    }, {
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: string | undefined;
        position?: string | undefined;
        teamId?: string | undefined;
    }>;
    Team: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        leagueId: z.ZodString;
        players: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        leagueId: string;
        players?: string[] | undefined;
    }, {
        id: string;
        name: string;
        leagueId: string;
        players?: string[] | undefined;
    }>;
    CreateTeam: z.ZodObject<{
        name: z.ZodString;
        leagueId: z.ZodString;
        players: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        leagueId: string;
        players?: string[] | undefined;
    }, {
        name: string;
        leagueId: string;
        players?: string[] | undefined;
    }>;
    UpdateTeam: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        leagueId: z.ZodOptional<z.ZodString>;
        players: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        leagueId?: string | undefined;
        players?: string[] | undefined;
    }, {
        name?: string | undefined;
        leagueId?: string | undefined;
        players?: string[] | undefined;
    }>;
    League: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        season: z.ZodString;
        status: z.ZodEnum<["active", "inactive", "completed"]>;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "completed" | "inactive";
        id: string;
        name: string;
        season: string;
    }, {
        status: "active" | "completed" | "inactive";
        id: string;
        name: string;
        season: string;
    }>;
    CreateLeague: z.ZodObject<{
        name: z.ZodString;
        season: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<["active", "inactive", "completed"]>>;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "completed" | "inactive";
        name: string;
        season: string;
    }, {
        name: string;
        season: string;
        status?: "active" | "completed" | "inactive" | undefined;
    }>;
    Game: z.ZodObject<{
        id: z.ZodString;
        homeTeamId: z.ZodString;
        awayTeamId: z.ZodString;
        leagueId: z.ZodString;
        scheduledDate: z.ZodAny;
        status: z.ZodEnum<["scheduled", "in_progress", "completed", "cancelled"]>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "cancelled" | "scheduled" | "in_progress";
        id: string;
        leagueId: string;
        homeTeamId: string;
        awayTeamId: string;
        scheduledDate?: any;
    }, {
        status: "completed" | "cancelled" | "scheduled" | "in_progress";
        id: string;
        leagueId: string;
        homeTeamId: string;
        awayTeamId: string;
        scheduledDate?: any;
    }>;
    CreateGame: z.ZodObject<{
        homeTeamId: z.ZodString;
        awayTeamId: z.ZodString;
        leagueId: z.ZodString;
        scheduledDate: z.ZodAny;
        status: z.ZodDefault<z.ZodEnum<["scheduled", "in_progress", "completed", "cancelled"]>>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "cancelled" | "scheduled" | "in_progress";
        leagueId: string;
        homeTeamId: string;
        awayTeamId: string;
        scheduledDate?: any;
    }, {
        leagueId: string;
        homeTeamId: string;
        awayTeamId: string;
        status?: "completed" | "cancelled" | "scheduled" | "in_progress" | undefined;
        scheduledDate?: any;
    }>;
    Venue: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        address: z.ZodString;
        capacity: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        address: string;
        capacity?: number | undefined;
    }, {
        id: string;
        name: string;
        address: string;
        capacity?: number | undefined;
    }>;
    CreateVenue: z.ZodObject<{
        name: z.ZodString;
        address: z.ZodString;
        capacity: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        address: string;
        capacity?: number | undefined;
    }, {
        name: string;
        address: string;
        capacity?: number | undefined;
    }>;
    Payment: z.ZodObject<{
        id: z.ZodString;
        amount: z.ZodNumber;
        currency: z.ZodString;
        status: z.ZodEnum<["pending", "completed", "failed", "refunded"]>;
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "pending" | "failed" | "refunded";
        id: string;
        amount: number;
        currency: string;
        userId: string;
    }, {
        status: "completed" | "pending" | "failed" | "refunded";
        id: string;
        amount: number;
        currency: string;
        userId: string;
    }>;
    CreatePayment: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        currency: string;
        userId: string;
    }, {
        amount: number;
        userId: string;
        currency?: string | undefined;
    }>;
    Notification: z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        title: z.ZodString;
        message: z.ZodString;
        type: z.ZodEnum<["info", "warning", "error", "success"]>;
        read: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: "info" | "error" | "warning" | "success";
        message: string;
        id: string;
        userId: string;
        title: string;
        read: boolean;
    }, {
        type: "info" | "error" | "warning" | "success";
        message: string;
        id: string;
        userId: string;
        title: string;
        read?: boolean | undefined;
    }>;
    CreateNotification: z.ZodObject<{
        userId: z.ZodString;
        title: z.ZodString;
        message: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["info", "warning", "error", "success"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "info" | "error" | "warning" | "success";
        message: string;
        userId: string;
        title: string;
    }, {
        message: string;
        userId: string;
        title: string;
        type?: "info" | "error" | "warning" | "success" | undefined;
    }>;
    ApiResponse: z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
        data: z.ZodOptional<z.ZodAny>;
        error: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        success: boolean;
        error?: any;
        data?: any;
    }, {
        message: string;
        success: boolean;
        error?: any;
        data?: any;
    }>;
    UserSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        role?: string | undefined;
        query?: string | undefined;
    }, {
        role?: string | undefined;
        query?: string | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
    }>;
    PlayerSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        position?: string | undefined;
        teamId?: string | undefined;
        query?: string | undefined;
    }, {
        position?: string | undefined;
        teamId?: string | undefined;
        query?: string | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
    }>;
    TeamSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        leagueId: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        leagueId?: string | undefined;
        query?: string | undefined;
    }, {
        leagueId?: string | undefined;
        query?: string | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
    }>;
    LeagueSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        status?: string | undefined;
        query?: string | undefined;
    }, {
        status?: string | undefined;
        query?: string | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
    }>;
    GameSearchSchema: z.ZodObject<{
        teamId: z.ZodOptional<z.ZodString>;
        leagueId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        status?: string | undefined;
        teamId?: string | undefined;
        leagueId?: string | undefined;
    }, {
        status?: string | undefined;
        teamId?: string | undefined;
        leagueId?: string | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
    }>;
    VenueSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        query?: string | undefined;
    }, {
        query?: string | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
    }>;
    PaymentSearchSchema: z.ZodObject<{
        userId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        status?: string | undefined;
        userId?: string | undefined;
    }, {
        status?: string | undefined;
        userId?: string | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
    }>;
    NotificationSearchSchema: z.ZodObject<{
        userId: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        read: z.ZodOptional<z.ZodBoolean>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        type?: string | undefined;
        userId?: string | undefined;
        read?: boolean | undefined;
    }, {
        type?: string | undefined;
        userId?: string | undefined;
        read?: boolean | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
    }>;
    PaginatedResponse: z.ZodObject<{
        data: z.ZodArray<z.ZodAny, "many">;
        total: z.ZodNumber;
        limit: z.ZodNumber;
        offset: z.ZodNumber;
        hasMore: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        data: any[];
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
    }, {
        data: any[];
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
    }>;
    NotificationsPaginatedResponse: z.ZodObject<{
        notifications: z.ZodArray<z.ZodAny, "many">;
        total: z.ZodNumber;
        limit: z.ZodNumber;
        offset: z.ZodNumber;
        hasMore: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
        notifications: any[];
    }, {
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
        notifications: any[];
    }>;
};
//# sourceMappingURL=validation.d.ts.map