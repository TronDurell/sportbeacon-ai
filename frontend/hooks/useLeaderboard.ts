import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useLeaderboard() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const q = query(collection(db, 'players'), orderBy('winRate', 'desc'));
      const snapshot = await getDocs(q);
      setPlayers(snapshot.docs.map(doc => doc.data()));
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  return { players, loading };
} 