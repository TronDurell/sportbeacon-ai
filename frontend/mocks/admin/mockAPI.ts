import { mockData } from './mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic API response wrapper
const apiResponse = <T>(data: T, success: boolean = true, message?: string) => ({
  success,
  data,
  message,
  timestamp: new Date().toISOString()
});

// Player Registration API
export const playerRegistrationAPI = {
  getRegistrations: async (leagueId?: string) => {
    await delay(500);
    let registrations = mockData.playerRegistrations;
    if (leagueId) {
      registrations = registrations.filter(r => r.leagueId === leagueId);
    }
    return apiResponse(registrations);
  },

  approveRegistration: async (registrationId: string, notes?: string) => {
    await delay(300);
    const registration = mockData.playerRegistrations.find(r => r.id === registrationId);
    if (registration) {
      registration.status = 'approved';
      registration.reviewNotes = notes;
      registration.reviewedBy = 'Current Admin';
      registration.reviewDate = new Date().toISOString();
    }
    return apiResponse({ success: true });
  },

  rejectRegistration: async (registrationId: string, reason: string) => {
    await delay(300);
    const registration = mockData.playerRegistrations.find(r => r.id === registrationId);
    if (registration) {
      registration.status = 'rejected';
      registration.reviewNotes = reason;
      registration.reviewedBy = 'Current Admin';
      registration.reviewDate = new Date().toISOString();
    }
    return apiResponse({ success: true });
  }
};

// Waitlist API
export const waitlistAPI = {
  getWaitlist: async (leagueId?: string) => {
    await delay(500);
    let entries = mockData.waitlistEntries;
    if (leagueId) {
      entries = entries.filter(w => w.leagueId === leagueId);
    }
    return apiResponse(entries);
  },

  assignPlayer: async (waitlistId: string, teamId: string) => {
    await delay(300);
    const entry = mockData.waitlistEntries.find(w => w.id === waitlistId);
    if (entry) {
      entry.status = 'assigned';
      // Add to players
      mockData.players.push({
        id: `player-${Date.now()}`,
        name: entry.playerName,
        age: entry.playerAge,
        grade: entry.grade,
        experienceLevel: entry.experienceLevel,
        guardianName: entry.guardianName,
        guardianEmail: entry.guardianEmail,
        guardianPhone: entry.guardianPhone,
        teamId: teamId as `team-${number}`,
        leagueId: entry.leagueId,
        registrationDate: new Date().toISOString()
      });
    }
    return apiResponse({ success: true });
  },

  autoFillTeams: async (leagueId: string) => {
    await delay(1000);
    const availablePlayers = mockData.waitlistEntries.filter(w => 
      w.leagueId === leagueId && w.status === 'waiting'
    );
    const teams = mockData.teams.filter(t => t.leagueId === leagueId);
    
    // Simulate auto-fill logic
    availablePlayers.slice(0, 10).forEach((player, index) => {
      const team = teams[index % teams.length];
      if (team && team.currentSize < team.maxSize) {
        player.status = 'assigned';
        team.currentSize++;
      }
    });
    
    return apiResponse({ success: true, assigned: Math.min(10, availablePlayers.length) });
  }
};

// Sibling Placement API
export const siblingAPI = {
  getSiblingGroups: async (leagueId?: string) => {
    await delay(500);
    return apiResponse(mockData.siblingGroups);
  },

  getTeams: async (leagueId?: string) => {
    await delay(300);
    let teams = mockData.teams;
    if (leagueId) {
      teams = teams.filter(t => t.leagueId === leagueId);
    }
    return apiResponse(teams);
  },

  placeSiblings: async (groupId: string, teamId: string) => {
    await delay(300);
    const group = mockData.siblingGroups.find(g => g.id === groupId);
    if (group) {
      group.placement = {
        teamId: teamId as "team-1" | "team-2" | "team-3" | "team-4",
        reason: 'Manual placement',
        date: new Date().toISOString()
      };
    }
    return apiResponse({ success: true });
  },

  generateAISuggestions: async (leagueId: string) => {
    await delay(800);
    mockData.siblingGroups.forEach(group => {
      group.aiSuggestions = Array.from({ length: 3 }, () => ({
        teamName: (['Red Dragons', 'Blue Eagles', 'Green Lions', 'Yellow Tigers'][Math.floor(Math.random() * 4)]) as "Red Dragons" | "Blue Eagles" | "Green Lions" | "Yellow Tigers",
        confidence: Math.floor(Math.random() * 35) + 60
      }));
    });
    return apiResponse({ success: true });
  }
};

// Age Exceptions API
export const ageExceptionAPI = {
  getAgeExceptions: async (leagueId?: string) => {
    await delay(500);
    return apiResponse(mockData.ageExceptions);
  },

  approveException: async (exceptionId: string, reason?: string) => {
    await delay(300);
    const exception = mockData.ageExceptions.find(e => e.id === exceptionId);
    if (exception) {
      exception.status = 'approved';
      exception.reviewNotes = reason;
      exception.reviewedBy = 'Current Admin';
      exception.reviewDate = new Date().toISOString();
    }
    return apiResponse({ success: true });
  },

  rejectException: async (exceptionId: string, reason: string) => {
    await delay(300);
    const exception = mockData.ageExceptions.find(e => e.id === exceptionId);
    if (exception) {
      exception.status = 'rejected';
      exception.reviewNotes = reason;
      exception.reviewedBy = 'Current Admin';
      exception.reviewDate = new Date().toISOString();
    }
    return apiResponse({ success: true });
  }
};

// Incident Reports API
export const incidentAPI = {
  getIncidentReports: async (leagueId?: string) => {
    await delay(500);
    return apiResponse(mockData.incidentReports);
  },

  getScoreReports: async (leagueId?: string) => {
    await delay(500);
    return apiResponse(mockData.scoreReports);
  },

  resolveIncident: async (incidentId: string, resolution: string, severity: string) => {
    await delay(300);
    const incident = mockData.incidentReports.find(i => i.id === incidentId);
    if (incident) {
      incident.status = 'resolved';
      incident.resolution = resolution;
      incident.resolutionDate = new Date().toISOString();
    }
    return apiResponse({ success: true });
  },

  updateScore: async (scoreId: string, homeScore: number, awayScore: number, notes?: string) => {
    await delay(300);
    const score = mockData.scoreReports.find(s => s.id === scoreId);
    if (score) {
      score.homeScore = homeScore;
      score.awayScore = awayScore;
      score.status = 'confirmed';
      if (notes) {
        score.comments.push({
          author: 'Admin',
          text: notes,
          timestamp: new Date().toISOString()
        });
      }
    }
    return apiResponse({ success: true });
  },

  addComment: async (reportId: string, comment: string) => {
    await delay(200);
    const incident = mockData.incidentReports.find(i => i.id === reportId);
    const score = mockData.scoreReports.find(s => s.id === reportId);
    
    const newComment = {
      author: 'Admin',
      text: comment,
      timestamp: new Date().toISOString()
    };
    
    if (incident) {
      incident.comments.push(newComment);
    } else if (score) {
      score.comments.push(newComment);
    }
    
    return apiResponse({ success: true });
  }
};

// Referee Scheduler API
export const refereeAPI = {
  getReferees: async (leagueId?: string) => {
    await delay(500);
    return apiResponse(mockData.referees);
  },

  getGames: async (leagueId?: string) => {
    await delay(500);
    let games = mockData.games;
    if (leagueId) {
      games = games.filter(g => g.leagueId === leagueId);
    }
    return apiResponse(games);
  },

  getAssignments: async (leagueId?: string) => {
    await delay(500);
    return apiResponse(mockData.refereeAssignments);
  },

  assignReferee: async (gameId: string, refereeId: string, role: string) => {
    await delay(300);
    const assignment = {
      id: `assign-${Date.now()}`,
      gameId,
      refereeId,
      role: role as "Center" | "Assistant",
      assignedDate: new Date().toISOString(),
      status: 'assigned' as "completed" | "assigned" | "confirmed"
    };
    mockData.refereeAssignments.push(assignment);
    return apiResponse({ success: true });
  },

  unassignReferee: async (assignmentId: string) => {
    await delay(300);
    const index = mockData.refereeAssignments.findIndex(a => a.id === assignmentId);
    if (index !== -1) {
      mockData.refereeAssignments.splice(index, 1);
    }
    return apiResponse({ success: true });
  },

  autoAssignReferees: async (leagueId: string, week: Date) => {
    await delay(1000);
    const games = mockData.games.filter(g => g.leagueId === leagueId);
    const referees = mockData.referees;
    
    games.forEach((game, index) => {
      const referee = referees[index % referees.length];
      if (referee) {
        mockData.refereeAssignments.push({
          id: `assign-${Date.now()}-${index}`,
          gameId: game.id,
          refereeId: referee.id,
          role: 'Center',
          assignedDate: new Date().toISOString(),
          status: 'assigned'
        });
      }
    });
    
    return apiResponse({ success: true, assigned: games.length });
  }
};

// League Dashboard API
export const leagueAPI = {
  getLeagues: async () => {
    await delay(300);
    return apiResponse(mockData.leagues);
  },

  getTeams: async (leagueId: string) => {
    await delay(300);
    const teams = mockData.teams.filter(t => t.leagueId === leagueId);
    return apiResponse(teams);
  },

  getPlayers: async (leagueId: string) => {
    await delay(300);
    const players = mockData.players.filter(p => p.leagueId === leagueId);
    return apiResponse(players);
  },

  getCoaches: async (leagueId: string) => {
    await delay(300);
    const coaches = mockData.coaches.filter(c => c.leagueId === leagueId);
    return apiResponse(coaches);
  },

  getGames: async (leagueId: string) => {
    await delay(300);
    const games = mockData.games.filter(g => g.leagueId === leagueId);
    return apiResponse(games);
  }
};

// Payment API
export const paymentAPI = {
  getPayments: async (leagueId?: string) => {
    await delay(500);
    return apiResponse(mockData.payments);
  },

  getRefunds: async (leagueId?: string) => {
    await delay(500);
    return apiResponse(mockData.refunds);
  },

  processRefund: async (paymentId: string, amount: number, reason: string) => {
    await delay(500);
    const refund = {
      id: `refund-${Date.now()}`,
      paymentId,
      amount,
      reason: reason as "Player injury - unable to participate" | "Schedule conflict" | "Family emergency" | "Dissatisfaction with program" | "Duplicate payment",
      date: new Date().toISOString(),
      status: 'completed' as "pending" | "completed" | "failed",
      processedBy: 'Current Admin'
    };
    mockData.refunds.push(refund);
    
    // Update payment status
    const payment = mockData.payments.find(p => p.id === paymentId);
    if (payment) {
      payment.status = 'refunded';
    }
    
    return apiResponse({ success: true });
  },

  searchPaymentById: async (searchQuery: string) => {
    await delay(300);
    const payment = mockData.payments.find(p => 
      p.id.includes(searchQuery) || 
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return apiResponse(payment ? [payment] : []);
  },

  exportPaymentData: async (leagueId?: string) => {
    await delay(1000);
    return apiResponse({ 
      success: true, 
      downloadUrl: '/api/admin/payments/export',
      filename: `payments-${new Date().toISOString().split('T')[0]}.csv`
    });
  }
};

// Admin Dashboard API
export const adminDashboardAPI = {
  getStats: async () => {
    await delay(300);
    return apiResponse({
      totalPlayers: mockData.players.length,
      pendingRegistrations: mockData.playerRegistrations.filter(r => r.status === 'pending').length,
      waitlistCount: mockData.waitlistEntries.filter(w => w.status === 'waiting').length,
      totalRevenue: mockData.payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
      activeLeagues: mockData.leagues.length,
      totalTeams: mockData.teams.length
    });
  },

  getRecentActivity: async () => {
    await delay(300);
    return apiResponse([
      {
        id: 1,
        type: 'registration_approved',
        message: 'Player registration approved',
        details: 'Sarah Johnson - Spring Soccer League',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        type: 'waitlist_added',
        message: 'New waitlist entry added',
        details: 'Michael Chen - Summer Baseball League',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        type: 'incident_reported',
        message: 'Incident report submitted',
        details: 'Coach Smith - Fall Football League',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        type: 'payment_processed',
        message: 'Payment processed',
        details: '$150.00 - Registration fee',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]);
  }
};

// Export all APIs
export const adminAPI = {
  playerRegistration: playerRegistrationAPI,
  waitlist: waitlistAPI,
  sibling: siblingAPI,
  ageException: ageExceptionAPI,
  incident: incidentAPI,
  referee: refereeAPI,
  league: leagueAPI,
  payment: paymentAPI,
  dashboard: adminDashboardAPI
}; 