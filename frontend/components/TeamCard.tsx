import React from 'react';
import { Team, Player, Coach } from '../lib/models/townRecTypes';

const TeamCard: React.FC<{ team: Team; players: Player[]; coaches: Coach[] }> = ({ team, players, coaches }) => (
  <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow flex flex-col items-start w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500" role="region" aria-label={`Team card for ${team.name}`} tabIndex={0}>
    <div className="font-bold text-lg mb-1">{team.name}</div>
    <div className="text-xs mb-1">Players:</div>
    <ul className="mb-1">
      {players.map(p => <li key={p.id} className="text-xs">{p.name}</li>)}
    </ul>
    <div className="text-xs mb-1">Coaches:</div>
    <ul>
      {coaches.map(c => <li key={c.id} className="text-xs">{c.name}</li>)}
    </ul>
  </div>
);

export default TeamCard; 