import { useEffect, useState } from 'react';
import { Facility } from '../../lib/models/townRecTypes';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../../lib/firebase';

export function useFirestoreFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'facilities'), snap => {
      setFacilities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Facility)));
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const createFacility = async (data: Omit<Facility, 'id'>) => {
    await addDoc(collection(db, 'facilities'), data);
  };
  const updateFacility = async (id: string, data: Partial<Facility>) => {
    await updateDoc(doc(db, 'facilities', id), data);
  };
  const deleteFacility = async (id: string) => {
    await deleteDoc(doc(db, 'facilities', id));
  };

  return { facilities, loading, error, createFacility, updateFacility, deleteFacility };
} 