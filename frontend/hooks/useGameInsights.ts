import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useGameInsights(gameId: string) {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const q = query(collection(db, 'games'), where('gameId', '==', gameId));
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => doc.data());
        setInsights(results);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [gameId]);

  return { insights, loading, error };
} 