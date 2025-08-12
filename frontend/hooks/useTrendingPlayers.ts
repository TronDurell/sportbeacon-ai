import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useTrendingPlayers() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    const fetchTrendingPlayers = async () => {
      try {
        const q = query(collection(db, 'players'), where('trend', '==', 'upward'));
        const querySnapshot = await getDocs(q);
        const playersData = querySnapshot.docs.map(doc => doc.data());
        setPlayers(playersData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingPlayers();
  }, []);

  return { players, loading, error };
} 