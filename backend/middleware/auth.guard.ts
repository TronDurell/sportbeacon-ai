import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// User roles and their permissions
export enum UserRole {
  PLAYER = 'player',
  COACH = 'coach',
  PARENT = 'parent',
  ADMIN = 'admin',
  SCOUT = 'scout',
  REFEREE = 'referee'
}

// Permission levels
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin'
}

// Role-based permissions mapping
const ROLE_PERMISSIONS = {
  [UserRole.PLAYER]: [Permission.READ, Permission.WRITE],
  [UserRole.COACH]: [Permission.READ, Permission.WRITE, Permission.DELETE],
  [UserRole.PARENT]: [Permission.READ, Permission.WRITE],
  [UserRole.ADMIN]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
  [UserRole.SCOUT]: [Permission.READ, Permission.WRITE],
  [UserRole.REFEREE]: [Permission.READ, Permission.WRITE]
};

// User context interface
export interface UserContext {
  id: string;
  role: UserRole;
  email: string;
  token: string;
  permissions: Permission[];
}

// JWT payload interface
interface JWTPayload {
  uid: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Extend Express Request to include user context
declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}

/**
 * Auth Guard Middleware
 * Verifies JWT token, decodes user role, and validates RBAC permissions
 */
export const authGuard = (requiredPermissions: Permission[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Validate JWT secret environment variable
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Authentication configuration error'
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired'
        });
      }

      // Create user context
      const userContext: UserContext = {
        id: decoded.uid,
        role: decoded.role,
        email: decoded.email,
        token,
        permissions: ROLE_PERMISSIONS[decoded.role] || []
      };

      // Validate required permissions
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission =>
          userContext.permissions.includes(permission)
        );

        if (!hasAllPermissions) {
          return res.status(403).json({
            error: 'Forbidden',
            message: `Insufficient permissions. Required: ${requiredPermissions.join(', ')}. User has: ${userContext.permissions.join(', ')}`
          });
        }
      }

      // Attach user context to request
      req.user = userContext;
      next();

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
      }

      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired'
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication failed'
      });
    }
  };
};

/**
 * Role-based guard for specific roles
 */
export const roleGuard = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not found'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Allowed roles: ${allowedRoles.join(', ')}. User role: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Agent-specific guard for AI agent operations
 */
export const agentGuard = (agentType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not found'
      });
    }

    // Define which roles can access which agents
    const agentPermissions = {
      'coachAgent': [UserRole.COACH, UserRole.ADMIN],
      'playerAgent': [UserRole.PLAYER, UserRole.COACH, UserRole.ADMIN],
      'parentAgent': [UserRole.PARENT, UserRole.ADMIN],
      'scoutAgent': [UserRole.SCOUT, UserRole.ADMIN],
      'refereeAgent': [UserRole.REFEREE, UserRole.ADMIN],
      'adminAgent': [UserRole.ADMIN]
    };

    const allowedRoles = agentPermissions[agentType] || [];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied to ${agentType}. Allowed roles: ${allowedRoles.join(', ')}. User role: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Utility function to generate JWT token for testing
 */
export const generateTestToken = (userData: Partial<JWTPayload>): string => {
  const payload: JWTPayload = {
    uid: userData.uid || 'test-uid',
    email: userData.email || 'test@example.com',
    role: userData.role || UserRole.PLAYER,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };

  // SECURITY FIX: Use proper secret management - no test fallback
  const jwtSecret = process.env.JWT_SECRET;
    
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable not configured - check environment variables');
  }
  
  return jwt.sign(payload, jwtSecret);
};

/**
 * Utility function to validate user context in agent operations
 */
export const validateUserContext = (userContext: UserContext, requiredRole?: UserRole): boolean => {
  if (!userContext || !userContext.id || !userContext.role) {
    return false;
  }

  if (requiredRole && userContext.role !== requiredRole) {
    return false;
  }

  return true;
}; 