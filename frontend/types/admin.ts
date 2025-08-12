export interface IncidentReport {
  id: string;
  type: 'incident' | 'score';
  title: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface ScoreReport {
  id: string;
  gameId: string;
  homeScore: number;
  awayScore: number;
  status: 'pending' | 'confirmed' | 'disputed';
  submittedBy: string;
  submittedAt: string;
}

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'confirmed' | 'disputed' | 'escalated' | 'under_review';

export interface League {
  id: string;
  name: string;
  description: string;
  season: string;
  status: 'active' | 'inactive' | 'completed';
  teams: Team[];
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  leagueId: string;
  players: Player[];
  coach: string;
  status: 'active' | 'inactive';
}

export interface Player {
  id: string;
  name: string;
  age: number;
  position: string;
  teamId: string;
  status: 'active' | 'inactive';
}

export interface Referee {
  id: string;
  name: string;
  email: string;
  phone: string;
  certifications: string[];
  availability: Availability;
  rating: number;
}

export interface Availability {
  monday: TimeSlots;
  tuesday: TimeSlots;
  wednesday: TimeSlots;
  thursday: TimeSlots;
  friday: TimeSlots;
  saturday: TimeSlots;
  sunday: TimeSlots;
}

export interface TimeSlots {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

export interface GameSchedule {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  location: string;
  referees: RefereeAssignment[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface RefereeAssignment {
  id: string;
  gameId: string;
  refereeId: string;
  role: 'Center' | 'Assistant';
  assignedDate: string;
  status: 'assigned' | 'confirmed' | 'completed';
}

export interface Payment {
  id: string;
  playerId: string;
  amount: number;
  type: 'registration' | 'tournament' | 'equipment';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  date: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: 'Player injury - unable to participate' | 'Schedule conflict' | 'Family emergency' | 'Dissatisfaction with program' | 'Duplicate payment';
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'failed';
  processedBy: string;
}

export interface SiblingGroup {
  id: string;
  siblings: Player[];
  suggestedTeams: TeamSuggestion[];
  status: 'pending' | 'placed' | 'manual_review';
  createdAt: string;
}

export interface TeamSuggestion {
  teamName: 'Red Dragons' | 'Blue Eagles' | 'Green Lions' | 'Yellow Tigers';
  confidence: number;
} 