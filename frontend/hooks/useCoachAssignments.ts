import { useState, useEffect } from 'react';
import { Coach, Team, League } from '../../lib/models/townRecTypes';
import { getCoachAssignments } from '../../lib/models/townRecUtils';

export function useCoachAssignments(coachId: string, teams: Team[], leagues: League[]) {
  const [assignments, setAssignments] = useState<{ teams: Team[]; leagues: League[] }>({ teams: [], leagues: [] });
  useEffect(() => {
    setAssignments(getCoachAssignments(coachId, teams, leagues));
  }, [coachId, teams, leagues]);
  return assignments;
} 