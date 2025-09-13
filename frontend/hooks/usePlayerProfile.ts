import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerProfileService } from '../services/playerProfileService';
import type { PlayerProfile } from '../types';
import type { FirebaseError } from '../firebase/types';

// Get service singleton instance
const playerProfileService = PlayerProfileService.getInstance();

// Hook return types
interface UsePlayerProfileReturn {
  profile: PlayerProfile | null;
  loading: boolean;
  error: FirebaseError | null;
  createPlayerProfile: (profileData: Omit<PlayerProfile, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'status'>) => Promise<string>;
  updatePlayerProfile: (updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'status'>>) => Promise<void>;
  deletePlayerProfile: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface UsePlayerProfilesReturn {
  profiles: PlayerProfile[];
  loading: boolean;
  error: FirebaseError | null;
  createPlayerProfile: (profileData: Omit<PlayerProfile, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'status'>) => Promise<string>;
  updatePlayerProfile: (profileId: string, updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'status'>>) => Promise<void>;
  deletePlayerProfile: (profileId: string) => Promise<void>;
  searchProfiles: (searchTerm: string) => Promise<PlayerProfile[]>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing a single player profile with real-time updates
 */
export const usePlayerProfile = (profileId: string | null): UsePlayerProfileReturn => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirebaseError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!profileId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const profileData = await playerProfileService.getPlayerProfile(profileId);
      setProfile(profileData);
    } catch (err) {
      setError(err as FirebaseError);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!profileId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = playerProfileService.subscribeToPlayerProfile(profileId, (profileData) => {
      setProfile(profileData);
      setLoading(false);
      setError(null);
    });

    unsubscribeRef.current = unsubscribe;

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [profileId]);

  // Create profile
  const createPlayerProfile = useCallback(async (profileData: Omit<PlayerProfile, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'status'>) => {
    try {
      setError(null);
      const newProfileId = await playerProfileService.createPlayerProfile(profileData.userId, profileData);
      return newProfileId;
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  // Update profile
  const updatePlayerProfile = useCallback(async (updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'status'>>) => {
    if (!profileId) {
      throw new Error('No profile ID provided');
    }

    try {
      setError(null);
      await playerProfileService.updatePlayerProfile(profileId, updates);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [profileId]);

  // Delete profile
  const deletePlayerProfile = useCallback(async () => {
    if (!profileId) {
      throw new Error('No profile ID provided');
    }

    try {
      setError(null);
      await playerProfileService.deletePlayerProfile(profileId);
      setProfile(null);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [profileId]);

  // Refetch profile
  const refetch = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    createPlayerProfile,
    updatePlayerProfile,
    deletePlayerProfile,
    refetch
  };
};

/**
 * Hook for managing multiple player profiles with real-time updates
 */
export const usePlayerProfiles = (filters?: {
  isActive?: boolean;
  position?: string;
  skillLevel?: string;
  limit?: number;
}): UsePlayerProfilesReturn => {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirebaseError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch profiles data
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profilesData = await playerProfileService.searchPlayers(filters as any || {});
      setProfiles(profilesData);
    } catch (err) {
      setError(err as FirebaseError);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch profiles on mount and when filters change
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Create profile
  const createPlayerProfile = useCallback(async (profileData: Omit<PlayerProfile, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'status'>) => {
    try {
      setError(null);
      const newProfileId = await playerProfileService.createPlayerProfile(profileData.userId, profileData);
      return newProfileId;
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  // Update profile
  const updatePlayerProfile = useCallback(async (profileId: string, updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt' | 'updatedAt' | 'lastActive' | 'status'>>) => {
    try {
      setError(null);
      await playerProfileService.updatePlayerProfile(profileId, updates);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  // Delete profile
  const deletePlayerProfile = useCallback(async (profileId: string) => {
    try {
      setError(null);
      await playerProfileService.deletePlayerProfile(profileId);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  // Search profiles
  const searchProfiles = useCallback(async (searchTerm: string) => {
    try {
      setError(null);
      return await playerProfileService.searchPlayersByText(searchTerm);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  // Refetch profiles
  const refetch = useCallback(async () => {
    await fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    createPlayerProfile,
    updatePlayerProfile,
    deletePlayerProfile,
    searchProfiles,
    refetch
  };
};

/**
 * Hook for managing player profiles by user ID (for coaches/admins)
 */
export const usePlayerProfilesByUser = (userId: string | null) => {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirebaseError | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const profilesData = await playerProfileService.getPlayerProfileByUserId(userId);
        setProfiles(profilesData ? [profilesData] : []);
      } catch (err) {
        setError(err as FirebaseError);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [userId]);

  return { profiles, loading, error };
};

/**
 * Hook for updating profile statistics
 */
export const useProfileStats = (profileId: string | null) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirebaseError | null>(null);

  const updateStats = useCallback(async (stats: {
    completedDrills?: number;
    averagePerformance?: number;
    streak?: number;
    totalTime?: number;
  }) => {
    if (!profileId) {
      throw new Error('No profile ID provided');
    }

    try {
      setLoading(true);
      setError(null);
      // await playerProfileService.updatePlayerProfileStats(profileId, stats); // Method not available
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const addRecentDrill = useCallback(async (drill: {
    id: string;
    name: string;
    date: string;
    performance: number;
  }) => {
    if (!profileId) {
      throw new Error('No profile ID provided');
    }

    try {
      setLoading(true);
      setError(null);
      // await playerProfileService.addRecentDrill(profileId, drill); // Method not available
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  return {
    updateStats,
    addRecentDrill,
    loading,
    error
  };
}; 