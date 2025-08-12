// Comprehensive League Types to replace TodoFixMe
export interface League {
  id: string;
  name: string;
  description?: string;
  sport: Sport;
  ageGroup: AgeGroup;
  season: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxTeams: number;
  maxPlayersPerTeam: number;
  minPlayersPerTeam: number;
  status: LeagueStatus;
  rules: LeagueRules;
  fees: LeagueFees;
  location: LeagueLocation;
  schedule: LeagueSchedule;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export type Sport = 'soccer' | 'basketball' | 'baseball' | 'football' | 'hockey' | 'tennis' | 'volleyball' | 'lacrosse';

export type AgeGroup = 'u6' | 'u8' | 'u10' | 'u12' | 'u14' | 'u16' | 'u18' | 'adult';

export type LeagueStatus = 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';

export interface LeagueRules {
  gameDuration: number; // minutes
  maxSubstitutions: number;
  tieBreaker: 'penalty_shootout' | 'overtime' | 'draw';
  equipmentRequired: string[];
  specialRules: string[];
}

export interface LeagueFees {
  registrationFee: number;
  lateFee?: number;
  refundPolicy: RefundPolicy;
  paymentMethods: PaymentMethod[];
}

export interface RefundPolicy {
  fullRefundDeadline: Date;
  partialRefundDeadline: Date;
  noRefundAfter: Date;
  partialRefundPercentage: number;
}

export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'cash';

export interface LeagueLocation {
  primaryVenue: Venue;
  backupVenues: Venue[];
  practiceVenues: Venue[];
}

export interface Venue {
  id: string;
  name: string;
  address: Address;
  facilities: Facility[];
  capacity: number;
  surfaceType: SurfaceType;
  lighting: boolean;
  parking: boolean;
  accessibility: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Facility {
  type: 'field' | 'court' | 'track' | 'pool' | 'gym';
  name: string;
  capacity: number;
  surfaceType: SurfaceType;
  lighting: boolean;
}

export type SurfaceType = 'grass' | 'turf' | 'hardwood' | 'concrete' | 'clay' | 'dirt';

export interface LeagueSchedule {
  practiceDays: string[];
  gameDays: string[];
  practiceTimes: TimeSlot[];
  gameTimes: TimeSlot[];
  holidays: Date[];
  rainOutPolicy: RainOutPolicy;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface RainOutPolicy {
  notificationTime: number; // hours before game
  reschedulePolicy: 'same_week' | 'next_week' | 'end_of_season';
  refundPolicy: 'full' | 'partial' | 'none';
}

export interface Team {
  id: string;
  leagueId: string;
  name: string;
  coachId: string;
  assistantCoachIds: string[];
  players: TeamPlayer[];
  captainId?: string;
  uniformColors: UniformColors;
  practiceSchedule: PracticeSchedule;
  stats: TeamStats;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TeamPlayer {
  playerId: string;
  jerseyNumber: number;
  position: string;
  isCaptain: boolean;
  joinDate: Date;
  isActive: boolean;
}

export interface UniformColors {
  home: {
    primary: string;
    secondary: string;
  };
  away: {
    primary: string;
    secondary: string;
  };
}

export interface PracticeSchedule {
  days: string[];
  timeSlots: TimeSlot[];
  venueId: string;
}

export interface TeamStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  rank: number;
}

export interface Game {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId: string;
  scheduledDate: Date;
  actualDate?: Date;
  status: GameStatus;
  score?: GameScore;
  refereeId?: string;
  notes?: string;
  weather?: WeatherInfo;
  createdAt: Date;
  updatedAt: Date;
}

export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';

export interface GameScore {
  homeTeam: number;
  awayTeam: number;
  periods: PeriodScore[];
  finalScore: boolean;
}

export interface PeriodScore {
  period: number;
  homeTeam: number;
  awayTeam: number;
}

export interface WeatherInfo {
  temperature: number;
  conditions: string;
  windSpeed: number;
  humidity: number;
  visibility: number;
}

// API Request/Response Types
export interface CreateLeagueRequest {
  name: string;
  description?: string;
  sport: Sport;
  ageGroup: AgeGroup;
  season: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  maxPlayersPerTeam: number;
  minPlayersPerTeam: number;
  rules: LeagueRules;
  fees: LeagueFees;
  location: LeagueLocation;
  schedule: LeagueSchedule;
}

export interface UpdateLeagueRequest {
  name?: string;
  description?: string;
  status?: LeagueStatus;
  rules?: Partial<LeagueRules>;
  fees?: Partial<LeagueFees>;
  location?: Partial<LeagueLocation>;
  schedule?: Partial<LeagueSchedule>;
  isActive?: boolean;
}

export interface LeagueSearchFilters {
  sport?: Sport;
  ageGroup?: AgeGroup;
  status?: LeagueStatus;
  season?: string;
  location?: {
    city?: string;
    state?: string;
  };
  registrationOpen?: boolean;
  isActive?: boolean;
}

export interface LeagueListResponse {
  leagues: League[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Validation Functions
export const validateLeague = (league: unknown): league is League => {
  if (!league || typeof league !== 'object') return false;
  const l = league as any;
  
  return (
    typeof l.id === 'string' &&
    typeof l.name === 'string' &&
    ['soccer', 'basketball', 'baseball', 'football', 'hockey', 'tennis', 'volleyball', 'lacrosse'].includes(l.sport) &&
    ['u6', 'u8', 'u10', 'u12', 'u14', 'u16', 'u18', 'adult'].includes(l.ageGroup) &&
    typeof l.season === 'string' &&
    l.startDate instanceof Date &&
    l.endDate instanceof Date &&
    l.registrationDeadline instanceof Date &&
    typeof l.maxTeams === 'number' &&
    typeof l.maxPlayersPerTeam === 'number' &&
    typeof l.minPlayersPerTeam === 'number' &&
    ['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'].includes(l.status) &&
    typeof l.createdBy === 'string' &&
    l.createdAt instanceof Date &&
    l.updatedAt instanceof Date &&
    typeof l.isActive === 'boolean'
  );
};

export const validateCreateLeagueRequest = (data: unknown): data is CreateLeagueRequest => {
  if (!data || typeof data !== 'object') return false;
  const d = data as any;
  
  return (
    typeof d.name === 'string' &&
    ['soccer', 'basketball', 'baseball', 'football', 'hockey', 'tennis', 'volleyball', 'lacrosse'].includes(d.sport) &&
    ['u6', 'u8', 'u10', 'u12', 'u14', 'u16', 'u18', 'adult'].includes(d.ageGroup) &&
    typeof d.season === 'string' &&
    typeof d.startDate === 'string' &&
    typeof d.endDate === 'string' &&
    typeof d.registrationDeadline === 'string' &&
    typeof d.maxTeams === 'number' &&
    typeof d.maxPlayersPerTeam === 'number' &&
    typeof d.minPlayersPerTeam === 'number'
  );
};

export const validateTeam = (team: unknown): team is Team => {
  if (!team || typeof team !== 'object') return false;
  const t = team as any;
  
  return (
    typeof t.id === 'string' &&
    typeof t.leagueId === 'string' &&
    typeof t.name === 'string' &&
    typeof t.coachId === 'string' &&
    Array.isArray(t.players) &&
    t.createdAt instanceof Date &&
    t.updatedAt instanceof Date &&
    typeof t.isActive === 'boolean'
  );
};

export const validateGame = (game: unknown): game is Game => {
  if (!game || typeof game !== 'object') return false;
  const g = game as any;
  
  return (
    typeof g.id === 'string' &&
    typeof g.leagueId === 'string' &&
    typeof g.homeTeamId === 'string' &&
    typeof g.awayTeamId === 'string' &&
    typeof g.venueId === 'string' &&
    g.scheduledDate instanceof Date &&
    ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'].includes(g.status) &&
    g.createdAt instanceof Date &&
    g.updatedAt instanceof Date
  );
}; 