export * from './user';
import { z } from 'zod';
export declare const Schemas: {
    readonly User: any;
    readonly Player: any;
    readonly Team: any;
    readonly League: any;
    readonly Game: any;
    readonly Venue: any;
    readonly Payment: any;
    readonly Notification: any;
    readonly CreateUser: any;
    readonly CreatePlayer: any;
    readonly CreateTeam: any;
    readonly CreateLeague: any;
    readonly CreateGame: any;
    readonly CreateVenue: any;
    readonly CreatePayment: any;
    readonly CreateNotification: any;
    readonly UpdateUser: any;
    readonly UpdatePlayer: any;
    readonly UpdateTeam: any;
    readonly UpdateLeague: any;
    readonly UpdateGame: any;
    readonly UpdateVenue: any;
    readonly UpdatePayment: any;
    readonly UpdateNotification: any;
    readonly ApiResponse: <T extends z.ZodTypeAny>(dataSchema: T) => any;
    readonly PaginatedResponse: <T_1 extends z.ZodTypeAny>(dataSchema: T_1) => any;
    readonly UserApiResponse: any;
    readonly PlayerApiResponse: any;
    readonly TeamApiResponse: any;
    readonly LeagueApiResponse: any;
    readonly GameApiResponse: any;
    readonly VenueApiResponse: any;
    readonly PaymentApiResponse: any;
    readonly NotificationApiResponse: any;
    readonly UsersPaginatedResponse: any;
    readonly PlayersPaginatedResponse: any;
    readonly TeamsPaginatedResponse: any;
    readonly LeaguesPaginatedResponse: any;
    readonly GamesPaginatedResponse: any;
    readonly VenuesPaginatedResponse: any;
    readonly PaymentsPaginatedResponse: any;
    readonly NotificationsPaginatedResponse: any;
};
/**
 * Validate data against a schema and return typed result
 */
export declare const validateData: <T>(schema: z.ZodSchema<T>, data: unknown) => {
    success: true;
    data: T;
} | {
    success: false;
    errors: z.ZodError;
};
/**
 * Validate data and throw error if invalid
 */
export declare const validateDataStrict: <T>(schema: z.ZodSchema<T>, data: unknown) => T;
/**
 * Validate data and return with default values
 */
export declare const validateDataWithDefaults: <T>(schema: z.ZodSchema<T>, data: unknown, defaults?: Partial<T>) => T;
/**
 * Create a validation function for a specific schema
 */
export declare const createValidator: <T>(schema: z.ZodSchema<T>) => {
    validate: (data: unknown) => {
        success: false;
        errors: z.ZodError;
    } | {
        success: true;
        data: unknown;
    };
    validateStrict: (data: unknown) => unknown;
    validateWithDefaults: (data: unknown, defaults?: Partial<T> | undefined) => T;
    schema: z.ZodSchema<T>;
};
/**
 * Create form validation schema from entity schema
 */
export declare const createFormSchema: <T>(entitySchema: z.ZodSchema<T>, requiredFields?: (keyof T)[]) => any;
/**
 * Create search/filter schema
 */
export declare const createSearchSchema: <T>(entitySchema: z.ZodSchema<T>, searchableFields?: (keyof T)[]) => any;
export declare const UserRegistrationFormSchema: any;
export declare const UserProfileFormSchema: any;
export declare const PlayerRegistrationFormSchema: any;
export declare const PlayerProfileFormSchema: any;
export declare const TeamCreationFormSchema: any;
export declare const TeamUpdateFormSchema: any;
export declare const LeagueCreationFormSchema: any;
export declare const LeagueUpdateFormSchema: any;
export declare const GameCreationFormSchema: any;
export declare const GameUpdateFormSchema: any;
export declare const VenueCreationFormSchema: any;
export declare const VenueUpdateFormSchema: any;
export declare const PaymentCreationFormSchema: any;
export declare const PaymentUpdateFormSchema: any;
export declare const NotificationCreationFormSchema: any;
export declare const NotificationUpdateFormSchema: any;
export declare const UserSearchSchema: any;
export declare const PlayerSearchSchema: any;
export declare const TeamSearchSchema: any;
export declare const LeagueSearchSchema: any;
export declare const GameSearchSchema: any;
export declare const VenueSearchSchema: any;
export declare const PaymentSearchSchema: any;
export declare const NotificationSearchSchema: any;
export declare const ValidationUtils: {
    validateData: <T>(schema: z.ZodSchema<T>, data: unknown) => {
        success: true;
        data: T;
    } | {
        success: false;
        errors: z.ZodError;
    };
    validateDataStrict: <T_1>(schema: z.ZodSchema<T_1>, data: unknown) => T_1;
    validateDataWithDefaults: <T_2>(schema: z.ZodSchema<T_2>, data: unknown, defaults?: Partial<T_2>) => T_2;
    createValidator: <T_3>(schema: z.ZodSchema<T_3>) => {
        validate: (data: unknown) => {
            success: false;
            errors: z.ZodError;
        } | {
            success: true;
            data: unknown;
        };
        validateStrict: (data: unknown) => unknown;
        validateWithDefaults: (data: unknown, defaults?: Partial<T> | undefined) => T;
        schema: z.ZodSchema<T_3>;
    };
    createFormSchema: <T_4>(entitySchema: z.ZodSchema<T_4>, requiredFields?: (keyof T_4)[]) => any;
    createSearchSchema: <T_5>(entitySchema: z.ZodSchema<T_5>, searchableFields?: (keyof T_5)[]) => any;
};
export declare const FormSchemas: {
    UserRegistration: any;
    UserProfile: any;
    PlayerRegistration: any;
    PlayerProfile: any;
    TeamCreation: any;
    TeamUpdate: any;
    LeagueCreation: any;
    LeagueUpdate: any;
    GameCreation: any;
    GameUpdate: any;
    VenueCreation: any;
    VenueUpdate: any;
    PaymentCreation: any;
    PaymentUpdate: any;
    NotificationCreation: any;
    NotificationUpdate: any;
};
export declare const SearchSchemas: {
    User: any;
    Player: any;
    Team: any;
    League: any;
    Game: any;
    Venue: any;
    Payment: any;
    Notification: any;
};
export type { SchemasType } from './user';
export { z };
//# sourceMappingURL=index.d.ts.map