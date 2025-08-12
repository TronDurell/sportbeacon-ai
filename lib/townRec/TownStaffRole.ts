import { db } from '../firebase/config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  orderBy,
  addDoc,
  limit,
  Timestamp
} from 'firebase/firestore';
import { 
  AuditLog,
  Record<string, unknown>
} from '../../types/interfaces';

export interface TownStaffUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'TownStaff' | 'RecDirector' | 'RecCoordinator' | 'RecAssistant';
  department: 'ParksAndRec' | 'Administration' | 'Finance' | 'IT';
  permissions: string[];
  isActive: boolean;
  hireDate: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  supervisor?: string;
  phone?: string;
  office?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface TownStaffPermission {
  id: string;
  name: string;
  description: string;
  category: 'waitlist' | 'registration' | 'overrides' | 'approvals' | 'analytics' | 'admin';
  requiredRole: TownStaffUser['role'][];
}

export interface TownStaffSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  userRole: TownStaffUser['role'];
  loginTime: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  permissions: string[];
}

export class TownStaffRole {
  private static instance: TownStaffRole;
  private currentUser: TownStaffUser | null = null;
  private permissions: Map<string, TownStaffPermission> = new Map();
  private activeSessions: Map<string, TownStaffSession> = new Map();

  static getInstance(): TownStaffRole {
    if (!TownStaffRole.instance) {
      TownStaffRole.instance = new TownStaffRole();
    }
    return TownStaffRole.instance;
  }

  /**
   * Initialize the Town Staff role system
   */
  async initialize(): Promise<void> {
    try {
      // Load permissions
      await this.loadPermissions();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load permissions from Firestore
   */
  private async loadPermissions(): Promise<void> {
    try {
      const permissionsSnapshot = await getDocs(collection(db, 'townStaffPermissions'));
      permissionsSnapshot.forEach((doc) => {
        const permission = doc.data() as TownStaffPermission;
        this.permissions.set(permission.id, permission);
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Authenticate and authorize Town Staff user
   */
  async authenticateUser(uid: string): Promise<TownStaffUser | null> {
    try {
      const userRef = doc(db, 'townStaff', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      const userData = userSnap.data() as TownStaffUser;
      
      if (!userData.isActive) {
        return null;
      }

      // Update last login
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.currentUser = userData;
      return userData;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user has required role
   */
  hasRole(requiredRoles: TownStaffUser['role'][]): boolean {
    if (!this.currentUser) {
      return false;
    }

    return requiredRoles.includes(this.currentUser.role);
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permissionId: string): boolean {
    if (!this.currentUser) {
      return false;
    }

    const permission = this.permissions.get(permissionId);
    if (!permission) {
      return false;
    }

    // Check if user's role is in required roles
    if (!permission.requiredRole.includes(this.currentUser.role)) {
      return false;
    }

    // Check if user has explicit permission
    return this.currentUser.permissions.includes(permissionId);
  }

  /**
   * Check if user has any permission in category
   */
  hasCategoryPermission(category: TownStaffPermission['category']): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.permissions.some(permissionId => {
      const permission = this.permissions.get(permissionId);
      return permission?.category === category;
    });
  }

  /**
   * Get current user
   */
  getCurrentUser(): TownStaffUser | null {
    return this.currentUser;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(): TownStaffPermission[] {
    if (!this.currentUser) {
      return [];
    }

    return this.currentUser.permissions
      .map(permissionId => this.permissions.get(permissionId))
      .filter(Boolean) as TownStaffPermission[];
  }

  /**
   * Create new Town Staff user
   */
  async createTownStaffUser(userData: Omit<TownStaffUser, 'uid' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Check if user already exists
      const existingUserQuery = query(
        collection(db, 'townStaff'),
        where('email', '==', userData.email)
      );
      
      const existingUserSnap = await getDocs(existingUserQuery);
      if (!existingUserSnap.empty) {
        throw new Error('User with this email already exists');
      }

      // Create user document
      const userRef = doc(collection(db, 'townStaff'));
      const newUser: TownStaffUser = {
        ...userData,
        uid: userRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create audit log
      await this.createAuditLog({
        action: 'user_created',
        userId: userRef.id,
        userEmail: userData.email,
        details: {
          role: userData.role,
          department: userData.department,
          permissions: userData.permissions
        }
      });

      return userRef.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update Town Staff user
   */
  async updateTownStaffUser(uid: string, updates: Partial<TownStaffUser>): Promise<void> {
    try {
      const userRef = doc(db, 'townStaff', uid);
      
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Create audit log
      await this.createAuditLog({
        action: 'user_updated',
        userId: uid,
        userEmail: this.currentUser?.email || 'unknown',
        details: updates
      });

      // Update current user if it's the same user
      if (this.currentUser?.uid === uid) {
        this.currentUser = { ...this.currentUser, ...updates };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deactivate Town Staff user
   */
  async deactivateTownStaffUser(uid: string, reason: string): Promise<void> {
    try {
      const userRef = doc(db, 'townStaff', uid);
      
      await updateDoc(userRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });

      // Create audit log
      await this.createAuditLog({
        action: 'user_deactivated',
        userId: uid,
        userEmail: this.currentUser?.email || 'unknown',
        details: { reason }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all Town Staff users
   */
  async getAllTownStaffUsers(): Promise<TownStaffUser[]> {
    try {
      const q = query(
        collection(db, 'townStaff'),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as TownStaffUser[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create user session
   */
  async createSession(userId: string, sessionData: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> {
    try {
      const userRef = doc(db, 'townStaff', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnap.data() as TownStaffUser;
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const session: TownStaffSession = {
        sessionId,
        userId,
        userEmail: userData.email,
        userRole: userData.role,
        loginTime: new Date(),
        lastActivity: new Date(),
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        isActive: true,
        permissions: userData.permissions
      };

      // Store session in Firestore
      const sessionRef = doc(db, 'townStaffSessions', sessionId);
      await setDoc(sessionRef, {
        ...session,
        loginTime: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      // Store in memory for quick access
      this.activeSessions.set(sessionId, session);

      return sessionId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<TownStaffSession | null> {
    try {
      // Check memory first
      const memorySession = this.activeSessions.get(sessionId);
      if (memorySession && memorySession.isActive) {
        // Update last activity
        memorySession.lastActivity = new Date();
        return memorySession;
      }

      // Check Firestore
      const sessionRef = doc(db, 'townStaffSessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        return null;
      }

      const session = sessionSnap.data() as TownStaffSession;
      
      // Check if session is still active (within 8 hours)
      const sessionAge = Date.now() - session.loginTime.getTime();
      const maxSessionAge = 8 * 60 * 60 * 1000; // 8 hours

      if (sessionAge > maxSessionAge) {
        await this.invalidateSession(sessionId);
        return null;
      }

      // Update last activity
      await updateDoc(sessionRef, {
        lastActivity: serverTimestamp()
      });

      session.lastActivity = new Date();
      this.activeSessions.set(sessionId, session);

      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'townStaffSessions', sessionId);
      await updateDoc(sessionRef, {
        isActive: false,
        lastActivity: serverTimestamp()
      });

      this.activeSessions.delete(sessionId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(logData: {
    action: string;
    userId: string;
    userEmail: string;
    details: Record<string, unknown>;
  }): Promise<void> {
    try {
      await addDoc(collection(db, 'townStaffAuditLogs'), {
        ...logData,
        timestamp: serverTimestamp(),
        performedBy: this.currentUser?.uid || 'system',
        performedByEmail: this.currentUser?.email || 'system'
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get audit logs for user
   */
  async getAuditLogs(userId?: string, limit: number = 50): Promise<AuditLog[]> {
    try {
      let q = query(
        collection(db, 'townStaffAuditLogs'),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      if (userId) {
        q = query(
          collection(db, 'townStaffAuditLogs'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(limit)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    if (this.currentUser) {
      // Invalidate all sessions for this user
      const userSessions = Array.from(this.activeSessions.values())
        .filter(session => session.userId === this.currentUser!.uid);

      for (const session of userSessions) {
        await this.invalidateSession(session.sessionId);
      }

      this.currentUser = null;
    }
  }

  /**
   * Check if user can access RecAdminHub
   */
  canAccessRecAdminHub(): boolean {
    return this.hasRole(['TownStaff', 'RecDirector', 'RecCoordinator']);
  }

  /**
   * Check if user can manage waitlists
   */
  canManageWaitlists(): boolean {
    return this.hasPermission('waitlist_manage') || this.hasRole(['RecDirector', 'RecCoordinator']);
  }

  /**
   * Check if user can approve overrides
   */
  canApproveOverrides(): boolean {
    return this.hasPermission('overrides_approve') || this.hasRole(['RecDirector']);
  }

  /**
   * Check if user can view analytics
   */
  canViewAnalytics(): boolean {
    return this.hasPermission('analytics_view') || this.hasRole(['RecDirector', 'RecCoordinator']);
  }

  /**
   * Check if user can manage users
   */
  canManageUsers(): boolean {
    return this.hasPermission('users_manage') || this.hasRole(['RecDirector']);
  }
}

// Export singleton instance
export const townStaffRole = TownStaffRole.getInstance();

// Export permission constants
export const TOWN_STAFF_PERMISSIONS = {
  // Waitlist permissions
  WAITLIST_VIEW: 'waitlist_view',
  WAITLIST_MANAGE: 'waitlist_manage',
  WAITLIST_PROMOTE: 'waitlist_promote',
  
  // Registration permissions
  REGISTRATION_VIEW: 'registration_view',
  REGISTRATION_CREATE: 'registration_create',
  REGISTRATION_EDIT: 'registration_edit',
  REGISTRATION_DELETE: 'registration_delete',
  
  // Override permissions
  OVERRIDES_VIEW: 'overrides_view',
  OVERRIDES_APPROVE: 'overrides_approve',
  OVERRIDES_DENY: 'overrides_deny',
  
  // Approval permissions
  APPROVALS_VIEW: 'approvals_view',
  APPROVALS_PROCESS: 'approvals_process',
  
  // Analytics permissions
  ANALYTICS_VIEW: 'analytics_view',
  ANALYTICS_EXPORT: 'analytics_export',
  
  // Admin permissions
  USERS_VIEW: 'users_view',
  USERS_MANAGE: 'users_manage',
  POLICIES_VIEW: 'policies_view',
  POLICIES_EDIT: 'policies_edit',
  AUDIT_LOGS_VIEW: 'audit_logs_view'
} as const; 