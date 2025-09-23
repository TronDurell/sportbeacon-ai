// Comprehensive input validation utilities
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export interface ValidationSchemas {
  player: any;
  league: any;
  team: any;
  game: any;
  registration: any;
  payment: any;
  message: any;
}

export class InputValidator {
  private static instance: InputValidator;
  private errors: string[] = [];

  private constructor() {}

  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  validate(data: any, schema: any): ValidationResult {
    this.errors = [];
    
    if (typeof data !== 'object' || data === null) {
      this.errors.push('Data must be an object');
      return { isValid: false, errors: this.errors };
    }

    // Basic validation logic for now
    if (!data) {
      this.errors.push('Input is required');
      return { isValid: false, errors: this.errors };
    }

    return { isValid: true, errors: [], sanitizedData: data };
  }

  validateType(fieldName: string, value: any, type: string): string | null {
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
        return typeof value === 'object' && value !== null && !Array.isArray(value) ? null : `${fieldName} must be an object`;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : `${fieldName} must be a valid email`;
      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? null : `${fieldName} must be a valid UUID`;
      case 'url':
        try {
          new URL(value);
          return null;
        } catch {
          return `${fieldName} must be a valid URL`;
        }
      case 'date':
        return value instanceof Date ? null : `${fieldName} must be a date`;
      default:
        return null;
    }
  }

  validateField(fieldName: string, value: any, rules: any): string[] {
    const errors: string[] = [];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
    }

    if (value !== undefined && value !== null) {
      if (rules.type) {
        const typeError = this.validateType(fieldName, value, rules.type);
        if (typeError) errors.push(typeError);
      }

      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
      }

      if (rules.min && typeof value === 'number' && value < rules.min) {
        errors.push(`${fieldName} must be at least ${rules.min}`);
      }

      if (rules.max && typeof value === 'number' && value > rules.max) {
        errors.push(`${fieldName} must be no more than ${rules.max}`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${fieldName} must be one of: ${rules.enum.join(', ')}`);
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`${fieldName} format is invalid`);
      }

      if (rules.custom && !rules.custom(value)) {
        errors.push(`${fieldName} failed custom validation`);
      }
    }

    return errors;
  }

  sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    return input.trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  validateEmail(email: any): string {
    if (typeof email !== 'string') {
      return 'Email must be a string';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Invalid email format';
    }
    return email.toLowerCase();
  }

  validateUUID(uuid: any): string {
    if (typeof uuid !== 'string') {
      return 'UUID must be a string';
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
      return 'Invalid UUID format';
    }
    return uuid.toLowerCase();
  }

  validatePhone(phone: any): string {
    if (typeof phone !== 'string') {
      return 'Phone number must be a string';
    }
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      return 'Invalid phone number format';
    }
    return `+${cleaned}`;
  }

  validateDate(date: any): Date | null {
    if (typeof date !== 'string') {
      return null;
    }
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  validateNumberRange(value: any, min: number, max: number): boolean {
    if (typeof value !== 'number') {
      return false;
    }
    return value >= min && value <= max;
  }

  validateStringLength(value: any, min: number, max: number): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    return value.length >= min && value.length <= max;
  }

  validateArrayLength(value: any, min: number, max: number): boolean {
    if (!Array.isArray(value)) {
      return false;
    }
    return value.length >= min && value.length <= max;
  }

  validateEnum(value: any, allowedValues: string[]): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    return allowedValues.includes(value);
  }

  validateObjectStructure(obj: any, requiredKeys: string[]): boolean {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return false;
    }
    return requiredKeys.every(key => key in obj);
  }
}

export const ValidationSchemas: ValidationSchemas = {
  player: {
    firstName: { type: 'string', required: true, minLength: 1 },
    lastName: { type: 'string', required: true, minLength: 1 },
    email: { type: 'email', required: true },
    age: { type: 'number', required: true, min: 0, max: 120 },
    gender: { type: 'string', required: true, enum: ['male', 'female', 'other'] },
    isActive: { type: 'boolean', required: true }
  },
  league: {
    name: { type: 'string', required: true, minLength: 1 },
    sport: { type: 'string', required: true },
    ageGroup: { type: 'string', required: true },
    season: { type: 'string', required: true },
    maxTeams: { type: 'number', required: true, min: 1 },
    maxPlayersPerTeam: { type: 'number', required: true, min: 1 },
    minPlayersPerTeam: { type: 'number', required: true, min: 1 },
    status: { type: 'string', required: true, enum: ['registration_open', 'registration_closed', 'active', 'completed'] }
  },
  team: {
    name: { type: 'string', required: true, minLength: 1 },
    leagueId: { type: 'string', required: true },
    coachId: { type: 'string', required: true },
    description: { type: 'string', required: false }
  },
  game: {
    homeTeamId: { type: 'string', required: true },
    awayTeamId: { type: 'string', required: true },
    gameDate: { type: 'date', required: true },
    location: { type: 'string', required: true }
  },
  registration: {
    playerId: { type: 'string', required: true },
    leagueId: { type: 'string', required: true },
    teamId: { type: 'string', required: true },
    registrationDate: { type: 'date', required: true }
  },
  payment: {
    userId: { type: 'string', required: true },
    amount: { type: 'number', required: true, min: 0 },
    currency: { type: 'string', required: true },
    paymentMethod: { type: 'string', required: true }
  },
  message: {
    senderId: { type: 'string', required: true },
    recipientId: { type: 'string', required: true },
    content: { type: 'string', required: true, minLength: 1 },
    messageType: { type: 'string', required: true, enum: ['text', 'image', 'file'] }
  }
};

export const inputValidator = InputValidator.getInstance();
