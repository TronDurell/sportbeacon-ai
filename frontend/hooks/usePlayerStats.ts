import { useState, useEffect } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function usePlayerStats(venueId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const ref = doc(db, 'venues', venueId);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          setData(snapshot.data());
        } else {
          throw new Error('No data found');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [venueId]);

  return { data, loading, error };
} 