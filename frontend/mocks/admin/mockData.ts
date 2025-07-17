import { faker } from '@faker-js/faker';

// Generate consistent mock data for development
export const generateMockData = () => {
  // Player Registrations
  const playerRegistrations = Array.from({ length: 50 }, (_, i) => ({
    id: `reg-${i + 1}`,
    playerName: faker.person.fullName(),
    guardianName: faker.person.fullName(),
    guardianEmail: faker.internet.email(),
    guardianPhone: faker.phone.number(),
    playerAge: faker.number.int({ min: 5, max: 18 }),
    grade: `${faker.number.int({ min: 1, max: 12 })}th Grade`,
    experienceLevel: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced']),
    leagueId: faker.helpers.arrayElement(['league-1', 'league-2', 'league-3']),
    teamId: faker.helpers.arrayElement(['team-1', 'team-2', 'team-3', 'team-4', null]),
    registrationDate: faker.date.recent({ days: 30 }).toISOString(),
    status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
    aiFlagged: faker.datatype.boolean(),
    flagReason: faker.helpers.arrayElement([
      'Age discrepancy detected',
      'Duplicate registration possible',
      'Missing medical information',
      'Payment verification needed',
      null
    ]),
    reviewNotes: faker.helpers.maybe(() => faker.lorem.sentence()),
    reviewedBy: faker.helpers.maybe(() => faker.person.fullName()),
    reviewDate: faker.helpers.maybe(() => faker.date.recent({ days: 7 }).toISOString())
  }));

  // Waitlist Entries
  const waitlistEntries = Array.from({ length: 30 }, (_, i) => ({
    id: `wait-${i + 1}`,
    playerName: faker.person.fullName(),
    guardianName: faker.person.fullName(),
    guardianEmail: faker.internet.email(),
    guardianPhone: faker.phone.number(),
    playerAge: faker.number.int({ min: 5, max: 18 }),
    grade: `${faker.number.int({ min: 1, max: 12 })}th Grade`,
    experienceLevel: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced']),
    leagueId: faker.helpers.arrayElement(['league-1', 'league-2', 'league-3']),
    preferredTeam: faker.helpers.arrayElement(['team-1', 'team-2', 'team-3', 'team-4']),
    waitlistDate: faker.date.recent({ days: 60 }).toISOString(),
    priority: faker.helpers.arrayElement(['high', 'medium', 'low']),
    notes: faker.helpers.maybe(() => faker.lorem.sentence()),
    status: faker.helpers.arrayElement(['waiting', 'contacted', 'assigned'])
  }));

  // Sibling Groups
  const siblingGroups = Array.from({ length: 15 }, (_, i) => ({
    id: `sib-${i + 1}`,
    guardianName: faker.person.fullName(),
    guardianPhone: faker.phone.number(),
    guardianEmail: faker.internet.email(),
    siblings: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, (_, j) => ({
      id: `sib-${i + 1}-${j + 1}`,
      name: faker.person.fullName(),
      age: faker.number.int({ min: 5, max: 18 }),
      grade: `${faker.number.int({ min: 1, max: 12 })}th Grade`,
      experienceLevel: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced']),
      currentTeam: faker.helpers.maybe(() => faker.helpers.arrayElement(['team-1', 'team-2', 'team-3', 'team-4']))
    })),
    placement: faker.helpers.maybe(() => ({
      teamId: faker.helpers.arrayElement(['team-1', 'team-2', 'team-3', 'team-4']),
      reason: faker.helpers.arrayElement(['AI suggestion', 'Manual placement', 'Guardian request']),
      date: faker.date.recent({ days: 7 }).toISOString()
    })),
    aiSuggestions: Array.from({ length: 3 }, () => ({
      teamName: faker.helpers.arrayElement(['Red Dragons', 'Blue Eagles', 'Green Lions', 'Yellow Tigers']),
      confidence: faker.number.int({ min: 60, max: 95 })
    }))
  }));

  // Age Exceptions
  const ageExceptions = Array.from({ length: 20 }, (_, i) => ({
    id: `age-${i + 1}`,
    playerName: faker.person.fullName(),
    guardianName: faker.person.fullName(),
    guardianPhone: faker.phone.number(),
    playerAge: faker.number.int({ min: 4, max: 19 }),
    cutoffAge: faker.number.int({ min: 5, max: 18 }),
    requestReason: faker.helpers.arrayElement([
      'Player is developmentally ready for older age group',
      'Sibling plays in older age group',
      'Coach recommendation',
      'Previous experience in older age group',
      'Physical development exceeds age group'
    ]),
    coachOverride: faker.datatype.boolean(),
    requestDate: faker.date.recent({ days: 30 }).toISOString(),
    status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
    reviewNotes: faker.helpers.maybe(() => faker.lorem.sentence()),
    reviewDate: faker.helpers.maybe(() => faker.date.recent({ days: 7 }).toISOString()),
    reviewedBy: faker.helpers.maybe(() => faker.person.fullName())
  }));

  // Incident Reports
  const incidentReports = Array.from({ length: 25 }, (_, i) => ({
    id: `inc-${i + 1}`,
    incidentType: faker.helpers.arrayElement([
      'Player injury',
      'Coach misconduct',
      'Parent complaint',
      'Referee dispute',
      'Equipment issue',
      'Weather-related incident'
    ]),
    description: faker.lorem.paragraph(),
    homeTeam: faker.helpers.arrayElement(['Red Dragons', 'Blue Eagles', 'Green Lions', 'Yellow Tigers']),
    awayTeam: faker.helpers.arrayElement(['Red Dragons', 'Blue Eagles', 'Green Lions', 'Yellow Tigers']),
    reportedBy: faker.person.fullName(),
    reportDate: faker.date.recent({ days: 30 }).toISOString(),
    severity: faker.helpers.arrayElement(['low', 'medium', 'high']),
    status: faker.helpers.arrayElement(['pending', 'resolved', 'escalated', 'under_review']),
    resolution: faker.helpers.maybe(() => faker.lorem.sentence()),
    resolutionDate: faker.helpers.maybe(() => faker.date.recent({ days: 7 }).toISOString()),
    comments: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
      author: faker.person.fullName(),
      text: faker.lorem.sentence(),
      timestamp: faker.date.recent({ days: 7 }).toISOString()
    }))
  }));

  // Score Reports
  const scoreReports = Array.from({ length: 40 }, (_, i) => ({
    id: `score-${i + 1}`,
    homeTeam: faker.helpers.arrayElement(['Red Dragons', 'Blue Eagles', 'Green Lions', 'Yellow Tigers']),
    awayTeam: faker.helpers.arrayElement(['Red Dragons', 'Blue Eagles', 'Green Lions', 'Yellow Tigers']),
    homeScore: faker.number.int({ min: 0, max: 10 }),
    awayScore: faker.number.int({ min: 0, max: 10 }),
    gameDate: faker.date.recent({ days: 30 }).toISOString(),
    venue: faker.helpers.arrayElement(['Central Park Field', 'Community Center', 'High School Stadium', 'Recreation Complex']),
    reportedBy: faker.person.fullName(),
    reportDate: faker.date.recent({ days: 7 }).toISOString(),
    status: faker.helpers.arrayElement(['pending', 'confirmed', 'disputed']),
    disputed: faker.datatype.boolean(),
    disputeNotes: faker.helpers.maybe(() => faker.lorem.sentence()),
    comments: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
      author: faker.person.fullName(),
      text: faker.lorem.sentence(),
      timestamp: faker.date.recent({ days: 3 }).toISOString()
    }))
  }));

  // Referees
  const referees = Array.from({ length: 20 }, (_, i) => ({
    id: `ref-${i + 1}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    skillLevel: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced', 'expert']),
    availability: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
      date: faker.date.future({ years: 0.1 }).toISOString().split('T')[0],
      timeSlots: faker.helpers.arrayElements(['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'], { min: 1, max: 3 })
    })),
    assignedGames: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
      gameId: `game-${faker.number.int({ min: 1, max: 50 })}`,
      role: faker.helpers.arrayElement(['Center', 'Assistant']),
      date: faker.date.future({ years: 0.1 }).toISOString()
    }))
  }));

  // Games
  const games = Array.from({ length: 50 }, (_, i) => ({
    id: `game-${i + 1}`,
    homeTeamId: faker.helpers.arrayElement(['team-1', 'team-2', 'team-3', 'team-4']),
    awayTeamId: faker.helpers.arrayElement(['team-1', 'team-2', 'team-3', 'team-4']),
    date: faker.date.future({ years: 0.1 }).toISOString(),
    time: faker.helpers.arrayElement(['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM']),
    venue: faker.helpers.arrayElement(['Central Park Field', 'Community Center', 'High School Stadium', 'Recreation Complex']),
    leagueId: faker.helpers.arrayElement(['league-1', 'league-2', 'league-3']),
    status: faker.helpers.arrayElement(['scheduled', 'in_progress', 'completed', 'cancelled'])
  }));

  // Referee Assignments
  const refereeAssignments = Array.from({ length: 30 }, (_, i) => ({
    id: `assign-${i + 1}`,
    gameId: `game-${faker.number.int({ min: 1, max: 50 })}`,
    refereeId: `ref-${faker.number.int({ min: 1, max: 20 })}`,
    role: faker.helpers.arrayElement(['Center', 'Assistant']),
    assignedDate: faker.date.recent({ days: 7 }).toISOString(),
    status: faker.helpers.arrayElement(['assigned', 'confirmed', 'completed'])
  }));

  // Leagues
  const leagues = [
    {
      id: 'league-1',
      name: 'Spring Soccer League',
      description: 'Youth soccer league for ages 8-14',
      season: 'Spring 2024',
      sport: 'Soccer',
      ageGroup: '8-14',
      status: 'active'
    },
    {
      id: 'league-2',
      name: 'Summer Baseball League',
      description: 'Summer baseball program for ages 10-16',
      season: 'Summer 2024',
      sport: 'Baseball',
      ageGroup: '10-16',
      status: 'active'
    },
    {
      id: 'league-3',
      name: 'Fall Football League',
      description: 'Fall football league for ages 12-18',
      season: 'Fall 2024',
      sport: 'Football',
      ageGroup: '12-18',
      status: 'active'
    }
  ];

  // Teams
  const teams = Array.from({ length: 12 }, (_, i) => ({
    id: `team-${i + 1}`,
    name: faker.helpers.arrayElement(['Red Dragons', 'Blue Eagles', 'Green Lions', 'Yellow Tigers', 'Purple Panthers', 'Orange Bears']),
    division: faker.helpers.arrayElement(['Division A', 'Division B', 'Division C']),
    leagueId: faker.helpers.arrayElement(['league-1', 'league-2', 'league-3']),
    currentSize: faker.number.int({ min: 8, max: 15 }),
    maxSize: 15,
    coachId: faker.helpers.maybe(() => `coach-${faker.number.int({ min: 1, max: 10 })}`)
  }));

  // Players
  const players = Array.from({ length: 200 }, (_, i) => ({
    id: `player-${i + 1}`,
    name: faker.person.fullName(),
    age: faker.number.int({ min: 5, max: 18 }),
    grade: `${faker.number.int({ min: 1, max: 12 })}th Grade`,
    experienceLevel: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced']),
    guardianName: faker.person.fullName(),
    guardianEmail: faker.internet.email(),
    guardianPhone: faker.phone.number(),
    teamId: faker.helpers.maybe(() => `team-${faker.number.int({ min: 1, max: 12 })}`),
    leagueId: faker.helpers.arrayElement(['league-1', 'league-2', 'league-3']),
    registrationDate: faker.date.recent({ days: 90 }).toISOString()
  }));

  // Coaches
  const coaches = Array.from({ length: 10 }, (_, i) => ({
    id: `coach-${i + 1}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    teamId: faker.helpers.maybe(() => `team-${faker.number.int({ min: 1, max: 12 })}`),
    leagueId: faker.helpers.arrayElement(['league-1', 'league-2', 'league-3']),
    certificationStatus: faker.helpers.arrayElement(['certified', 'pending', 'expired']),
    certificationExpiry: faker.date.future({ years: 2 }).toISOString()
  }));

  // Payments
  const payments = Array.from({ length: 150 }, (_, i) => ({
    id: `pay-${i + 1}`,
    customerName: faker.person.fullName(),
    customerEmail: faker.internet.email(),
    amount: faker.number.float({ min: 50, max: 300, precision: 0.01 }),
    date: faker.date.recent({ days: 90 }).toISOString(),
    status: faker.helpers.arrayElement(['completed', 'pending', 'failed', 'refunded']),
    paymentMethod: faker.helpers.arrayElement(['credit_card', 'debit_card', 'bank_transfer']),
    description: faker.helpers.arrayElement([
      'Registration fee - Spring Soccer League',
      'Registration fee - Summer Baseball League',
      'Registration fee - Fall Football League',
      'Equipment fee',
      'Tournament fee'
    ])
  }));

  // Refunds
  const refunds = Array.from({ length: 20 }, (_, i) => ({
    id: `refund-${i + 1}`,
    paymentId: `pay-${faker.number.int({ min: 1, max: 150 })}`,
    amount: faker.number.float({ min: 25, max: 150, precision: 0.01 }),
    reason: faker.helpers.arrayElement([
      'Player injury - unable to participate',
      'Schedule conflict',
      'Family emergency',
      'Dissatisfaction with program',
      'Duplicate payment'
    ]),
    date: faker.date.recent({ days: 30 }).toISOString(),
    status: faker.helpers.arrayElement(['pending', 'completed', 'failed']),
    processedBy: faker.person.fullName()
  }));

  return {
    playerRegistrations,
    waitlistEntries,
    siblingGroups,
    ageExceptions,
    incidentReports,
    scoreReports,
    referees,
    games,
    refereeAssignments,
    leagues,
    teams,
    players,
    coaches,
    payments,
    refunds
  };
};

// Export the generated mock data
export const mockData = generateMockData(); 