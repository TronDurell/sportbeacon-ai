import { useState } from 'react';

export function useAdminTeams() {
  // TODO: Implement CRUD, manage invites, waitlist, etc.
  const [teams, setTeams] = useState<any[]>([]);
  return { teams, setTeams };
} 