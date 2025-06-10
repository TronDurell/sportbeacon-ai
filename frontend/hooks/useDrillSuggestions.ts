import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DrillSuggestion {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  duration: number;
}

export const useDrillSuggestions = (
  playerId: string,
  enabled: boolean = true
) => {
  const [suggestions, setSuggestions] = useState<DrillSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!playerId || !enabled) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'drillSuggestions'),
          where('playerId', '==', playerId)
        );
        const snapshot = await getDocs(q);
        const drills: DrillSuggestion[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<DrillSuggestion, 'id'>),
        }));
        setSuggestions(drills);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [playerId, enabled]);

  return { suggestions, loading, error };
};
