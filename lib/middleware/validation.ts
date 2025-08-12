// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================
// Middleware for validating API requests using Zod schemas

import { z } from 'zod';
import { Schemas, ValidationUtils } from '../schemas/zod';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// VALIDATION MIDDLEWARE FACTORY
// ============================================================================

/**
 * Create validation middleware for Express/Next.js API routes
 */
export const createValidationMiddleware = (options: ValidationMiddlewareOptions) => {
  return (req: ValidationRequest, res: ValidationResponse, next: ValidationNext): void => {
    try {
      let dataToValidate: Record<string, unknown> = {};

      // Validate request body
      if (options.validateBody && req.body) {
        dataToValidate = { ...dataToValidate, ...req.body };
      }

      // Validate query parameters
      if (options.validateQuery && req.query) {
        dataToValidate = { ...dataToValidate, ...req.query };
      }

      // Validate route parameters
      if (options.validateParams && req.params) {
        dataToValidate = { ...dataToValidate, ...req.params };
      }

      // Perform validation
      const result = ValidationUtils.validateData(options.schema, dataToValidate);

      if (result.success) {
        // Validation successful
        if (options.transform) {
          // Transform and sanitize data
          const sanitizedData = options.schema.parse(dataToValidate);
          
          // Update request with sanitized data
          if (options.validateBody) {
            req.body = sanitizedData as Record<string, unknown>;
          }
          if (options.validateQuery) {
            req.query = sanitizedData as Record<string, unknown>;
          }
          if (options.validateParams) {
            req.params = sanitizedData as Record<string, unknown>;
          }
        }

        // Add validation result to request
        req.validation = {
          success: true,
          data: result.data,
          sanitizedData: result.data
        };

        next();
      } else {
        // Validation failed
        const errorResponse = {
          success: false,
          error: 'Validation failed',
          details: result.errors?.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          })) || [],
          timestamp: new Date()
        };

        if (options.strict) {
          return res.status(400).json(errorResponse);
        } else {
          // Add validation errors to request for handling elsewhere
          req.validation = {
            success: false,
            errors: result.errors,
            data: undefined
          };
          next();
        }
      }
    } catch (error) {
      const errorResponse = {
        success: false,
        error: 'Validation middleware error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };

      if (options.strict) {
        return res.status(500).json(errorResponse);
      } else {
        next(error instanceof Error ? error : new Error('Validation middleware error'));
      }
    }
  };
};

// ============================================================================
// SPECIFIC VALIDATION MIDDLEWARES
// ============================================================================

/**
 * User validation middlewares
 */
export const validateUserRegistration = createValidationMiddleware({
  schema: Schemas.CreateUser,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateUserUpdate = createValidationMiddleware({
  schema: Schemas.UpdateUser,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateUserSearch = createValidationMiddleware({
  schema: Schemas.UserSearchSchema || z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional()
  }),
  validateQuery: true,
  strict: false,
  transform: true
});

/**
 * Player validation middlewares
 */
export const validatePlayerRegistration = createValidationMiddleware({
  schema: Schemas.CreatePlayer,
  validateBody: true,
  strict: true,
  transform: true
});

export const validatePlayerUpdate = createValidationMiddleware({
  schema: Schemas.UpdatePlayer,
  validateBody: true,
  strict: true,
  transform: true
});

export const validatePlayerSearch = createValidationMiddleware({
  schema: Schemas.PlayerSearchSchema || z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    position: z.string().optional(),
    skillLevel: z.string().optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional()
  }),
  validateQuery: true,
  strict: false,
  transform: true
});

/**
 * Team validation middlewares
 */
export const validateTeamCreation = createValidationMiddleware({
  schema: Schemas.CreateTeam,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateTeamUpdate = createValidationMiddleware({
  schema: Schemas.UpdateTeam,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateTeamSearch = createValidationMiddleware({
  schema: Schemas.TeamSearchSchema || z.object({
    name: z.string().optional(),
    leagueId: z.string().optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional()
  }),
  validateQuery: true,
  strict: false,
  transform: true
});

/**
 * League validation middlewares
 */
export const validateLeagueCreation = createValidationMiddleware({
  schema: Schemas.CreateLeague,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateLeagueUpdate = createValidationMiddleware({
  schema: Schemas.UpdateLeague,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateLeagueSearch = createValidationMiddleware({
  schema: Schemas.LeagueSearchSchema || z.object({
    name: z.string().optional(),
    season: z.string().optional(),
    status: z.string().optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional()
  }),
  validateQuery: true,
  strict: false,
  transform: true
});

/**
 * Game validation middlewares
 */
export const validateGameCreation = createValidationMiddleware({
  schema: Schemas.CreateGame,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateGameUpdate = createValidationMiddleware({
  schema: Schemas.UpdateGame,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateGameSearch = createValidationMiddleware({
  schema: Schemas.GameSearchSchema || z.object({
    homeTeamId: z.string().optional(),
    awayTeamId: z.string().optional(),
    leagueId: z.string().optional(),
    status: z.string().optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional()
  }),
  validateQuery: true,
  strict: false,
  transform: true
});

/**
 * Venue validation middlewares
 */
export const validateVenueCreation = createValidationMiddleware({
  schema: Schemas.CreateVenue,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateVenueUpdate = createValidationMiddleware({
  schema: Schemas.UpdateVenue,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateVenueSearch = createValidationMiddleware({
  schema: Schemas.VenueSearchSchema || z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional()
  }),
  validateQuery: true,
  strict: false,
  transform: true
});

/**
 * Payment validation middlewares
 */
export const validatePaymentCreation = createValidationMiddleware({
  schema: Schemas.CreatePayment,
  validateBody: true,
  strict: true,
  transform: true
});

export const validatePaymentUpdate = createValidationMiddleware({
  schema: Schemas.UpdatePayment,
  validateBody: true,
  strict: true,
  transform: true
});

export const validatePaymentSearch = createValidationMiddleware({
  schema: Schemas.PaymentSearchSchema || z.object({
    userId: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional()
  }),
  validateQuery: true,
  strict: false,
  transform: true
});

/**
 * Notification validation middlewares
 */
export const validateNotificationCreation = createValidationMiddleware({
  schema: Schemas.CreateNotification,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateNotificationUpdate = createValidationMiddleware({
  schema: Schemas.UpdateNotification,
  validateBody: true,
  strict: true,
  transform: true
});

export const validateNotificationSearch = createValidationMiddleware({
  schema: Schemas.NotificationSearchSchema || z.object({
    userId: z.string().optional(),
    type: z.string().optional(),
    priority: z.string().optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional()
  }),
  validateQuery: true,
  strict: false,
  transform: true
});

// ============================================================================
// ID VALIDATION MIDDLEWARES
// ============================================================================

/**
 * Validate UUID parameters
 */
export const validateIdParam = createValidationMiddleware({
  schema: z.object({
    id: z.string().uuid('Invalid ID format')
  }),
  validateParams: true,
  strict: true
});

/**
 * Validate multiple ID parameters
 */
export const validateIdsParam = createValidationMiddleware({
  schema: z.object({
    ids: z.string().refine(
      (val) => val.split(',').every(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
      'Invalid ID format'
    )
  }),
  validateParams: true,
  strict: true
});

// ============================================================================
// PAGINATION VALIDATION
// ============================================================================

export const validatePagination = createValidationMiddleware({
  schema: z.object({
    page: z.number().min(1).optional().default(1),
    limit: z.number().min(1).max(100).optional().default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
  }),
  validateQuery: true,
  strict: false,
  transform: true
});

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate data against a Zod schema
 */
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> => {
  try {
    const parsedData = schema.parse(data);
    return {
      success: true,
      data: parsedData,
      sanitizedData: parsedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error
      };
    }
    return {
      success: false,
      errors: new z.ZodError([])
    };
  }
};

/**
 * Validate response data against a schema
 */
export const validateResponse = <T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> => {
  return validateData(schema, data);
};

/**
 * Create response validation middleware
 */
export const createResponseValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (req: ValidationRequest, res: ValidationResponse, next: ValidationNext): void => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to validate response
    res.json = function(data: unknown) {
      try {
        const validatedData = schema.parse(data);
        return originalJson.call(this, validatedData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return originalJson.call(this, {
            success: false,
            error: 'Response validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            })),
            timestamp: new Date()
          });
        }
        return originalJson.call(this, data);
      }
    };

    next();
  };
};

/**
 * Handle validation errors in a centralized way
 */
export const handleValidationErrors = (req: ValidationRequest, res: ValidationResponse, next: ValidationNext): void => {
  if (req.validation && !req.validation.success) {
    const errorResponse = {
      success: false,
      error: 'Validation failed',
      details: req.validation.errors?.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      })) || [],
      timestamp: new Date()
    };

    return res.status(400).json(errorResponse);
  }
  next();
};

/**
 * Create error handling middleware
 */
export const createErrorHandlingMiddleware = () => {
  return (error: Error, req: ValidationRequest, res: ValidationResponse, next: ValidationNext): void => {
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date()
    };

    res.status(500).json(errorResponse);
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export const ValidationMiddleware = {
  // Factory functions
  create: createValidationMiddleware,
  createResponseValidation: createResponseValidationMiddleware,
  createErrorHandling: createErrorHandlingMiddleware,
  
  // Specific validations
  user: {
    registration: validateUserRegistration,
    update: validateUserUpdate,
    search: validateUserSearch
  },
  player: {
    registration: validatePlayerRegistration,
    update: validatePlayerUpdate,
    search: validatePlayerSearch
  },
  team: {
    creation: validateTeamCreation,
    update: validateTeamUpdate,
    search: validateTeamSearch
  },
  league: {
    creation: validateLeagueCreation,
    update: validateLeagueUpdate,
    search: validateLeagueSearch
  },
  game: {
    creation: validateGameCreation,
    update: validateGameUpdate,
    search: validateGameSearch
  },
  venue: {
    creation: validateVenueCreation,
    update: validateVenueUpdate,
    search: validateVenueSearch
  },
  payment: {
    creation: validatePaymentCreation,
    update: validatePaymentUpdate,
    search: validatePaymentSearch
  },
  notification: {
    creation: validateNotificationCreation,
    update: validateNotificationUpdate,
    search: validateNotificationSearch
  },
  
  // Utility validations
  id: validateIdParam,
  ids: validateIdsParam,
  pagination: validatePagination,
  errors: handleValidationErrors,
  
  // Response validation
  validateResponse
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Example usage in Express/Next.js API routes:

import { ValidationMiddleware } from '@/lib/middleware/validation';

// User registration endpoint
app.post('/api/users', 
  ValidationMiddleware.user.registration,
  ValidationMiddleware.errors,
  async (req, res) => {
    // req.body is now validated and sanitized
    const userData = req.body;
    
    // Create user
    const user = await userService.create(userData);
    
    // Validate response
    const response = ValidationMiddleware.validateResponse(
      Schemas.UserApiResponse,
      { success: true, data: user, timestamp: new Date() }
    );
    
    res.json(response.sanitizedData);
  }
);

// Search endpoint with pagination
app.get('/api/users',
  ValidationMiddleware.user.search,
  ValidationMiddleware.pagination,
  ValidationMiddleware.errors,
  async (req, res) => {
    const { page, limit, sortBy, sortOrder, ...filters } = req.query;
    
    const users = await userService.search(filters, { page, limit, sortBy, sortOrder });
    
    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total: users.length },
      timestamp: new Date()
    });
  }
);

// Error handling
app.use(ValidationMiddleware.createErrorHandling());
*/ 