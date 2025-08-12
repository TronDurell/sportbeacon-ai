import type { RolePermissions, UserRole, Permission } from '../types/auth';

/**
 * Comprehensive Role Permissions Configuration
 * Defines hierarchical roles with granular permissions
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  // Admin - Full system access
  admin: [
    // User Management
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'users.roles.assign',
    
    // Content Management
    'content.read',
    'content.create',
    'content.update',
    'content.delete',
    'content.moderate',
    
    // Payment Management
    'payments.read',
    'payments.create',
    'payments.refund',
    'payments.payout',
    'payments.manage',
    
    // Analytics & Reports
    'analytics.read',
    'analytics.export',
    'reports.generate',
    'reports.view',
    
    // System Management
    'system.settings',
    'system.maintenance',
    'system.logs',
    'system.backup',
    
    // Sports Management
    'sports.manage',
    'teams.manage',
    'leagues.manage',
    'tournaments.manage',
    
    // Communication
    'messages.send',
    'messages.read',
    'notifications.send',
    'announcements.create',
    
    // Media Management
    'media.upload',
    'media.delete',
    'media.moderate',
    'media.approve',
    
    // Financial Management
    'financial.read',
    'financial.manage',
    'financial.reports',
    'financial.settings'
  ],

  // Moderator - Content and user moderation
  moderator: [
    // User Management (limited)
    'users.read',
    'users.update',
    
    // Content Management
    'content.read',
    'content.create',
    'content.update',
    'content.delete',
    'content.moderate',
    
    // Payment Management (read-only)
    'payments.read',
    
    // Analytics & Reports (limited)
    'analytics.read',
    'reports.view',
    
    // Communication
    'messages.send',
    'messages.read',
    'notifications.send',
    'announcements.create',
    
    // Media Management
    'media.upload',
    'media.delete',
    'media.moderate',
    'media.approve'
  ],

  // Coach - Sports and team management
  coach: [
    // User Management (limited to athletes)
    'users.read',
    'users.create',
    'users.update',
    
    // Content Management
    'content.read',
    'content.create',
    'content.update',
    'content.delete',
    
    // Payment Management (limited)
    'payments.read',
    'payments.create',
    
    // Analytics & Reports (limited)
    'analytics.read',
    'reports.view',
    
    // Sports Management
    'sports.manage',
    'teams.manage',
    'leagues.manage',
    'tournaments.manage',
    
    // Communication
    'messages.send',
    'messages.read',
    'notifications.send',
    
    // Media Management
    'media.upload',
    'media.delete'
  ],

  // Creator - Content creation and monetization
  creator: [
    // User Management (own profile)
    'users.read',
    'users.update',
    
    // Content Management
    'content.read',
    'content.create',
    'content.update',
    'content.delete',
    
    // Payment Management (own payouts)
    'payments.read',
    'payments.create',
    'payments.payout',
    
    // Analytics & Reports (own data)
    'analytics.read',
    'reports.view',
    
    // Communication
    'messages.send',
    'messages.read',
    
    // Media Management
    'media.upload',
    'media.delete'
  ],

  // Athlete - Sports participation and content consumption
  athlete: [
    // User Management (own profile)
    'users.read',
    'users.update',
    
    // Content Management (limited)
    'content.read',
    'content.create',
    'content.update',
    
    // Payment Management (own payments)
    'payments.read',
    'payments.create',
    
    // Analytics & Reports (own data)
    'analytics.read',
    
    // Communication
    'messages.send',
    'messages.read',
    
    // Media Management (limited)
    'media.upload'
  ],

  // Town Staff - Local sports management
  townstaff: [
    // User Management (local users)
    'users.read',
    'users.create',
    'users.update',
    
    // Content Management
    'content.read',
    'content.create',
    'content.update',
    'content.delete',
    
    // Payment Management (local)
    'payments.read',
    'payments.create',
    
    // Analytics & Reports (local)
    'analytics.read',
    'reports.view',
    
    // Sports Management (local)
    'sports.manage',
    'teams.manage',
    'leagues.manage',
    'tournaments.manage',
    
    // Communication
    'messages.send',
    'messages.read',
    'notifications.send',
    'announcements.create',
    
    // Media Management
    'media.upload',
    'media.delete'
  ],

  // Guest - Limited access
  guest: [
    // Content Management (read-only)
    'content.read',
    
    // Communication (limited)
    'messages.read'
  ]
};

/**
 * Role Hierarchy Configuration
 * Defines role inheritance and management capabilities
 */
export const ROLE_HIERARCHY = {
  admin: {
    inheritsFrom: [],
    canAssignRoles: ['admin', 'moderator', 'coach', 'creator', 'athlete', 'townstaff', 'guest'],
    canManageUsers: true,
    canAccessAdmin: true,
    description: 'Full system administrator with complete access'
  },
  moderator: {
    inheritsFrom: ['admin'],
    canAssignRoles: ['creator', 'athlete', 'guest'],
    canManageUsers: false,
    canAccessAdmin: false,
    description: 'Content and user moderation specialist'
  },
  coach: {
    inheritsFrom: ['moderator'],
    canAssignRoles: ['athlete'],
    canManageUsers: false,
    canAccessAdmin: false,
    description: 'Sports coach with team management capabilities'
  },
  creator: {
    inheritsFrom: ['athlete'],
    canAssignRoles: [],
    canManageUsers: false,
    canAccessAdmin: false,
    description: 'Content creator with monetization capabilities'
  },
  athlete: {
    inheritsFrom: ['guest'],
    canAssignRoles: [],
    canManageUsers: false,
    canAccessAdmin: false,
    description: 'Sports participant with basic platform access'
  },
  townstaff: {
    inheritsFrom: ['moderator'],
    canAssignRoles: ['athlete', 'guest'],
    canManageUsers: false,
    canAccessAdmin: false,
    description: 'Local sports organization staff'
  },
  guest: {
    inheritsFrom: [],
    canAssignRoles: [],
    canManageUsers: false,
    canAccessAdmin: false,
    description: 'Limited access user'
  }
};

/**
 * Permission Categories for UI Organization
 */
export const PERMISSION_CATEGORIES = {
  'User Management': [
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'users.roles.assign'
  ],
  'Content Management': [
    'content.read',
    'content.create',
    'content.update',
    'content.delete',
    'content.moderate'
  ],
  'Payment Management': [
    'payments.read',
    'payments.create',
    'payments.refund',
    'payments.payout',
    'payments.manage'
  ],
  'Analytics & Reports': [
    'analytics.read',
    'analytics.export',
    'reports.generate',
    'reports.view'
  ],
  'System Management': [
    'system.settings',
    'system.maintenance',
    'system.logs',
    'system.backup'
  ],
  'Sports Management': [
    'sports.manage',
    'teams.manage',
    'leagues.manage',
    'tournaments.manage'
  ],
  'Communication': [
    'messages.send',
    'messages.read',
    'notifications.send',
    'announcements.create'
  ],
  'Media Management': [
    'media.upload',
    'media.delete',
    'media.moderate',
    'media.approve'
  ],
  'Financial Management': [
    'financial.read',
    'financial.manage',
    'financial.reports',
    'financial.settings'
  ]
};

/**
 * Role Display Names
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Administrator',
  moderator: 'Moderator',
  coach: 'Coach',
  creator: 'Creator',
  athlete: 'Athlete',
  townstaff: 'Town Staff',
  guest: 'Guest'
};

/**
 * Role Descriptions
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full system administrator with complete access to all features and user management',
  moderator: 'Content and user moderation specialist with authority over community content',
  coach: 'Sports coach with team management capabilities and athlete oversight',
  creator: 'Content creator with monetization capabilities and audience engagement',
  athlete: 'Sports participant with basic platform access and personal content management',
  townstaff: 'Local sports organization staff with regional management capabilities',
  guest: 'Limited access user with basic content viewing and communication'
};

/**
 * Permission Display Names
 */
export const PERMISSION_DISPLAY_NAMES: Record<Permission, string> = {
  // User Management
  'users.read': 'View Users',
  'users.create': 'Create Users',
  'users.update': 'Update Users',
  'users.delete': 'Delete Users',
  'users.roles.assign': 'Assign User Roles',
  
  // Content Management
  'content.read': 'View Content',
  'content.create': 'Create Content',
  'content.update': 'Update Content',
  'content.delete': 'Delete Content',
  'content.moderate': 'Moderate Content',
  
  // Payment Management
  'payments.read': 'View Payments',
  'payments.create': 'Create Payments',
  'payments.refund': 'Process Refunds',
  'payments.payout': 'Process Payouts',
  'payments.manage': 'Manage Payments',
  
  // Analytics & Reports
  'analytics.read': 'View Analytics',
  'analytics.export': 'Export Analytics',
  'reports.generate': 'Generate Reports',
  'reports.view': 'View Reports',
  
  // System Management
  'system.settings': 'Manage System Settings',
  'system.maintenance': 'Perform System Maintenance',
  'system.logs': 'View System Logs',
  'system.backup': 'Manage System Backups',
  
  // Sports Management
  'sports.manage': 'Manage Sports',
  'teams.manage': 'Manage Teams',
  'leagues.manage': 'Manage Leagues',
  'tournaments.manage': 'Manage Tournaments',
  
  // Communication
  'messages.send': 'Send Messages',
  'messages.read': 'Read Messages',
  'notifications.send': 'Send Notifications',
  'announcements.create': 'Create Announcements',
  
  // Media Management
  'media.upload': 'Upload Media',
  'media.delete': 'Delete Media',
  'media.moderate': 'Moderate Media',
  'media.approve': 'Approve Media',
  
  // Financial Management
  'financial.read': 'View Financial Data',
  'financial.manage': 'Manage Financial Data',
  'financial.reports': 'Generate Financial Reports',
  'financial.settings': 'Manage Financial Settings'
};

/**
 * Utility Functions
 */

/**
 * Get all permissions for a role (including inherited permissions)
 */
export function getRolePermissions(role: UserRole): Permission[] {
  const directPermissions = ROLE_PERMISSIONS[role] || [];
  const hierarchy = ROLE_HIERARCHY[role];
  
  if (!hierarchy || hierarchy.inheritsFrom.length === 0) {
    return directPermissions;
  }
  
  const inheritedPermissions = hierarchy.inheritsFrom.flatMap(inheritedRole => 
    getRolePermissions(inheritedRole)
  );
  
  return [...new Set([...directPermissions, ...inheritedPermissions])];
}

/**
 * Check if a role can assign another role
 */
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  const hierarchy = ROLE_HIERARCHY[assignerRole];
  return hierarchy?.canAssignRoles.includes(targetRole) || false;
}

/**
 * Get roles that can be assigned by a given role
 */
export function getAssignableRoles(role: UserRole): UserRole[] {
  const hierarchy = ROLE_HIERARCHY[role];
  return hierarchy?.canAssignRoles || [];
}

/**
 * Check if a role has access to admin features
 */
export function hasAdminAccess(role: UserRole): boolean {
  const hierarchy = ROLE_HIERARCHY[role];
  return hierarchy?.canAccessAdmin || false;
}

/**
 * Get all roles that inherit from a given role
 */
export function getInheritingRoles(role: UserRole): UserRole[] {
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, hierarchy]) => hierarchy.inheritsFrom.includes(role))
    .map(([inheritingRole]) => inheritingRole as UserRole);
}

/**
 * Get the role hierarchy level (0 = base, higher = more privileged)
 */
export function getRoleLevel(role: UserRole): number {
  const hierarchy = ROLE_HIERARCHY[role];
  if (!hierarchy || hierarchy.inheritsFrom.length === 0) {
    return 0;
  }
  
  return Math.max(...hierarchy.inheritsFrom.map(inheritedRole => 
    getRoleLevel(inheritedRole)
  )) + 1;
}

/**
 * Check if a role is higher in hierarchy than another
 */
export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  return getRoleLevel(role1) > getRoleLevel(role2);
}

/**
 * Get all permissions grouped by category
 */
export function getPermissionsByCategory(): Record<string, Permission[]> {
  return PERMISSION_CATEGORIES;
}

/**
 * Get permissions for a specific category
 */
export function getCategoryPermissions(category: string): Permission[] {
  return PERMISSION_CATEGORIES[category] || [];
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): Permission[] {
  return Object.values(PERMISSION_CATEGORIES).flat();
}

export default {
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  PERMISSION_CATEGORIES,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  PERMISSION_DISPLAY_NAMES,
  getRolePermissions,
  canAssignRole,
  getAssignableRoles,
  hasAdminAccess,
  getInheritingRoles,
  getRoleLevel,
  isHigherRole,
  getPermissionsByCategory,
  getCategoryPermissions,
  getAllPermissions
}; 