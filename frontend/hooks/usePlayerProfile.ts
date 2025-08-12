import { useState, useEffect, useCallback, useRef } from 'react';
import { playerProfileService } from '../services/playerProfileService';
import type { PlayerProfileDocument, FirebaseError } from '../firebase/types';

// Hook return types
interface UsePlayerProfileReturn {
  profile: PlayerProfileDocument | null;
  loading: boolean;
  error: FirebaseError | null;
  createProfile: (profileData: Omit<PlayerProfileDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => Promise<string>;
  updateProfile: (updates: Partial<Omit<PlayerProfileDocument, 'id' | 'createdAt' | 'createdBy'>>) => Promise<void>;
  deleteProfile: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface UsePlayerProfilesReturn {
  profiles: PlayerProfileDocument[];
  loading: boolean;
  error: FirebaseError | null;
  createProfile: (profileData: Omit<PlayerProfileDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => Promise<string>;
  updateProfile: (profileId: string, updates: Partial<Omit<PlayerProfileDocument, 'id' | 'createdAt' | 'createdBy'>>) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  searchProfiles: (searchTerm: string) => Promise<PlayerProfileDocument[]>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing a single player profile with real-time updates
 */
export const usePlayerProfile = (profileId: string | null): UsePlayerProfileReturn => {
  const [profile, setProfile] = useState<PlayerProfileDocument | null>(null);
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
      const profileData = await playerProfileService.getProfileById(profileId);
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
    const unsubscribe = playerProfileService.subscribeToProfile(profileId, (profileData) => {
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
  const createProfile = useCallback(async (profileData: Omit<PlayerProfileDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => {
    try {
      setError(null);
      const newProfileId = await playerProfileService.createProfile(profileData);
      return newProfileId;
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Omit<PlayerProfileDocument, 'id' | 'createdAt' | 'createdBy'>>) => {
    if (!profileId) {
      throw new Error('No profile ID provided');
    }

    try {
      setError(null);
      await playerProfileService.updateProfile(profileId, updates);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [profileId]);

  // Delete profile
  const deleteProfile = useCallback(async () => {
    if (!profileId) {
      throw new Error('No profile ID provided');
    }

    try {
      setError(null);
      await playerProfileService.deleteProfile(profileId);
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
    createProfile,
    updateProfile,
    deleteProfile,
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
  const [profiles, setProfiles] = useState<PlayerProfileDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirebaseError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch profiles data
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profilesData = await playerProfileService.getAllProfiles(filters);
      setProfiles(profilesData);
    } catch (err) {
      setError(err as FirebaseError);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Subscribe to real-time updates
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = playerProfileService.subscribeToProfiles(filters || {}, (profilesData) => {
      setProfiles(profilesData);
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
  }, [filters]);

  // Create profile
  const createProfile = useCallback(async (profileData: Omit<PlayerProfileDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => {
    try {
      setError(null);
      const newProfileId = await playerProfileService.createProfile(profileData);
      return newProfileId;
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (profileId: string, updates: Partial<Omit<PlayerProfileDocument, 'id' | 'createdAt' | 'createdBy'>>) => {
    try {
      setError(null);
      await playerProfileService.updateProfile(profileId, updates);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  // Delete profile
  const deleteProfile = useCallback(async (profileId: string) => {
    try {
      setError(null);
      await playerProfileService.deleteProfile(profileId);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, []);

  // Search profiles
  const searchProfiles = useCallback(async (searchTerm: string) => {
    try {
      setError(null);
      return await playerProfileService.searchProfiles(searchTerm);
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
    createProfile,
    updateProfile,
    deleteProfile,
    searchProfiles,
    refetch
  };
};

/**
 * Hook for managing player profiles by user ID (for coaches/admins)
 */
export const usePlayerProfilesByUser = (userId: string | null) => {
  const [profiles, setProfiles] = useState<PlayerProfileDocument[]>([]);
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
        const profilesData = await playerProfileService.getProfilesByUserId(userId);
        setProfiles(profilesData);
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
      await playerProfileService.updateProfileStats(profileId, stats);
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
      await playerProfileService.addRecentDrill(profileId, drill);
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