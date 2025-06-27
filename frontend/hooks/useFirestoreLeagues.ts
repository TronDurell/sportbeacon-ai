import { useEffect, useState } from 'react';
import { League } from '../../lib/models/townRecTypes';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../../lib/firebase';

export function useFirestoreLeagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'leagues'), snap => {
      setLeagues(snap.docs.map(d => ({ id: d.id, ...d.data() } as League)));
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const createLeague = async (data: Omit<League, 'id'>) => {
    await addDoc(collection(db, 'leagues'), data);
  };
  const updateLeague = async (id: string, data: Partial<League>) => {
    await updateDoc(doc(db, 'leagues', id), data);
  };
  const deleteLeague = async (id: string) => {
    await deleteDoc(doc(db, 'leagues', id));
  };

  return { leagues, loading, error, createLeague, updateLeague, deleteLeague };
} 