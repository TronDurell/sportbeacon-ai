import { useEffect, useState } from 'react';
import { RegionalLeague } from '../../lib/models/townRecTypes';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../../lib/firebase';

export function useFirestoreRegionalLeagues() {
  const [regionalLeagues, setRegionalLeagues] = useState<RegionalLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'regionalLeagues'), snap => {
      setRegionalLeagues(snap.docs.map(d => ({ id: d.id, ...d.data() } as RegionalLeague)));
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const createRegionalLeague = async (data: Omit<RegionalLeague, 'id'>) => {
    await addDoc(collection(db, 'regionalLeagues'), data);
  };
  const updateRegionalLeague = async (id: string, data: Partial<RegionalLeague>) => {
    await updateDoc(doc(db, 'regionalLeagues', id), data);
  };
  const deleteRegionalLeague = async (id: string) => {
    await deleteDoc(doc(db, 'regionalLeagues', id));
  };

  return { regionalLeagues, loading, error, createRegionalLeague, updateRegionalLeague, deleteRegionalLeague };
} 