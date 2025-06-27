// TypeScript types for Town Rec
export interface Town {
  id: string;
  name: string;
  state: string;
  zones: string[];
  facilities: string[];
  leagues: string[];
}

export interface Zone {
  id: string;
  name: string;
  townId: string;
  facilities: string[];
}

export type FacilityType = 'field' | 'gym' | 'pool' | 'other';
export interface Facility {
  id: string;
  name: string;
  address: string;
  zoneId: string;
  type: FacilityType;
  capacity: number;
  schedule: string[];
}

export interface League {
  id: string;
  name: string;
  season: string;
  townId: string;
  teams: string[];
  schedule: string[];
  registrationOpen: boolean;
  paymentTier: string;
}

export interface Player {
  id: string;
  name: string;
  email: string;
  leagues: string[];
  teams: string[];
  resident: boolean;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  leagues: string[];
  teams: string[];
  backgroundCheckStatus: 'pending' | 'approved' | 'rejected';
}

export interface Team {
  id: string;
  name: string;
  leagueId: string;
  players: string[];
  coaches: string[];
}

export interface Game {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  facilityId: string;
  date: string;
  time: string;
  score?: { home: number; away: number };
}

export interface Practice {
  id: string;
  leagueId: string;
  teamId: string;
  facilityId: string;
  date: string;
  time: string;
}

export interface TimeSlot {
  id: string;
  facilityId: string;
  start: Date;
  end: Date;
  reserved: boolean;
  reservedFor: string | null; // gameId or practiceId
}

export interface Payment {
  id: string;
  playerId: string;
  leagueId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  timestamp: Date;
  details: Record<string, any>;
}

export interface RegionalLeague {
  id: string;
  name: string;
  sport: string;
  ageRange: string;
  adminTowns: string[];
  teamLimit: number;
  sharedSchedule: boolean;
}

export interface School {
  id: string;
  name: string;
  district: string;
  contact: string;
  teams: string[];
  eligibility: Record<string, any>;
  coachAssignments: Record<string, any>;
} 