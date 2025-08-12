import { InputValidator, ValidationSchemas, inputValidator } from '../lib/utils/inputValidation';

describe('InputValidator', () => {
  let validator: InputValidator;

  beforeEach(() => {
    validator = InputValidator.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = InputValidator.getInstance();
      const instance2 = InputValidator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('validate', () => {
    it('should validate valid player data', () => {
      const playerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        dateOfBirth: new Date('2000-01-01'),
        age: 23,
        gender: 'male',
        isActive: true
      };

      const result = validator.validate(playerData, ValidationSchemas.player);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toBeDefined();
    });

    it('should reject invalid player data', () => {
      const invalidPlayerData = {
        firstName: '', // Empty string
        lastName: 'Doe',
        email: 'invalid-email', // Invalid email
        age: -5, // Negative age
        gender: 'invalid', // Invalid gender
        isActive: true
      };

      const result = validator.validate(invalidPlayerData, ValidationSchemas.player);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('firstName is required');
      expect(result.errors).toContain('email must be a valid email');
      expect(result.errors).toContain('age must be at least 0');
      expect(result.errors).toContain('gender must be one of: male, female, other');
    });

    it('should reject non-object data', () => {
      const result = validator.validate('not an object', ValidationSchemas.player);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data must be an object');
    });

    it('should handle missing required fields', () => {
      const incompleteData = {
        firstName: 'John',
        // Missing other required fields
      };

      const result = validator.validate(incompleteData, ValidationSchemas.player);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('lastName is required');
      expect(result.errors).toContain('email is required');
    });
  });

  describe('validateType', () => {
    it('should validate string type', () => {
      const result = validator['validateType']('testField', 'valid string', 'string');
      expect(result).toBeNull();
    });

    it('should reject invalid string type', () => {
      const result = validator['validateType']('testField', 123, 'string');
      expect(result).toBe('testField must be a string');
    });

    it('should validate email type', () => {
      const result = validator['validateType']('email', 'test@example.com', 'email');
      expect(result).toBeNull();
    });

    it('should reject invalid email type', () => {
      const result = validator['validateType']('email', 'invalid-email', 'email');
      expect(result).toBe('email must be a valid email');
    });

    it('should validate UUID type', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const result = validator['validateType']('id', validUUID, 'uuid');
      expect(result).toBeNull();
    });

    it('should reject invalid UUID type', () => {
      const result = validator['validateType']('id', 'invalid-uuid', 'uuid');
      expect(result).toBe('id must be a valid UUID');
    });

    it('should validate number type', () => {
      const result = validator['validateType']('age', 25, 'number');
      expect(result).toBeNull();
    });

    it('should reject invalid number type', () => {
      const result = validator['validateType']('age', 'not a number', 'number');
      expect(result).toBe('age must be a number');
    });

    it('should validate boolean type', () => {
      const result = validator['validateType']('active', true, 'boolean');
      expect(result).toBeNull();
    });

    it('should reject invalid boolean type', () => {
      const result = validator['validateType']('active', 'true', 'boolean');
      expect(result).toBe('active must be a boolean');
    });

    it('should validate array type', () => {
      const result = validator['validateType']('tags', ['tag1', 'tag2'], 'array');
      expect(result).toBeNull();
    });

    it('should reject invalid array type', () => {
      const result = validator['validateType']('tags', 'not an array', 'array');
      expect(result).toBe('tags must be an array');
    });

    it('should validate object type', () => {
      const result = validator['validateType']('config', { key: 'value' }, 'object');
      expect(result).toBeNull();
    });

    it('should reject invalid object type', () => {
      const result = validator['validateType']('config', 'not an object', 'object');
      expect(result).toBe('config must be an object');
    });

    it('should reject array as object type', () => {
      const result = validator['validateType']('config', [], 'object');
      expect(result).toBe('config must be an object');
    });

    it('should validate date type', () => {
      const result = validator['validateType']('birthDate', new Date(), 'date');
      expect(result).toBeNull();
    });

    it('should reject invalid date type', () => {
      const result = validator['validateType']('birthDate', 'not a date', 'date');
      expect(result).toBe('birthDate must be a date');
    });

    it('should validate URL type', () => {
      const result = validator['validateType']('website', 'https://example.com', 'url');
      expect(result).toBeNull();
    });

    it('should reject invalid URL type', () => {
      const result = validator['validateType']('website', 'not a url', 'url');
      expect(result).toBe('website must be a valid URL');
    });
  });

  describe('validateField', () => {
    it('should validate required field', () => {
      const errors = validator['validateField']('name', 'John', { required: true });
      expect(errors).toHaveLength(0);
    });

    it('should reject missing required field', () => {
      const errors = validator['validateField']('name', undefined, { required: true });
      expect(errors).toContain('name is required');
    });

    it('should validate string length constraints', () => {
      const errors = validator['validateField']('name', 'John', { 
        type: 'string', 
        minLength: 2, 
        maxLength: 10 
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject string too short', () => {
      const errors = validator['validateField']('name', 'J', { 
        type: 'string', 
        minLength: 2 
      });
      expect(errors).toContain('name must be at least 2 characters long');
    });

    it('should reject string too long', () => {
      const errors = validator['validateField']('name', 'VeryLongName', { 
        type: 'string', 
        maxLength: 10 
      });
      expect(errors).toContain('name must be no more than 10 characters long');
    });

    it('should validate number range constraints', () => {
      const errors = validator['validateField']('age', 25, { 
        type: 'number', 
        min: 0, 
        max: 120 
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject number too small', () => {
      const errors = validator['validateField']('age', -5, { 
        type: 'number', 
        min: 0 
      });
      expect(errors).toContain('age must be at least 0');
    });

    it('should reject number too large', () => {
      const errors = validator['validateField']('age', 150, { 
        type: 'number', 
        max: 120 
      });
      expect(errors).toContain('age must be no more than 120');
    });

    it('should validate array length constraints', () => {
      const errors = validator['validateField']('tags', ['tag1', 'tag2'], { 
        type: 'array', 
        minLength: 1, 
        maxLength: 5 
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject array too short', () => {
      const errors = validator['validateField']('tags', [], { 
        type: 'array', 
        minLength: 1 
      });
      expect(errors).toContain('tags must have at least 1 items');
    });

    it('should reject array too long', () => {
      const errors = validator['validateField']('tags', ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'], { 
        type: 'array', 
        maxLength: 5 
      });
      expect(errors).toContain('tags must have no more than 5 items');
    });

    it('should validate enum values', () => {
      const errors = validator['validateField']('status', 'active', { 
        enum: ['active', 'inactive', 'pending'] 
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid enum value', () => {
      const errors = validator['validateField']('status', 'invalid', { 
        enum: ['active', 'inactive', 'pending'] 
      });
      expect(errors).toContain('status must be one of: active, inactive, pending');
    });

    it('should validate pattern', () => {
      const errors = validator['validateField']('phone', '+1234567890', { 
        type: 'string',
        pattern: /^\+?[1-9]\d{1,14}$/ 
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid pattern', () => {
      const errors = validator['validateField']('phone', 'invalid-phone', { 
        type: 'string',
        pattern: /^\+?[1-9]\d{1,14}$/ 
      });
      expect(errors).toContain('phone format is invalid');
    });

    it('should validate custom validation', () => {
      const errors = validator['validateField']('password', 'strongpass123', { 
        custom: (value) => value.length >= 8 
      });
      expect(errors).toHaveLength(0);
    });

    it('should reject failed custom validation', () => {
      const errors = validator['validateField']('password', 'weak', { 
        custom: (value) => value.length >= 8 
      });
      expect(errors).toContain('password failed custom validation');
    });
  });

  describe('Utility Methods', () => {
    describe('sanitizeString', () => {
      it('should sanitize HTML characters', () => {
        const input = '<script>alert("xss")</script>';
        const result = validator.sanitizeString(input);
        expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      });

      it('should trim whitespace', () => {
        const input = '  test string  ';
        const result = validator.sanitizeString(input);
        expect(result).toBe('test string');
      });

      it('should throw error for non-string input', () => {
        expect(() => validator.sanitizeString(123 as any)).toThrow('Input must be a string');
      });
    });

    describe('validateEmail', () => {
      it('should validate correct email', () => {
        const result = validator.validateEmail('test@example.com');
        expect(result).toBe('test@example.com');
      });

      it('should normalize email case', () => {
        const result = validator.validateEmail('TEST@EXAMPLE.COM');
        expect(result).toBe('test@example.com');
      });

      it('should reject invalid email', () => {
        const result = validator.validateEmail('invalid-email');
        expect(result).toBe('Invalid email format');
      });

      it('should reject non-string input', () => {
        const result = validator.validateEmail(123 as any);
        expect(result).toBe('Email must be a string');
      });
    });

    describe('validateUUID', () => {
      it('should validate correct UUID', () => {
        const validUUID = '123e4567-e89b-12d3-a456-426614174000';
        const result = validator.validateUUID(validUUID);
        expect(result).toBe(validUUID.toLowerCase());
      });

      it('should reject invalid UUID', () => {
        const result = validator.validateUUID('invalid-uuid');
        expect(result).toBe('Invalid UUID format');
      });

      it('should reject non-string input', () => {
        const result = validator.validateUUID(123 as any);
        expect(result).toBe('UUID must be a string');
      });
    });

    describe('validatePhone', () => {
      it('should validate correct phone number', () => {
        const result = validator.validatePhone('+1 (555) 123-4567');
        expect(result).toBe('+15551234567');
      });

      it('should reject invalid phone number', () => {
        const result = validator.validatePhone('invalid-phone');
        expect(result).toBe('Invalid phone number format');
      });

      it('should reject non-string input', () => {
        const result = validator.validatePhone(123 as any);
        expect(result).toBe('Phone number must be a string');
      });
    });

    describe('validateDate', () => {
      it('should validate correct date string', () => {
        const result = validator.validateDate('2023-01-01');
        expect(result).toBeInstanceOf(Date);
      });

      it('should reject invalid date string', () => {
        const result = validator.validateDate('invalid-date');
        expect(result).toBeNull();
      });

      it('should reject non-string input', () => {
        const result = validator.validateDate(123 as any);
        expect(result).toBeNull();
      });
    });

    describe('validateNumberRange', () => {
      it('should validate number in range', () => {
        const result = validator.validateNumberRange(50, 0, 100);
        expect(result).toBe(true);
      });

      it('should reject number below range', () => {
        const result = validator.validateNumberRange(-5, 0, 100);
        expect(result).toBe(false);
      });

      it('should reject number above range', () => {
        const result = validator.validateNumberRange(150, 0, 100);
        expect(result).toBe(false);
      });

      it('should reject non-number input', () => {
        const result = validator.validateNumberRange('50' as any, 0, 100);
        expect(result).toBe(false);
      });
    });

    describe('validateStringLength', () => {
      it('should validate string in length range', () => {
        const result = validator.validateStringLength('test', 1, 10);
        expect(result).toBe(true);
      });

      it('should reject string too short', () => {
        const result = validator.validateStringLength('', 1, 10);
        expect(result).toBe(false);
      });

      it('should reject string too long', () => {
        const result = validator.validateStringLength('very long string', 1, 10);
        expect(result).toBe(false);
      });

      it('should reject non-string input', () => {
        const result = validator.validateStringLength(123 as any, 1, 10);
        expect(result).toBe(false);
      });
    });

    describe('validateArrayLength', () => {
      it('should validate array in length range', () => {
        const result = validator.validateArrayLength(['item1', 'item2'], 1, 5);
        expect(result).toBe(true);
      });

      it('should reject array too short', () => {
        const result = validator.validateArrayLength([], 1, 5);
        expect(result).toBe(false);
      });

      it('should reject array too long', () => {
        const result = validator.validateArrayLength(['item1', 'item2', 'item3', 'item4', 'item5', 'item6'], 1, 5);
        expect(result).toBe(false);
      });

      it('should reject non-array input', () => {
        const result = validator.validateArrayLength('not an array' as any, 1, 5);
        expect(result).toBe(false);
      });
    });

    describe('validateEnum', () => {
      it('should validate valid enum value', () => {
        const result = validator.validateEnum('active', ['active', 'inactive', 'pending']);
        expect(result).toBe(true);
      });

      it('should reject invalid enum value', () => {
        const result = validator.validateEnum('invalid', ['active', 'inactive', 'pending']);
        expect(result).toBe(false);
      });

      it('should reject non-string input', () => {
        const result = validator.validateEnum(123 as any, ['active', 'inactive', 'pending']);
        expect(result).toBe(false);
      });
    });

    describe('validateObjectStructure', () => {
      it('should validate object with required keys', () => {
        const result = validator.validateObjectStructure({ key1: 'value1', key2: 'value2' }, ['key1', 'key2']);
        expect(result).toBe(true);
      });

      it('should reject object missing required keys', () => {
        const result = validator.validateObjectStructure({ key1: 'value1' }, ['key1', 'key2']);
        expect(result).toBe(false);
      });

      it('should reject non-object input', () => {
        const result = validator.validateObjectStructure('not an object' as any, ['key1']);
        expect(result).toBe(false);
      });

      it('should reject array input', () => {
        const result = validator.validateObjectStructure(['item1', 'item2'], ['key1']);
        expect(result).toBe(false);
      });
    });
  });

  describe('ValidationSchemas', () => {
    it('should have player schema defined', () => {
      expect(ValidationSchemas.player).toBeDefined();
      expect(ValidationSchemas.player.firstName).toBeDefined();
      expect(ValidationSchemas.player.email).toBeDefined();
    });

    it('should have league schema defined', () => {
      expect(ValidationSchemas.league).toBeDefined();
      expect(ValidationSchemas.league.name).toBeDefined();
      expect(ValidationSchemas.league.sport).toBeDefined();
    });

    it('should have team schema defined', () => {
      expect(ValidationSchemas.team).toBeDefined();
      expect(ValidationSchemas.team.name).toBeDefined();
      expect(ValidationSchemas.team.leagueId).toBeDefined();
    });

    it('should have game schema defined', () => {
      expect(ValidationSchemas.game).toBeDefined();
      expect(ValidationSchemas.game.homeTeamId).toBeDefined();
      expect(ValidationSchemas.game.awayTeamId).toBeDefined();
    });

    it('should have registration schema defined', () => {
      expect(ValidationSchemas.registration).toBeDefined();
      expect(ValidationSchemas.registration.playerId).toBeDefined();
      expect(ValidationSchemas.registration.leagueId).toBeDefined();
    });

    it('should have payment schema defined', () => {
      expect(ValidationSchemas.payment).toBeDefined();
      expect(ValidationSchemas.payment.userId).toBeDefined();
      expect(ValidationSchemas.payment.amount).toBeDefined();
    });

    it('should have message schema defined', () => {
      expect(ValidationSchemas.message).toBeDefined();
      expect(ValidationSchemas.message.senderId).toBeDefined();
      expect(ValidationSchemas.message.content).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should validate complete player registration flow', () => {
      const playerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        dateOfBirth: new Date('2000-01-01'),
        age: 23,
        gender: 'male',
        phoneNumber: '+1234567890',
        isActive: true
      };

      const result = validator.validate(playerData, ValidationSchemas.player);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toBeDefined();
      expect(result.sanitizedData.firstName).toBe('John');
      expect(result.sanitizedData.lastName).toBe('Doe');
    });

    it('should validate complete league creation flow', () => {
      const leagueData = {
        name: 'Spring Soccer League',
        sport: 'soccer',
        ageGroup: 'u12',
        season: 'Spring 2024',
        maxTeams: 20,
        maxPlayersPerTeam: 15,
        minPlayersPerTeam: 10,
        status: 'registration_open'
      };

      const result = validator.validate(leagueData, ValidationSchemas.league);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toBeDefined();
      expect(result.sanitizedData.name).toBe('Spring Soccer League');
    });

    it('should handle multiple validation errors', () => {
      const invalidData = {
        firstName: '', // Empty
        lastName: 'Doe',
        email: 'invalid-email', // Invalid email
        age: -5, // Negative age
        gender: 'invalid', // Invalid gender
        phoneNumber: 'invalid-phone', // Invalid phone
        isActive: 'not boolean' // Wrong type
      };

      const result = validator.validate(invalidData, ValidationSchemas.player);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(5);
    });
  });
}); 