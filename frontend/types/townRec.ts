// Town-Rec Automation Suite Types

export interface PlayerRegistration {
  id: string;
  playerId: string;
  leagueId: string;
  guardianId: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  autoFlagged: boolean;
  flagReasons: string[];
  formData: {
    playerName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalInfo: {
      allergies: string[];
      conditions: string[];
      medications: string[];
    };
    experience: 'beginner' | 'intermediate' | 'advanced';
    preferredPosition?: string;
    specialRequests?: string;
  };
}

export interface WaitlistEntry {
  id: string;
  playerId: string;
  leagueId: string;
  guardianId: string;
  joinedAt: string;
  priority: number; // 1 = highest priority
  preferences: {
    preferredTeams: string[];
    preferredTimeSlots: string[];
    maxTravelDistance: number;
  };
  status: 'waiting' | 'invited' | 'accepted' | 'declined';
  invitedAt?: string;
  respondedAt?: string;
}

export interface SiblingGroup {
  id: string;
  guardianId: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  siblings: {
    playerId: string;
    playerName: string;
    dateOfBirth: string;
    leagueId: string;
    teamId?: string;
    registrationStatus: 'registered' | 'waitlisted' | 'pending';
  }[];
  placementStatus: 'pending' | 'placed' | 'manual_override';
  aiSuggestion?: {
    recommendedTeams: string[];
    reasoning: string;
    confidence: number;
  };
  manualOverride?: {
    overriddenBy: string;
    overriddenAt: string;
    reason: string;
    teamAssignments: Record<string, string>; // playerId -> teamId
  };
}

export interface AgeException {
  id: string;
  playerId: string;
  playerName: string;
  leagueId: string;
  leagueName: string;
  requestedBy: 'system' | 'coach' | 'parent';
  requestedByUserId?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reason: string;
  justification: string;
  supportingDocuments?: string[];
  cutoffDate: string;
  playerBirthDate: string;
  ageDifference: number; // in days
}

export interface IncidentReport {
  id: string;
  gameId: string;
  reportedBy: string;
  reportedAt: string;
  incidentType: 'injury' | 'misconduct' | 'equipment_failure' | 'weather' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  description: string;
  involvedPlayers: string[];
  witnesses: string[];
  location: string;
  weatherConditions?: string;
  actionsTaken: string[];
  followUpRequired: boolean;
  followUpNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  attachments?: string[];
}

export interface ScoreReport {
  id: string;
  gameId: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'verified' | 'disputed' | 'resolved';
  homeTeam: {
    teamId: string;
    teamName: string;
    score: number;
    scorer: string;
  };
  awayTeam: {
    teamId: string;
    teamName: string;
    score: number;
    scorer: string;
  };
  gameDate: string;
  gameTime: string;
  venue: string;
  disputedBy?: string;
  disputedAt?: string;
  disputeReason?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  comments: {
    userId: string;
    userName: string;
    comment: string;
    timestamp: string;
  }[];
}

export interface Referee {
  id: string;
  name: string;
  email: string;
  phone: string;
  certificationLevel: 'certified' | 'trainee' | 'volunteer';
  certifications: string[];
  experience: number; // years
  availability: {
    [dayOfWeek: string]: {
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
    };
  };
  preferredVenues: string[];
  maxGamesPerWeek: number;
  currentAssignments: string[];
  rating: number; // 1-5 stars
  totalGames: number;
  specialties: string[]; // age groups, sports, etc.
}

export interface RefereeAssignment {
  id: string;
  refereeId: string;
  gameId: string;
  role: 'head_referee' | 'assistant_referee' | 'scorekeeper';
  assignedAt: string;
  assignedBy: string;
  status: 'assigned' | 'confirmed' | 'declined' | 'completed';
  confirmedAt?: string;
  declinedReason?: string;
  performanceRating?: number;
  performanceNotes?: string;
}

export interface League {
  id: string;
  name: string;
  sport: string;
  season: string;
  ageGroup: string;
  skillLevel: 'recreational' | 'competitive' | 'elite';
  status: 'registration_open' | 'registration_closed' | 'in_progress' | 'completed';
  registrationDeadline: string;
  seasonStartDate: string;
  seasonEndDate: string;
  maxTeams: number;
  maxPlayersPerTeam: number;
  minPlayersPerTeam: number;
  currentTeams: number;
  currentPlayers: number;
  waitlistCount: number;
  venue: string;
  gameSchedule: {
    dayOfWeek: string;
    timeSlots: string[];
  }[];
  coaches: string[];
  referees: string[];
  rules: string[];
  fees: {
    amount: number;
    currency: string;
    dueDate: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  leagueId: string;
  name: string;
  coachId: string;
  coachName: string;
  players: string[];
  maxPlayers: number;
  currentPlayers: number;
  status: 'forming' | 'active' | 'inactive';
  practiceSchedule: {
    dayOfWeek: string;
    timeSlot: string;
    venue: string;
  }[];
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesTied: number;
  pointsFor: number;
  pointsAgainst: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  playerId: string;
  guardianId: string;
  leagueId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'cash';
  stripePaymentIntentId?: string;
  stripeRefundId?: string;
  paidAt?: string;
  refundedAt?: string;
  refundedBy?: string;
  refundReason?: string;
  description: string;
  receiptUrl?: string;
  metadata: Record<string, any>;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  phone: string;
  certifications: {
    type: string;
    level: string;
    issuedDate: string;
    expiryDate?: string;
    status: 'valid' | 'expired' | 'pending';
  }[];
  backgroundCheck: {
    status: 'pending' | 'passed' | 'failed' | 'expired';
    completedAt?: string;
    expiresAt?: string;
  };
  experience: number; // years
  teams: string[];
  availability: {
    [dayOfWeek: string]: {
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
    };
  };
  specialties: string[];
  rating: number;
  totalTeams: number;
  activeTeams: number;
}

export interface GameDaySummary {
  id: string;
  date: string;
  leagueId: string;
  totalGames: number;
  completedGames: number;
  cancelledGames: number;
  totalPlayers: number;
  totalSpectators: number;
  incidents: number;
  weatherConditions: string;
  venueIssues: string[];
  refereeAssignments: RefereeAssignment[];
  highlights: {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    finalScore: string;
    notableEvents: string[];
  }[];
  generatedAt: string;
  generatedBy: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'league_admin' | 'referee_coordinator' | 'registration_admin';
  permissions: string[];
  assignedLeagues: string[];
  lastLogin: string;
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'registration_review' | 'age_exception' | 'incident_report' | 'payment_issue' | 'referee_assignment';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'actioned';
  createdAt: string;
  readAt?: string;
  actionedAt?: string;
  actionedBy?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, { old: any; new: any }>;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AdminDashboardStats {
  totalLeagues: number;
  activeLeagues: number;
  totalPlayers: number;
  pendingRegistrations: number;
  waitlistCount: number;
  pendingAgeExceptions: number;
  pendingIncidentReports: number;
  upcomingGames: number;
  totalReferees: number;
  availableReferees: number;
  totalRevenue: number;
  pendingPayments: number;
}

export interface WaitlistAutoFillResult {
  success: boolean;
  filledPositions: number;
  totalPositions: number;
  assignments: {
    playerId: string;
    teamId: string;
    position: string;
  }[];
  errors: string[];
}

export interface AIRecommendation {
  type: 'team_placement' | 'referee_assignment' | 'age_exception' | 'incident_resolution';
  confidence: number;
  reasoning: string;
  recommendations: any[];
  alternatives: any[];
} 