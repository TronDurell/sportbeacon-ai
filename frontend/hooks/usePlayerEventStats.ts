import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function usePlayerEventStats(playerId: string) {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, 'events'), where('playerId', '==', playerId));
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => doc.data());
        setStats(results);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [playerId]);

  return { stats, loading, error };
} 