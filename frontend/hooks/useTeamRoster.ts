import { useState, useEffect } from 'react';
import { Team, Player } from '../../lib/models/townRecTypes';
import { getTeamRoster } from '../../lib/models/townRecUtils';

export function useTeamRoster(team: Team, players: Player[]) {
  const [roster, setRoster] = useState<Player[]>([]);
  useEffect(() => {
    setRoster(getTeamRoster(team, players));
  }, [team, players]);
  return roster;
} 