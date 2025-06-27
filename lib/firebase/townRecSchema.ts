/**
 * Firestore schema for TownRec
 *
 * towns/{townId}
 *   - name: string
 *   - state: string
 *   - zones: string[] (zoneIds)
 *   - facilities: string[] (facilityIds)
 *   - leagues: string[] (leagueIds)
 *
 * zones/{zoneId}
 *   - name: string
 *   - townId: string
 *   - facilities: string[] (facilityIds)
 *
 * facilities/{facilityId}
 *   - name: string
 *   - address: string
 *   - zoneId: string
 *   - type: 'field' | 'gym' | 'pool' | 'other'
 *   - capacity: number
 *   - schedule: string[] (gameId|practiceId)
 *
 * leagues/{leagueId}
 *   - name: string
 *   - season: string
 *   - townId: string
 *   - teams: string[] (teamIds)
 *   - schedule: string[] (gameIds)
 *   - registrationOpen: boolean
 *   - paymentTier: string
 */

// Firestore schema for Town Rec
export const townRecSchema = {
  towns: {
    id: 'string',
    name: 'string',
    zones: ['zoneId'],
    facilities: ['facilityId'],
    leagues: ['leagueId'],
  },
  zones: {
    id: 'string',
    name: 'string',
    townId: 'string',
    facilities: ['facilityId'],
  },
  facilities: {
    id: 'string',
    name: 'string',
    address: 'string',
    zoneId: 'string',
    availability: ['timeSlotId'],
  },
  leagues: {
    id: 'string',
    name: 'string',
    season: 'string',
    townId: 'string',
    zoneId: 'string',
    teams: ['teamId'],
    schedule: ['gameId'],
    registrationOpen: 'boolean',
    paymentTier: 'string',
  },
  players: {
    id: 'string',
    name: 'string',
    email: 'string',
    address: 'string',
    resident: 'boolean',
    teams: ['teamId'],
    leagues: ['leagueId'],
    payments: ['paymentId'],
  },
  coaches: {
    id: 'string',
    name: 'string',
    email: 'string',
    leagues: ['leagueId'],
    teams: ['teamId'],
    backgroundCheck: 'boolean',
  },
  teams: {
    id: 'string',
    name: 'string',
    leagueId: 'string',
    players: ['playerId'],
    coaches: ['coachId'],
    rosterInvites: ['playerId'],
    waitlist: ['playerId'],
  },
  games: {
    id: 'string',
    leagueId: 'string',
    teamA: 'teamId',
    teamB: 'teamId',
    facilityId: 'string',
    timeSlotId: 'string',
    status: 'scheduled' | 'completed' | 'rainout',
    score: { teamA: 'number', teamB: 'number' },
  },
  practices: {
    id: 'string',
    leagueId: 'string',
    teamId: 'string',
    facilityId: 'string',
    timeSlotId: 'string',
  },
  timeSlots: {
    id: 'string',
    facilityId: 'string',
    start: 'timestamp',
    end: 'timestamp',
    reserved: 'boolean',
    reservedFor: 'gameId' | 'practiceId' | null,
  },
  payments: {
    id: 'string',
    playerId: 'string',
    leagueId: 'string',
    amount: 'number',
    status: 'pending' | 'completed' | 'failed',
    tier: 'string',
    timestamp: 'timestamp',
  },
  auditLogs: {
    id: 'string',
    action: 'string',
    userId: 'string',
    timestamp: 'timestamp',
    details: 'object',
  },
};

/**
 * regionalLeagues/{regionalLeagueId}
 *   - name: string
 *   - sport: string
 *   - ageRange: string
 *   - adminTowns: string[]
 *   - teamLimit: number
 *   - sharedSchedule: boolean
 *
 * schools/{schoolId}
 *   - name: string
 *   - district: string
 *   - contact: string
 *   - teams: string[]
 *   - eligibility: object
 *   - coachAssignments: object
 */ 