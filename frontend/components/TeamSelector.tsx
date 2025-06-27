import React, { useState, useEffect } from 'react';
import { Select, MenuItem, Typography } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TeamSelector({ onSelect }: { onSelect: (teamId: string) => void }) {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const snapshot = await getDocs(collection(db, 'teams'));
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchTeams();
  }, []);

  if (loading) return <Typography>Loading teams...</Typography>;

  return (
    <div className="w-full" role="region" aria-label="Team selector" tabIndex={0}>
      <Select onChange={(e) => onSelect(e.target.value)}>
        {teams.map((team) => (
          <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
        ))}
      </Select>
    </div>
  );
} 