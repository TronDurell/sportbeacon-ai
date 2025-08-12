/**
 * Security validation tests for SportBeaconAI
 * Tests comprehensive input validation and sanitization
 */

import {
  validateUserRegistrationData,
  isValidEmail,
  validatePasswordStrength,
  sanitizeString,
  isValidUUID,
  isValidDate,
  createValidationError,
  formatValidationErrors,
  UserRegistrationData,
  ValidationResult
} from '../../src/utils/validation';

describe('Security Validation Tests', () => {
  describe('validateUserRegistrationData', () => {
    it('should validate correct user registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'athlete' as const,
        organization: 'Test Org'
      };

      const result = validateUserRegistrationData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toEqual({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'athlete',
        organization: 'Test Org'
      });
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'athlete' as const
      };

      const result = validateUserRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('email');
      expect(result.errors[0].code).toBe('INVALID_EMAIL_FORMAT');
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        role: 'athlete' as const
      };

      const result = validateUserRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'password')).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
        // missing password, firstName, lastName, role
      };

      const result = validateUserRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'password')).toBe(true);
      expect(result.errors.some(e => e.field === 'firstName')).toBe(true);
      expect(result.errors.some(e => e.field === 'lastName')).toBe(true);
      expect(result.errors.some(e => e.field === 'role')).toBe(true);
    });

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid-role' as any
      };

      const result = validateUserRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('role');
      expect(result.errors[0].code).toBe('INVALID_ROLE');
    });

    it('should sanitize input data', () => {
      const dataWithWhitespace = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'SecurePass123!',
        firstName: '  John  ',
        lastName: '  Doe  ',
        role: 'athlete' as const,
        organization: '  Test Org  '
      };

      const result = validateUserRegistrationData(dataWithWhitespace);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toEqual({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'athlete',
        organization: 'Test Org'
      });
    });

    it('should reject data that is not an object', () => {
      const invalidData = 'not an object';

      const result = validateUserRegistrationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('data');
      expect(result.errors[0].code).toBe('INVALID_DATA_TYPE');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@numbers.com'
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email as any)).toBe(false);
      });
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'SecurePass123!',
        'MyP@ssw0rd',
        'Str0ng#P@ss',
        'C0mpl3x!P@ss'
      ];

      strongPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak', // too short
        'password', // no uppercase, numbers, or special chars
        'PASSWORD', // no lowercase, numbers, or special chars
        'Password', // no numbers or special chars
        'Password123', // no special chars
        'password123!', // no uppercase
        'PASSWORD123!', // no lowercase
      ];

      weakPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide specific error messages for password issues', () => {
      const result = validatePasswordStrength('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'PASSWORD_TOO_SHORT')).toBe(true);
      expect(result.errors.some(e => e.code === 'PASSWORD_MISSING_UPPERCASE')).toBe(true);
      expect(result.errors.some(e => e.code === 'PASSWORD_MISSING_NUMBER')).toBe(true);
      expect(result.errors.some(e => e.code === 'PASSWORD_MISSING_SPECIAL')).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize valid strings', () => {
      expect(sanitizeString('  test  ')).toBe('test');
      expect(sanitizeString('normal string')).toBe('normal string');
      expect(sanitizeString('string with <script>')).toBe('string with script');
    });

    it('should reject invalid inputs', () => {
      expect(sanitizeString('')).toBe(null);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(null);
      expect(sanitizeString(123)).toBe(null);
    });

    it('should respect max length', () => {
      const longString = 'a'.repeat(1001);
      expect(sanitizeString(longString, 1000)).toBe(null);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID formats', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ];

      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-42661417400', // too short
        '123e4567-e89b-12d3-a456-4266141740000', // too long
        '',
        null,
        undefined
      ];

      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid as any)).toBe(false);
      });
    });
  });

  describe('isValidDate', () => {
    it('should validate correct date formats', () => {
      const validDates = [
        new Date(),
        new Date('2023-01-01'),
        '2023-01-01',
        '2023-01-01T00:00:00.000Z'
      ];

      validDates.forEach(date => {
        expect(isValidDate(date)).toBe(true);
      });
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        'not-a-date',
        '2023-13-01', // invalid month
        '2023-01-32', // invalid day
        '',
        null,
        undefined,
        new Date('invalid-date')
      ];

      invalidDates.forEach(date => {
        expect(isValidDate(date)).toBe(false);
      });
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with correct structure', () => {
      const error = createValidationError('email', 'Invalid email', 'INVALID_EMAIL');

      expect(error.field).toBe('email');
      expect(error.message).toBe('Invalid email');
      expect(error.code).toBe('INVALID_EMAIL');
    });
  });

  describe('formatValidationErrors', () => {
    it('should format validation errors correctly', () => {
      const errors = [
        createValidationError('email', 'Invalid email', 'INVALID_EMAIL'),
        createValidationError('password', 'Password too weak', 'WEAK_PASSWORD')
      ];

      const formatted = formatValidationErrors(errors);

      expect(formatted).toEqual([
        'email: Invalid email',
        'password: Password too weak'
      ]);
    });

    it('should handle empty errors array', () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toEqual([]);
    });
  });
}); 