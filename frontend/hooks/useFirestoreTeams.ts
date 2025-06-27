import { useEffect, useState } from 'react';
import { Team } from '../../lib/models/townRecTypes';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../../lib/firebase';

export function useFirestoreTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'teams'), snap => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const createTeam = async (data: Omit<Team, 'id'>) => {
    await addDoc(collection(db, 'teams'), data);
  };
  const updateTeam = async (id: string, data: Partial<Team>) => {
    await updateDoc(doc(db, 'teams', id), data);
  };
  const deleteTeam = async (id: string) => {
    await deleteDoc(doc(db, 'teams', id));
  };

  return { teams, loading, error, createTeam, updateTeam, deleteTeam };
} 