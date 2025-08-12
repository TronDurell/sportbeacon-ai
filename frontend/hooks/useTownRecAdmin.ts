import { useState, useEffect, useCallback } from 'react';
import {
  PlayerRegistration,
  WaitlistEntry,
  SiblingGroup,
  AgeException,
  IncidentReport,
  ScoreReport,
  Referee,
  RefereeAssignment,
  League,
  Team,
  Payment,
  Coach,
  GameDaySummary,
  AdminDashboardStats,
  WaitlistAutoFillResult,
  AIRecommendation,
  PaginatedResponse,
} from '../types/townRec';

// Mock data for development
const MOCK_DATA = {
  playerRegistrations: [
    {
      id: '1',
      playerId: 'player1',
      leagueId: 'league1',
      guardianId: 'guardian1',
      status: 'pending' as const,
      submittedAt: '2024-01-15T10:00:00Z',
      autoFlagged: true,
      flagReasons: ['Age exception required', 'Medical conditions noted'],
      formData: {
        playerName: 'John Smith',
        dateOfBirth: '2015-03-15',
        gender: 'male' as const,
        emergencyContact: {
          name: 'Jane Smith',
          phone: '555-0123',
          relationship: 'Mother',
        },
        medicalInfo: {
          allergies: ['Peanuts'],
          conditions: ['Asthma'],
          medications: ['Inhaler'],
        },
        experience: 'beginner' as const,
        preferredPosition: 'Forward',
        specialRequests: 'Needs to be on same team as sibling',
      },
    },
    // Add more mock registrations...
  ],
  waitlistEntries: [
    {
      id: '1',
      playerId: 'player2',
      leagueId: 'league1',
      guardianId: 'guardian2',
      joinedAt: '2024-01-10T14:30:00Z',
      priority: 1,
      preferences: {
        preferredTeams: ['team1', 'team2'],
        preferredTimeSlots: ['Saturday 9:00 AM', 'Saturday 10:30 AM'],
        maxTravelDistance: 10,
      },
      status: 'waiting' as const,
    },
  ],
  siblingGroups: [
    {
      id: '1',
      guardianId: 'guardian1',
      guardianName: 'Jane Smith',
      guardianEmail: 'jane.smith@email.com',
      guardianPhone: '555-0123',
      siblings: [
        {
          playerId: 'player1',
          playerName: 'John Smith',
          dateOfBirth: '2015-03-15',
          leagueId: 'league1',
          registrationStatus: 'registered' as const,
        },
        {
          playerId: 'player3',
          playerName: 'Sarah Smith',
          dateOfBirth: '2017-06-22',
          leagueId: 'league1',
          registrationStatus: 'waitlisted' as const,
        },
      ],
      placementStatus: 'pending' as const,
      aiSuggestion: {
        recommendedTeams: ['team1', 'team3'],
        reasoning: 'Both siblings have similar skill levels and availability',
        confidence: 0.85,
      },
    },
  ],
  ageExceptions: [
    {
      id: '1',
      playerId: 'player4',
      playerName: 'Mike Johnson',
      leagueId: 'league1',
      leagueName: 'Spring Soccer U10',
      requestedBy: 'system' as const,
      requestedAt: '2024-01-12T09:00:00Z',
      status: 'pending' as const,
      reason: 'Player is 5 days over age cutoff',
      justification: 'Player has been playing with this age group for 2 years',
      cutoffDate: '2014-08-01',
      playerBirthDate: '2014-07-26',
      ageDifference: 5,
    },
  ],
  incidentReports: [
    {
      id: '1',
      gameId: 'game1',
      reportedBy: 'coach1',
      reportedAt: '2024-01-14T16:30:00Z',
      incidentType: 'injury' as const,
      severity: 'medium' as const,
      status: 'reported' as const,
      description: 'Player twisted ankle during game',
      involvedPlayers: ['player5'],
      witnesses: ['coach1', 'referee1'],
      location: 'Field 3',
      actionsTaken: ['First aid applied', 'Parent notified'],
      followUpRequired: true,
      followUpNotes: 'Schedule follow-up with medical staff',
    },
  ],
  scoreReports: [
    {
      id: '1',
      gameId: 'game1',
      submittedBy: 'referee1',
      submittedAt: '2024-01-14T17:00:00Z',
      status: 'pending' as const,
      homeTeam: {
        teamId: 'team1',
        teamName: 'Tigers',
        score: 3,
        scorer: 'referee1',
      },
      awayTeam: {
        teamId: 'team2',
        teamName: 'Lions',
        score: 2,
        scorer: 'referee1',
      },
      gameDate: '2024-01-14',
      gameTime: '15:00',
      venue: 'Field 3',
      comments: [],
    },
  ],
  referees: [
    {
      id: 'ref1',
      name: 'Bob Wilson',
      email: 'bob.wilson@email.com',
      phone: '555-0456',
      certificationLevel: 'certified' as const,
      certifications: ['USSF Grade 8', 'First Aid'],
      experience: 5,
      availability: {
        monday: { morning: false, afternoon: false, evening: true },
        tuesday: { morning: false, afternoon: false, evening: true },
        wednesday: { morning: false, afternoon: false, evening: true },
        thursday: { morning: false, afternoon: false, evening: true },
        friday: { morning: false, afternoon: false, evening: true },
        saturday: { morning: true, afternoon: true, evening: false },
        sunday: { morning: true, afternoon: true, evening: false },
      },
      preferredVenues: ['Field 1', 'Field 2', 'Field 3'],
      maxGamesPerWeek: 8,
      currentAssignments: ['game1', 'game2'],
      rating: 4.5,
      totalGames: 150,
      specialties: ['U10', 'U12', 'Soccer'],
    },
  ],
  leagues: [
    {
      id: 'league1',
      name: 'Spring Soccer U10',
      sport: 'Soccer',
      season: 'Spring 2024',
      ageGroup: 'U10',
      skillLevel: 'recreational' as const,
      status: 'registration_open' as const,
      registrationDeadline: '2024-02-01',
      seasonStartDate: '2024-03-01',
      seasonEndDate: '2024-05-31',
      maxTeams: 8,
      maxPlayersPerTeam: 12,
      minPlayersPerTeam: 8,
      currentTeams: 6,
      currentPlayers: 65,
      waitlistCount: 12,
      venue: 'Community Sports Complex',
      gameSchedule: [
        { dayOfWeek: 'saturday', timeSlots: ['09:00', '10:30', '12:00'] },
        { dayOfWeek: 'sunday', timeSlots: ['09:00', '10:30'] },
      ],
      coaches: ['coach1', 'coach2', 'coach3'],
      referees: ['ref1', 'ref2', 'ref3'],
      rules: ['No slide tackling', 'Substitutions on any dead ball'],
      fees: { amount: 150, currency: 'USD', dueDate: '2024-02-15' },
      createdBy: 'admin1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
  ],
  teams: [
    {
      id: 'team1',
      leagueId: 'league1',
      name: 'Tigers',
      coachId: 'coach1',
      coachName: 'Coach Johnson',
      players: ['player1', 'player2', 'player3'],
      maxPlayers: 12,
      currentPlayers: 10,
      status: 'active' as const,
      practiceSchedule: [
        { dayOfWeek: 'tuesday', timeSlot: '17:00', venue: 'Field 1' },
        { dayOfWeek: 'thursday', timeSlot: '17:00', venue: 'Field 1' },
      ],
      gamesPlayed: 5,
      gamesWon: 3,
      gamesLost: 1,
      gamesTied: 1,
      pointsFor: 12,
      pointsAgainst: 8,
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
  ],
  payments: [
    {
      id: 'payment1',
      playerId: 'player1',
      guardianId: 'guardian1',
      leagueId: 'league1',
      amount: 150,
      currency: 'USD',
      status: 'completed' as const,
      paymentMethod: 'credit_card' as const,
      stripePaymentIntentId: 'pi_123456789',
      paidAt: '2024-01-15T10:30:00Z',
      description: 'Spring Soccer U10 Registration Fee',
      receiptUrl: 'https://receipt.stripe.com/123456',
      metadata: { leagueName: 'Spring Soccer U10' },
    },
  ],
  coaches: [
    {
      id: 'coach1',
      name: 'Coach Johnson',
      email: 'coach.johnson@email.com',
      phone: '555-0789',
      certifications: [
        {
          type: 'USSF',
          level: 'D License',
          issuedDate: '2022-06-15',
          status: 'valid' as const,
        },
      ],
      backgroundCheck: {
        status: 'passed' as const,
        completedAt: '2023-12-01',
        expiresAt: '2024-12-01',
      },
      experience: 3,
      teams: ['team1'],
      availability: {
        monday: { morning: false, afternoon: false, evening: true },
        tuesday: { morning: false, afternoon: false, evening: true },
        wednesday: { morning: false, afternoon: false, evening: true },
        thursday: { morning: false, afternoon: false, evening: true },
        friday: { morning: false, afternoon: false, evening: true },
        saturday: { morning: true, afternoon: true, evening: false },
        sunday: { morning: true, afternoon: true, evening: false },
      },
      specialties: ['U10', 'Soccer'],
      rating: 4.8,
      totalTeams: 5,
      activeTeams: 1,
    },
  ],
};

// Player Registration Hooks
export const usePlayerRegistrations = () => {
  const [registrations, setRegistrations] = useState<PlayerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async (filters?: {
    status?: string;
    leagueId?: string;
    autoFlagged?: boolean;
  }) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      let filteredData = MOCK_DATA.playerRegistrations;
      
      if (filters?.status) {
        filteredData = filteredData.filter(r => r.status === filters.status);
      }
      if (filters?.leagueId) {
        filteredData = filteredData.filter(r => r.leagueId === filters.leagueId);
      }
      if (filters?.autoFlagged !== undefined) {
        filteredData = filteredData.filter(r => r.autoFlagged === filters.autoFlagged);
      }
      
      setRegistrations(filteredData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveRegistration = useCallback(async (registrationId: string, reviewerId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setRegistrations(prev => 
        prev.map(r => 
          r.id === registrationId 
            ? { ...r, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: reviewerId }
            : r
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to approve registration' };
    }
  }, []);

  const rejectRegistration = useCallback(async (registrationId: string, reviewerId: string, reason: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setRegistrations(prev => 
        prev.map(r => 
          r.id === registrationId 
            ? { ...r, status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: reviewerId, rejectionReason: reason }
            : r
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to reject registration' };
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return {
    registrations,
    loading,
    error,
    fetchRegistrations,
    approveRegistration,
    rejectRegistration,
  };
};

// Waitlist Management Hooks
export const useWaitlistManager = () => {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaitlist = useCallback(async (leagueId?: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      let filteredData = MOCK_DATA.waitlistEntries;
      
      if (leagueId) {
        filteredData = filteredData.filter(w => w.leagueId === leagueId);
      }
      
      setWaitlistEntries(filteredData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch waitlist');
    } finally {
      setLoading(false);
    }
  }, []);

  const assignPlayerToTeam = useCallback(async (playerId: string, teamId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setWaitlistEntries(prev => 
        prev.map(w => 
          w.playerId === playerId 
            ? { ...w, status: 'invited', invitedAt: new Date().toISOString() }
            : w
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to assign player' };
    }
  }, []);

  const runAutoFill = useCallback(async (leagueId: string): Promise<WaitlistAutoFillResult> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        filledPositions: 3,
        totalPositions: 5,
        assignments: [
          { playerId: 'player2', teamId: 'team1', position: 'Forward' },
          { playerId: 'player3', teamId: 'team2', position: 'Midfielder' },
          { playerId: 'player4', teamId: 'team3', position: 'Defender' },
        ],
        errors: [],
      };
    } catch (err) {
      return {
        success: false,
        filledPositions: 0,
        totalPositions: 0,
        assignments: [],
        errors: ['Failed to run auto-fill'],
      };
    }
  }, []);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  return {
    waitlistEntries,
    loading,
    error,
    fetchWaitlist,
    assignPlayerToTeam,
    runAutoFill,
  };
};

// Sibling Placement Hooks
export const useSiblingPlacement = () => {
  const [siblingGroups, setSiblingGroups] = useState<SiblingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSiblingGroups = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSiblingGroups(MOCK_DATA.siblingGroups);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sibling groups');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyManualOverride = useCallback(async (
    groupId: string, 
    adminId: string, 
    reason: string, 
    teamAssignments: Record<string, string>
  ) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setSiblingGroups(prev => 
        prev.map(g => 
          g.id === groupId 
            ? { 
                ...g, 
                placementStatus: 'manual_override',
                manualOverride: {
                  overriddenBy: adminId,
                  overriddenAt: new Date().toISOString(),
                  reason,
                  teamAssignments,
                }
              }
            : g
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to apply override' };
    }
  }, []);

  const getAIRecommendations = useCallback(async (groupId: string): Promise<AIRecommendation> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        type: 'team_placement',
        confidence: 0.85,
        reasoning: 'Both siblings have similar skill levels and availability',
        recommendations: ['team1', 'team3'],
        alternatives: ['team2', 'team4'],
      };
    } catch (err) {
      throw new Error('Failed to get AI recommendations');
    }
  }, []);

  useEffect(() => {
    fetchSiblingGroups();
  }, [fetchSiblingGroups]);

  return {
    siblingGroups,
    loading,
    error,
    fetchSiblingGroups,
    applyManualOverride,
    getAIRecommendations,
  };
};

// Age Exception Hooks
export const useAgeExceptions = () => {
  const [ageExceptions, setAgeExceptions] = useState<AgeException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgeExceptions = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      let filteredData = MOCK_DATA.ageExceptions;
      
      if (status) {
        filteredData = filteredData.filter(e => e.status === status);
      }
      
      setAgeExceptions(filteredData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch age exceptions');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveAgeException = useCallback(async (exceptionId: string, reviewerId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAgeExceptions(prev => 
        prev.map(e => 
          e.id === exceptionId 
            ? { ...e, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: reviewerId }
            : e
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to approve age exception' };
    }
  }, []);

  const rejectAgeException = useCallback(async (exceptionId: string, reviewerId: string, reason: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAgeExceptions(prev => 
        prev.map(e => 
          e.id === exceptionId 
            ? { ...e, status: 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: reviewerId }
            : e
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to reject age exception' };
    }
  }, []);

  useEffect(() => {
    fetchAgeExceptions();
  }, [fetchAgeExceptions]);

  return {
    ageExceptions,
    loading,
    error,
    fetchAgeExceptions,
    approveAgeException,
    rejectAgeException,
  };
};

// Incident Reports Hooks
export const useIncidentReports = () => {
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidentReports = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      let filteredData = MOCK_DATA.incidentReports;
      
      if (status) {
        filteredData = filteredData.filter(i => i.status === status);
      }
      
      setIncidentReports(filteredData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch incident reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateIncidentStatus = useCallback(async (
    incidentId: string, 
    status: string, 
    adminId: string, 
    notes?: string
  ) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setIncidentReports(prev => 
        prev.map(i => 
          i.id === incidentId 
            ? { 
                ...i, 
                status: status as any,
                followUpNotes: notes,
                resolvedBy: adminId,
                resolvedAt: new Date().toISOString(),
              }
            : i
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to update incident status' };
    }
  }, []);

  useEffect(() => {
    fetchIncidentReports();
  }, [fetchIncidentReports]);

  return {
    incidentReports,
    loading,
    error,
    fetchIncidentReports,
    updateIncidentStatus,
  };
};

// Score Reports Hooks
export const useScoreReports = () => {
  const [scoreReports, setScoreReports] = useState<ScoreReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScoreReports = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      let filteredData = MOCK_DATA.scoreReports;
      
      if (status) {
        filteredData = filteredData.filter(s => s.status === status);
      }
      
      setScoreReports(filteredData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch score reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyScore = useCallback(async (reportId: string, adminId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setScoreReports(prev => 
        prev.map(s => 
          s.id === reportId 
            ? { ...s, status: 'verified' }
            : s
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to verify score' };
    }
  }, []);

  const resolveDispute = useCallback(async (
    reportId: string, 
    adminId: string, 
    resolution: string
  ) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setScoreReports(prev => 
        prev.map(s => 
          s.id === reportId 
            ? { 
                ...s, 
                status: 'resolved',
                resolvedBy: adminId,
                resolvedAt: new Date().toISOString(),
                resolution,
              }
            : s
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to resolve dispute' };
    }
  }, []);

  useEffect(() => {
    fetchScoreReports();
  }, [fetchScoreReports]);

  return {
    scoreReports,
    loading,
    error,
    fetchScoreReports,
    verifyScore,
    resolveDispute,
  };
};

// Referee Scheduler Hooks
export const useRefereeScheduler = () => {
  const [referees, setReferees] = useState<Referee[]>([]);
  const [assignments, setAssignments] = useState<RefereeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReferees = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setReferees(MOCK_DATA.referees);
      setError(null);
    } catch (err) {
      setError('Failed to fetch referees');
    } finally {
      setLoading(false);
    }
  }, []);

  const assignReferee = useCallback(async (
    refereeId: string, 
    gameId: string, 
    role: string, 
    adminId: string
  ) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newAssignment: RefereeAssignment = {
        id: `assignment_${Date.now()}`,
        refereeId,
        gameId,
        role: role as any,
        assignedAt: new Date().toISOString(),
        assignedBy: adminId,
        status: 'assigned',
      };
      setAssignments(prev => [...prev, newAssignment]);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to assign referee' };
    }
  }, []);

  const getRefereeAvailability = useCallback(async (date: string, timeSlot: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_DATA.referees.filter(ref => {
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const timeOfDay = timeSlot.includes('09:00') || timeSlot.includes('10:30') ? 'morning' : 'afternoon';
        return ref.availability[dayOfWeek]?.[timeOfDay] && ref.currentAssignments.length < ref.maxGamesPerWeek;
      });
    } catch (err) {
      throw new Error('Failed to get referee availability');
    }
  }, []);

  useEffect(() => {
    fetchReferees();
  }, [fetchReferees]);

  return {
    referees,
    assignments,
    loading,
    error,
    fetchReferees,
    assignReferee,
    getRefereeAvailability,
  };
};

// League Dashboard Hooks
export const useLeagueDashboard = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeagues = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLeagues(MOCK_DATA.leagues);
      setTeams(MOCK_DATA.teams);
      setError(null);
    } catch (err) {
      setError('Failed to fetch leagues');
    } finally {
      setLoading(false);
    }
  }, []);

  const getLeagueOverview = useCallback(async (leagueId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const league = MOCK_DATA.leagues.find(l => l.id === leagueId);
      const leagueTeams = MOCK_DATA.teams.filter(t => t.leagueId === leagueId);
      return { league, teams: leagueTeams };
    } catch (err) {
      throw new Error('Failed to get league overview');
    }
  }, []);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  return {
    leagues,
    teams,
    loading,
    error,
    fetchLeagues,
    getLeagueOverview,
  };
};

// Payment Management Hooks
export const usePaymentManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      let filteredData = MOCK_DATA.payments;
      
      if (status) {
        filteredData = filteredData.filter(p => p.status === status);
      }
      
      setPayments(filteredData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, []);

  const processRefund = useCallback(async (
    paymentId: string, 
    adminId: string, 
    reason: string, 
    amount?: number
  ) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setPayments(prev => 
        prev.map(p => 
          p.id === paymentId 
            ? { 
                ...p, 
                status: 'refunded',
                refundedAt: new Date().toISOString(),
                refundedBy: adminId,
                refundReason: reason,
                stripeRefundId: `re_${Date.now()}`,
              }
            : p
        )
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to process refund' };
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    processRefund,
  };
};

// Coach Management Hooks
export const useCoachManagement = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoaches = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setCoaches(MOCK_DATA.coaches);
      setError(null);
    } catch (err) {
      setError('Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  }, []);

  const getMissingCertifications = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_DATA.coaches.filter(coach => 
        coach.certifications.some(cert => cert.status === 'failed') ||
        coach.backgroundCheck.status === 'failed'
      );
    } catch (err) {
      throw new Error('Failed to get missing certifications');
    }
  }, []);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  return {
    coaches,
    loading,
    error,
    fetchCoaches,
    getMissingCertifications,
  };
};

// Dashboard Stats Hook
export const useAdminDashboardStats = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockStats: AdminDashboardStats = {
        totalLeagues: 8,
        activeLeagues: 6,
        totalPlayers: 450,
        pendingRegistrations: 23,
        waitlistCount: 67,
        pendingAgeExceptions: 5,
        pendingIncidentReports: 3,
        upcomingGames: 24,
        totalReferees: 15,
        availableReferees: 8,
        totalRevenue: 67500,
        pendingPayments: 12,
      };
      setStats(mockStats);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
}; 