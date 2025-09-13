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
        role: "player" | "coach" | "admin" | "parent" | "director" | "staff";
        password: string;
        firstName: string;
        lastName: string;
    }, {
        email: string;
        role: "player" | "coach" | "admin" | "parent" | "director" | "staff";
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
        id: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        position?: string | undefined;
        teamId?: string | undefined;
    }, {
        id: string;
        firstName: string;
        lastName: string;
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
        position?: string | undefined;
        teamId?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: string | undefined;
    }, {
        position?: string | undefined;
        teamId?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        dateOfBirth?: string | undefined;
    }>;
    Team: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        leagueId: z.ZodString;
        players: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        leagueId: string;
        players?: string[] | undefined;
    }, {
        name: string;
        id: string;
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
        players?: string[] | undefined;
        leagueId?: string | undefined;
    }, {
        name?: string | undefined;
        players?: string[] | undefined;
        leagueId?: string | undefined;
    }>;
    League: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        season: z.ZodString;
        status: z.ZodEnum<["active", "inactive", "completed"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        status: "active" | "inactive" | "completed";
        id: string;
        season: string;
    }, {
        name: string;
        status: "active" | "inactive" | "completed";
        id: string;
        season: string;
    }>;
    CreateLeague: z.ZodObject<{
        name: z.ZodString;
        season: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<["active", "inactive", "completed"]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        status: "active" | "inactive" | "completed";
        season: string;
    }, {
        name: string;
        season: string;
        status?: "active" | "inactive" | "completed" | undefined;
    }>;
    Game: z.ZodObject<{
        id: z.ZodString;
        homeTeamId: z.ZodString;
        awayTeamId: z.ZodString;
        leagueId: z.ZodString;
        scheduledDate: z.ZodAny;
        status: z.ZodEnum<["scheduled", "in_progress", "completed", "cancelled"]>;
    }, "strip", z.ZodTypeAny, {
        status: "cancelled" | "completed" | "scheduled" | "in_progress";
        id: string;
        leagueId: string;
        homeTeamId: string;
        awayTeamId: string;
        scheduledDate?: any;
    }, {
        status: "cancelled" | "completed" | "scheduled" | "in_progress";
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
        status: "cancelled" | "completed" | "scheduled" | "in_progress";
        leagueId: string;
        homeTeamId: string;
        awayTeamId: string;
        scheduledDate?: any;
    }, {
        leagueId: string;
        homeTeamId: string;
        awayTeamId: string;
        status?: "cancelled" | "completed" | "scheduled" | "in_progress" | undefined;
        scheduledDate?: any;
    }>;
    Venue: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        address: z.ZodString;
        capacity: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        address: string;
        id: string;
        capacity?: number | undefined;
    }, {
        name: string;
        address: string;
        id: string;
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
        currency: string;
        status: "failed" | "pending" | "completed" | "refunded";
        id: string;
        userId: string;
        amount: number;
    }, {
        currency: string;
        status: "failed" | "pending" | "completed" | "refunded";
        id: string;
        userId: string;
        amount: number;
    }>;
    CreatePayment: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        userId: string;
        amount: number;
    }, {
        userId: string;
        amount: number;
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
        type: "error" | "warning" | "info" | "success";
        title: string;
        id: string;
        message: string;
        read: boolean;
        userId: string;
    }, {
        type: "error" | "warning" | "info" | "success";
        title: string;
        id: string;
        message: string;
        userId: string;
        read?: boolean | undefined;
    }>;
    CreateNotification: z.ZodObject<{
        userId: z.ZodString;
        title: z.ZodString;
        message: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["info", "warning", "error", "success"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "error" | "warning" | "info" | "success";
        title: string;
        message: string;
        userId: string;
    }, {
        title: string;
        message: string;
        userId: string;
        type?: "error" | "warning" | "info" | "success" | undefined;
    }>;
    ApiResponse: z.ZodObject<{
        success: z.ZodBoolean;
        message: z.ZodString;
        data: z.ZodOptional<z.ZodAny>;
        error: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        success: boolean;
        data?: any;
        error?: any;
    }, {
        message: string;
        success: boolean;
        data?: any;
        error?: any;
    }>;
    UserSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        offset: number;
        limit: number;
        role?: string | undefined;
        query?: string | undefined;
    }, {
        offset?: number | undefined;
        role?: string | undefined;
        query?: string | undefined;
        limit?: number | undefined;
    }>;
    PlayerSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        teamId: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        offset: number;
        limit: number;
        position?: string | undefined;
        query?: string | undefined;
        teamId?: string | undefined;
    }, {
        position?: string | undefined;
        offset?: number | undefined;
        query?: string | undefined;
        teamId?: string | undefined;
        limit?: number | undefined;
    }>;
    TeamSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        leagueId: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        offset: number;
        limit: number;
        query?: string | undefined;
        leagueId?: string | undefined;
    }, {
        offset?: number | undefined;
        query?: string | undefined;
        leagueId?: string | undefined;
        limit?: number | undefined;
    }>;
    LeagueSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        offset: number;
        limit: number;
        status?: string | undefined;
        query?: string | undefined;
    }, {
        offset?: number | undefined;
        status?: string | undefined;
        query?: string | undefined;
        limit?: number | undefined;
    }>;
    GameSearchSchema: z.ZodObject<{
        teamId: z.ZodOptional<z.ZodString>;
        leagueId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        offset: number;
        limit: number;
        status?: string | undefined;
        teamId?: string | undefined;
        leagueId?: string | undefined;
    }, {
        offset?: number | undefined;
        status?: string | undefined;
        teamId?: string | undefined;
        leagueId?: string | undefined;
        limit?: number | undefined;
    }>;
    VenueSearchSchema: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        offset: number;
        limit: number;
        query?: string | undefined;
    }, {
        offset?: number | undefined;
        query?: string | undefined;
        limit?: number | undefined;
    }>;
    PaymentSearchSchema: z.ZodObject<{
        userId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        offset: number;
        limit: number;
        status?: string | undefined;
        userId?: string | undefined;
    }, {
        offset?: number | undefined;
        status?: string | undefined;
        userId?: string | undefined;
        limit?: number | undefined;
    }>;
    NotificationSearchSchema: z.ZodObject<{
        userId: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        read: z.ZodOptional<z.ZodBoolean>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        offset: number;
        limit: number;
        type?: string | undefined;
        read?: boolean | undefined;
        userId?: string | undefined;
    }, {
        type?: string | undefined;
        offset?: number | undefined;
        read?: boolean | undefined;
        userId?: string | undefined;
        limit?: number | undefined;
    }>;
    PaginatedResponse: z.ZodObject<{
        data: z.ZodArray<z.ZodAny, "many">;
        total: z.ZodNumber;
        limit: z.ZodNumber;
        offset: z.ZodNumber;
        hasMore: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        offset: number;
        data: any[];
        total: number;
        limit: number;
        hasMore: boolean;
    }, {
        offset: number;
        data: any[];
        total: number;
        limit: number;
        hasMore: boolean;
    }>;
    NotificationsPaginatedResponse: z.ZodObject<{
        notifications: z.ZodArray<z.ZodAny, "many">;
        total: z.ZodNumber;
        limit: z.ZodNumber;
        offset: z.ZodNumber;
        hasMore: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        offset: number;
        total: number;
        notifications: any[];
        limit: number;
        hasMore: boolean;
    }, {
        offset: number;
        total: number;
        notifications: any[];
        limit: number;
        hasMore: boolean;
    }>;
};
//# sourceMappingURL=validation.d.ts.map