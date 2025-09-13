import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import PlayerProfileService from '../services/playerProfileService';
import TipTrackerService from '../services/tipTrackerService';
import CreatorDashboardService from '../services/creatorDashboardService';
import MediaService from '../services/mediaService';
import type { PlayerProfile, Tip, CreatorDashboard, MediaMetadata } from '../types';

// Backend Integration State Types
export interface BackendIntegrationState {
  // Player Profile State
  playerProfile: PlayerProfile | null;
  playerProfileLoading: boolean;
  playerProfileError: string | null;
  
  // Tip Tracking State
  userTips: {
    sent: Tip[];
    received: Tip[];
  };
  tipsLoading: boolean;
  tipsError: string | null;
  
  // Creator Dashboard State
  creatorDashboard: CreatorDashboard | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  
  // Media State
  userMedia: any[]; // Using any[] to avoid type conflicts
  mediaLoading: boolean;
  mediaError: string | null;
  
  // Global State
  isOnline: boolean;
  isInitialized: boolean;
  lastSync: Date | null;
  syncError: string | null;
}

// Backend Integration Actions
export interface BackendIntegrationActions {
  // Player Profile Actions
  refreshPlayerProfile: () => Promise<void>;
  updatePlayerProfile: (updates: any) => Promise<void>;
  
  // Tip Actions
  createTip: (tipRequest: any) => Promise<string>;
  refreshUserTips: () => Promise<void>;
  
  // Dashboard Actions
  refreshCreatorDashboard: () => Promise<void>;
  updateDashboard: (updates: any) => Promise<void>;
  
  // Media Actions
  refreshUserMedia: () => Promise<void>;
  uploadMedia: (file: File, category: string) => Promise<string>;
  
  // Global Actions
  refreshAllData: () => Promise<void>;
  retryFailedOperations: () => Promise<void>;
  clearErrors: () => void;
}

// Backend Integration Context Type
export interface BackendIntegrationContextType {
  state: BackendIntegrationState;
  actions: BackendIntegrationActions;
}

// Service Instances
const playerProfileService = PlayerProfileService.getInstance();
const tipTrackerService = TipTrackerService.getInstance();
const creatorDashboardService = CreatorDashboardService.getInstance();
const mediaService = MediaService.getInstance();

// Create Context
const BackendIntegrationContext = createContext<BackendIntegrationContextType | undefined>(undefined);

// Provider Component
export const BackendIntegrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const user = auth.user;
  
  // State
  const [state, setState] = useState<BackendIntegrationState>({
    playerProfile: null,
    playerProfileLoading: false,
    playerProfileError: null,
    userTips: { sent: [], received: [] },
    tipsLoading: false,
    tipsError: null,
    creatorDashboard: null,
    dashboardLoading: false,
    dashboardError: null,
    userMedia: [],
    mediaLoading: false,
    mediaError: null,
    isOnline: navigator.onLine,
    isInitialized: false,
    lastSync: null,
    syncError: null
  });

  // Refs for cleanup
  const listeners = useRef<Map<string, () => void>>(new Map());
  const retryQueue = useRef<Array<() => Promise<void>>>([]);
  const isInitializing = useRef(false);

  // Network Status Management
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Retry failed operations when back online
      retryFailedOperations();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Backend Integration
  const initializeBackendIntegration = useCallback(async () => {
    if (!user || isInitializing.current) return;

    isInitializing.current = true;
    setState(prev => ({ ...prev, isInitialized: false }));

    try {
      // Initialize all services in parallel
      await Promise.all([
        initializePlayerProfile(),
        initializeUserTips(),
        initializeCreatorDashboard(),
        initializeUserMedia()
      ]);

      setState(prev => ({ 
        ...prev, 
        isInitialized: true, 
        lastSync: new Date(),
        syncError: null 
      }));
    } catch (error) {
      console.error('Failed to initialize backend integration:', error);
      setState(prev => ({ 
        ...prev, 
        isInitialized: false,
        syncError: error instanceof Error ? error.message : 'Initialization failed'
      }));
    } finally {
      isInitializing.current = false;
    }
  }, [user]);

  // Initialize Player Profile
  const initializePlayerProfile = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, playerProfileLoading: true, playerProfileError: null }));

    try {
      // Get or create player profile
      let profile = await playerProfileService.getPlayerProfileByUserId(user.uid);
      
      if (!profile) {
        // Create default profile
        const profileId = await playerProfileService.createPlayerProfile(user.uid, {
          displayName: user.displayName || 'Player',
          email: user.email || '',
          sports: {
            primary: 'general',
            positions: [],
            experience: 'beginner',
            yearsPlaying: 0
          },
          performance: {
            totalGames: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            averageScore: 0,
            bestScore: 0,
            totalPoints: 0,
            achievements: []
          },
          social: {
            followers: 0,
            following: 0,
            isVerified: false,
            isPublic: true,
            allowMessages: true,
            allowTips: true
          },
          financial: {
            totalEarnings: 0,
            totalTips: 0,
            payoutEnabled: false,
            preferredPayoutMethod: 'stripe'
          },
          preferences: {
            notifications: true,
            privacy: {
              showEmail: false,
              showPhone: false,
              showLocation: true,
              showAge: false,
              showEarnings: true
            },
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        });
        
        profile = await playerProfileService.getPlayerProfile(profileId);
      }

      setState(prev => ({ 
        ...prev, 
        playerProfile: profile,
        playerProfileLoading: false 
      }));

      // Set up real-time listener
      const unsubscribe = playerProfileService.subscribeToPlayerProfile(
        profile!.id,
        (updatedProfile) => {
          setState(prev => ({ 
            ...prev, 
            playerProfile: updatedProfile,
            lastSync: new Date()
          }));
        }
      );

      listeners.current.set('playerProfile', unsubscribe);

    } catch (error) {
      console.error('Failed to initialize player profile:', error);
      setState(prev => ({ 
        ...prev, 
        playerProfileLoading: false,
        playerProfileError: error instanceof Error ? error.message : 'Failed to load profile'
      }));
      
      // Add to retry queue
      retryQueue.current.push(initializePlayerProfile);
    }
  }, [user]);

  // Initialize User Tips
  const initializeUserTips = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, tipsLoading: true, tipsError: null }));

    try {
      // Set up real-time listeners for sent and received tips
      const unsubscribeSent = tipTrackerService.subscribeToUserTips(
        user.uid,
        'sent',
        (sentTips) => {
          setState(prev => ({ 
            ...prev, 
            userTips: { ...prev.userTips, sent: sentTips },
            lastSync: new Date()
          }));
        }
      );

      const unsubscribeReceived = tipTrackerService.subscribeToUserTips(
        user.uid,
        'received',
        (receivedTips) => {
          setState(prev => ({ 
            ...prev, 
            userTips: { ...prev.userTips, received: receivedTips },
            lastSync: new Date()
          }));
        }
      );

      listeners.current.set('tipsSent', unsubscribeSent);
      listeners.current.set('tipsReceived', unsubscribeReceived);

      setState(prev => ({ ...prev, tipsLoading: false }));

    } catch (error) {
      console.error('Failed to initialize user tips:', error);
      setState(prev => ({ 
        ...prev, 
        tipsLoading: false,
        tipsError: error instanceof Error ? error.message : 'Failed to load tips'
      }));
      
      retryQueue.current.push(initializeUserTips);
    }
  }, [user]);

  // Initialize Creator Dashboard
  const initializeCreatorDashboard = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, dashboardLoading: true, dashboardError: null }));

    try {
      // Get or create creator dashboard
      let dashboard = await creatorDashboardService.getCreatorDashboard(user.uid);
      
      if (!dashboard) {
        const dashboardId = await creatorDashboardService.createCreatorDashboard(user.uid);
        dashboard = await creatorDashboardService.getCreatorDashboard(user.uid);
      }

      setState(prev => ({ 
        ...prev, 
        creatorDashboard: dashboard,
        dashboardLoading: false 
      }));

      // Set up real-time listener
      const unsubscribe = creatorDashboardService.subscribeToCreatorDashboard(
        user.uid,
        (updatedDashboard) => {
          setState(prev => ({ 
            ...prev, 
            creatorDashboard: updatedDashboard,
            lastSync: new Date()
          }));
        }
      );

      listeners.current.set('creatorDashboard', unsubscribe);

    } catch (error) {
      console.error('Failed to initialize creator dashboard:', error);
      setState(prev => ({ 
        ...prev, 
        dashboardLoading: false,
        dashboardError: error instanceof Error ? error.message : 'Failed to load dashboard'
      }));
      
      retryQueue.current.push(initializeCreatorDashboard);
    }
  }, [user]);

  // Initialize User Media
  const initializeUserMedia = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, mediaLoading: true, mediaError: null }));

    try {
      const userMedia = await mediaService.getUserMedia(user.uid);
      
      setState(prev => ({ 
        ...prev, 
        userMedia,
        mediaLoading: false 
      }));

    } catch (error) {
      console.error('Failed to initialize user media:', error);
      setState(prev => ({ 
        ...prev, 
        mediaLoading: false,
        mediaError: error instanceof Error ? error.message : 'Failed to load media'
      }));
      
      retryQueue.current.push(initializeUserMedia);
    }
  }, [user]);

  // Retry Failed Operations
  const retryFailedOperations = useCallback(async () => {
    if (retryQueue.current.length === 0) return;

    const operations = [...retryQueue.current];
    retryQueue.current = [];

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Retry operation failed:', error);
        // Add back to queue for next retry
        retryQueue.current.push(operation);
      }
    }
  }, []);

  // Initialize when user changes
  useEffect(() => {
    if (user) {
      initializeBackendIntegration();
    } else {
      // Cleanup when user logs out
      listeners.current.forEach(unsubscribe => unsubscribe());
      listeners.current.clear();
      retryQueue.current = [];
      
      setState({
        playerProfile: null,
        playerProfileLoading: false,
        playerProfileError: null,
        userTips: { sent: [], received: [] },
        tipsLoading: false,
        tipsError: null,
        creatorDashboard: null,
        dashboardLoading: false,
        dashboardError: null,
        userMedia: [],
        mediaLoading: false,
        mediaError: null,
        isOnline: navigator.onLine,
        isInitialized: false,
        lastSync: null,
        syncError: null
      });
    }
  }, [user, initializeBackendIntegration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      listeners.current.forEach(unsubscribe => unsubscribe());
      listeners.current.clear();
    };
  }, []);

  // Actions
  const actions: BackendIntegrationActions = {
    // Player Profile Actions
    refreshPlayerProfile: async () => {
      await initializePlayerProfile();
    },

    updatePlayerProfile: async (updates: any) => {
      if (!state.playerProfile) throw new Error('No player profile found');
      
      try {
        await playerProfileService.updatePlayerProfile(state.playerProfile.id, updates);
      } catch (error) {
        console.error('Failed to update player profile:', error);
        throw error;
      }
    },

    // Tip Actions
    createTip: async (tipRequest: any) => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        const tipId = await tipTrackerService.createTip(user.uid, tipRequest);
        return tipId;
      } catch (error) {
        console.error('Failed to create tip:', error);
        throw error;
      }
    },

    refreshUserTips: async () => {
      await initializeUserTips();
    },

    // Dashboard Actions
    refreshCreatorDashboard: async () => {
      await initializeCreatorDashboard();
    },

    updateDashboard: async (updates: any) => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        await creatorDashboardService.updateCreatorDashboard(user.uid, updates);
      } catch (error) {
        console.error('Failed to update dashboard:', error);
        throw error;
      }
    },

    // Media Actions
    refreshUserMedia: async () => {
      await initializeUserMedia();
    },

    uploadMedia: async (file: File, category: string) => {
      if (!user) throw new Error('User not authenticated');
      
      try {
        const uploadTask = await mediaService.uploadFile(file, category as any, user.uid);
        return uploadTask.id;
      } catch (error) {
        console.error('Failed to upload media:', error);
        throw error;
      }
    },

    // Global Actions
    refreshAllData: async () => {
      await initializeBackendIntegration();
    },

    retryFailedOperations: async () => {
      await retryFailedOperations();
    },

    clearErrors: () => {
      setState(prev => ({
        ...prev,
        playerProfileError: null,
        tipsError: null,
        dashboardError: null,
        mediaError: null,
        syncError: null
      }));
    }
  };

  const contextValue: BackendIntegrationContextType = {
    state,
    actions
  };

  return (
    <BackendIntegrationContext.Provider value={contextValue}>
      {children}
    </BackendIntegrationContext.Provider>
  );
};

// Hook to use Backend Integration Context
export const useBackendIntegration = (): BackendIntegrationContextType => {
  const context = useContext(BackendIntegrationContext);
  if (context === undefined) {
    throw new Error('useBackendIntegration must be used within a BackendIntegrationProvider');
  }
  return context;
};

export default BackendIntegrationContext; 