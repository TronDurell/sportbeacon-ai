import { useEffect, useState } from 'react';
import { Player } from '../../lib/models/townRecTypes';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../../lib/firebase';

export function useFirestoreRegistrations() {
  const [registrations, setRegistrations] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'players'), snap => {
      setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Player)));
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const createRegistration = async (data: Omit<Player, 'id'>) => {
    await addDoc(collection(db, 'players'), data);
  };
  const updateRegistration = async (id: string, data: Partial<Player>) => {
    await updateDoc(doc(db, 'players', id), data);
  };
  const deleteRegistration = async (id: string) => {
    await deleteDoc(doc(db, 'players', id));
  };

  return { registrations, loading, error, createRegistration, updateRegistration, deleteRegistration };
} 