import { useState } from 'react';

export function useAdminLeagues() {
  // TODO: Implement CRUD, assign facilities/zones, etc.
  const [leagues, setLeagues] = useState<any[]>([]);
  return { leagues, setLeagues };
} 