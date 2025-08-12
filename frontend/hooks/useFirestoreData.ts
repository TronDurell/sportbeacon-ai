import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import FirestoreService from '../services/firestoreService';
import type {
  Player,
  Drill,
  Report,
  VideoAnnotation,
  SearchFilters,
  QueryResult,
  FirestoreError
} from '../types/firestore';

/**
 * Custom hook for Firestore data management
 * Provides caching, real-time updates, and efficient data operations
 */
export const useFirestoreData = () => {
  const { user } = useAuth();
  const userId = user?.uid;

  // Refs for cleanup
  const listeners = useRef<{ [key: string]: () => void }>({});

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      Object.values(listeners.current).forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Player Profile Management
  const usePlayerProfile = (playerId: string) => {
    const [player, setPlayer] = useState<Player | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    useEffect(() => {
      if (!playerId) {
        setPlayer(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Initial load
      const loadPlayer = async () => {
        try {
          const playerData = await FirestoreService.getPlayerProfile(playerId);
          setPlayer(playerData);
        } catch (err) {
          const firestoreError: FirestoreError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch player profile',
            timestamp: new Date() as any
          };
          setError(firestoreError);
        } finally {
          setLoading(false);
        }
      };

      loadPlayer();

      // Real-time listener
      const unsubscribe = FirestoreService.listenToPlayerProfile(
        playerId,
        (playerData) => {
          setPlayer(playerData);
          setLoading(false);
        },
        (err) => {
          const firestoreError: FirestoreError = {
            code: 'LISTENER_ERROR',
            message: err.message,
            timestamp: new Date() as any
          };
          setError(firestoreError);
          setLoading(false);
        }
      );

      listeners.current[`player-${playerId}`] = unsubscribe;

      return () => {
        if (listeners.current[`player-${playerId}`]) {
          listeners.current[`player-${playerId}`]();
          delete listeners.current[`player-${playerId}`];
        }
      };
    }, [playerId]);

    const updatePlayer = useCallback(async (updates: Partial<Player>) => {
      if (!playerId) return;

      try {
        await FirestoreService.updatePlayerProfile(playerId, updates);
      } catch (err) {
        const firestoreError: FirestoreError = {
          code: 'UPDATE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to update player profile',
          timestamp: new Date() as any
        };
        setError(firestoreError);
        throw err;
      }
    }, [playerId]);

    return {
      player,
      loading,
      error,
      updatePlayer
    };
  };

  // Drills Management
  const useDrills = (filters: {
    sport?: string;
    level?: string;
    coachId?: string;
  }) => {
    const [drills, setDrills] = useState<Drill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    useEffect(() => {
      setLoading(true);
      setError(null);

      // Initial load
      const loadDrills = async () => {
        try {
          const drillsData = await FirestoreService.getDrills(filters);
          setDrills(drillsData);
        } catch (err) {
          const firestoreError: FirestoreError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch drills',
            timestamp: new Date() as any
          };
          setError(firestoreError);
        } finally {
          setLoading(false);
        }
      };

      loadDrills();

      // Real-time listener
      const unsubscribe = FirestoreService.listenToDrills(
        filters,
        (drillsData) => {
          setDrills(drillsData);
          setLoading(false);
        },
        (err) => {
          const firestoreError: FirestoreError = {
            code: 'LISTENER_ERROR',
            message: err.message,
            timestamp: new Date() as any
          };
          setError(firestoreError);
          setLoading(false);
        }
      );

      const listenerKey = `drills-${JSON.stringify(filters)}`;
      listeners.current[listenerKey] = unsubscribe;

      return () => {
        if (listeners.current[listenerKey]) {
          listeners.current[listenerKey]();
          delete listeners.current[listenerKey];
        }
      };
    }, [filters.sport, filters.level, filters.coachId]);

    return {
      drills,
      loading,
      error
    };
  };

  // Reports Management
  const useReports = (filters: {
    playerId?: string;
    coachId?: string;
    type?: string;
  }) => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    useEffect(() => {
      setLoading(true);
      setError(null);

      // Initial load
      const loadReports = async () => {
        try {
          const reportsData = await FirestoreService.getReports(filters);
          setReports(reportsData);
        } catch (err) {
          const firestoreError: FirestoreError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch reports',
            timestamp: new Date() as any
          };
          setError(firestoreError);
        } finally {
          setLoading(false);
        }
      };

      loadReports();

      // Real-time listener
      const unsubscribe = FirestoreService.listenToReports(
        filters,
        (reportsData) => {
          setReports(reportsData);
          setLoading(false);
        },
        (err) => {
          const firestoreError: FirestoreError = {
            code: 'LISTENER_ERROR',
            message: err.message,
            timestamp: new Date() as any
          };
          setError(firestoreError);
          setLoading(false);
        }
      );

      const listenerKey = `reports-${JSON.stringify(filters)}`;
      listeners.current[listenerKey] = unsubscribe;

      return () => {
        if (listeners.current[listenerKey]) {
          listeners.current[listenerKey]();
          delete listeners.current[listenerKey];
        }
      };
    }, [filters.playerId, filters.coachId, filters.type]);

    return {
      reports,
      loading,
      error
    };
  };

  // Video Annotations Management
  const useVideoAnnotations = (videoId: string) => {
    const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    useEffect(() => {
      if (!videoId) {
        setAnnotations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Initial load
      const loadAnnotations = async () => {
        try {
          const annotationsData = await FirestoreService.getVideoAnnotations(videoId);
          setAnnotations(annotationsData);
        } catch (err) {
          const firestoreError: FirestoreError = {
            code: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch video annotations',
            timestamp: new Date() as any
          };
          setError(firestoreError);
        } finally {
          setLoading(false);
        }
      };

      loadAnnotations();

      // Real-time listener
      const unsubscribe = FirestoreService.listenToVideoAnnotations(
        videoId,
        (annotationsData) => {
          setAnnotations(annotationsData);
          setLoading(false);
        },
        (err) => {
          const firestoreError: FirestoreError = {
            code: 'LISTENER_ERROR',
            message: err.message,
            timestamp: new Date() as any
          };
          setError(firestoreError);
          setLoading(false);
        }
      );

      listeners.current[`annotations-${videoId}`] = unsubscribe;

      return () => {
        if (listeners.current[`annotations-${videoId}`]) {
          listeners.current[`annotations-${videoId}`]();
          delete listeners.current[`annotations-${videoId}`];
        }
      };
    }, [videoId]);

    const saveAnnotation = useCallback(async (annotation: Omit<VideoAnnotation, 'id' | 'createdAt'>) => {
      if (!videoId) return;

      try {
        await FirestoreService.saveVideoAnnotation(videoId, annotation);
      } catch (err) {
        const firestoreError: FirestoreError = {
          code: 'SAVE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to save annotation',
          timestamp: new Date() as any
        };
        setError(firestoreError);
        throw err;
      }
    }, [videoId]);

    const updateAnnotation = useCallback(async (annotationId: string, updates: Partial<VideoAnnotation>) => {
      if (!videoId) return;

      try {
        await FirestoreService.updateVideoAnnotation(videoId, annotationId, updates);
      } catch (err) {
        const firestoreError: FirestoreError = {
          code: 'UPDATE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to update annotation',
          timestamp: new Date() as any
        };
        setError(firestoreError);
        throw err;
      }
    }, [videoId]);

    const deleteAnnotation = useCallback(async (annotationId: string) => {
      if (!videoId) return;

      try {
        await FirestoreService.deleteVideoAnnotation(videoId, annotationId);
      } catch (err) {
        const firestoreError: FirestoreError = {
          code: 'DELETE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to delete annotation',
          timestamp: new Date() as any
        };
        setError(firestoreError);
        throw err;
      }
    }, [videoId]);

    return {
      annotations,
      loading,
      error,
      saveAnnotation,
      updateAnnotation,
      deleteAnnotation
    };
  };

  // Search Functionality
  const useSearch = () => {
    const [searchResults, setSearchResults] = useState<QueryResult<Player>>({
      data: [],
      loading: false,
      error: null,
      hasMore: false
    });

    const searchPlayers = useCallback(async (filters: SearchFilters) => {
      setSearchResults(prev => ({ ...prev, loading: true, error: null }));

      try {
        const results = await FirestoreService.searchPlayers(filters);
        setSearchResults({
          data: results,
          loading: false,
          error: null,
          hasMore: results.length === (filters.limit || 10)
        });
      } catch (err) {
        const firestoreError: FirestoreError = {
          code: 'SEARCH_ERROR',
          message: err instanceof Error ? err.message : 'Failed to search players',
          timestamp: new Date() as any
        };
        setSearchResults(prev => ({
          ...prev,
          loading: false,
          error: firestoreError
        }));
      }
    }, []);

    const searchDrills = useCallback(async (filters: {
      sport?: string;
      level?: string;
      tags?: string[];
      coachId?: string;
      limit?: number;
    }) => {
      try {
        const results = await FirestoreService.searchDrills(filters);
        return results;
      } catch (err) {
        const firestoreError: FirestoreError = {
          code: 'SEARCH_ERROR',
          message: err instanceof Error ? err.message : 'Failed to search drills',
          timestamp: new Date() as any
        };
        throw firestoreError;
      }
    }, []);

    return {
      searchResults,
      searchPlayers,
      searchDrills
    };
  };

  // Batch Operations
  const useBatchOperations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<FirestoreError | null>(null);

    const batchUpdatePlayers = useCallback(async (updates: Array<{ id: string; data: Partial<Player> }>) => {
      setLoading(true);
      setError(null);

      try {
        await FirestoreService.batchUpdatePlayerProfiles(updates);
      } catch (err) {
        const firestoreError: FirestoreError = {
          code: 'BATCH_UPDATE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to batch update players',
          timestamp: new Date() as any
        };
        setError(firestoreError);
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

    const batchCreateDrills = useCallback(async (drills: Array<Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>>) => {
      setLoading(true);
      setError(null);

      try {
        const drillIds = await FirestoreService.batchCreateDrills(drills);
        return drillIds;
      } catch (err) {
        const firestoreError: FirestoreError = {
          code: 'BATCH_CREATE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to batch create drills',
          timestamp: new Date() as any
        };
        setError(firestoreError);
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

    return {
      loading,
      error,
      batchUpdatePlayers,
      batchCreateDrills
    };
  };

  return {
    usePlayerProfile,
    useDrills,
    useReports,
    useVideoAnnotations,
    useSearch,
    useBatchOperations
  };
};

export default useFirestoreData; 