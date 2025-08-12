import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  deleteUser as firebaseDeleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type {
  AuthContextType,
  AuthState,
  UserProfile,
  UserRole,
  Permission,
  AuthError,
  RoleAssignment
} from '../types/auth';
import { getRolePermissions, canAssignRole, getAssignableRoles } from '../config/rolePermissions';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    permissions: [],
    isAuthenticated: false,
    isInitialized: false,
    isLoading: true,
    error: null
  });

  // Load user profile from Firestore
  const loadUserProfile = useCallback(async (user: FirebaseUser): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }, []);

  // Create user profile in Firestore
  const createUserProfile = useCallback(async (
    user: FirebaseUser,
    profileData: Partial<UserProfile>
  ): Promise<UserProfile> => {
    const defaultProfile: UserProfile = {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || profileData.displayName || '',
      photoURL: user.photoURL || undefined,
      role: 'guest',
      permissions: getRolePermissions('guest'),
      isActive: true,
      isVerified: false,
      isEmailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber || undefined,
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false,
          marketing: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          showLocation: false,
          allowDirectMessages: true
        },
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        theme: 'auto'
      },
      metadata: {
        registrationSource: 'web',
        tags: [],
        deviceInfo: {
          platform: navigator.platform,
          browser: navigator.userAgent,
          version: navigator.appVersion
        }
      },
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      lastLoginAt: serverTimestamp() as any,
      lastActiveAt: serverTimestamp() as any,
      ...profileData
    };

    await setDoc(doc(db, 'users', user.uid), defaultProfile);
    return defaultProfile;
  }, []);

  // Update user profile in Firestore
  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!authState.user) throw new Error('No authenticated user');

    const userRef = doc(db, 'users', authState.user.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Update local state
    if (authState.profile) {
      setAuthState(prev => ({
        ...prev,
        profile: { ...prev.profile!, ...updates }
      }));
    }
  }, [authState.user, authState.profile]);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Load or create user profile
      let profile = await loadUserProfile(user);
      if (!profile) {
        profile = await createUserProfile(user, {});
      }

      // Update last login
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp()
      });

      setAuthState({
        user,
        profile,
        role: profile.role,
        permissions: profile.permissions,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'SIGN_IN_ERROR',
        message: error.message || 'Failed to sign in',
        timestamp: new Date() as any
      };
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: authError
      }));
      throw error;
    }
  }, [loadUserProfile, createUserProfile]);

  // Sign up function
  const signUp = useCallback(async (
    email: string,
    password: string,
    profileData: Partial<UserProfile>
  ): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile
      const profile = await createUserProfile(user, profileData);
      
      setAuthState({
        user,
        profile,
        role: profile.role,
        permissions: profile.permissions,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'SIGN_UP_ERROR',
        message: error.message || 'Failed to sign up',
        timestamp: new Date() as any
      };
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: authError
      }));
      throw error;
    }
  }, [createUserProfile]);

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setAuthState({
        user: null,
        profile: null,
        role: null,
        permissions: [],
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'SIGN_OUT_ERROR',
        message: error.message || 'Failed to sign out',
        timestamp: new Date() as any
      };
      setAuthState(prev => ({
        ...prev,
        error: authError
      }));
      throw error;
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'RESET_PASSWORD_ERROR',
        message: error.message || 'Failed to reset password',
        timestamp: new Date() as any
      };
      setAuthState(prev => ({
        ...prev,
        error: authError
      }));
      throw error;
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    try {
      await updateUserProfile(updates);
      
      // Update Firebase Auth profile if displayName or photoURL changed
      if (updates.displayName || updates.photoURL) {
        await firebaseUpdateProfile(auth.currentUser!, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'UPDATE_PROFILE_ERROR',
        message: error.message || 'Failed to update profile',
        timestamp: new Date() as any
      };
      setAuthState(prev => ({
        ...prev,
        error: authError
      }));
      throw error;
    }
  }, [updateUserProfile]);

  // Update password function
  const updatePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error('No authenticated user');
      }

      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'UPDATE_PASSWORD_ERROR',
        message: error.message || 'Failed to update password',
        timestamp: new Date() as any
      };
      setAuthState(prev => ({
        ...prev,
        error: authError
      }));
      throw error;
    }
  }, []);

  // Delete account function
  const deleteAccount = useCallback(async (password: string): Promise<void> => {
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error('No authenticated user');
      }

      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Delete user profile from Firestore
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      
      // Delete Firebase Auth user
      await firebaseDeleteUser(auth.currentUser);
      
      setAuthState({
        user: null,
        profile: null,
        role: null,
        permissions: [],
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'DELETE_ACCOUNT_ERROR',
        message: error.message || 'Failed to delete account',
        timestamp: new Date() as any
      };
      setAuthState(prev => ({
        ...prev,
        error: authError
      }));
      throw error;
    }
  }, []);

  // Role management functions
  const assignRole = useCallback(async (userId: string, role: UserRole, reason?: string): Promise<void> => {
    try {
      if (!authState.user || !authState.role) {
        throw new Error('No authenticated user');
      }

      // Check if current user can assign this role
      if (!canAssignRole(authState.role, role)) {
        throw new Error('Insufficient permissions to assign this role');
      }

      // Update user role in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role,
        permissions: getRolePermissions(role),
        updatedAt: serverTimestamp()
      });

      // Create role assignment record
      const roleAssignment: RoleAssignment = {
        id: `${userId}_${Date.now()}`,
        userId,
        role,
        assignedBy: authState.user.uid,
        assignedAt: serverTimestamp() as any,
        reason,
        isActive: true
      };

      await setDoc(doc(db, 'roleAssignments', roleAssignment.id), roleAssignment);

      // Update local state if it's the current user
      if (userId === authState.user.uid) {
        setAuthState(prev => ({
          ...prev,
          role,
          permissions: getRolePermissions(role)
        }));
      }
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'ASSIGN_ROLE_ERROR',
        message: error.message || 'Failed to assign role',
        timestamp: new Date() as any
      };
      setAuthState(prev => ({
        ...prev,
        error: authError
      }));
      throw error;
    }
  }, [authState.user, authState.role]);

  const removeRole = useCallback(async (userId: string, reason?: string): Promise<void> => {
    try {
      if (!authState.user || !authState.role) {
        throw new Error('No authenticated user');
      }

      // Check if current user can remove roles
      if (!canAssignRole(authState.role, 'guest')) {
        throw new Error('Insufficient permissions to remove roles');
      }

      // Update user role to guest in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: 'guest',
        permissions: getRolePermissions('guest'),
        updatedAt: serverTimestamp()
      });

      // Create role assignment record
      const roleAssignment: RoleAssignment = {
        id: `${userId}_${Date.now()}`,
        userId,
        role: 'guest',
        assignedBy: authState.user.uid,
        assignedAt: serverTimestamp() as any,
        reason,
        isActive: true
      };

      await setDoc(doc(db, 'roleAssignments', roleAssignment.id), roleAssignment);

      // Update local state if it's the current user
      if (userId === authState.user.uid) {
        setAuthState(prev => ({
          ...prev,
          role: 'guest',
          permissions: getRolePermissions('guest')
        }));
      }
    } catch (error: any) {
      const authError: AuthError = {
        code: error.code || 'REMOVE_ROLE_ERROR',
        message: error.message || 'Failed to remove role',
        timestamp: new Date() as any
      };
      setAuthState(prev => ({
        ...prev,
        error: authError
      }));
      throw error;
    }
  }, [authState.user, authState.role]);

  const updateRole = useCallback(async (userId: string, role: UserRole, reason?: string): Promise<void> => {
    await assignRole(userId, role, reason);
  }, [assignRole]);

  // Permission check functions
  const hasPermission = useCallback((
    permission: Permission,
    resource?: string,
    resourceId?: string
  ): boolean => {
    if (!authState.isAuthenticated || !authState.permissions) {
      return false;
    }

    // Check if user has the permission
    const hasDirectPermission = authState.permissions.includes(permission);
    
    // Check resource-specific permissions if provided
    if (resource && resourceId) {
      // For now, return direct permission check
      // In the future, this could check resource-specific permissions
      return hasDirectPermission;
    }

    return hasDirectPermission;
  }, [authState.isAuthenticated, authState.permissions]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return authState.role === role;
  }, [authState.role]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return authState.role ? roles.includes(authState.role) : false;
  }, [authState.role]);

  const hasAllRoles = useCallback((roles: UserRole[]): boolean => {
    return authState.role ? roles.includes(authState.role) : false;
  }, [authState.role]);

  // Utility functions
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!authState.user) return;

    try {
      await authState.user.reload();
      const profile = await loadUserProfile(authState.user);
      
      if (profile) {
        setAuthState(prev => ({
          ...prev,
          profile,
          role: profile.role,
          permissions: profile.permissions
        }));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [authState.user, loadUserProfile]);

  const clearError = useCallback((): void => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Load user profile
          let profile = await loadUserProfile(user);
          if (!profile) {
            profile = await createUserProfile(user, {});
          }

          setAuthState({
            user,
            profile,
            role: profile.role,
            permissions: profile.permissions,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Error loading user profile:', error);
          setAuthState({
            user: null,
            profile: null,
            role: null,
            permissions: [],
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            error: null
          });
        }
      } else {
        setAuthState({
          user: null,
          profile: null,
          role: null,
          permissions: [],
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
          error: null
        });
      }
    });

    return unsubscribe;
  }, [loadUserProfile, createUserProfile]);

  // Update last active timestamp
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      const interval = setInterval(async () => {
        try {
          await updateDoc(doc(db, 'users', authState.user!.uid), {
            lastActiveAt: serverTimestamp()
          });
        } catch (error) {
          console.error('Error updating last active timestamp:', error);
        }
      }, 5 * 60 * 1000); // Update every 5 minutes

      return () => clearInterval(interval);
    }
  }, [authState.isAuthenticated, authState.user]);

  const contextValue: AuthContextType = {
    authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
    deleteAccount,
    assignRole,
    removeRole,
    updateRole,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    refreshUser,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth Context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 