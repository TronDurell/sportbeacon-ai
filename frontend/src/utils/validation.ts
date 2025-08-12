/**
 * Comprehensive Input Validation Utilities
 * 
 * This module provides centralized validation functions for all user inputs
 * to prevent injection attacks and ensure data integrity.
 */

import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * User Registration Data Schema
 */
export const UserRegistrationSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(254, 'Email too long')
    .transform(email => email.trim().toLowerCase()),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters')
    .transform(name => name.trim()),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters')
    .transform(name => name.trim()),
  
  role: z.enum(['admin', 'director', 'coach', 'townStaff', 'athlete'], {
    errorMap: () => ({ message: 'Invalid role selected' })
  }),
  
  organization: z.string()
    .max(100, 'Organization name too long')
    .optional()
    .transform(org => org?.trim() || undefined),
});

/**
 * User Login Data Schema
 */
export const UserLoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .transform(email => email.trim().toLowerCase()),
  
  password: z.string()
    .min(1, 'Password is required'),
  
  role: z.enum(['admin', 'director', 'coach', 'townStaff', 'athlete'], {
    errorMap: () => ({ message: 'Invalid role selected' })
  }),
});

/**
 * User Profile Update Schema
 */
export const UserProfileUpdateSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters')
    .transform(name => name.trim())
    .optional(),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters')
    .transform(name => name.trim())
    .optional(),
  
  organization: z.string()
    .max(100, 'Organization name too long')
    .optional()
    .transform(org => org?.trim() || undefined),
});

/**
 * League Data Schema
 */
export const LeagueSchema = z.object({
  name: z.string()
    .min(1, 'League name is required')
    .max(100, 'League name too long')
    .regex(/^[a-zA-Z0-9\s\-']+$/, 'League name contains invalid characters')
    .transform(name => name.trim()),
  
  sport: z.enum(['soccer', 'basketball', 'baseball', 'football', 'hockey', 'tennis', 'volleyball', 'lacrosse'], {
    errorMap: () => ({ message: 'Invalid sport selected' })
  }),
  
  ageGroup: z.enum(['u6', 'u8', 'u10', 'u12', 'u14', 'u16', 'u18', 'adult'], {
    errorMap: () => ({ message: 'Invalid age group selected' })
  }),
  
  maxTeams: z.number()
    .int('Max teams must be a whole number')
    .min(1, 'Max teams must be at least 1')
    .max(100, 'Max teams cannot exceed 100'),
  
  maxPlayersPerTeam: z.number()
    .int('Max players per team must be a whole number')
    .min(1, 'Max players per team must be at least 1')
    .max(50, 'Max players per team cannot exceed 50'),
  
  minPlayersPerTeam: z.number()
    .int('Min players per team must be a whole number')
    .min(1, 'Min players per team must be at least 1')
    .max(50, 'Min players per team cannot exceed 50'),
  
  organizationId: z.string()
    .uuid('Invalid organization ID format')
    .optional(),
});

/**
 * Team Data Schema
 */
export const TeamSchema = z.object({
  name: z.string()
    .min(1, 'Team name is required')
    .max(100, 'Team name too long')
    .regex(/^[a-zA-Z0-9\s\-']+$/, 'Team name contains invalid characters')
    .transform(name => name.trim()),
  
  leagueId: z.string()
    .uuid('Invalid league ID format'),
  
  coachId: z.string()
    .uuid('Invalid coach ID format'),
});

/**
 * Player Data Schema
 */
export const PlayerSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters')
    .transform(name => name.trim()),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters')
    .transform(name => name.trim()),
  
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine(date => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 3 && age <= 100;
    }, 'Invalid birth date'),
  
  teamId: z.string()
    .uuid('Invalid team ID format')
    .optional(),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validation Result Interface
 */
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
}

/**
 * Generic validation function
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      isValid: true,
      data: validatedData,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return {
      isValid: false,
      errors: ['Validation failed with unknown error']
    };
  }
}

/**
 * User Registration Validation
 */
export function validateUserRegistration(data: unknown): ValidationResult<z.infer<typeof UserRegistrationSchema>> {
  return validateData(UserRegistrationSchema, data);
}

/**
 * User Login Validation
 */
export function validateUserLogin(data: unknown): ValidationResult<z.infer<typeof UserLoginSchema>> {
  return validateData(UserLoginSchema, data);
}

/**
 * User Profile Update Validation
 */
export function validateUserProfileUpdate(data: unknown): ValidationResult<z.infer<typeof UserProfileUpdateSchema>> {
  return validateData(UserProfileUpdateSchema, data);
}

/**
 * League Data Validation
 */
export function validateLeagueData(data: unknown): ValidationResult<z.infer<typeof LeagueSchema>> {
  return validateData(LeagueSchema, data);
}

/**
 * Team Data Validation
 */
export function validateTeamData(data: unknown): ValidationResult<z.infer<typeof TeamSchema>> {
  return validateData(TeamSchema, data);
}

/**
 * Player Data Validation
 */
export function validatePlayerData(data: unknown): ValidationResult<z.infer<typeof PlayerSchema>> {
  return validateData(PlayerSchema, data);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  return errors.join(', ');
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(
  requestCount: number,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  return requestCount < maxRequests;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type UserRegistrationData = z.infer<typeof UserRegistrationSchema>;
export type UserLoginData = z.infer<typeof UserLoginSchema>;
export type UserProfileUpdateData = z.infer<typeof UserProfileUpdateSchema>;
export type LeagueData = z.infer<typeof LeagueSchema>;
export type TeamData = z.infer<typeof TeamSchema>;
export type PlayerData = z.infer<typeof PlayerSchema>; 