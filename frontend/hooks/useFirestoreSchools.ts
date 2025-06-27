import { useEffect, useState } from 'react';
import { School } from '../../lib/models/townRecTypes';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../../lib/firebase';

export function useFirestoreSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'schools'), snap => {
      setSchools(snap.docs.map(d => ({ id: d.id, ...d.data() } as School)));
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const createSchool = async (data: Omit<School, 'id'>) => {
    await addDoc(collection(db, 'schools'), data);
  };
  const updateSchool = async (id: string, data: Partial<School>) => {
    await updateDoc(doc(db, 'schools', id), data);
  };
  const deleteSchool = async (id: string) => {
    await deleteDoc(doc(db, 'schools', id));
  };

  return { schools, loading, error, createSchool, updateSchool, deleteSchool };
} 