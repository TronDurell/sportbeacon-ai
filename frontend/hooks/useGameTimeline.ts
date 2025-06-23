import { useState, useEffect } from 'react';

export default function useGameTimeline(gameId: string) {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    if (!gameId) return;
    // Firestore query to fetch from collection 'game_events' ordered by time, filter by gameId
  }, [gameId]);
  return events;
} 