import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useDrillLog(playerId: string) {
  const [drills, setDrills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrills = async () => {
      try {
        const q = query(collection(db, 'drills'), where('playerId', '==', playerId));
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => doc.data());
        setDrills(results);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDrills();
  }, [playerId]);

  return { drills, loading, error };
} 