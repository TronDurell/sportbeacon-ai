import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { app } from '../lib/firebase';
import { 
  validateUserRegistration, 
  validateUserLogin,
  formatValidationErrors,
  UserRegistrationData
} from '../utils/validation';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AdminAuthProvider');
  }
  return context;
};

// Alias for compatibility
export const useAdminAuth = useAuth;

// Admin role hook for dashboard components
export const useAdminRole = () => {
  const { user } = useAuth();
  
  return {
    user,
    canViewPlayers: true,
    canApproveRegistrations: true,
    canManageWaitlist: true,
    canManageSiblings: true,
    canApproveAgeExceptions: true,
    canViewIncidents: true,
    canManageScores: true,
    canViewPayments: true,
    canProcessRefunds: true,
    canManageReferees: true,
    canViewLeagueDashboard: true,
  };
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  // Initialize Firebase Auth and Firestore
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Convert Firebase user to our User type
  const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    try {
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || 'athlete',
          organization: userData.organization,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date()
        };
      } else {
        // Create user document if it doesn't exist
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          role: 'player',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...newUser,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        return newUser;
      }
    } catch (error) {
      throw new Error('Failed to load user data');
    }
  };

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await convertFirebaseUser(firebaseUser);
          setAuthState({
            user,
            isAuthenticated: true,
            loading: false
          });
        } catch (error) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false
        });
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  const login = async (email: string, password: string, role: UserRole) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
      
      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Convert to our User type
      const user = await convertFirebaseUser(firebaseUser);
      
      // Update user role if needed
      if (user.role !== role) {
        await updateDoc(doc(db, 'users', user.id), {
          role,
          updatedAt: new Date()
        });
        user.role = role;
      }
      
      setAuthState({
        user,
        isAuthenticated: true,
        loading: false
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      
      // Handle specific Firebase auth errors
      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          throw new Error('User not found. Please check your email and password.');
        } else if (error.message.includes('wrong-password')) {
          throw new Error('Incorrect password. Please try again.');
        } else if (error.message.includes('too-many-requests')) {
          throw new Error('Too many failed attempts. Please try again later.');
        } else if (error.message.includes('user-disabled')) {
          throw new Error('Account has been disabled. Please contact support.');
        }
      }
      
      throw error;
    }
  };

  const register = async (userData: any) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      // Comprehensive input validation using new validation utilities
      const validationResult = validateUserRegistration(userData);
      
      if (!validationResult.isValid) {
        const errorMessages = formatValidationErrors(validationResult.errors);
        throw new Error(`Registration validation failed: ${errorMessages}`);
      }
      
      const validatedData = validationResult.data!;
      
      // Create Firebase user with validated data
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        validatedData.email, 
        validatedData.password
      );
      
      const firebaseUser = userCredential.user;
      
      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: `${validatedData.firstName} ${validatedData.lastName}`
      });
      
      // Create user document in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        organization: validatedData.organization,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setAuthState({
        user: newUser,
        isAuthenticated: true,
        loading: false
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      
      // Handle specific Firebase auth errors
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          throw new Error('An account with this email already exists.');
        } else if (error.message.includes('weak-password')) {
          throw new Error('Password is too weak. Please choose a stronger password.');
        } else if (error.message.includes('invalid-email')) {
          throw new Error('Invalid email address.');
        }
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false
      });
    } catch (error) {
      // Force logout even if Firebase logout fails
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false
      });
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!authState.user) {
      throw new Error('No user logged in');
    }
    
    try {
      // Update Firestore document
      await updateDoc(doc(db, 'users', authState.user.id), {
        ...userData,
        updatedAt: new Date()
      });
      
      // Update local state
      const updatedUser = { ...authState.user, ...userData, updatedAt: new Date() };
      setAuthState(prev => ({ ...prev, user: updatedUser }));
      
      // Update Firebase profile if name changed
      if (userData.firstName || userData.lastName) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await updateProfile(currentUser, {
            displayName: `${userData.firstName || authState.user.firstName} ${userData.lastName || authState.user.lastName}`
          });
        }
      }
    } catch (error) {
      throw new Error('Failed to update user profile');
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 