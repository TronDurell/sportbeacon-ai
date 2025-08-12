import { z } from 'zod';
export interface ValidationMiddlewareOptions {
    schema: z.ZodSchema<unknown>;
    validateBody?: boolean;
    validateQuery?: boolean;
    validateParams?: boolean;
    strict?: boolean;
    transform?: boolean;
}
export interface ValidationResult<T = unknown> {
    success: boolean;
    data?: T;
    errors?: z.ZodError;
    sanitizedData?: T;
}
export interface ValidationRequest {
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    params?: Record<string, unknown>;
    validation?: ValidationResult<unknown>;
}
export interface ValidationResponse {
    status: (code: number) => ValidationResponse;
    json: (data: unknown) => void;
}
export interface ValidationNext {
    (error?: Error): void;
}
/**
 * Create validation middleware for Express/Next.js API routes
 */
export declare const createValidationMiddleware: (options: ValidationMiddlewareOptions) => (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * User validation middlewares
 */
export declare const validateUserRegistration: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateUserUpdate: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateUserSearch: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Player validation middlewares
 */
export declare const validatePlayerRegistration: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validatePlayerUpdate: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validatePlayerSearch: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Team validation middlewares
 */
export declare const validateTeamCreation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateTeamUpdate: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateTeamSearch: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * League validation middlewares
 */
export declare const validateLeagueCreation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateLeagueUpdate: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateLeagueSearch: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Game validation middlewares
 */
export declare const validateGameCreation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateGameUpdate: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateGameSearch: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Venue validation middlewares
 */
export declare const validateVenueCreation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateVenueUpdate: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateVenueSearch: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Payment validation middlewares
 */
export declare const validatePaymentCreation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validatePaymentUpdate: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validatePaymentSearch: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Notification validation middlewares
 */
export declare const validateNotificationCreation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateNotificationUpdate: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validateNotificationSearch: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Validate UUID parameters
 */
export declare const validateIdParam: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Validate multiple ID parameters
 */
export declare const validateIdsParam: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const validatePagination: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Validate data against a Zod schema
 */
export declare const validateData: <T>(schema: z.ZodSchema<T>, data: unknown) => ValidationResult<T>;
/**
 * Validate response data against a schema
 */
export declare const validateResponse: <T>(schema: z.ZodSchema<T>, data: unknown) => ValidationResult<T>;
/**
 * Create response validation middleware
 */
export declare const createResponseValidationMiddleware: <T>(schema: z.ZodSchema<T>) => (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Handle validation errors in a centralized way
 */
export declare const handleValidationErrors: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
/**
 * Create error handling middleware
 */
export declare const createErrorHandlingMiddleware: () => (error: Error, req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
export declare const ValidationMiddleware: {
    create: (options: ValidationMiddlewareOptions) => (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    createResponseValidation: <T>(schema: z.ZodSchema<T>) => (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    createErrorHandling: () => (error: Error, req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    user: {
        registration: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        update: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        search: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    };
    player: {
        registration: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        update: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        search: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    };
    team: {
        creation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        update: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        search: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    };
    league: {
        creation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        update: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        search: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    };
    game: {
        creation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        update: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        search: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    };
    venue: {
        creation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        update: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        search: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    };
    payment: {
        creation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        update: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        search: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    };
    notification: {
        creation: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        update: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
        search: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    };
    id: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    ids: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    pagination: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    errors: (req: ValidationRequest, res: ValidationResponse, next: ValidationNext) => void;
    validateResponse: <T_1>(schema: z.ZodSchema<T_1>, data: unknown) => ValidationResult<T_1>;
};
//# sourceMappingURL=validation.d.ts.map