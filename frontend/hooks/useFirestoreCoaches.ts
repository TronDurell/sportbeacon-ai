import { useEffect, useState } from 'react';
import { Coach } from '../../lib/models/townRecTypes';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../../lib/firebase';

export function useFirestoreCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coaches'), snap => {
      setCoaches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coach)));
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const createCoach = async (data: Omit<Coach, 'id'>) => {
    await addDoc(collection(db, 'coaches'), data);
  };
  const updateCoach = async (id: string, data: Partial<Coach>) => {
    await updateDoc(doc(db, 'coaches', id), data);
  };
  const deleteCoach = async (id: string) => {
    await deleteDoc(doc(db, 'coaches', id));
  };

  return { coaches, loading, error, createCoach, updateCoach, deleteCoach };
} 