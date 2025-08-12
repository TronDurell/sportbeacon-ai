/**
 * DEPRECATED: TodoFixMe Types - Migration in Progress
 * 
 * This file is being phased out in favor of comprehensive type definitions.
 * Please use the proper interfaces from types/interfaces.ts instead.
 * 
 * These types are maintained for backward compatibility during migration.
 */

// Import comprehensive type definitions
export * from './interfaces';

// Legacy TodoFixMe types for backward compatibility
// TODO: Remove these after migration is complete

/**
 * @deprecated Use proper interfaces from types/interfaces.ts
 * Temporary type for migration - replace with specific interfaces
 */
export interface TodoFixMe {
  [key: string]: unknown;
}

/**
 * @deprecated Use ApiRequest<T> from types/interfaces.ts
 * Temporary request type for migration
 */
export interface TodoFixMeRequest {
  body: TodoFixMe;
  params: TodoFixMe;
  query: TodoFixMe;
  headers: TodoFixMe;
}

/**
 * @deprecated Use ApiResponse<T> from types/interfaces.ts
 * Temporary response type for migration
 */
export interface TodoFixMeResponse {
  data: TodoFixMe;
}

/**
 * @deprecated Use ApiContext from types/interfaces.ts
 * Temporary context type for migration
 */
export interface TodoFixMeContext {
  auth: TodoFixMe;
  user: TodoFixMe;
}

/**
 * @deprecated Use AppConfig from types/interfaces.ts
 * Temporary config type for migration
 */
export interface TodoFixMeConfig {
  [key: string]: unknown;
}

/**
 * @deprecated Use specific data types from types/interfaces.ts
 * Temporary data type for migration
 */
export interface TodoFixMeData {
  [key: string]: unknown;
}

// Migration helper functions
export const createTypedRequest = <T>(data: T) => data;
export const createTypedResponse = <T>(data: T) => data;
export const createTypedContext = <T>(data: T) => data;

// Type guards for migration
export const isTodoFixMe = (obj: unknown): obj is TodoFixMe => {
  return typeof obj === 'object' && obj !== null;
};

export const migrateToTypedInterface = <T>(todoFixMeData: TodoFixMe): T => {
  return todoFixMeData as T;
}; 