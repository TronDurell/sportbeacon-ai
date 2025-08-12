// Comprehensive Input Validation Utilities
// Replaces TodoFixMe types with proper validation

import { ValidationRule, ValidationSchema } from '../../types/interfaces';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: Record<string, unknown>;
}

export class InputValidator {
  private static instance: InputValidator;

  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  /**
   * Validate data against a schema
   */
  validate(data: unknown, schema: ValidationSchema): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: Record<string, unknown> = {};

    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: ['Data must be an object']
      };
    }

    const dataObj = data as Record<string, unknown>;

    // Validate each field in the schema
    for (const [fieldName, rule] of Object.entries(schema)) {
      const value = dataObj[fieldName];
      const fieldErrors = this.validateField(fieldName, value, rule);

      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors);
      } else if (value !== undefined) {
        // Apply sanitization if rule exists
        sanitizedData[fieldName] = rule.sanitize ? rule.sanitize(value) : value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  /**
   * Validate a single field
   */
  private validateField(fieldName: string, value: unknown, rule: ValidationRule): string[] {
    const errors: string[] = [];

    // Check if required
    if (rule.type === 'required' && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      return errors;
    }

    // Skip validation if value is undefined and not required
    if (value === undefined || value === null) {
      return errors;
    }

    // Type validation
    if (rule.type && rule.type !== 'required') {
      const typeError = this.validateType(fieldName, value, rule.type);
      if (typeError) {
        errors.push(typeError);
        return errors; // Stop validation if type is wrong
      }
    }

    // String-specific validations
    if (typeof value === 'string') {
      if (rule.type === 'email' && !this.validateEmail(value)) {
        errors.push(`${fieldName} must be a valid email address`);
      }

      if (rule.type === 'uuid' && !this.validateUUID(value)) {
        errors.push(`${fieldName} must be a valid UUID`);
      }

      if (rule.type === 'url' && !this.validateURL(value)) {
        errors.push(`${fieldName} must be a valid URL`);
      }

      if (rule.value && typeof rule.value === 'number') {
        if (rule.type === 'minLength' && value.length < rule.value) {
          errors.push(`${fieldName} must be at least ${rule.value} characters long`);
        }

        if (rule.type === 'maxLength' && value.length > rule.value) {
          errors.push(`${fieldName} must be no more than ${rule.value} characters long`);
        }
      }

      if (rule.type === 'pattern' && rule.value instanceof RegExp && !rule.value.test(value)) {
        errors.push(`${fieldName} must match the required pattern`);
      }
    }

    // Number-specific validations
    if (typeof value === 'number') {
      if (rule.value && typeof rule.value === 'number') {
        if (rule.type === 'min' && value < rule.value) {
          errors.push(`${fieldName} must be at least ${rule.value}`);
        }

        if (rule.type === 'max' && value > rule.value) {
          errors.push(`${fieldName} must be no more than ${rule.value}`);
        }
      }
    }

    // Array-specific validations
    if (Array.isArray(value)) {
      if (rule.value && typeof rule.value === 'number') {
        if (rule.type === 'minLength' && value.length < rule.value) {
          errors.push(`${fieldName} must have at least ${rule.value} items`);
        }

        if (rule.type === 'maxLength' && value.length > rule.value) {
          errors.push(`${fieldName} must have no more than ${rule.value} items`);
        }
      }
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors.push(rule.message || `${fieldName} failed custom validation`);
    }

    return errors;
  }

  /**
   * Validate type of a value
   */
  private validateType(fieldName: string, value: unknown, type: string): string | null {
    switch (type) {
      case 'string':
        return typeof value === 'string' ? null : `${fieldName} must be a string`;
      case 'number':
        return typeof value === 'number' ? null : `${fieldName} must be a number`;
      case 'boolean':
        return typeof value === 'boolean' ? null : `${fieldName} must be a boolean`;
      case 'array':
        return Array.isArray(value) ? null : `${fieldName} must be an array`;
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value) 
          ? null : `${fieldName} must be an object`;
      case 'date':
        return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))
          ? null : `${fieldName} must be a valid date`;
      case 'email':
        return typeof value === 'string' && this.validateEmail(value)
          ? null : `${fieldName} must be a valid email address`;
      case 'uuid':
        return typeof value === 'string' && this.validateUUID(value)
          ? null : `${fieldName} must be a valid UUID`;
      case 'url':
        return typeof value === 'string' && this.validateURL(value)
          ? null : `${fieldName} must be a valid URL`;
      default:
        return null;
    }
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate UUID format
   */
  validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate URL format
   */
  validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate phone number format
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Validate and parse date string
   */
  validateDate(dateString: string): Date | null {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Validate number range
   */
  validateNumberRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Validate string length
   */
  validateStringLength(value: string, min: number, max: number): boolean {
    return value.length >= min && value.length <= max;
  }

  /**
   * Validate array length
   */
  validateArrayLength(value: unknown[], min: number, max: number): boolean {
    return value.length >= min && value.length <= max;
  }

  /**
   * Validate enum value
   */
  validateEnum(value: string, allowedValues: string[]): boolean {
    return allowedValues.includes(value);
  }

  /**
   * Validate object structure
   */
  validateObjectStructure(obj: Record<string, unknown>, requiredKeys: string[]): boolean {
    return requiredKeys.every(key => key in obj);
  }

  /**
   * Create validation schema for common patterns
   */
  static createUserSchema(): ValidationSchema {
    return {
      email: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Must be a valid email address' }
      ],
      firstName: [
        { type: 'required', message: 'First name is required' },
        { type: 'minLength', value: 2, message: 'First name must be at least 2 characters' },
        { type: 'maxLength', value: 50, message: 'First name must be no more than 50 characters' }
      ],
      lastName: [
        { type: 'required', message: 'Last name is required' },
        { type: 'minLength', value: 2, message: 'Last name must be at least 2 characters' },
        { type: 'maxLength', value: 50, message: 'Last name must be no more than 50 characters' }
      ],
      role: [
        { type: 'required', message: 'Role is required' },
        { type: 'enum', value: ['admin', 'director', 'coach', 'parent', 'player', 'referee', 'scout'], message: 'Invalid role' }
      ]
    };
  }

  /**
   * Create validation schema for player registration
   */
  static createPlayerSchema(): ValidationSchema {
    return {
      firstName: [
        { type: 'required', message: 'First name is required' },
        { type: 'minLength', value: 2, message: 'First name must be at least 2 characters' }
      ],
      lastName: [
        { type: 'required', message: 'Last name is required' },
        { type: 'minLength', value: 2, message: 'Last name must be at least 2 characters' }
      ],
      dateOfBirth: [
        { type: 'required', message: 'Date of birth is required' },
        { type: 'date', message: 'Must be a valid date' }
      ],
      gender: [
        { type: 'required', message: 'Gender is required' },
        { type: 'enum', value: ['male', 'female', 'other'], message: 'Invalid gender' }
      ],
      skillLevel: [
        { type: 'required', message: 'Skill level is required' },
        { type: 'enum', value: ['beginner', 'intermediate', 'advanced', 'elite'], message: 'Invalid skill level' }
      ]
    };
  }

  /**
   * Create validation schema for league creation
   */
  static createLeagueSchema(): ValidationSchema {
    return {
      name: [
        { type: 'required', message: 'League name is required' },
        { type: 'minLength', value: 3, message: 'League name must be at least 3 characters' },
        { type: 'maxLength', value: 100, message: 'League name must be no more than 100 characters' }
      ],
      description: [
        { type: 'maxLength', value: 500, message: 'Description must be no more than 500 characters' }
      ],
      startDate: [
        { type: 'required', message: 'Start date is required' },
        { type: 'date', message: 'Must be a valid date' }
      ],
      endDate: [
        { type: 'required', message: 'End date is required' },
        { type: 'date', message: 'Must be a valid date' }
      ],
      maxTeams: [
        { type: 'required', message: 'Maximum teams is required' },
        { type: 'min', value: 2, message: 'Must have at least 2 teams' },
        { type: 'max', value: 100, message: 'Cannot have more than 100 teams' }
      ]
    };
  }

  /**
   * Create validation schema for payment processing
   */
  static createPaymentSchema(): ValidationSchema {
    return {
      amount: [
        { type: 'required', message: 'Amount is required' },
        { type: 'min', value: 0.01, message: 'Amount must be greater than 0' }
      ],
      currency: [
        { type: 'required', message: 'Currency is required' },
        { type: 'enum', value: ['USD', 'EUR', 'GBP', 'CAD'], message: 'Invalid currency' }
      ],
      method: [
        { type: 'required', message: 'Payment method is required' },
        { type: 'enum', value: ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'check'], message: 'Invalid payment method' }
      ]
    };
  }
}

// Export singleton instance
export const inputValidator = InputValidator.getInstance(); 