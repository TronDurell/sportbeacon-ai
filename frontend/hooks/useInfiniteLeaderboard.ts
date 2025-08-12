import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
}

export const useInfiniteLeaderboard = (category?: string) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newEntries = [
        { id: `${Date.now()}`, name: `Player ${Date.now()}`, score: Math.floor(Math.random() * 100), rank: leaderboard.length + 1 }
      ];
      setLeaderboard(prev => [...prev, ...newEntries]);
      setHasMore(leaderboard.length < 50); // Stop after 50 entries
      setLoading(false);
    }, 1000);
  };

  return {
    leaderboard,
    loading,
    hasMore,
    loadMore
  };
}; 