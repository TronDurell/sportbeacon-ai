import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DrillLog } from '../../types/DrillLog';
import Sentry from '../lib/sentry';

export function useDrillLog(playerId: string) {
  const [drills, setDrills] = useState<DrillLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'drills'), where('playerId', '==', playerId));
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DrillLog));
      setDrills(results);
    } catch (err: any) {
      Sentry.captureException(err);
      setError(err.message || 'Failed to fetch drill logs');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (playerId) {
      fetchDrills();
    }
  }, [playerId, fetchDrills]);

  return { drills, loading, error };
} 