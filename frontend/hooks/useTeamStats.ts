import { useState, useEffect } from 'react';

export default function useTeamStats(teamId: string) {
  const [stats, setStats] = useState({});
  useEffect(() => {
    if (!teamId) return;
    // Firestore query to aggregate metrics from players
  }, [teamId]);
  return stats;
} 