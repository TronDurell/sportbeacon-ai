import { useState, useEffect } from 'react';
import { League, Game } from '../../lib/models/townRecTypes';
import { getLeagueSchedule } from '../../lib/models/townRecUtils';

export function useLeagueSchedule(league: League, games: Game[]) {
  const [schedule, setSchedule] = useState<Game[]>([]);
  useEffect(() => {
    setSchedule(getLeagueSchedule(league, games));
  }, [league, games]);
  return schedule;
} 