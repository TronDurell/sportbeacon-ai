import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/init';

export default function useTeamBuilder(teamId: string) {
  const [team, setTeam] = useState<any>(null);

  useEffect(() => {
    if (!teamId) return;

    const fetchTeam = async () => {
      const ref = doc(db, 'teams', teamId);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        setTeam(snapshot.data());
      }
    };

    fetchTeam();
  }, [teamId]);

  const createTeam = async (teamData: any) => {
    const ref = await addDoc(collection(db, 'teams'), teamData);
    setTeam({ id: ref.id, ...teamData });
  };

  const updateTeam = async (teamData: any) => {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, teamData);
    setTeam((prev: any) => ({ ...prev, ...teamData }));
  };

  return { team, createTeam, updateTeam };
} 