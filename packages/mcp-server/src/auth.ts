/**
 * Authentication and Authorization for MCP Server
 * Supports Firebase ID tokens and service account authentication
 */

import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import jwt from 'jsonwebtoken';
import { AuthContext, ServiceAccount } from './types.js';

const db = getFirestore();

/**
 * Extract and validate Firebase ID token from Authorization header
 */
export async function validateFirebaseToken(token: string): Promise<AuthContext> {
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new Error('User not found in database');
    }

    // Determine role and permissions
    const role = determineUserRole(userData);
    const permissions = getUserPermissions(role, userData);

    return {
      uid: decodedToken.uid,
      role,
      teamId: userData.teamId,
      leagueId: userData.leagueId,
      permissions
    };
  } catch (error) {
    throw new Error(`Invalid Firebase token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate service account token for agent-service role
 */
export async function validateServiceToken(token: string, serviceAccount: ServiceAccount): Promise<AuthContext> {
  try {
    const decoded = jwt.verify(token, serviceAccount.private_key, {
      audience: serviceAccount.project_id,
      issuer: serviceAccount.client_email,
      algorithms: ['RS256']
    }) as any;

    if (decoded.role !== 'agent-service') {
      throw new Error('Invalid service account role');
    }

    return {
      uid: `service-${serviceAccount.client_id}`,
      role: 'agent-service',
      permissions: ['*'] // Service accounts have full access
    };
  } catch (error) {
    throw new Error(`Invalid service token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Authentication middleware for Express
 */
export function authMiddleware(serviceAccount?: ServiceAccount) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Missing or invalid authorization header' },
          id: req.body?.id || null
        });
      }

      const token = authHeader.substring(7);
      let authContext: AuthContext;

      // Try Firebase token first, then service account token
      try {
        authContext = await validateFirebaseToken(token);
      } catch (firebaseError) {
        if (serviceAccount) {
          try {
            authContext = await validateServiceToken(token, serviceAccount);
          } catch (serviceError) {
            return res.status(401).json({
              jsonrpc: '2.0',
              error: { code: -32001, message: 'Invalid authentication token' },
              id: req.body?.id || null
            });
          }
        } else {
          return res.status(401).json({
            jsonrpc: '2.0',
            error: { code: -32001, message: 'Invalid authentication token' },
            id: req.body?.id || null
          });
        }
      }

      // Attach auth context to request
      (req as any).auth = authContext;
      next();
    } catch (error) {
      return res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal authentication error' },
        id: req.body?.id || null
      });
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth as AuthContext;
    
    if (!auth || !allowedRoles.includes(auth.role)) {
      return res.status(403).json({
        jsonrpc: '2.0',
        error: { code: -32002, message: 'Insufficient permissions' },
        id: req.body?.id || null
      });
    }
    
    next();
  };
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth as AuthContext;
    
    if (!auth || (!auth.permissions.includes('*') && !auth.permissions.includes(permission))) {
      return res.status(403).json({
        jsonrpc: '2.0',
        error: { code: -32002, message: `Missing required permission: ${permission}` },
        id: req.body?.id || null
      });
    }
    
    next();
  };
}

/**
 * Determine user role from user data
 */
function determineUserRole(userData: any): AuthContext['role'] {
  if (userData.isAdmin) return 'admin';
  if (userData.role === 'coach') return 'coach';
  if (userData.role === 'athlete') return 'athlete';
  return 'athlete'; // Default role
}

/**
 * Get user permissions based on role
 */
function getUserPermissions(role: AuthContext['role'], userData: any): string[] {
  const basePermissions = ['read:own-data'];
  
  switch (role) {
    case 'admin':
      return ['*']; // Full access
    case 'coach':
      return [
        ...basePermissions,
        'read:team-data',
        'write:team-data',
        'read:player-stats',
        'write:player-stats',
        'verify:stats',
        'export:data',
        'send:notifications'
      ];
    case 'athlete':
      return [
        ...basePermissions,
        'read:own-stats',
        'write:own-stats',
        'read:team-data'
      ];
    case 'agent-service':
      return ['*']; // Full access for agents
    default:
      return basePermissions;
  }
}

/**
 * Check if user has access to specific resource
 */
export function hasResourceAccess(auth: AuthContext, resourceType: string, resourceId: string): boolean {
  // Admin and agent-service have full access
  if (auth.role === 'admin' || auth.role === 'agent-service') {
    return true;
  }

  // Check team-based access
  if (resourceType === 'team' && auth.teamId === resourceId) {
    return true;
  }

  // Check league-based access
  if (resourceType === 'league' && auth.leagueId === resourceId) {
    return true;
  }

  // Check user-based access
  if (resourceType === 'user' && auth.uid === resourceId) {
    return true;
  }

  return false;
}
