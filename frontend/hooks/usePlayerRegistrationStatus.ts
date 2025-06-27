import { useState, useEffect } from 'react';
import { Player, League, Payment } from '../../lib/models/townRecTypes';
import { getPlayerRegistrationStatus } from '../../lib/models/townRecUtils';

export function usePlayerRegistrationStatus(playerId: string, leagues: League[], payments: Payment[]) {
  const [status, setStatus] = useState<{ league: League; paid: boolean }[]>([]);
  useEffect(() => {
    setStatus(getPlayerRegistrationStatus(playerId, leagues, payments));
  }, [playerId, leagues, payments]);
  return status;
} 