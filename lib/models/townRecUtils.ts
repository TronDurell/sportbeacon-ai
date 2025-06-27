import { League, Team, Player, Coach, Game, Practice, Facility, Payment } from './townRecTypes';

// Fetch all games for a league
export function getLeagueSchedule(league: League, games: Game[]): Game[] {
  return games.filter(g => league.schedule.includes(g.id));
}

// Fetch all players for a team
export function getTeamRoster(team: Team, players: Player[]): Player[] {
  return players.filter(p => team.players.includes(p.id));
}

// Fetch all coaches for a team
export function getTeamCoaches(team: Team, coaches: Coach[]): Coach[] {
  return coaches.filter(c => team.coaches.includes(c.id));
}

// Fetch all leagues a player is registered in
export function getPlayerLeagues(player: Player, leagues: League[]): League[] {
  return leagues.filter(l => player.leagues.includes(l.id));
}

// Fetch all teams a coach is assigned to
export function getCoachTeams(coach: Coach, teams: Team[]): Team[] {
  return teams.filter(t => t.coaches.includes(coach.id));
}

// New utilities
export function getFacilitySchedule(facilityId: string, games: Game[], practices: Practice[]): (Game | Practice)[] {
  return [
    ...games.filter(g => g.facilityId === facilityId),
    ...practices.filter(p => p.facilityId === facilityId),
  ];
}

export function getCoachAssignments(coachId: string, teams: Team[], leagues: League[]): { teams: Team[]; leagues: League[] } {
  return {
    teams: teams.filter(t => t.coaches.includes(coachId)),
    leagues: leagues.filter(l => l.teams.some(teamId => teams.find(t => t.id === teamId && t.coaches.includes(coachId))))
  };
}

export function getPlayerRegistrationStatus(playerId: string, leagues: League[], payments: Payment[]): { league: League; paid: boolean }[] {
  return leagues.map(league => ({
    league,
    paid: payments.some(p => p.playerId === playerId && p.leagueId === league.id && p.status === 'completed'),
  }));
} 