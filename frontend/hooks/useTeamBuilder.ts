import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure this path is correct

export default function useTeamBuilder(teamId) {
  const [team, setTeam] = useState(null);

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

  const createTeam = async (teamData) => {
    const ref = await addDoc(collection(db, 'teams'), teamData);
    setTeam({ id: ref.id, ...teamData });
  };

  const updateTeam = async (teamData) => {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, teamData);
    setTeam((prev) => ({ ...prev, ...teamData }));
  };

  return { team, createTeam, updateTeam };
} 