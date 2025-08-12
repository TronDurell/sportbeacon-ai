import { useState, useEffect, useCallback, useRef } from 'react';
import { coachLogsService } from '../services/coachLogsService';
import type { CoachLogDocument, FirebaseError } from '../firebase/types';

// Hook return types
interface UseCoachLogsReturn {
  logs: CoachLogDocument[];
  loading: boolean;
  error: FirebaseError | null;
  createLog: (logData: Omit<CoachLogDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => Promise<string>;
  updateLog: (logId: string, updates: Partial<Omit<CoachLogDocument, 'id' | 'createdAt' | 'createdBy'>>) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
  createDrillAssignment: (assignmentData: {
    playerId: string;
    drillId: string;
    drillName: string;
    duration: number;
    notes?: string;
  }) => Promise<string>;
  completeDrill: (logId: string, completionData: {
    performance: number;
    feedback: string;
    aiFeedback?: {
      suggestions: string[];
      improvements: string[];
      nextSteps: string[];
    };
  }) => Promise<void>;
  updateAIFeedback: (logId: string, aiFeedback: {
    suggestions: string[];
    improvements: string[];
    nextSteps: string[];
  }) => Promise<void>;
  refetch: () => Promise<void>;
}

interface UseCoachLogReturn {
  log: CoachLogDocument | null;
  loading: boolean;
  error: FirebaseError | null;
  updateLog: (updates: Partial<Omit<CoachLogDocument, 'id' | 'createdAt' | 'createdBy'>>) => Promise<void>;
  deleteLog: () => Promise<void>;
  completeDrill: (completionData: {
    performance: number;
    feedback: string;
    aiFeedback?: {
      suggestions: string[];
      improvements: string[];
      nextSteps: string[];
    };
  }) => Promise<void>;
  updateAIFeedback: (aiFeedback: {
    suggestions: string[];
    improvements: string[];
    nextSteps: string[];
  }) => Promise<void>;
  refetch: () => Promise<void>;
}

interface UsePlayerAnalyticsReturn {
  analytics: {
    totalDrills: number;
    averagePerformance: number;
    totalDuration: number;
    recentTrend: 'improving' | 'declining' | 'stable';
    topDrills: Array<{ drillName: string; performance: number; }>;
  } | null;
  loading: boolean;
  error: FirebaseError | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing coach logs with real-time updates
 */
export const useCoachLogs = (userId: string | null, filters?: {
  playerId?: string;
  drillId?: string;
  status?: 'completed' | 'in_progress' | 'cancelled';
  limit?: number;
}): UseCoachLogsReturn => {
  const [logs, setLogs] = useState<CoachLogDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirebaseError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch logs data
  const fetchLogs = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const logsData = await coachLogsService.getUserLogs(userId, filters);
      setLogs(logsData);
    } catch (err) {
      setError(err as FirebaseError);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [userId, filters]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = coachLogsService.subscribeToUserLogs(userId, filters || {}, (logsData) => {
      setLogs(logsData);
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
  }, [userId, filters]);

  // Create log
  const createLog = useCallback(async (logData: Omit<CoachLogDocument, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => {
    if (!userId) {
      throw new Error('No user ID provided');
    }

    try {
      setError(null);
      const newLogId = await coachLogsService.createLog(userId, logData);
      return newLogId;
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [userId]);

  // Update log
  const updateLog = useCallback(async (logId: string, updates: Partial<Omit<CoachLogDocument, 'id' | 'createdAt' | 'createdBy'>>) => {
    if (!userId) {
      throw new Error('No user ID provided');
    }

    try {
      setError(null);
      await coachLogsService.updateLog(userId, logId, updates);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [userId]);

  // Delete log
  const deleteLog = useCallback(async (logId: string) => {
    if (!userId) {
      throw new Error('No user ID provided');
    }

    try {
      setError(null);
      await coachLogsService.deleteLog(userId, logId);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [userId]);

  // Create drill assignment
  const createDrillAssignment = useCallback(async (assignmentData: {
    playerId: string;
    drillId: string;
    drillName: string;
    duration: number;
    notes?: string;
  }) => {
    if (!userId) {
      throw new Error('No user ID provided');
    }

    try {
      setError(null);
      const newLogId = await coachLogsService.createDrillAssignment(userId, assignmentData);
      return newLogId;
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [userId]);

  // Complete drill
  const completeDrill = useCallback(async (logId: string, completionData: {
    performance: number;
    feedback: string;
    aiFeedback?: {
      suggestions: string[];
      improvements: string[];
      nextSteps: string[];
    };
  }) => {
    if (!userId) {
      throw new Error('No user ID provided');
    }

    try {
      setError(null);
      await coachLogsService.completeDrill(userId, logId, completionData);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [userId]);

  // Update AI feedback
  const updateAIFeedback = useCallback(async (logId: string, aiFeedback: {
    suggestions: string[];
    improvements: string[];
    nextSteps: string[];
  }) => {
    if (!userId) {
      throw new Error('No user ID provided');
    }

    try {
      setError(null);
      await coachLogsService.updateAIFeedback(userId, logId, aiFeedback);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [userId]);

  // Refetch logs
  const refetch = useCallback(async () => {
    await fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    createLog,
    updateLog,
    deleteLog,
    createDrillAssignment,
    completeDrill,
    updateAIFeedback,
    refetch
  };
};

/**
 * Hook for managing a single coach log with real-time updates
 */
export const useCoachLog = (userId: string | null, logId: string | null): UseCoachLogReturn => {
  const [log, setLog] = useState<CoachLogDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirebaseError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch log data
  const fetchLog = useCallback(async () => {
    if (!userId || !logId) {
      setLog(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const logData = await coachLogsService.getLogById(userId, logId);
      setLog(logData);
    } catch (err) {
      setError(err as FirebaseError);
      setLog(null);
    } finally {
      setLoading(false);
    }
  }, [userId, logId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId || !logId) {
      setLog(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = coachLogsService.subscribeToLog(userId, logId, (logData) => {
      setLog(logData);
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
  }, [userId, logId]);

  // Update log
  const updateLog = useCallback(async (updates: Partial<Omit<CoachLogDocument, 'id' | 'createdAt' | 'createdBy'>>) => {
    if (!userId || !logId) {
      throw new Error('No user ID or log ID provided');
    }

    try {
      setError(null);
      await coachLogsService.updateLog(userId, logId, updates);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [userId, logId]);

  // Delete log
  const deleteLog = useCallback(async () => {
    if (!userId || !logId) {
      throw new Error('No user ID or log ID provided');
    }

    try {
      setError(null);
      await coachLogsService.deleteLog(userId, logId);
      setLog(null);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [userId, logId]);

  // Complete drill
  const completeDrill = useCallback(async (completionData: {
    performance: number;
    feedback: string;
    aiFeedback?: {
      suggestions: string[];
      improvements: string[];
      nextSteps: string[];
    };
  }) => {
    if (!userId || !logId) {
      throw new Error('No user ID or log ID provided');
    }

    try {
      setError(null);
      await coachLogsService.completeDrill(userId, logId, completionData);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [userId, logId]);

  // Update AI feedback
  const updateAIFeedback = useCallback(async (aiFeedback: {
    suggestions: string[];
    improvements: string[];
    nextSteps: string[];
  }) => {
    if (!userId || !logId) {
      throw new Error('No user ID or log ID provided');
    }

    try {
      setError(null);
      await coachLogsService.updateAIFeedback(userId, logId, aiFeedback);
    } catch (err) {
      setError(err as FirebaseError);
      throw err;
    }
  }, [userId, logId]);

  // Refetch log
  const refetch = useCallback(async () => {
    await fetchLog();
  }, [fetchLog]);

  return {
    log,
    loading,
    error,
    updateLog,
    deleteLog,
    completeDrill,
    updateAIFeedback,
    refetch
  };
};

/**
 * Hook for managing player analytics
 */
export const usePlayerAnalytics = (userId: string | null, playerId: string | null): UsePlayerAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<{
    totalDrills: number;
    averagePerformance: number;
    totalDuration: number;
    recentTrend: 'improving' | 'declining' | 'stable';
    topDrills: Array<{ drillName: string; performance: number; }>;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirebaseError | null>(null);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!userId || !playerId) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const analyticsData = await coachLogsService.getPlayerAnalytics(userId, playerId);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err as FirebaseError);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [userId, playerId]);

  // Fetch analytics when dependencies change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Refetch analytics
  const refetch = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for managing drill history
 */
export const useDrillHistory = (userId: string | null, playerId: string | null, limit?: number) => {
  const [history, setHistory] = useState<CoachLogDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirebaseError | null>(null);

  useEffect(() => {
    if (!userId || !playerId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const historyData = await coachLogsService.getDrillHistory(userId, playerId, limit);
        setHistory(historyData);
      } catch (err) {
        setError(err as FirebaseError);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId, playerId, limit]);

  return { history, loading, error };
}; 