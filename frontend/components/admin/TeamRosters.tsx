import React, { useState } from 'react';
import { Team, Player, Coach } from '../../lib/models/townRecTypes';
import { useTeamRoster } from '../../hooks/useTeamRoster';
import { useCoachAssignments } from '../../hooks/useCoachAssignments';
import { Button } from 'shadcn/ui/button';

// Dummy data
const teams: Team[] = [
  { id: '1', name: 'Cary Eagles', leagueId: '1', players: ['1', '2'], coaches: ['1'] },
];
const players: Player[] = [
  { id: '1', name: 'Alex Smith', email: 'alex@email.com', leagues: ['1'], teams: ['1'], resident: true },
  { id: '2', name: 'Jamie Lee', email: 'jamie@email.com', leagues: ['1'], teams: ['1'], resident: false },
];
const coaches: Coach[] = [
  { id: '1', name: 'Coach Carter', email: 'coach@email.com', leagues: ['1'], teams: ['1'], backgroundCheckStatus: 'approved' },
];

const TeamRosters: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const roster = useTeamRoster(selectedTeam || teams[0], players);
  const coachAssignments = useCoachAssignments(coaches[0].id, teams, []);

  return (
    <div className="w-full" role="region" aria-label="Team rosters" tabIndex={0}>
      <div className="p-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Team Rosters</h2>
        <ul className="divide-y mb-4">
          {teams.map(team => (
            <li key={team.id} className="py-2 flex justify-between items-center">
              <span>{team.name}</span>
              <Button size="sm" onClick={() => setSelectedTeam(team)}>View Roster</Button>
            </li>
          ))}
        </ul>
        {selectedTeam && (
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl">
            <h3 className="font-semibold mb-2">Roster for {selectedTeam.name}</h3>
            <ul className="mb-2">
              {roster.map(player => (
                <li key={player.id}>{player.name} ({player.resident ? 'Resident' : 'Non-Resident'})</li>
              ))}
            </ul>
            <h4 className="font-semibold mb-1">Coaches</h4>
            <ul>
              {coachAssignments.teams.find(t => t.id === selectedTeam.id) && coaches.map(coach => (
                <li key={coach.id}>{coach.name} ({coach.backgroundCheckStatus})</li>
              ))}
            </ul>
            <Button className="mt-2 w-full" variant="secondary" onClick={() => setSelectedTeam(null)}>Back</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamRosters; 