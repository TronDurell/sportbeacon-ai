import type { Timestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';

// Role Types
export type UserRole = 
  | 'admin' 
  | 'coach' 
  | 'athlete' 
  | 'townstaff' 
  | 'moderator'
  | 'creator'
  | 'guest';

// Permission Types
export type Permission = 
  // User Management
  | 'users.read'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'users.roles.assign'
  
  // Content Management
  | 'content.read'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  | 'content.moderate'
  
  // Payment Management
  | 'payments.read'
  | 'payments.create'
  | 'payments.refund'
  | 'payments.payout'
  | 'payments.manage'
  
  // Analytics & Reports
  | 'analytics.read'
  | 'analytics.export'
  | 'reports.generate'
  | 'reports.view'
  
  // System Management
  | 'system.settings'
  | 'system.maintenance'
  | 'system.logs'
  | 'system.backup'
  
  // Sports Management
  | 'sports.manage'
  | 'teams.manage'
  | 'leagues.manage'
  | 'tournaments.manage'
  
  // Communication
  | 'messages.send'
  | 'messages.read'
  | 'notifications.send'
  | 'announcements.create'
  
  // Media Management
  | 'media.upload'
  | 'media.delete'
  | 'media.moderate'
  | 'media.approve'
  
  // Financial Management
  | 'financial.read'
  | 'financial.manage'
  | 'financial.reports'
  | 'financial.settings';

// Role Permission Mapping
export type RolePermissions = {
  [key in UserRole]: Permission[];
};

// User Profile Types
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  isVerified: boolean;
  isEmailVerified: boolean;
  phoneNumber?: string;
  dateOfBirth?: Timestamp;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  location?: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  preferences: UserPreferences;
  metadata: UserMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  lastActiveAt: Timestamp;
}

// User Preferences
export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends-only';
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    allowDirectMessages: boolean;
  };
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
}

// User Metadata
export interface UserMetadata {
  registrationSource: 'web' | 'mobile' | 'admin' | 'invite';
  referrer?: string;
  campaign?: string;
  deviceInfo?: {
    platform: string;
    browser: string;
    version: string;
  };
  ipAddress?: string;
  userAgent?: string;
  tags: string[];
  notes?: string;
}

// Auth State Types
export interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

// Auth Error Types
export interface AuthError {
  code: string;
  message: string;
  details?: any;
  timestamp: Timestamp;
}

// Role Assignment Types
export interface RoleAssignment {
  id: string;
  userId: string;
  role: UserRole;
  assignedBy: string;
  assignedAt: Timestamp;
  expiresAt?: Timestamp;
  reason?: string;
  isActive: boolean;
}

// Permission Check Types
export interface PermissionCheck {
  permission: Permission;
  resource?: string;
  resourceId?: string;
  context?: Record<string, any>;
}

// Auth Context Types
export interface AuthContextType {
  // State
  authState: AuthState;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  
  // Role Management
  assignRole: (userId: string, role: UserRole, reason?: string) => Promise<void>;
  removeRole: (userId: string, reason?: string) => Promise<void>;
  updateRole: (userId: string, role: UserRole, reason?: string) => Promise<void>;
  
  // Permission Checks
  hasPermission: (permission: Permission, resource?: string, resourceId?: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
  
  // Utility
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Route Protection Types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// Role-Based Component Props
export interface RoleBasedComponentProps {
  children: React.ReactNode;
  role?: UserRole;
  roles?: UserRole[];
  permission?: Permission;
  permissions?: Permission[];
  fallback?: React.ReactNode;
  show?: boolean;
}

// Auth Guard Types
export interface AuthGuardConfig {
  requireAuth: boolean;
  requireRole?: UserRole;
  requireRoles?: UserRole[];
  requirePermission?: Permission;
  requirePermissions?: Permission[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// Session Management Types
export interface SessionInfo {
  id: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
}

// Login History Types
export interface LoginHistory {
  id: string;
  userId: string;
  timestamp: Timestamp;
  ipAddress: string;
  userAgent: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  success: boolean;
  failureReason?: string;
}

// Security Event Types
export interface SecurityEvent {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'password_change' | 'role_change' | 'permission_change' | 'suspicious_activity';
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  timestamp: Timestamp;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Role Hierarchy Types
export interface RoleHierarchy {
  role: UserRole;
  inheritsFrom: UserRole[];
  permissions: Permission[];
  canAssignRoles: UserRole[];
  canManageUsers: boolean;
  canAccessAdmin: boolean;
  description: string;
}

// Auth Configuration Types
export interface AuthConfig {
  enableEmailVerification: boolean;
  enablePhoneVerification: boolean;
  enableMultiFactor: boolean;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  roleAssignment: {
    requireApproval: boolean;
    allowSelfAssignment: boolean;
    maxRolesPerUser: number;
  };
}

// All types are already exported inline above 