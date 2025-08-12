import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
}

export const useLeaderboard = (category?: string) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLeaderboard([
        { id: '1', name: 'Player 1', score: 100, rank: 1 },
        { id: '2', name: 'Player 2', score: 95, rank: 2 },
        { id: '3', name: 'Player 3', score: 90, rank: 3 }
      ]);
      setLoading(false);
    }, 1000);
  }, [category]);

  return {
    leaderboard,
    loading
  };
}; 